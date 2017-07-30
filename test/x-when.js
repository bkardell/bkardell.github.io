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
			target = (this.getAttribute('what'))

		if (target == '%stat') {

			let statName = this.getAttribute('name'),
				modifier = this.getAttribute('modifier'),
				verb = (modifier.trim().charAt(0) == "-") ? 'decreased' : 'increased'

			// TODO: get the player and actually modify something
			this.story.queue(`Your ${statName} is ${verb} by ${modifier}`)
		} else {
			let toMod = this.story.querySelectorAll(target)
			toMod.forEach((el) => {
				if (attrToRemove) {
					el.removeAttribute(attrToRemove)
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
	    		closestAttachable = this.parentElement.closest('x-item,x-scene,x-player')

	    	console.log('added event listener to ', closestAttachable, action)
	    	closestAttachable.addEventListener(
	    		action,
	    		(evt) => {
	    			if (this.isPropagationStoppingAction(action)) {
	    				evt.stopPropagation()
	    			}
	    			children.forEach((doable) => {
	    				if (doable.do) {
	    					doable.do()
	    				}
	    			})
	    			if (action == 'look') {
	   		     		story.queue(story.area.currentLocation.exits.announcement)
	    			}
	    		}
	    	)
	    }
    	this.totallyInitedAlready = true
    }

}
customElements.define('x-when', RuleElement)


