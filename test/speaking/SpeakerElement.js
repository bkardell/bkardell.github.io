class XSpeakerElement extends HTMLElement {
    activate() {
        this.shouldSpeak = true
        this.shadowRoot.querySelector('.toggler').innerHTML = `Don't speak`
    }

    deactivate() {
        this.shouldSpeak = false
        this.shadowRoot.querySelector('.toggler').innerHTML = `Speak`
    }

    constructor() {
        super()
        let observerCfg = {
                childList: true,
                characterData: true,
                subtree: true
            },
            self = this,
            throttleTimeout,
            observer = new MutationObserver((mutations) => {
                if (throttleTimeout) {
                    clearTimeout(throttleTimeout)
                }
                throttleTimeout = setTimeout(() => {
                    let toSpeak = self.innerText.trim(),
                    	evt = new Event('finished-speaking',
                    		{
                    	        bubbles: true,
                            	cancelable: true
                        	}
                        )

                    if (self.shouldSpeak && toSpeak) {
                        self.__spkr.say(toSpeak).then(() => {
                            self.dispatchEvent(evt)
                        })
                    } else {
                    	self.dispatchEvent(evt)
                    }
                }, 250)
            })
        observer.observe(this, observerCfg)
    }


    connectedCallback() {
        let voice = this.getAttribute('voice') || 'UK.*Female',
            speakerRegExp = new RegExp(voice, 'i'),
            shadowRoot = this.attachShadow({
                mode: 'open'
            })


        this.shouldSpeak = this.hasAttribute('autostart')

        shadowRoot.innerHTML = `
			<div style="width: 85%; float: left; border: 1px solid red"><slot></slot></div>
			<button class="toggler" aria-label="toggle speech">${ (this.shouldSpeak) ? `Don't` : ``} Speak!</button>`

        shadowRoot.querySelector('.toggler')
            .addEventListener('click', (evt) => {
                if (this.shouldSpeak) {
                    this.deactivate()
                } else {
                    this.activate()
                }
                console.log(evt, this)
            })


        this.__spkr = new ListenerPausingVoiceSpeaker(speakerRegExp)

    }
}
customElements.define('x-speaker', XSpeakerElement)