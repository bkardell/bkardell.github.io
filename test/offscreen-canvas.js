let supportsOffscreenCanvas = document.createElement("canvas")
  .transferControlToOffscreen;


// is this used?
let importImageBitmap = async function(url, cors=false) {
  const headers = new Headers();

  const req = (!cors) ? new Request() : new Request({
    method: 'GET',
    headers: headers,
    mode: 'cors',
    cache: 'default'
  })

  const resp = await fetch(url, req);
  const blob = await resp.blob();
  return await createImageBitmap(blob);
}

let copyCanvas = function(c, fill = "white") {
  let width = c.naturalWidth || c.width,
    height = c.naturalHeight || c.height,
    temp = document.createElement("canvas");

  temp.width = width;
  temp.height = height;
  let ctx = temp.getContext("2d");
  ctx.fillStyle = fill;
  ctx.fillRect(0, 0, temp.width, temp.height);
  ctx.drawImage(c, 0, 0, temp.width, temp.height);
  return temp;
};

class CanvasWorker extends HTMLElement {
  static get observedAttributes() {
    return ["src"];
  }

  async _createShadowCanvas(img) {
    let temp = document.createElement("canvas");
    temp.width = img.width || img.naturalWidth ;
    temp.height = img.height || img.naturalHeight ;
    temp.setAttribute("part", "canvas")
    let source = img.src ? img : copyCanvas(temp);
    let imageBitmap = await createImageBitmap(source);
    temp.innerHTML = img.getAttribute("alt");
    this.canvas.replaceWith(temp);
    this.canvas = temp;
    this._offscreen = this.canvas.transferControlToOffscreen();
    this._worker.postMessage({ 
      canvas: this._offscreen, 
      imageBitmap, 
      highResImageBitmapURL: img.getAttribute('full-res-src'),
      noCors: img.getAttribute('crossorigin') === 'Anonymous'
    
    }, [
      this._offscreen
    ]);
  }

  attributeChangedCallback(name, oldValue, newValue) {
    this._worker = new Worker(newValue);
  }

  constructor() {
    super();
    if (!supportsOffscreenCanvas) {
      return;
    }
    this.attachShadow({ mode: "open" });
    this.shadowRoot.innerHTML = `
      <span class="wrapper" part="wrapper">
        <canvas style="touch-action: none;"></canvas>
      </span>
      <slot style="display:none;"></slot>
      <style>
        canvas { max-width: 100%; }
      </style>
    `;
    this.canvas = this.shadowRoot.querySelector("canvas");
    let slot = this.shadowRoot.querySelector("slot");
    let self = this;
    slot.addEventListener("slotchange", e => {
      // canvas or image
      let img = self.querySelector("img");
      let workerSrc = self.querySelectorAll(
        'script[type="text/offscreen-worker"]'
      );
      if (workerSrc.length > 0) {
        var blob = new Blob(
          Array.prototype.map.call(workerSrc, function(oScript) {
            return oScript.textContent;
          }),
          { type: "text/javascript" }
        );

        // Creating a new document.worker property containing all our "text/js-worker" scripts.
        self._worker = new Worker(window.URL.createObjectURL(blob));
      }
      if (!img.src || img.complete) {
        self._createShadowCanvas(img);
      } else {
        img.onload = () => {
          self._createShadowCanvas(img);
        };
        img.onerror = console.error;
      }
    });
  }

  connectedCallback() {
    //nothing to do here...
  }
}

customElements.define("offscreen-canvas", CanvasWorker);

export { CanvasWorker };
