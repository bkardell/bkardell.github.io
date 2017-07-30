const createRecognizer = (grammar) => {
    const SpeechRecognition = window.SpeechRecognition || webkitSpeechRecognition,
          SpeechGrammarList = window.SpeechGrammarList || webkitSpeechGrammarList,
          SpeechRecognitionEvent = window.SpeechRecognitionEvent || webkitSpeechRecognitionEvent,
          recognition = this.recognition = new SpeechRecognition(),
          cbDb = {},
          retVal = {
            whenReady: (cb) => {
              readyCb = cb
            },
            isListening: false,
            pauseUntil: (promise) => {
              return new Promise((resolve, reject) => {
                recognition.abort()
                retVal.isListening = false
                retVal.isPaused = true
                return promise.then(() => {
                  recognition.start()
                  retVal.isListening = true
                  resolve()
                }).catch((e)=> {
                  console.error(e)
                  reject()
                })
              })
            },
            stopListening: () => {
              recognition.abort()
            },
            whenYouHear: (match, cb) => {
              cbDb[match] = cb
            }
          }

    let speechRecognitionList = new SpeechGrammarList(),
        readyCb = () => { console.log('no op.ready') }
        inited = false

    speechRecognitionList.addFromString(grammar, 1)
    recognition.grammars = speechRecognitionList
    recognition.lang = 'en-US'
    recognition.interimResults = false
    recognition.maxAlternatives = 1

    recognition.onresult = function(evt) {
      var last = event.results.length - 1,
          match = event.results[last][0].transcript

      console.log(`heard ${match}`)
      if (cbDb[match]) {
        cbDb[match](match)
      } else {
        let found = Object.keys(cbDb).find((key) => {
          return new RegExp(key).test(match)
        })
        if (found) {
          cbDb[found](match)
        } else {
          console.log(`I didn't understand ${match}`)
        }
      }
      //self.fire('heard', event.results[last][0])
    }

    recognition.onstart = function() {
      console.log('Starting...');
      retVal.isListening = true
      if (!inited) {
        inited = true
        readyCb()
      }
    }

    recognition.onnomatch = function() {
      console.log('Speech not recognised');
    }

    recognition.onend = function(evt) {
      console.log(`recognition ended ${retVal.isListening}`)
      if (retVal.isListening) {
        console.log('supposed to be listening, so restarting...')
        recognition.start()
      }
    }

    recognition.onerror = function(evt) {
      if (evt.error === 'aborted') {
        console.log('recognition aborting..')
        //evt.preventDefault()
      } else {
        // denada?
      }
    }

    setTimeout(() => {
      recognition.start()
    })

  return retVal
}



class VActor {
  constructor(test, grammar) {
    let recognizer = createRecognizer(grammar),
        voice = null,
        readyCb = () => { console.log('vActor noop.ready') }

    const synth = window.speechSynthesis,
          self = this,
          tryInit = () => {
            let temp = synth.getVoices()
            console.log('trying to init voice...')
            if (temp.length === 0) {
              setTimeout(tryInit, 500)
              return
            }
            voice = temp.find((v) => {
              return test.test(v.name)
            })
            readyCb()
          },
          _say = (shortText) => {
            return new Promise((resolve, reject) => {
              var utterThis = new SpeechSynthesisUtterance(shortText)
              utterThis.pitch = 1
              utterThis.rate = 1.2
              utterThis.voice = voice
              console.log('about to speak...')
              utterThis.onend = () => {
                  console.log(`done speaking, resolving..`)
                  resolve()
              }
              utterThis.onerror = () => {
                  console.log(`...uhm..`)
                  resolve()
              }
              setTimeout(() => {
                console.log(utterThis)
                synth.speak(utterThis)
              })
          })
          }



    recognizer.whenReady(() => {
      tryInit()
    })

    this.whenReady = (cb) => {
      readyCb = cb
    }

    this.whenYouHear = recognizer.whenYouHear

    this.say = (text) => {
      let queue = []
      text.split(".").forEach((shortText) => {
        queue.push(_say(shortText))
      })
      return recognizer.pauseUntil(Promise.all(queue))
    }

    this.pauseUntil = (promise) => {
      return recognizer.pauseUntil(promise)
    }
  }
}