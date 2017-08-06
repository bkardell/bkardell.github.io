class PauseableVoiceListener extends BasicVoiceListener {

    pause() {
      this.isPaused = true
    }

    unpause() {
      this.isPaused = false
    }

    constructor(options = {}) {
      super()
      this.pauseWhile = (promise) => {
        return new Promise((resolve, reject) => {
            this.stop()
            return promise.then(() => {
                  if (!this.isPaused) {
                    this.start()
                  }
                  resolve()
            }).catch((e)=> {
              console.error(e)
              reject()
            })
        })
      }
    }

}
