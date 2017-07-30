class ExitsElement extends StoryItemElement {

    get announcement () {
        let first = true,
            buff = [],
            intro = 'There is '

        this.eachExit((exitEl) => {
            let str = exitEl.announcement
            if (str) {
                if (first && !/^a|an/.test(str)) {
                    intro = 'There are '
                }
                buff.push(`${intro} ${str}`)
                if (first) {
                    first = false
                    intro = ', '
                }
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

    findExit (dir) {
        return this.querySelector(`x-exit[dir="${dir}"]`)
    }

    eachExit (fn) {
        this.querySelectorAll('x-exit').forEach(fn)
    }

    connectedCallback() {
       console.log('fired')
    }


}
customElements.define('x-exits', ExitsElement)



class ExitElement extends StoryItemElement {

    get type () {
        return this.getAttribute('type')
    }

    get direction () {
        return this.getAttribute('dir')
    }

    get leadsTo () {
        return this.getAttribute('leads-to')
    }

    get visibleExits () {
        return this.querySelectorAll('x-exit:not([hidden]')
    }

    get announcement () {
        if (!this.isHidden) {
            if (this.type == 'door') {
                return `a door to the ${this.direction}`
            } else if (this.type == 'stairs') {
               return `stairs going ${this.direction}`
            } else {
                return `an exit to the ${this.direction}`
            }
        }
    }

    followExit () {
        this.area.getScene(this.leadsTo).enter()
    }

    connectedCallback () {
        // the nature of an exit means it doesn't move..
        // we can optimize this
        this.area = this.closest('x-area')
    }
}
customElements.define('x-exit', ExitElement)