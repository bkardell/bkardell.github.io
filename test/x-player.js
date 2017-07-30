/*
<x-player health="10">
    <x-inventory id="player-inventory"></x-inventory>
</x-player>
*/

class PlayerElement extends StoryItemElement {
	static create () {
		let player = document.createElement('x-player')
		player.character = randoCharacter()
		Object.keys(player.character).forEach((key) => {
			if (typeof player.character[key] != 'function') {
				player.setAttribute(`character-${key}`, player.character[key])
			}
		})

		player.innerHTML = `<x-inventory id="player-inventory"></x-inventory>`
		return player
	}

    go (dir) {
    	let exit = this.story.area.currentLocation.exits.findExit(dir)
    	if (exit) {
    		exit.followExit()
    	} else {
    		this.story.queue(`I see no exit ${dir}`)
    	}

    }

    attack (npcEl) {
    	let player = this.character,
    		npc = npcEl.character,
	    	whatToSay = ''
    	player.attack(npc, (result) => {
			if (result.isDead) {
                whatToSay = `The enemy has been vanquished. Their lifeless form lies at your feet.`
            } else {
                if (result.type == 'hit') {
                    if (result.damage > 0) {
                        whatToSay = `The enemy has been hit, dealing ${result.damage} damage.`
                    } else {
                        whatToSay += `Your attack grazes harmlessly dealing no real damage`
                    }
                } else {
                    whatToSay = `You've missed entirely.`
                }
                whatToSay += ".... Their turn. "
                npc.attack(player, (result) => {
                    if (result.isDead) {
                        whatToSay = `You have been killed. R.I.P.`
                    } else {
                        if (result.type == 'hit') {
                            if (result.damage > 0) {
                                whatToSay += `Ouch. Shit. The enemy's blow deals ${result.damage} damage.`
                            } else {
                                whatToSay += `The enemy's blow grazes harmlessly dealing no damage`
                            }
                        } else {
                            whatToSay += `Their attack misses entirely.`
                        }
                    }
                })
            }
    	})
    	this.story.queue(whatToSay)
    }

	take (itemEl) {
		this.inventory.appendChild(itemEl)
	}

    connectedCallback () {
    	this.inventory = this.querySelector('x-inventory')
    }
}
customElements.define('x-player', PlayerElement)




class InventoryElement extends StoryItemElement {
	get items () {
		return this.querySelectorAll('x-item:not([hidden])')
	}

	get inventoryAnnouncement () {
		let buff = [], items = this.items

		items.forEach((item) => {
			buff.push(item.announcement)
		})
		if (items.length == 0) {
			buff.push('nothing')
		} else if (items.length > 1) {
			let temp = buff.pop()
			buff.push(' and ')
			buff.push(temp)
		}
		this.story.queue(`You are carrying: \n${buff.join(".\n")}`)
	}

	get itemsMatcher () {
        let set = new Set()

        this.items.forEach((item) => {
            set.add(item.name)
        })
        return Array.from(set).join('|')
    }

	locateItem (name, includeHidden = false) {
    	let filter = (includeHidden) ? '' : ':not([hidden]'
    	return this.querySelector(`x-item[name*="${name}"]${filter}`)
    }

    connectedCallback () {

    }
}
customElements.define('x-inventory', InventoryElement)
