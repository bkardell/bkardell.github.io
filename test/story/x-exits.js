class ExitsElement extends StoryItemElement {
    static reverse (dir) {
        return {
                'north': 'south',
                'south': 'north',
                'east': 'west',
                'west': 'east',
                'up': 'down',
                'down': 'up'
            }[dir]
    }

    get announcement () {
        let first = true,
            buff = [],
            intro = '<p>There is</p><ul>'

        this.eachExit((exitEl) => {
            let str = exitEl.announcement
            if (str) {
                if (first && !/^a|an/.test(str)) {
                    intro = '<p>There are</p><ul>'
                }
                buff.push(`${intro} <li>${str}</li>`)
                if (first) {
                    first = false
                    intro = ''
                }
            }
        })
        first = false
        if (buff.length > 1) {

            buff[buff.length-1] = buff[buff.length-1].replace(`<li>`, `<li>and `)
            //let temp = buff.pop()
            //buff.push(' and ')
            //buff.push(temp)
        }
        buff.push('</ul>')
        return buff.join(' ')
    }

    findExit (dir) {
        return this.querySelector(`x-exit[dir="${dir}"]`)
    }

    findReverseExit (element) {
        return this.findExit(ExitsElement.reverse(element.direction))
    }

    eachExit (fn) {
        this.querySelectorAll('x-exit').forEach(fn)
    }

    connectedCallback() {
       //console.log('fired')
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

    get hasBeenFollowed () {
        return this.hasAttribute('hasBeenFollowed')
    }

    set hasBeenFollowed (b = true) {
        return this.setAttribute('hasBeenFollowed', '')
    }

    get announcement () {
        if (!this.isHidden) {
            if (!this.isHidden) {
                let announceable = (this.hasBeenFollowed) ? ` leading to ${this.leadsTo} ` : ''

                if (this.type == 'door') {
                    return `a door to the ${this.direction} ${announceable}`
                } else if (this.type == 'stairs' || this.type == 'steps') {
                   return `stairs going ${this.direction} ${announceable}`
                } else {
                    return `an exit to the ${this.direction} ${announceable}`
                }
            }
        }
    }

    followExit () {
        this.hasBeenFollowed = true
        this.area.getScene(this.leadsTo).enter(this)
    }

    connectedCallback () {
        // the nature of an exit means it doesn't move..
        // we can optimize this
        this.area = this.closest('x-area')
    }
}
customElements.define('x-exit', ExitElement)