
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

  }
}
