{
	let parseAttr = (el, attr) => {
	   return parseInt(el.getAttribute(attr) || 0, 10)
	}
	let op = {
			"<=" : (el, attr, x) => {
				return parseAttr(el, attr) <= x
			},
			"==" : (el, attr, x) => {
				console.log(attr, x)
				return parseAttr(el, attr) == x
			},
			">=" : (el, attr, x) => {
				return parseAttr(el, attr) >= x
			}

	}

	let doWork = function (sel, which) {
		let mathyBits = sel.match(/\[(.*)(<=|>=|==)(\d*)\]/)
		if (!mathyBits || mathyBits.length !== 4) {
		  return this[which](sel)
		}
		let nativeResult = this[which](sel.replace(mathyBits[2], '').replace(mathyBits[3], ''))
		if (which == 'matches') {
			return nativeResult && op[mathyBits[2]](el, mathyBits[1], mathyBits[3])
		} else {
			nativeResult = (nativeResult && nativeResult.nodeType) ? [nativeResult] : nativeResult
			temp = Array.from(nativeResult || []),
			filtered = temp.filter((el) => {
				return op[mathyBits[2]](el, mathyBits[1], mathyBits[3])
			})
			return (which==='querySelectorAll') ? filtered : filtered[0]
		}
	}

	HTMLElement.prototype._querySelector = function (sel) {
		return doWork.call(this, sel, 'querySelector')
	}

	HTMLElement.prototype._matches = function (sel) {
		return doWork.call(this, sel, 'querySelector')
	}

	HTMLElement.prototype._querySelectorAll = function (sel) {
		return doWork.call(this, sel, 'querySelectorAll')
	}


}
