class BasicVoiceListener {

    constructor(options = {}) {
      const SpeechRecognition = window.SpeechRecognition || webkitSpeechRecognition,
            SpeechGrammarList = window.SpeechGrammarList || webkitSpeechGrammarList,
            SpeechRecognitionEvent = window.SpeechRecognitionEvent || webkitSpeechRecognitionEvent,
            recognition = this.recognition = new SpeechRecognition()

      let speechRecognitionList = new SpeechGrammarList(),
          readyResolver,
          readyRejector,
          isListening = false,
          inited = false,
          heardCallbacks = []

      this.__recognition = recognition

      speechRecognitionList.addFromString(options.grammar, 1)
      recognition.grammars = speechRecognitionList
      recognition.lang = 'en-US'
      recognition.interimResults = false
      recognition.maxAlternatives = 1

      this.ready = new Promise((resolve, reject) => {
        readyResolver = resolve
        readyRejector = reject
      })

      this.start = () => {
        recognition.start()
      }

      this.stop = () => {
        isListening = false
        recognition.abort()
      }

      this.addEventListener = function (name, cb) {
        if (name === 'heard') {
          if (!heardCallbacks.includes(cb)) {
            heardCallbacks.push(cb)
          }
        }
      }

      this.removeEventListener = function (name, cb) {
        if (name === 'heard') {
          let foundIndex = heardCallbacks.indexOf(cb)
          if (foundIndex !== -1) {
            heardCallbacks.splice(foundIndex, 1)
          }
        }
      }

      recognition.onstart = function() {
        isListening = true
        if (!inited) {
          console.log('starting recognition')
          inited = true
          readyResolver()
          //window.resolvedone = true
        }
      }

      this.isListening = () => { return isListening }

      recognition.onend = function(oy = 'oy') {
        if (isListening) {
          recognition.start()
        }
      }

      recognition.onerror = function(oy) {
        if (isListening) {
          //recognition.start()
        }
      }

      recognition.onresult = function(evt) {
        const last = event.results.length - 1,
            match = event.results[last][0].transcript

        heardCallbacks.forEach((cb) => {
          cb(match)
        })
      }

      if (options.autostart) {
        this.start()
      }
    }
  }


/*
  creating one is this simple...
  it accepts an optional 'options' object which may contain a boolean
  {autostart: true} and an optional { grammar: str } where grammar
  is a JSGF string https://www.w3.org/TR/jsgf/.  In practice, this
  doesn't actually seem to do anything and I dont know anyone who
  actually knows JSGF anyway, so you can skip it.
*
let basicVoiceListener = new BasicVoiceListener({autostart: true})

// our newly created object has methods to .start() and .stop()
// but we already have asked it to autostart, so no reason to
/// do that..
// Frequently you want to know when it's started up and ready to
// receive input, so there's a .ready promise for that
basicVoiceListener.ready.then(() => {
  document.body.style.backgroundColor = 'green'
})

basicVoiceListener.addEventListener('heard', (what) => {
    console.log(`I heard ${what}`)
  })

/*
static matcher (pattern, ...names) => {
      let re = new RegExp(pattern, 'i')
      return {
         pattern: pattern,
         match: (str) => {
            let result = str.match(re)

            if (!result) {
              return []
            }

            let ret = { text: str }
            result.forEach((match, i) => {
                 if (i > 0) {
                    ret[names[i-1]] = match
                 }
              })
              return ret;
         }
       }
    }*/