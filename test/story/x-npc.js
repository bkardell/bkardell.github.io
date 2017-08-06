class NPCListElement extends StoryItemElement {

	get npcs () {
		return this.querySelectorAll('x-npc')
	}

	get announcement () {
		if (this.npcs.length === 0) {
			return ''
		} else if (this.npcs.length === 1) {
			return `<p class="npcs">There is a ${this.npcs[0].announcement} here.</p>`
		} else {
			let buff = [`<p class="npcs">${this.npcs.length} characters are here: </p><ul>`]
			this.npcs.forEach((npc) => {
				buff.push(`<li>a ${npc.announcement}</li>`)
			})

			buff[buff.length-1] = buff[buff.length-1].replace(`<li>`, `<li>and `)
	        buff.push('</ul>')
	        return buff.join(' ')

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

	get name () {
		return `them`
	}

	get announcement () {
    	return `Level ${this.character.level} ${this.character.race} ${this.character.class}`
    }

    getStat (stat) {
        return `<p>They have ${this.getAttribute('character-' + stat)} ${stat}</p>`
    }

	get statsAnnouncement () {
        let buff = [`<p>They are a Level ${this.getAttribute('character-level')} ${this.getAttribute('character-race')} ${this.getAttribute('character-class')}.
 			They have: <ul>`
        ]
        Array.from(this.attributes).forEach((attr) => {
            if (!/character-level|character-race|character-class|id/.test(attr.name)) {
                buff.push(`<li>${attr.value} ${attr.name.replace('character-', '')}.</li>`)
            }
        })
        buff.push('</li>')
        return buff.join('\n')
    }

    constructor () {
    	super()
    	let rules = this.rules = new TextRules()
    	rules.on(/stats/, () => {
    		this.story.queue(this.statsAnnouncement)
    	})
    	this.rules.on({
          expression: '.*(his|her|their)(.*)',
          captures: ['', 'what']
       }, (captured) => {
        	this.story.queue(this.getStat(captured.what.trim()))
       })
    }

	connectedCallback () {
		this.character = randoCharacter()
        Array.from(this.attributes).forEach((attr) => {
        	if (/character-/.test(attr.name)) {
            	let temp = attr.name.replace('character-', '')
            	this.character[temp] = this.getAttribute(attr.name)
            }
        })

		Object.keys(this.character).forEach((key) => {
			if (typeof this.character[key] != 'function') {
				this.setAttribute(`character-${key}`, this.character[key])
			}
		})
	}
}
customElements.define('x-npc', NPCElement)