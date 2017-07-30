class NPCListElement extends StoryItemElement {

	get npcs () {
		return this.querySelectorAll('x-npc')
	}

	get announcement () {
		if (this.npcs.length === 0) {
			return ''
		} else if (this.npcs.length === 1) {
			return `There is a ${this.npcs[0].announcement} here.`
		} else {
			let buff = [`${this.npcs.length} characters are here: `]
			this.npcs.forEach((npc) => {
				buff.push(`a ${npc.announcement}`)
			})
			let temp = buff.pop()
	        buff.push(' and ')
	        buff.push(temp)
	        return buff.join(', ')

		}
    }


    eachNpc (fn) {
        this.querySelectorAll('x-npc').forEach(fn)
    }

	connectedCallback () {
	}
}
customElements.define('x-npcs', NPCListElement)


class NPCElement extends StoryItemElement {

	get announcement () {
    	return `Level ${this.character.level} ${this.character.race} ${this.character.class}`
    }


	connectedCallback () {
		this.character = randoCharacter()
		Object.keys(this.character).forEach((key) => {
			if (typeof this.character[key] != 'function') {
				this.setAttribute(`character-${key}`, this.character[key])
			}
		})
	}
}
customElements.define('x-npc', NPCElement)