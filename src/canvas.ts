
export class Renderer {
  parent: HTMLElement;
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
  image: HTMLImageElement;

  static get MINIMUM_CELL_WIDTH(): number {return 8;}
  static get EXPONENT(): number {return 4;}

  constructor(parent: HTMLElement) {
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
    const c = this.canvas;
    const cx = this.context;
    c.width = this.image.naturalWidth;
    c.height = this.image.naturalHeight;
    cx.clearRect(0, 0, c.width, c.height);
    const smallData = this.generateSmallCanvas();
    const cellData = this.generateCell(smallData);
  }

  generateSmallCanvas(): ImageData {
    const width = this.canvas.width - this.canvas.width % Renderer.MINIMUM_CELL_WIDTH;
    const height = this.canvas.height - this.canvas.height % Renderer.MINIMUM_CELL_WIDTH;
    const dw = width / Renderer.MINIMUM_CELL_WIDTH;
    const dh = height / Renderer.MINIMUM_CELL_WIDTH;
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
    const out = new ImageData(w, h);

    // TODO: セルに分割していく部分のロジックを考える

    return out;
  }
}

class Cell {
  data: ImageData;
  rect: DOMRect;
  count: number;
  diff: number;
  color: {r: number, g: number, b: number};

  constructor(data, x, y, w, h) {
    this.data = data;
    this.rect = new DOMRect(x, y, w, h);
    this.count = w * h;
    this.diff = 0;

    this.calculate();
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
    this.color.r = Math.round(tr / this.count);
    this.color.g = Math.round(tg / this.count);
    this.color.b = Math.round(tb / this.count);
    // ntsc
    tr = this.color.r * 0.2989;
    tg = this.color.g * 0.587;
    tb = this.color.b * 0.114;
    // final result
    this.diff = tr + tg + tb;
    return this.diff;
  }
}
