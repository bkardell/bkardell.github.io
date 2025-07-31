import { CanvasWorker } from './offscreen-canvas.js'

let workerSource = `
  let canvas,
      ctx,
      originalBitmap,
      initialZoomFactor,
      highResBitmap,
      highResImageBitmapURL,
      debouncedLoader,
      zoomFactor = 1,
      xOffset = 0,
      yOffset = 0,
      trackingX,
      trackingY, 
      deltaX = 0
      deltaY = 0
    ;

  let importImageBitmap = async function(url, cors=false) {
    try {
    const headers = new Headers();

    const req = (!cors) ? new Request(url) : new Request(url, {
      method: 'GET',
      headers: headers,
      mode: 'cors',
      cache: 'default'
    })
    postMessage('one')
    const resp = await fetch(req);

    postMessage('two')
    const blob = await resp.blob();

    postMessage('three')
    let imgMap =  await createImageBitmap(blob);

    postMessage('four')
    return imgMap;
    } catch(e) {
       postMessage(e.message)
    }
  }

  function draw() {
    // debugger;
    let scaledWidth = canvas.width / zoomFactor;
    let scaledHeight = canvas.height / zoomFactor;
    xOffset -= Math.floor(deltaX)
    yOffset -= Math.floor(deltaY)

    postMessage(\`deltas:\${deltaX},:\${deltaY} :::: Offsets: \${xOffset}, \${yOffset} :::: tracking: \${trackingX}, \${trackingY}\`)

    trackingX = null
    trackingY = null
    deltaX = 0
    deltaY = 0

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.imageSmoothingEnabled = true;
    console.log(xOffset, yOffset)
    ctx.drawImage(highResBitmap || originalBitmap, xOffset, yOffset, scaledWidth, scaledHeight, 0, 0, canvas.width, canvas.height);

    if(highResBitmap && originalBitmap !== highResBitmap) {
      zoomFactor *= highResBitmap.width / originalBitmap.width
      originalBitmap = highResBitmap
      postMessage('loaded high res')
    }
    ctx.commit()

  }

  const throttle = (fn, delay) => {
    let lastCalled = 0;
    return (...args) => {
      let now = Date.now();
      if(now - lastCalled < delay) {
        return;
      }
      lastCalled = now;
      return fn(...args);
    }
  }

  const debounce = (func, delay) => { 
    let timerId; 
    return function() { 
      clearTimeout(timerId) 
      timerId = setTimeout(() => func.apply(this,arguments), delay)
    }; 
  };

  const throttledDraw = throttle(draw, 50)
  // going to be provided canvas
  onmessage = async function(evt) {
    if (evt.data.canvas) {
      canvas = evt.data.canvas;
      ctx = canvas.getContext("2d");
      originalBitmap = evt.data.imageBitmap
      highResImageBitmapURL = evt.data.highResImageBitmapURL
      initialZoomFactor = canvas.width / originalBitmap.width
      zoomFactor = initialZoomFactor

    } else if (evt.data.tracking === false) {
      trackingX = null
      trackingY = null
      return
    } else if (typeof evt.data.zoomFactor !== 'undefined') {
      if (evt.data.zoomFactor > 3) { return; }

      // what we really need here is a 'zoomScale' that translates those coord to current
      console.log(originalBitmap.width)
      zoomFactor = (evt.data.zoomFactor < 0.5) ? 0.05 : (canvas.width / originalBitmap.width) * evt.data.zoomFactor;

      postMessage(zoomFactor)
      // this should wait for a break in the action...
      if (!debouncedLoader) {
        // start loading that
        debouncedLoader = debounce(async function()  {
          highResBitmap = await importImageBitmap(highResImageBitmapURL, true)

          let deltaScale = originalBitmap.width / highResBitmap.width
          originalBitmap = highResBitmap
          zoomFactor = zoomFactor * deltaScale
 
          xOffset = Math.floor(xOffset  * (highResBitmap.width/canvas.width))
          yOffset = Math.floor(yOffset * (highResBitmap.width/canvas.width))

          throttledDraw()
        },1000)
      } else if (!highResBitmap) {
        debouncedLoader()
      }
    } else if (typeof evt.data.x !== 'undefined') {
      if (!trackingX) {
        trackingX = Math.floor(evt.data.x)
        trackingY = Math.floor(evt.data.y);
        console.log(\`startedTracking\`, trackingX, trackingY)
      }
      deltaScale = (highResBitmap) ? highResBitmap.width/canvas.width : 1
      deltaX = deltaScale * (Math.floor(evt.data.x) - trackingX);
      deltaY = deltaScale * (Math.floor(evt.data.y) - trackingY);
    }
    throttledDraw()
  };
  `

