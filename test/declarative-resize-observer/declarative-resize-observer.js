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
            screenCssPixelRatio = 1

        Object.keys(bps).forEach(function(sizeName) {
          if ((dim[dir] * screenCssPixelRatio) > bps[sizeName]) {
            sizebreakpoint = sizeName
          }
        })
        el.setAttribute('available-' + dir, sizebreakpoint)
      },
      setContainerSize = function setContainerSize(el, dim) {
        var dim = (typeof dim !== 'undefined') ? dim : el.getBoundingClientRect()
        //console.log('evaluateBreakpoints on ', el)
        evaluateBreakpoints(el, breakpoints.width, 'width', dim)
        evaluateBreakpoints(el, breakpoints.height, 'height', dim)
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
      isApplying = false,
      mo = new MutationObserver(collector),
      rObserver = function() {
        if (hasResizeObserver) {
          return new ResizeObserver(function(entries) {
            if (!isApplying) {
              isApplying = true
              entries.forEach(function(entry) {
                setContainerSize(entry.target, entry.contentRect);
              })
              setTimeout(() => {
                isApplying = false
              },10)
            }
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
        if (isMatch(el)) {
          if (hasResizeObserver) {
              rObserver.observe(el)
          } else {
              xSizeEls.push(el)
          }
        }
      },
      unobserveEl = function unobserveEl(el) {
          if (isMatch(el)) {
            if (hasResizeObserver) {
                rObserver.unobserve(el)
            } else {
                xSizeEls = xSizeEls.filter(function(el) {
                   return el !== undefined;
                }, el);
            }
          }
          if (el.removeAttribute) {
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
    temp.innerHTML = "[resize-observer] { display: inherit; }[resize-observer] > * { display: contents; width: auto; height: auto;}"
    document.head.insertBefore(temp, document.head.firstElementChild)

    po.observe(document.documentElement, {
        subtree: true,
        childList: true,
        attributeFilter: ['resize-observer']
    })
  }
}())