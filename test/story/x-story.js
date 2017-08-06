/*
    The story is the top-level game interface, it provides
    quick accessors and methods and is responsible for loading/saving
    and a singular management point for sending things to the voice agent
*/
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

        this.docIsReady = (Promise.all([
            document._state.parsed,
            this.private.narrator.whenReady
        ])).then(() => {
            console.log('ok, I should be all ready')
            self.outEl = document.querySelector('#out')
            self.inEl = document.querySelector('#in')
            self.inEl.onchange = () => {



                let dict = [],
                    match

                dict.push(matcher("(Sorry|teach)", "sorry"))
                dict.push(matcher("(go to|enter) (.*)", "roomCommand", "name"))
                dict.push(matcher("(go|walk|proceed).*(north|south|east|west|up|down)", "go", "direction"))
                dict.push(matcher(`(attack|fight|kill).*(${this.area.currentLocation.npcsMatcher||'thingr'})`, "attack", "which"))
                dict.push(matcher(`(${this.area.currentLocation.actionsMatcher}|get).*(${this.area.currentLocation.itemsMatcher||'thingr'})`, "evt", "which"))
                dict.push(matcher(`(ask|query).*(about|thingr)`, "ask", "which"))
                dict.push(matcher(`(talk|converse).*(${this.area.currentLocation.npcsMatcher||'thingr'})`, "talk", "which"))
                dict.push(matcher(`(equip|wield).*(${this.player.inventory.itemsMatcher})`, "playerevt", "which"))
                dict.push(matcher(`(look|describe|explain).*(exits|doors)`, "descibeExits"))
                dict.push(matcher(`(look|describe|explain).*(scene|room|area|around)`, "look", "which"))
                dict.push(matcher(`(look|describe|explain).*(scene|room|area|around)`, "look", "which"))
                dict.push(matcher(`(list|tell).*(inventory|carrying)`, "listInventory", "listInventory"))
                dict.push(matcher(`(their|enem|opponent).*(health)`, "theirStat", "stat"))
                dict.push(matcher(`(their|enem|opponent).*(stats)`, "theirStats"))
                dict.push(matcher(`(my).*(stats)`, "myStats"))
                dict.push(matcher(`(my).*(health)`, "myStat", "stat"))

                dict.push(matcher(`(save game|save story|save progress)`, "save"))
                dict.push(matcher(`(attack|fight|kill|kick)`, "generalAttack"))
                dict.push(matcher(`(kick their ass)`, "generalAttack"))

                //touch|press|take|own

                if (!self.inEl.value) {
                    return
                }
                if(!/I'd like to/.test(self.inEl.value)) {
                    console.log(`ignoring ${self.inEl.value}`)
                    self.inEl.value = ''
                    return
                }
                match = this.private.parseIn((self.inEl.value.replace(/.*like to/, '').trim()), dict)
                console.log(`now I just gotta figure out what the hell to do with ${self.inEl.value}`, match)

                if (match.sorry) {
                    // skip it bro..
                } else if (!match) {
                    this.queue(`Sorry, I don't understand what you mean by ${self.inEl.value}.`)
                } else {
                    if (match.go){
                        this.player.go(match.direction)
                    } else if (match.listInventory) {
                        this.player.inventory.inventoryAnnouncement
                    } else if (match.attack) {
                        this.player.attack(
                            this.area.currentLocation.findNpc(match.which)
                        )
                    } else if (match.myStats) {
                        this.queue(this.player.statsAnnouncement)
                    } else if (match.myStat) {
                        this.queue(this.player.getStat(match.stat))
                    } else if (match.theirStats) {
                        if (this.area.currentLocation.npcs.firstElementChild) {
                            this.queue(this.area.currentLocation.npcs.firstElementChild.statsAnnouncement)
                        } else {
                            this.queue("sorry, there's no one here right now.")
                        }
                    }  else if (match.theirStat) {
                        this.queue(this.area.currentLocation.npcs.firstElementChild.getStat(match.stat))
                    } else if (match.generalAttack) {
                        this.player.attack(
                            this.area.currentLocation.npcs.firstElementChild
                        )
                    } else if (match.roomCommand) {
                        this.area.getScene(match.name).enter()
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
                    } else if (match.talk) {
                        //console.log('take the ' + match.which)
                        this.area.currentLocation.npcs.firstElementChild.fire('talk')
                    } else if (match.ask) {
                        //console.log('take the ' + match.which)
                        this.area.currentLocation.npcs.firstElementChild.querySelector(`[subject*="${match.which}"]`)
                        this.area.currentLocation.npcs.firstElementChild.fire('ask')
                    } else if (match.save) {
                        this.save().then(()=> {
                            this.queue("Ok, I've saved it")
                        })
                    } else {
                        this.queue(`Sorry, I don't understand what you mean by ${self.inEl.value}.`)
                        console.log(match)
                    }
                }
                self.inEl.value = ''
            }
        })


        this.getSaved().then((savedSrc) => {
            this.docIsReady.then(() => {
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

        })
    }

    queue(text) {
        if (this.inEl) {
            // queing can start early
            this.inEl.disabled = true
        }
        //if (!this.isSpeaking) {
            console.log('queing ', text)
            this.outQueue.push(text)
            if (this.timeout) {
                clearTimeout(this.timeout)
            }
            this.timeout = setTimeout((() => { this.flush() }).bind(this), 100)
        //}
    }

    flush() {
        // do jarvising
        this.docIsReady.then((() => {
            console.log('the doc is ready')
            let text = this.outQueue.join('\n')
            this.outEl.innerText = text
            console.log('flush 1')
            this.private.narrator.say(text).then(() => {
                console.log('flush 2')
                this.inEl.disabled = false
                this.inEl.focus()
                //this.isSpeaking = false
            }).catch((e) => {
                console.log('flush 3')
                console.error('oh noes', e)
                this.inEl.disabled = false
                this.inEl.focus()
                //this.isSpeaking = false

            })
            this.private.narrator.whenYouHear('.*', (heard) => {
                //if (!this.isSpeaking) {
                    this.inEl.value = heard
                    this.inEl.onchange()
                //}
            })
            this.outQueue = []
        }).bind(this))

    }
}

customElements.define('x-story', StoryElement)