class PanZoomCanvas extends CanvasWorker {
  constructor() { 
    super() 
    var blob = new Blob([workerSource],{type: 'text/javascript'});
    this._worker = new Worker(window.URL.createObjectURL(blob));
     
    let wrapper = this.shadowRoot.firstElementChild
    let range = document.createRange()
    let zoomFragment = range.createContextualFragment(`<div
        id="zoomy"
        style="display: none; font-size: 2rem; position: absolute; top: 1rem; right: 1rem;"
      >
        <button id="zoomIn">+</button>
        <button id="zoomOut">-</button>
      </div>
    </div>`)
    wrapper.prepend(zoomFragment)
    
    let zoomIn = this.shadowRoot.querySelector('#zoomIn'),
        zoomOut = this.shadowRoot.querySelector('#zoomOut'),
        zoomy = zoomIn.parentElement,
        style = this.shadowRoot.querySelector('style'),
        clickableOne = this; 
    
    customElements.whenDefined("offscreen-canvas").then(() => {
        let mouseTracking;
            
      style.innerHTML += `
        .wrapper {     
          position: relative;
          width: auto;
          display: inline-block;
        }
      `

        let zoomFactor = 1,
          pointerEventsCache = [],
          lastTwoPointerDelta = 0;

        //caption.style.display = 'block'
        if (window.navigator.maxTouchPoints < 2) {
          zoomy.style.display = "block";
        }

        clickableOne.onpointerdown = evt => {
          mouseTracking = true;
          event.preventDefault();
          pointerEventsCache.push(evt);
          evt.target.style.cursor = "move";
          
          clickableOne.classList.add('touched')
        };

        let stopPointerHandler = evt => {
          mouseTracking = false;
          untrackEvent(evt);
          evt.target.style.cursor = "auto";
          clickableOne.classList.remove('touched')
          if (pointerEventsCache.length < 2) lastTwoPointerDelta = -1;
          updateWorker({tracking: false})
        };

        clickableOne.onpointerup = stopPointerHandler;
        clickableOne.onpointercancel = stopPointerHandler;
        clickableOne.onpointerout = stopPointerHandler;
        clickableOne.onpointerleave = stopPointerHandler;

        clickableOne.onpointermove = evt => {
          evt.preventDefault();
          if (mouseTracking) {
            trackSecondPointerEvt(evt);
            if (pointerEventsCache.length == 2) {
              let twoPointerDelta = Math.abs(
                pointerEventsCache[0].clientX - pointerEventsCache[1].clientX
              );
              if (lastTwoPointerDelta > 0) {
                if (twoPointerDelta > lastTwoPointerDelta) {
                  zoomFactor += 0.025;
                } else if (twoPointerDelta < lastTwoPointerDelta) {
                  zoomFactor -= 0.025;
                }
              }
              updateWorker({ zoomFactor });
              lastTwoPointerDelta = twoPointerDelta;
            } else {
              updateWorker({ x: evt.clientX, y: evt.clientY });
            }
          }
        };

        function untrackEvent(evt) {
          // Remove this event from the target's cache
          for (var i = 0; i < pointerEventsCache.length; i++) {
            if (pointerEventsCache[i].pointerId == evt.pointerId) {
              pointerEventsCache.splice(i, 1);
              break;
            }
          }
        }

        function trackSecondPointerEvt(evt) {
          for (var i = 0; i < pointerEventsCache.length; i++) {
            if (evt.pointerId == pointerEventsCache[i].pointerId) {
              pointerEventsCache[i] = evt;
              break;
            }
          }
        }

        function updateWorker(m) {
          clickableOne._worker.postMessage(m);
        }

        setTimeout(() => {
          clickableOne._worker.onmessage = (evt) => {
            console.log(evt.data)
          }
        }, 1000)
        
        
        zoomIn.onclick = () => {
          zoomFactor += 0.1;
          updateWorker({ zoomFactor });
        };

        zoomOut.onclick = () => {
          if (zoomFactor > 1) {
            zoomFactor -= 0.1;
            updateWorker({ zoomFactor });
          }
        };
      });
  }
  
}

customElements.define('pan-zoom-img', PanZoomCanvas)
export { PanZoomCanvas }
