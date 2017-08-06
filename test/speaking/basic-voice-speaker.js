
/* Here's the thing... there's only one speechSynthesis object
   and lots of buggy or weird stuff to deal with here...
	1) Which voice it speaks in comes from a list accessed by .getVoices()
	2) The list isn't available immediately on all platforms and
	   until they are ready, you'll always get an empty list/the default voice
	3) What the default voice is varies wildly. On android it seems to be
	   the last voice anyone used anywhere
	4) What voices are called varies wildly
	5) The specs aren't updated/contain errata on much of this

	To this end, I find it simpler to use an abstraction..
*/

class BasicVoiceSpeaker {

	/*
		The constructor takes an optional regexp for determining the voice
		this at least lets us simplify the process of searching for a decent voice
		that sort of matches something we might expect
	*/
	constructor(test = /.*/) {
		const synth = window.speechSynthesis
		let voice = null

		// We only ever need get the list of voices once, so
		// let's just expose a promise for that
		BasicVoiceSpeaker.voicesReady = BasicVoiceSpeaker.voicesReady || new Promise((resolve) => {
			synth.onvoiceschanged = () => {
				resolve(synth.getVoices())
			}
			synth.getVoices()
		})

		this.ready = new Promise((resolve, reject) => {
			return BasicVoiceSpeaker.voicesReady.then((voices) => {
				voice = voices.find((v) => {
	              return test.test(v.name)
	            })
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
	                  console.log(`...uhm..`)
	                  resolve()
	              }
	              utterThis.onmark = () => {
	                  console.log(`...uhm mark?..`)
	                  resolve()
	              }
	              utterThis.onpause = () => {
	                  console.log(`...uhm pause?..`)
	                  resolve()
	              }
	              utterThis.onstart = () => {
	              	console.log(`...uhm start?..`)
	              }
	              utterThis.addEventListener('error', () => {
	              	console.log('ended')
	              })
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
  		/*return Promise.all(queue).then(() => {
  			console.log('all my speaking should be done now')
  		})*/
	}
}

//new BasicVoiceSpeaker(/UK.*Female/).say('female speaker all ready')

//new BasicVoiceSpeaker(/UK.*Male/).say('Male speaker all ready')