
class XVoiceInputElement extends HTMLElement {
	get referenceElement () {
		return this.querySelector(`#${this.id} > input, #${this.id} > textarea`)
	}

	get isListening () {
		return this._voiceListener.isListening //this.hasAttribute('listening')
	}

	stopListening () {
		//this._voiceListener.pause()
		this._voiceListener.stop()
		this.removeAttribute('listening')
		this.shadowRoot.querySelector('.toggler').innerHTML = `Listen`
	}

	startListening () {
		if (!this._voiceListener.isPaused) {
			this._voiceListener.start()
			this.setAttribute('listening', '')
			this.shadowRoot.querySelector('.toggler').innerHTML = `Don't Listen`
		}
	}

	constructor() {
		super()
	}

	connectedCallback() {
		let checkAutoStart = () => {
				let hasAttribute = this.hasAttribute('autostart')
				if (hasAttribute && this.referenceElement) {
					this.startListening()
				} else if (!hasAttribute){
					this._voiceListener.isPaused = true
				}
			},
			observer = new MutationObserver((mutations) => {
			  checkAutoStart()
			}),
			shadowRoot = this.attachShadow({mode: 'open'})
			shadowRoot.innerHTML = `
				<slot></slot>
				<button class="toggler" aria-label="toggle recognition">Listen</button>`

			shadowRoot.querySelector('.toggler')
					.addEventListener('click', (evt) => {

						if (this.isListening()) {
							this._voiceListener.pause()
							this.stopListening()
						} else {
							this._voiceListener.unpause()
							this.startListening()
						}
						console.log(evt, this)
					})


			this._voiceListener = window._voiceListener
			this._voiceListener.addEventListener('heard', (what) => {
			    let target = this.referenceElement
			   	let trimmedWhat = (what) ? what.trim() : ''
			    if (target && trimmedWhat) {
			    	let evt = document.createEvent("HTMLEvents");
				    evt.initEvent("change", false, true);
				    target.value = what
	            	target.dispatchEvent(evt)
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
