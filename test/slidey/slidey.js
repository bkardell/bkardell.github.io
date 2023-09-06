class XSlider extends HTMLElement {
  isDragging = false;
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot.innerHTML = `
<style>
:host {
  /* how far along the track is the thumb, 
   * a value between 0 (min) and 1 (max) */
  --k: calc((var(--val) - var(--min))/(var(--max) - var(--min)));
  --dark: 0;
  --perc: calc(var(--dark)*100%);
  display: grid;
  width: 100%;
  max-width: 25rem;
  /* should this just be accentcolor instead? */
  color: color-mix(in srgb, #be95c4 var(--perc), #3c096c);
}
@media (prefers-color-scheme: dark) {
  :host {
    --dark: 1 ;
  }
}

[class*=comp] {
  grid-area: 1/1;
}

.comp--track {
  align-self: center;
  /* depends on thumb size */
  margin: auto calc(0.625rem + -1*3px);
  height: 6px;
  border-radius: 3px;
  background: color-mix(in srgb, #333333 var(--perc), #cccccc);
}
.comp--fill {
  align-self: center;
  /* depends on thumb size and track height */
  margin-left: calc(0.625rem + -1*3px);
  /* depends on thumb size and track height */
  margin-right: calc(0.625rem + -1*3px + (1 - var(--k))*(100% - 1.25rem));
  /* depends on track height */
  height: 6px;
  /* depends on track height */
  border-radius: 3px;
  background: currentcolor;
}
.comp--thumb {
  /* depends on its own size */
  margin-left: calc(var(--k)*(100% - 1.25rem));
  width: 1.25rem;
  aspect-ratio: 1;
  border-radius: 50%;
  /* opacity just for testing purposes *
  opacity: .5; /**/
  background: currentcolor;
}

.projected-range { display: grid; }

.projected-range, input[type=range] {
  grid-area: 1/1;
  z-index: 1;
  opacity: 0.3;
}

      </style>

      <div class="projected-range"><slot></slot></div>
      <div part="track" class="comp--track"></div>
      <div part="fill" class="comp--fill"></div>
      <div class="comp--mover">
        <div part="thumb" class="comp--thumb"></div>
      </div>
      <!--.comp--value-->
      <!--.comp--ruler-->
    `;
    let projectionContainer = 
      this.shadowRoot.querySelector('.projected-range')

    this.addEventListener("input",  (e) => {
      let _t = this.querySelector('input[type=range]')
      this.style.setProperty('--val', + _t.value)
    })

    let updateStyle = (inp) => {
      this.setAttribute("style", `--min: ${inp.min}; --val: ${inp.value}; --max: ${inp.max}`)
    }
    
    let inp = this.querySelector('input[type=range]')
    if (inp) {
      updateStyle(inp)
    }
    projectionContainer.addEventListener("slotchange", (e) => {
      updateStyle(e.target.assignedElements()[0])
    })
 }   
}

customElements.define("x-slider", XSlider);