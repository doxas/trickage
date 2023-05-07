
export class Renderer {
  parent: HTMLElement;
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
  image: HTMLImageElement;

  constructor(parent: HTMLElement) {
    this.parent = parent;
    this.canvas = document.createElement('canvas');
    this.context = this.canvas.getContext('2d');
    this.parent.appendChild(this.canvas);

    this.eventSetting();
  }

  eventSetting() {
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

  render() {
    const c = this.canvas;
    const cx = this.context;
    c.width = this.image.naturalWidth;
    c.height = this.image.naturalHeight;
    cx.clearRect(0, 0, c.width, c.height);
    cx.drawImage(this.image, 0, 0, c.width, c.height);
  }
}
