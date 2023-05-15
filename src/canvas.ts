
export class Renderer {
  iteration: number;
  parent: HTMLElement;
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
  image: HTMLImageElement;

  static get MINIMUM_CELL_WIDTH(): number {return 4;}

  constructor(parent: HTMLElement) {
    this.iteration = 0;
    this.parent = parent;
    this.canvas = document.createElement('canvas');
    this.context = this.canvas.getContext('2d');
    this.parent.appendChild(this.canvas);

    this.eventSetting();
  }

  eventSetting(): void {
    const body = document.body;
    body.addEventListener('dragover', (evt) => {
      evt.preventDefault();
    }, false);
    body.addEventListener('drop', (evt) => {
      evt.preventDefault();
      const files = evt.dataTransfer.files;
      if (files.length === 0) {
        return;
      }
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        const url = reader.result as string;
        this.image = new Image();
        this.image.addEventListener('load', () => {
          this.render();
        }, false);
        this.image.src = url;
      }, false);
      reader.readAsDataURL(files[0]);
    }, false);
  }

  render(): void {
    this.iteration = 0;
    const c = this.canvas;
    const cx = this.context;
    c.width = this.image.naturalWidth;
    c.height = this.image.naturalHeight;
    cx.clearRect(0, 0, c.width, c.height);
    const smallData = this.generateSmallCanvas();
    const cellData = this.generateCell(smallData);

    // TODO: とりま結果確認用
    this.context.putImageData(cellData, 0, 0);
  }

  generateSmallCanvas(): ImageData {
    const width = this.canvas.width - this.canvas.width % Renderer.MINIMUM_CELL_WIDTH;
    const height = this.canvas.height - this.canvas.height % Renderer.MINIMUM_CELL_WIDTH;
    const tw = width / Renderer.MINIMUM_CELL_WIDTH;
    const th = height / Renderer.MINIMUM_CELL_WIDTH;
    const dw = tw - tw % Renderer.MINIMUM_CELL_WIDTH;
    const dh = th - th % Renderer.MINIMUM_CELL_WIDTH;
    const c = document.createElement('canvas');
    const cx = c.getContext('2d');
    c.width = dw;
    c.height = dh;
    cx.drawImage(this.image, 0, 0, this.canvas.width, this.canvas.height, 0, 0, dw, dh);
    const data = cx.getImageData(0, 0, dw, dh);
    return data;
  }

  generateCell(data: ImageData): ImageData {
    const w = data.width;
    const h = data.height;
    // gen canvas and reset
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const cx = c.getContext('2d');
    cx.fillStyle = 'black';
    cx.fillRect(0, 0, w, h);

    // まず最初は全体が対象（偏差を求めないようにするため最終引数を指定）
    let target = new Cell(data, 0, 0, w, h, 0);
    let cache = target.split() as Cell[];
    // split した瞬間に色を更新
    cache.forEach((cell) => {
      cx.fillStyle = `rgb(${cell.color.r}, ${cell.color.g}, ${cell.color.b})`;
      cx.fillRect(cell.rect.x, cell.rect.y, cell.rect.width, cell.rect.height);
    });

    // TODO: たぶんループする回数は固定値にしたほうがよい
    let running = true;
    window.addEventListener('keydown', (evt) => {
      running = false;
    }, {once: true});
    while (running) {
      // 偏差が最大なセルのインデックス
      const max = Cell.imax(cache);
      // 標準偏差が最大なので次の分割対象
      target = cache[max];
      // 分割対象となったセルは取り除く
      cache.splice(max, 1);
      // 分割（分割不可能な場合は false が返る）
      const cells = target.split();
      if (cells === false) {
        // このセルはこれ以上分割できない
        ++this.iteration;
        if (this.iteration > 1000) {
          running = false;
        }
      } else {
        // まさに分割した直後の色を塗りキャッシュする
        cells.forEach((cell) => {
          cx.fillStyle = `rgb(${cell.color.r}, ${cell.color.g}, ${cell.color.b})`;
          cx.fillRect(cell.rect.x, cell.rect.y, cell.rect.width, cell.rect.height);
        });
        cache.push(cells[0], cells[1], cells[2], cells[3]);
      }
    }
    return cx.getImageData(0, 0, w, h);
  }
}

