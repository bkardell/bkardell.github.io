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
