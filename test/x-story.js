class StoryElement extends HTMLElement {
    get area () {
        return this.querySelector('x-area')
    }

    save () {
        let key = this.getAttribute('current-area')
        return localforage.setItem(key, this.area.outerHTML)
    }

    getSaved () {
        let key = this.getAttribute('current-area')
        return localforage.getItem(key)
    }

    connectedCallback () {
        var self = this

        this.outQueue = []
        this.style.display = 'none'
        this.private = {
            initArea: (source) => {
                this.innerHTML = source
                this.player = this.querySelector('x-story > x-player')

                if (!this.player) {
                    this.player = this.appendChild(PlayerElement.create())
                }
                this.firstElementChild.currentLocation.enter()
            },
            narrator: new VActor(/UK.*Male/, ''),
            parseIn: (str, dict) => {
              let result
              dict.find((toTest) => {
                result = toTest.match(str)
                return result.length !== 0
              })
              return result
            }
        }

        this.docIsReady = new Promise((resolve)=> {
            document.addEventListener('DOMContentLoaded', () => {
                this.private.narrator.whenReady(() => {

                    self.outEl = document.querySelector('#out')
                    self.inEl = document.querySelector('#in')
                    self.inEl.onchange = () => {
                        console.log('now I just gotta figure out what the hell to do')

                        let dict = [],
                            match
                        dict.push(matcher("(sorry|don't understand)", "sorry"))

                        dict.push(matcher("(go|walk|proceed).*(north|south|east|west|up|down)", "go", "direction"))
                        dict.push(matcher(`(attack|fight|kill).*(${this.area.currentLocation.npcsMatcher||'thingr'})`, "attack", "which"))
                        dict.push(matcher(`(${this.area.currentLocation.actionsMatcher}).*(${this.area.currentLocation.itemsMatcher||'thingr'})`, "evt", "which"))
                        dict.push(matcher(`(equip|wield).*(${this.player.inventory.itemsMatcher})`, "playerevt", "which"))
                         dict.push(matcher(`(look|describe|explain).*(exits|doors)`, "descibeExits"))
                        dict.push(matcher(`(look|describe|explain).*(scene|room|area|around)`, "look", "which"))
                        dict.push(matcher(`(look|describe|explain).*(scene|room|area|around)`, "look", "which"))
                        dict.push(matcher(`(list|tell).*(inventory|carrying)`, "listInventory", "listInventory"))
                        dict.push(matcher(`(save game|save story|save progress)`, "save"))


                        //touch|press|take|own

                        match = this.private.parseIn(self.inEl.value, dict)
                        if (match.sorry) {
                            // skip it bro..
                        } else if (!match) {
                            this.queue(`Sorry, I don't understand what you mean by ${self.inEl.value} - please teach me something new.`)
                        } else {
                            if (match.go){
                                this.player.go(match.direction)
                            } else if (match.listInventory) {
                                this.player.inventory.inventoryAnnouncement
                            } else if (match.attack) {
                                this.player.attack(
                                    this.area.currentLocation.findNpc(match.which)
                                )
                            } else if (match.descibeExits) {
                                this.queue(this.area.currentLocation.exits.announcement)
                            } else if (match.look) {
                                this.area.currentLocation.fire('look')
                                // todo: look should probably always also annouce the exits
                            } else if (match.playerevt) {
                                console.log('this is a player event ')
                                this.player.inventory.locateItem(match.which).fire(match.playerevt)
                            } else if (match.evt) {
                                //console.log('take the ' + match.which)
                                this.area.currentLocation.items.locateItem(match.which).fire(match.evt)
                            } else if (match.save) {
                                this.save().then(()=> {
                                    this.queue("Ok, I've saved it")
                                })
                            } else {
                                this.queue(`Sorry, I don't understand what you mean by ${self.inEl.value} - please teach me something new.`)
                                console.log(match)
                            }
                        }
                        self.inEl.value = ''
                    }
                    resolve()
                })
            })
        })


        this.getSaved().then((savedSrc) => {
            if (savedSrc) {
                this.private.initArea(savedSrc)
            } else {
                fetch(`${this.getAttribute('current-area')}`).then((resp) => {
                    return resp.text().then((source) => {
                        this.private.initArea(source)
                    })
                })
            }
        })
    }

    queue(text) {
        if (this.inEl) {
            // queing can start early
            this.inEl.disabled = true
        }
        this.outQueue.push(text)
        if (this.timeout) {
            clearTimeout(this.timeout)
        }
        this.timeout = setTimeout((() => { this.flush() }).bind(this), 100)
    }

    flush() {
        // do jarvising
        this.docIsReady.then((() => {
            let text = this.outQueue.join('\n')
            this.outEl.innerText = text
            this.private.narrator.say(text).then(() => {
                this.inEl.disabled = false
                this.inEl.focus()
            })
            this.private.narrator.whenYouHear('.*', (heard) => {
                this.inEl.value = heard
                this.inEl.onchange()
            })
            this.outQueue = []
        }).bind(this))

    }
}

customElements.define('x-story', StoryElement)