class Cell {
  data: ImageData;
  rect: DOMRect;
  count: number;
  diff: number;
  color: {r: number, g: number, b: number};

  static imin(cells: Cell[]): number {
    let index = 0;
    let value = Infinity;
    for (let i = 0, j = cells.length; i < j; ++i) {
      if (cells[i].diff < value) {
        value = cells[i].diff;
        index = i;
      }
    }
    return index;
  }
  static imax(cells: Cell[]): number {
    let average = 0;
    for (let i = 0, j = cells.length; i < j; ++i) {
      average += cells[i].diff;
    }
    average /= cells.length;
    const diffs = cells.map((cell) => {
      const d = cell.diff - average;
      return d * d * (cell.rect.width * cell.rect.height * 0.2);
    });
    let index = 0;
    let value = -Infinity;
    for (let i = 0, j = cells.length; i < j; ++i) {
      if (diffs[i] > value) {
        value = diffs[i];
        index = i;
      }
    }
    return index;
  }

  constructor(data: ImageData, x: number, y: number, w: number, h: number, diff?: number) {
    this.data = data;
    this.rect = new DOMRect(x, y, w, h);
    this.count = w * h;
    this.diff = diff ?? 0;
    this.color = {r: 0, g: 0, b: 0};

    if (diff == null) {
      this.calculate();
    }
  }
  split(): Cell[] | false {
    const mw = this.rect.width % 2;
    const mh = this.rect.height % 2;
    const w = (this.rect.width - mw) / 2;
    const h = (this.rect.height - mh) / 2;
    if (w <= 1 || h <= 1) {
      return false;
    }
    const cells = [];
    cells.push(new Cell(this.data, this.rect.x, this.rect.y, w, h));                   // 左上
    cells.push(new Cell(this.data, this.rect.x + w, this.rect.y, w + mw, h));          // 右上
    cells.push(new Cell(this.data, this.rect.x, this.rect.y + h, w, h + mh));          // 左下
    cells.push(new Cell(this.data, this.rect.x + w, this.rect.y + h, w + mw, h + mh)); // 右下
    return cells;
  }
  calculate(): number {
    const imageData = this.data;
    const width = imageData.width;
    // general
    let r = 0;
    let g = 0;
    let b = 0;
    // vector
    const vr = [];
    const vg = [];
    const vb = [];
    // cache
    for (let i = 0, j = this.rect.height; i < j; ++i) {
      const x = (this.rect.y + i) * width + this.rect.x;
      for (let k = 0, l = this.rect.width; k < l; ++k) {
        const index = (x + k) * 4;
        r += imageData.data[index];
        g += imageData.data[index + 1];
        b += imageData.data[index + 2];
        vr.push(imageData.data[index]);
        vg.push(imageData.data[index + 1]);
        vb.push(imageData.data[index + 2]);
      }
    }
    // average
    const ar = r / this.count;
    const ag = g / this.count;
    const ab = b / this.count;
    // total
    let tr = 0;
    let tg = 0;
    let tb = 0;
    for (let i = 0, j = vr.length; i < j; ++i) {
      r = vr[i] - ar;
      g = vg[i] - ag;
      b = vb[i] - ab;
      tr += r * r;
      tg += g * g;
      tb += b * b;
    }
    // color
    this.color.r = ar;
    this.color.g = ag;
    this.color.b = ab;
    // ntsc
    tr = this.color.r * 0.2989;
    tg = this.color.g * 0.587;
    tb = this.color.b * 0.114;
    // final result
    this.diff = tr + tg + tb;
    return this.diff;
  }
}
