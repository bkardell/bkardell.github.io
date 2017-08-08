/*
    The story is the top-level game interface, it provides
    quick accessors and methods and is responsible for loading/saving
    and a singular management point for sending things to the voice agent
*/
class StoryElement extends HTMLElement {
    get area () {
        return this.querySelector('x-area')
    }

    get lastCommand () {
      return this.getAttribute('last-command')
    }

    get currentTextRules () {
      return new TextRules().on({
          expression: `.*(look|describe).*(room|around|scene)`,
          captures: ["action", 'item']
        }, (captured) => {
         //return this.player.rules.process(captured.subject)
         this.area.currentLocation.fire('look')
         return true
        }).on({
          expression: `(${this.area.currentLocation.actionsMatcher}).*(${this.area.currentLocation.itemsMatcher})`,
          captures: ["action", 'item']
        }, (captured) => {
         //return this.player.rules.process(captured.subject)
         this.area.currentLocation.items.locateItem(captured.item).fire(captured.action)
         return true
        }).on({
          expression: `(${this.player.actionsMatcher}).*(${this.player.inventory.itemsMatcher})`,
          captures: ["action", 'item']
        }, (captured) => {
         //return this.player.rules.process(captured.subject)
         this.player.inventory.locateItem(captured.item).fire(captured.action)
         return true
       }).on({
          expression: `.*(take|get).*(${this.area.currentLocation.itemsMatcher})`,
          captures: ["action", 'item']
        }, (captured) => {
         //return this.player.rules.process(captured.subject)
         this.area.currentLocation.fire('take')
         return true
        })
    }

    save (gameName = 'default', saveName = 'default') {
        let key = `${gameName}-${saveName}`
        return localforage.setItem(key, this.area.outerHTML)
    }

    getSaved (gameName = 'default', saveName = 'default') {
        let key = `${gameName}-${saveName}`
        return localforage.getItem(key)
    }

    interpret (input) {
      if (input != 'again') {
        this.setAttribute('last-command', input)
      } else {
        input = this.getAttribute('last-command')
      }
      return this.currentTextRules.process(input).then((handled) => {
             if (!handled) {
               //this is really when we should run the rules, probably just expose a
               //
               return this.rules.process(input)
             }
          }).catch((e) => {
            return this.rules.process(input)
          })
          //this.rules.process(input)
    }

    constructor () {
        super()


        this.rules = new TextRules()

/*        // todo - this needs thought :(
       this.rules.on({
          expression: '.*(look|take|drink).*',
          captures: ['look']
       }, (captured) => {
          // here we need to figure out what to look at...
          return
          //
       })
*/

        this.rules.on('again', () => {
          return this.rules.process(this.lastCommand)
        })

        this.rules.on({
          expression: '(my)(.*)',
          captures: ["player", 'subject']
       }, (captured) => {
         return this.player.rules.process(captured.subject)
       })

       this.rules.on({
          expression: 'how much (.*) do (I) have',
          captures: ['subject',"player"]
       }, (captured) => {
         return this.player.rules.process(captured.subject)
       })

       this.rules.on({
          expression: '(go|walk|run|climb).*(north|south|east|west|up|down|stairs)',
          captures: ['go', 'direction']
       }, (captured) => {
         return this.player.go(captured.direction)
       })

       this.rules.on({
          expression: '(go to|enter) (.*)',
          captures: ['', 'roomName']
       }, (captured) => {
          let scene = this.area.getScene(captured.roomName.trim())
          if (!scene) {
            return this.queue(`I don't see ${captured.roomName} here`)
          }
          return scene.enter()
       })



       this.rules.on(/(list|tell me).*(inventory|carrying)/, () => {
            return this.player.inventory.inventoryAnnouncement
       })

       this.rules.on(/(attack|kill|hit|kick).*/, (match) => {
            // TODO: deal with more than one in a room..
            // possibly these rules belong to npcs, not npc
            return this.player.attack(
                this.area.currentLocation.npcs.firstElementChild
            )

       })
       this.rules.on({
          expression: 'save (game|story|progress|game)( as .*)?',
          captures: ['save', 'as']
       }, (captured) => {
            return this.save('default', (captured.as || '').replace(' as ', '').trim() || 'default').then(()=> {
                this.queue("Ok, I've saved it")
            })
       })

       this.rules.on(/their|his|her/, (match) => {
            // TODO: deal with more than one in a room..
            // possibly these rules belong to npcs, not npc
            return this.area.currentLocation.npcs.firstElementChild.rules.process(match.text)

       })

       this.rules.on({
          expression: '(talk to|speak to|ask) (.*)',
          captures: ['speaking', 'what']
       }, (match) => {
            console.log(match)
            this.area.currentLocation.npcs.firstElementChild.fire('talk')
       })


        /*
            save game as
            restore saved game (*)

            Look,
            take,
            go,
            fight,
            talk to
        */
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
            parseIn: (str, dict) => {
              let result
              dict.find((toTest) => {
                result = toTest.match(str)
                return result.length !== 0
              })
              return result
            }
        }

        // need a promise here I think about whether the map is ready
        // exposed to the game/story html
        this.docIsReady = document._state.parsed.then(() => {})

        // probably we want to get all the saves and present for choice

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
        let temp = text.trim(),
            punctionationRe = /[.,\/#!$%\^&\*;:{}=\-_`~()](<\/\w*\>)?$/
        temp = temp + ( punctionationRe.test(temp) ? '' : '.')
        console.log('queing ', temp)
        this.outQueue.push(temp)
    }

    flush() {
        let text = this.outQueue.join('\n')
        this.outQueue = []
        return text
    }
}

customElements.define('x-story', StoryElement)














