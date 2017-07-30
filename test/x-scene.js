class SceneElement extends StoryItemElement {

    get items () {
        return this.querySelector('x-items')
    }

    enter (exit = null) {
        if (!this.isVisited) {
            let evt = new Event('sceneFirstEntered', {
                scene: this,
                bubbles: true,
                cancelable: true
            })
            this.dispatchEvent(evt)
            this.setAttribute('visited', '')
        }

        let evt = new Event('sceneEntered', {
            bubbles: true,
            cancelable: true
        })
        evt.scene = this
        evt.fromExit = exit

        this.dispatchEvent(evt)
    }

    get npcsMatcher () {
        let set = new Set()

        this.querySelectorAll('x-npc').forEach((npcEl) => {
            set.add(npcEl.character.class)
            set.add(npcEl.character.race)
        })
        return Array.from(set).join('|')
    }

    get itemsMatcher () {
        let set = new Set()

        this.querySelectorAll('x-item:not([hidden])').forEach((item) => {
            set.add(item.name)
        })
        return Array.from(set).join('|')
    }

    get actionsMatcher () {
        let set = new Set()

        this.querySelectorAll('x-when').forEach((item) => {
            set.add(item.action)
        })
        return Array.from(set).join('|')
    }

    get npcs () {
        return this.querySelector('x-npcs')
    }

    get exits () {
        return this.querySelector('x-exits')
    }

    get isVisited() {
        return this.querySelector('[visited]')
    }

    findNpc (which) {
        return this.querySelector(`x-npc[character-class="${which}"], x-npc[character-race="${which}"]`)
    }

    connectedCallback() {
        if (!this.npcs) {
            this.appendChild(new NPCListElement())
        }


        this.addEventListener('sceneEntered', (evt) => {
            this.parentElement.currentLocation = evt.target
            if (evt.fromExit) {
                this.exits.findReverseExit(evt.fromExit).hasBeenFollowed = true
            }
            this.story.queue(this.getAttribute('name') + ".")
            this.story.queue(this.exits.announcement)
            this.story.queue(this.npcs.announcement)
        })
    }
}
customElements.define('x-scene', SceneElement)