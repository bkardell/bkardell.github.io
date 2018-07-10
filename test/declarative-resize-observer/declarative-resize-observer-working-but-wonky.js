"use strict";

(function () {
  var xSizeEls = [],
      custom = {
        width: {},
        height: {}
      },
      breakpoints = {
        width: {
          "xxx-small": 268,
          "xx-small": 368,
          "x-small": 468,
          "small": 568,
          "small-medium": 668,
          "medium": 768,
          "medium-large": 868,
          "large": 968,
          "x-large": 1068,
          "xx-large": 1168
        },
        height: {
          "xxx-small": 50,
          "xx-small": 100,
          "x-small": 150,
          "small": 200,
          "small-medium": 250,
          "medium": 300,
          "medium-large": 400,
          "large": 500,
          "x-large": 700,
          "xx-large": 800
        }
      },
      hasResizeObserver = typeof ResizeObserver === 'function',
      useFallbackObserver = document.documentElement.hasAttribute('pseudo-observe-fallback'),
      evaluateBreakpoints = function (el, bps, dir, dim) {
        var sizebreakpoint = 'xxxx-small',
            dim = (typeof dim !== 'undefined') ? dim : el.getBoundingClientRect(),
            attr = 'available-' + dir,
            changed = false

        Object.keys(bps).forEach(function(sizeName) {
          if (dim[dir] > bps[sizeName]) {
            sizebreakpoint = sizeName
          }
        })
        if (el.getAttribute(attr) !== sizebreakpoint) {
          el.setAttribute('available-' + dir, sizebreakpoint)
          el._lastMod = Date.now()
          changed = true
        }
        return changed;
      },
      setContainerSize = function setContainerSize(el, dim) {
        var dim = (typeof dim !== 'undefined') ? dim : el.getBoundingClientRect()
        //console.log('evaluateBreakpoints on ', el)
        if (el.getAttribute('resize-observer') == 'height') {
          return evaluateBreakpoints(el, breakpoints.height, 'height', dim)
        } else {
          return evaluateBreakpoints(el, breakpoints.width, 'width', dim)
        }
      },
      setContainerSizes = function setContainerSizes() {
        xSizeEls.forEach(function(el) {
          setContainerSize(el)
        });
      },
      collector = function collector(mutations) {
        mo.disconnect();
        setContainerSizes();
        observe();
      },
      observe = function observe() {
        mo.observe(document.documentElement, {
          subtree: true,
          attributes: true
        })
      },
      modThreshold = 40,
      mo = new MutationObserver(collector),
      rObserver = function() {
        if (hasResizeObserver) {
          return new ResizeObserver(function(entries) {
              var now = Date.now()

              entries.forEach(function(entry) {
                var isTimeGateOpen = false,
                    didChange = false;
                //console.log("resizing ", entry.target)
                // I think what we really want to know is whether this is a nested observer
                entry.target.consecutive = entry.target.consecutive || 0


                /*
                  you can hit here without a change directly in the DOM:
                    * because he browser resized (including device orientation flipping)
                      and something uses relative units
                    * Because a media query took effect and new rules are engaged or disengaged
                    * Because an animation or transition is in progress and things are resizing

                  Or, you can be here because of a modification to the that caused
                  an effect.

                    * Sometimes that effect is 'normal' (outside in - if an ancestor resizes),
                    * Sometimes it is fucked (a cylcle) created by a thing expressed poorly


                  Really, we have to  prevent that cycle but that is tricky because we don't know
                  exactly _why_ we're here... A cycle isnt determinable by 'time' - for example,
                  it could take 5 sec to complete because an animation could take 5 sec to complete..
                */


                // we haven't updated this very recently
                if (!entry.target._lastMod || (now - entry.target._lastMod) > modThreshold) {
                  isTimeGateOpen = true
                }

                var anim = false //entry.target.getAnimations()[0]

                if (anim) {
                  unobserveEl(entry.target, true)
                  anim.finished.then(() => {
                    observeEl(entry.target)
                  }).catch((e) => {
                    console.error(e)
                  })
                }
                if (!anim && entry.target.consecutive < 5 && isTimeGateOpen) {

                  //console.log('updating ' + entry.target.consecutive + 'c', entry.target, (now - entry.target._lastMod))

                  if(setContainerSize(entry.target, entry.contentRect)) {
                    entry.target.consecutive++
                    entry.target._lastMod = now
                    console.log('changed ', entry.target, entry.target._lastMod)
                  } else {
                    console.log('no change on ', entry.target)
                  }

                } else if (!anim && isTimeGateOpen) {
                  console.log('the time gate is opened, reset this??', entry.target)
                  entry.target.consecutive = 0
                } else  {
                  //setTimeout( () => {
                    console.log('skipping update #' + entry.target.consecutive + 'on ', entry.target, anim, (now - entry.target._lastMod))
                    entry.target.consecutive++
                  //})
                  //unobserveEl(entry.target)


                }
                //entry.target._lastMod = now
              })

          })
        }
      }(),
      throttleId = false,
      queueSet = function queueSet() {
          if (throttleId) {
            clearTimeout(throttleId);
          }
          mo.disconnect()
          throttleId = setTimeout(function() {
            setContainerSizes()
            observe();
          }, 10);
      },
      observeEl = function observeEl(el) {
        /*
          Ok, here what I think we want to do really is build a collection
          xSizeEls = [{el: ... }, {el: ..., ancestor: [..]}]
        */
        if (isMatch(el)) {
          if (hasResizeObserver) {
              xSizeEls.push(el)
              rObserver.observe(el)
          } else {
              xSizeEls.push(el)
          }
        }
      },
      unobserveEl = function unobserveEl(el, temporary) {
          if (isMatch(el)) {
            if (hasResizeObserver) {
                rObserver.unobserve(el)
            } else {
                xSizeEls = xSizeEls.filter(function(el) {
                   return el !== undefined;
                }, el);
            }
          }
          if (!temporary && el.removeAttribute) {
            el.removeAttribute('resize-observer')
            el.removeAttribute('available-width')
            el.removeAttribute('available-height')
          }
      };

  observe();


  var isMatch = function isMatch(node) {
      return node.nodeType === 1 && node.matches('[resize-observer]')
  };
  var po = new MutationObserver(function(mutations) {

      mutations.forEach(function(mutation) {
          if (mutation.type==='attributes') {
            let target = mutation.target
            if (isMatch(target)) {
              observeEl(target)
              setContainerSize(target)
            } else {
              unobserveEl(target)
            }
          } else {
            Array.prototype.slice.call(mutation.addedNodes).forEach(observeEl)
            Array.prototype.slice.call(mutation.removedNodes).forEach(unobserveEl)
          }
      });
      if (!hasResizeObserver && useFallbackObserver) {
          window.addEventListener('resize', queueSet)
          queueSet()
      }
  });
  if (hasResizeObserver || useFallbackObserver) {
    var temp = document.createElement('style')
    temp.innerHTML = '[resize-observer] { display: inherit; overflow-x: hidden; overflow-y: visible; width: auto; height: auto;}'
                     + '[resize-observer="height"] { overflow-x: visible; overflow-y: hidden; }'
    document.head.insertBefore(temp, document.head.firstElementChild)

    po.observe(document.documentElement, {
        subtree: true,
        childList: true,
        attributeFilter: ['resize-observer']
    })
  }
}())