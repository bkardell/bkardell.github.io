class ItemsElement extends StoryItemElement {
    get announcement () {
        let first = true,
            buff = [],
            intro = 'You see'

        this.eachItem((exitEl) => {
            let str = exitEl.announcement
            buff.push(`${intro} a ${str}`)
            if (first) {
                first = false
                intro = ', '
            }
        })
        first = false
        if (buff.length > 1) {
            let temp = buff.pop()
            buff.push(' and ')
            buff.push(temp)
        }
        return buff.join(' ')
    }

    locateItem (name, includeHidden = false) {
        let filter = (includeHidden) ? '' : ':not([hidden]'
        return this.scene.querySelector(`x-item[name*="${name}"]${filter}`)
    }

    connectedCallback() {

    }

    eachItem (fn) {
        this.querySelectorAll('x-item:not([hidden]').forEach(fn)
    }


}
customElements.define('x-items', ItemsElement)


class ItemElement extends StoryItemElement {

    get name () {
        return this.getAttribute('name')
    }


    get announcement () {
        return this.name.split('|')[0]
    }

    get takeable () {
        return !this.getAttribute('untakeable-because')
    }

    connectedCallback() {
        let untakeable = this.getAttribute('untakeable-because')
        if (!this.inited) {
            this.inited = true
            if (untakeable) {
                let whenEl = document.createElement('x-when')
                whenEl.setAttribute('action', 'take')
                whenEl.innerHTML = `<x-say>You cannot, ${untakeable}</x-say>`
                this.appendChild(whenEl)
            } else {
                this.addEventListener('take', (evt) => {
                    this.removeAttribute('relationship')
                    this.story.queue(`Ok. You take the ${this.announcement}.`)
                    this.story.player.take(this)
                    evt.stopPropagation()
                })
                this.addEventListener('equip', (evt) => {
                    this.setAttribute('relationship', 'equipped')
                    this.story.queue(`Ok. You equip the ${this.announcement}.`)
                    //this.story.player.take(this)
                    evt.stopPropagation()
                })
            }
            this.addEventListener('look', (evt) => {
                if (!this.querySelector(':not([hidden])>[action="look"]>x-say,[action="event"]>x-say')) {
                    this.story.queue(`There's nothing interesting about it reallly`)
                    evt.stopPropagation()
                } else {
                    //debugger;
                }
            })
        }

    }

}
customElements.define('x-item', ItemElement)