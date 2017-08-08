class StoryItemElement extends HTMLElement {
    get story() {
        return this.closest('x-story')
    }

    get scene() {
        return this.closest('x-scene')
    }


    get isHidden () {
        return this.hasAttribute('hidden')
    }

    getNumericAttribute(attr) {
        return parseInt((this.getAttribute(attr) || 0), 10)
    }

    modifyNumericAttribute(attr, modify) {
        let oldValue = this.getNumericAttribute(attr),
            modBy = parseInt(modify || 0, 10),
            newVal = oldValue + modBy

        this.setAttribute(attr, newVal)
        return `${attr} is ${(modBy > 0) ? 'increased' : 'decreased'} by ${newVal}`
    }

    fire (name, then) {
        let evt = new Event(name, {
            scene: this,
            bubbles: true,
            cancelable: true
        })
        evt.then = then
        this.dispatchEvent(evt)
    }

    _find(selector, processor) {
        // maybe?
    }
}
