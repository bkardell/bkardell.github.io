class SayElement extends StoryItemElement {
	do () {
		this.story.queue(this.innerText)
	}
}
customElements.define('x-say', SayElement)


// we need a factory of actions here maybe? take? or should that be it's own thing
class ModifyElement extends StoryItemElement {
	do () {
		let attrToRemove = this.getAttribute('removeAttribute'),
			target = (this.getAttribute('what')),
			attName = this.getAttribute('name'),
			modifier = this.getAttribute('modifier')

	   	// TODO: rewrite using modify on story item element
		if (target == '%stat') {
			let verb = (modifier.trim().charAt(0) == "-") ? 'decreased' : 'increased'

			let player = this.story.player,
				oldValue =  parseInt(player.getAttribute(`character-${attName}`) || 0, 10)

			player.setAttribute(`character-${attName}`, oldValue + parseInt(modifier, 10))

			this.story.queue(`Your ${attName} is ${verb} by ${modifier}`)
		} else {
			let toMod = this.story.querySelectorAll(target)
			toMod.forEach((el) => {
				if (attrToRemove) {
					el.removeAttribute(attrToRemove)
				}

				if (modifier) {
					let oldValue =  parseInt(el.getAttribute(attName) || 0, 10)
					el.setAttribute(attName, oldValue + parseInt(modifier, 10))
				}
			})
		}
	}

}
customElements.define('x-modify', ModifyElement)

/*
class TakeElement extends StoryItemElement {
	do () {
		let attrToRemove = this.getAttribute('removeAttribute'),
			toMod = this.story.querySelectorAll(
				this.getAttribute('what')
			)
		toMod.forEach((el) => {
			if (attrToRemove) {
				el.removeAttribute(attrToRemove)
			}
		})
	}
}
customElements.define('x-take', TakeElement)

*/



class RuleElement extends StoryItemElement {

	isPropagationStoppingAction (action) {
		return /look/.test(action)
	}

	get action () {
		return this.getAttribute('action') || this.getAttribute('event')
	}

    connectedCallback () {
    	if (!this.totallyInitedAlready) {
	    	let story = this.story,
	    		children = Array.from(this.children),
	    		action = this.getAttribute('action') || this.getAttribute('event'),
	    		closestAttachable = this.parentElement.closest('x-item,x-scene,x-player,x-npc'),
	    		test = () => {
	    			let filter = this.getAttribute('filter'),
	    				isConsumable = closestAttachable.hasAttribute('usable-times')

					if (isConsumable && closestAttachable.getNumericAttribute('usable-times') <= 0) {
						return false
					}
	    			if (filter) {
	    				return this.story._querySelector(filter)
	    			}
	    			return true
	    		}

	    	//console.log('added event listener to ', closestAttachable, action)
	    	closestAttachable.addEventListener(
	    		action,
	    		(evt) => {
	    			if (this.isPropagationStoppingAction(action)) {
	    				evt.stopPropagation()
	    			}

	    			if (test()) {
		    			children.forEach((doable) => {
		    				if (doable.do) {
		    					doable.do()
		    				}
		    			})
		    			if (action == 'look') {
		    				// this should probably be a method somewhere, it's also in scene
		   		     		story.queue(story.area.currentLocation.exits.announcement)
		   		     		story.queue(story.area.currentLocation.npcs.announcement)
		    			}
		    		}
	    		}
	    	)
	    }
    	this.totallyInitedAlready = true
    }

}
customElements.define('x-when', RuleElement)


