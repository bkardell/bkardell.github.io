
/* Why? see http://bkardell.com/blog/Greetings-Professor-Falken.html */
class BasicVoiceSpeaker {

	/*
		The constructor takes an optional regexp for determining the voice
		this at least lets us simplify the process of searching for a decent voice
		that sort of matches something we might expect
	*/
	constructor(test = /.*/) {
		const synth = window.speechSynthesis
		let voice = null,
			tester = test

		if (test instanceof RegExp) {
			tester = function (v) {
				return test.test(v.name)
			}
		}


		// We only ever need get the list of voices once, so
		// let's just expose a promise for that
		BasicVoiceSpeaker.voicesReady = BasicVoiceSpeaker.voicesReady || new Promise((resolve) => {
			let voices = synth.getVoices()
			if (voices.length ===0 ) {
				synth.onvoiceschanged = () => {
					resolve(synth.getVoices())
				}
			} else {
				resolve(voices)
			}

		})

		this.ready = new Promise((resolve, reject) => {
			return BasicVoiceSpeaker.voicesReady.then((voices) => {
				voice = voices.find(tester)
	            console.log('voices should be ready')
		        resolve()
			})
	    })

		// There's also a problem with log utterances and managing this is a
		// serious pita with events to this end, let's create an internal,
		// promise based 'speech transaction'
        this.__sayThis = (shortText) => {
            return this.ready.then(() => {
            	return new Promise((resolve, reject) => {
	              let utterThis = new SpeechSynthesisUtterance(shortText)
	              utterThis.pitch = 1
	              utterThis.rate = 1.2
	              utterThis.voice = voice
	              if (voice.voiceURI) {
	              	utterThis.voiceURI = voice.voiceURI
	              	utterThis.lang = voice.lang
	              }
	              console.log(`promising `, shortText)
	              utterThis.onend = () => {
	                  console.log(`done speaking, resolving..`, shortText)
	                  resolve()
	              }
	              utterThis.onerror = () => {
	                  resolve()
	              }
	              setTimeout(() => {
	              	window.__utterance = utterThis
	                synth.speak(utterThis)
	              },100)
	          })
            })
        }
  	}

    // oy, even queing is buggy... a whole bunch of things
    // get spoken and not resolved if I do Promise.all(queue)
    __sayNext (queue) {
    	return this.__sayThis(queue.shift()).then(() => {
    		return (queue.length > 0) ? this.__sayNext(queue) : null
    	})
  	}
  	 // the method we expose will do some simple auto-queuing for us
        // to avoid the long text problems and keep things simple..
        // periods make for a natural place to pause, so this isn't
        // 'bullet proof' but in practice it seems to work pretty well.
    say(text) {
  		let queue = []
  		text.split(/[.,&"\n]/).forEach((shortText) => {
    		queue.push(shortText)
    		//queue.push(this.__sayThis(shortText))
  		})
  		return this.__sayNext(queue).then(() => {
  			console.log('all my speaking should be done now')
  		})
	}
}

new BasicVoiceSpeaker((voice) => {
   return /ubbles/.test(voice.name) || /emale/.test(voice.name)
}).say('bubbles or female speaker all ready')

new BasicVoiceSpeaker(/UK.*Female/).say('female speaker all ready')
new BasicVoiceSpeaker(/UK.*Male/).say('Male speaker all ready')