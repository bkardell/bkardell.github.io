class AreaElement extends StoryItemElement {

    get currentLocation() {
        let it = this.querySelector('x-scene[current-location]')
        if (!it) {
            it = this.querySelector('x-scene')
            it.setAttribute('current-location','')
        }
        return it
    }

    set currentLocation(target) {
        this.currentLocation.removeAttribute('current-location')
        target.setAttribute('current-location', '')
    }


    getScene (name) {
        return this.querySelector(`x-scene[name="${name}"]`)
    }

    connectedCallback () {

    }

}
customElements.define('x-area', AreaElement)
