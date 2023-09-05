class XSlider extends HTMLElement {
  isDragging = false;
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot.innerHTML = `
      <style>
        .visually-hidden {
          background-color: pink;
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border-width: 0;
        }

        [part=container] {
          height: 1em;
          padding: 0;
          margin: 0;
        }
        :host {
          display: block;
          background-color: none;
          margin: 2px;
          cursor: default;
          padding: unset;
          border: unset;
          user-select: none !important;
          height: 1em;
        }
        [part=track] {
          border: 1px dashed blue;
          background-color: lightgray;
          display: block !important;
          float: none !important;
          position: static !important;
          writing-mode: unset !important;
          direction: unset !important;
          block-size: 1em;
          box-sizing: border-box;
          user-select: none !important;
        }
        [part=fill] {
          border: 1px solid transparent;
          display: block !important;
          float: none !important;
          position: absolute !important;  
          margin: var(--dif);  
          top: calc(var(--dif) * 0.7);
          writing-mode: unset !important;
          direction: unset !important;
          block-size: 1em;
          width: 1em;
          box-sizing: border-box;
          background-color: blue;
          user-select: none !important;
        }
        [part=thumb] {
          display: block !important;
          float: none !important;
          position: absolute !important;
          writing-mode: unset !important;
          direction: unset !important;
          aspect-ratio: 1 / 1;
          height: 1em;
          width: 1em;
          top: calc(var(--dif) * 1.25);
          left: 0.7em;
          border: 0.1em solid pink;
          border-radius: 50%;
          background: currentColor;
          user-select: none !important;
        }
        .focused {
          border-color: lime;
        }
      </style>
      <div part="container">
        <div part="track"></div>
        <div part="fill"></div>
        <div part="thumb"></div>
        <div class="visually-hidden"><slot></slot></div>
      </div>
    `;
    let self = this;
    let thumb = this.shadowRoot.querySelector("[part=thumb]");
    let track = this.shadowRoot.querySelector("[part=track]");
    let fill = this.shadowRoot.querySelector("[part=fill]");
    let slot = this.shadowRoot.querySelector("slot");
    let container = this.shadowRoot.querySelector("[part=container]");
    this.thumb = thumb;
    this.fill = fill;
    this.container = container;


    let setWidthFromInput = (input) => {
      let unit = (this.offsetWidth - 12) / parseInt(input.max, 10);
      let newValue = (unit * input.value);
      setWidth({
        clientX: newValue
      }, true);

    }

    let divCoordsToRangeCoords = (e) => {
      return ((thumb.offsetLeft + 12) / this.offsetWidth) * 100;
    }

    let setWidth = (e, keys=false) => {
      if ((keys || this.isDragging) && (e.clientX <= (this.offsetWidth - 12))) {
      

        requestAnimationFrame(()=> {
          this.thumb.style.left = e.clientX + "px";
          this.fill.style.width = e.clientX + "px";
          slot.assignedElements()[0].value = divCoordsToRangeCoords(e);

        })
      }
    }

    container.addEventListener("slotchange", (e) => {
      console.log('slotchange')
      let inp = e.target.assignedElements()[0]
      setWidthFromInput(inp)
    })

    this.addEventListener("mousedown", (e) => {
      //e.preventDefault();
      this.isDragging = true;
      setWidth(e)
    });

    container.onmouseout = (e) => {
      if (e.relatedTarget && !e.relatedTarget.matches("x-slider, [part=container] > *")) {
        this.isDragging = false;
      }
    };
    this.onmousemove = (e) => {
      setWidth(e)
    };
    this.onmouseup = this.stopDragging.bind(this);
    this.addEventListener("focus", (e) => {
      console.log('hey')
      this.thumb.classList.add("focused")
    }, true)
    this.addEventListener("change",  (e) => {
      let input = e.target
      setWidthFromInput(input)
    });
  }

  moveElement(e) {}
  stopDragging() {
    this.isDragging = false;
  }
}

customElements.define("x-slider", XSlider);