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

    fire (name) {
        let evt = new Event(name, {
            scene: this,
            bubbles: true,
            cancelable: true
        })
        this.dispatchEvent(evt)
    }

    _find(selector, processor) {
        // maybe?
    }
}
