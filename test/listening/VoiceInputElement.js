
class XVoiceInputElement extends HTMLElement {
	get referenceElement () {
		return this.querySelector(`#${this.id} > input, #${this.id} > textarea`)
	}

	get isListening () {
		return this._voiceListener.isListening //this.hasAttribute('listening')
	}

	stopListening () {
		this._voiceListener.pause()
		this._voiceListener.stop()
		this.removeAttribute('listening')
		this.shadowRoot.querySelector('.toggler').innerHTML = `Listen`
	}

	startListening () {
		this._voiceListener.unpause()
		this._voiceListener.start()
		this.setAttribute('listening', '')
		this.shadowRoot.querySelector('.toggler').innerHTML = `Don't Listen`
	}

	constructor() {
		super()
	}

	connectedCallback() {
		let checkAutoStart = () => {
				if (this.hasAttribute('autostart') && this.referenceElement) {
					this.startListening()
				}
			},
			observer = new MutationObserver((mutations) => {
			  checkAutoStart()
			}),
			shadowRoot = this.attachShadow({mode: 'open'})
			shadowRoot.innerHTML = `
				<slot></slot>
				<button class="toggler" aria-label="toggle recognition"></button>`

			shadowRoot.querySelector('.toggler')
					.addEventListener('click', (evt) => {
						if (this.isListening()) {
							this.stopListening()
						} else {
							this.startListening()
						}
						console.log(evt, this)
					})


			this._voiceListener = window._voiceListener //new BasicVoiceListener()
			this._voiceListener.addEventListener('heard', (what) => {
			    let target = this.referenceElement
			   	let trimmedWhat = (what) ? what.trim() : ''
			    if (target && trimmedWhat) {
			    	target.value = what
	            	target.dispatchEvent(new InputEvent('change'))
			    }
			})

			this.id = this.id || 'xlistener-' + Date.now()

			observer.observe(this, {
				childList: true
			})


			checkAutoStart()
	}

}
customElements.define('x-voice-listener', XVoiceInputElement)
