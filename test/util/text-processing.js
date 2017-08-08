/*
  A TextRulesProcess is a little like a rules engine for matching free-form
  input text, regardless of where that comes from (input boxes, other systems,
  voice recognition, etc).

  Basically, it works like this:  First you create an instance of TextRules.
  Then you add rules by calling `.when(...)`.  There are several variants
  of how you can add a rule, but each has a callback.

  The simplest form is an exact match and you'd add them like this:

  ```javascript
    // create an instance of TextRules
    let rules = new TextRules()
    rules.on(`open sublime`, () => {
      console.log(`Ok, I'll open sublime`)
    })
    rules.on(`open chrome`, () => {
      console.log(`Ok, I'll open chrome`)
    })
  ```

  You can process the rules whenever by calling `.process(someText)` and,
  as you might expect, the correct function will be called (testing is
  applied against case insensitive and trimmed input).  This method returns
  a promise which will be either resolved or rejected depending on whether
  it was processed, and the promise resolves the return value of your processor,
  so..


  ```javascript
    // create an instance of TextRules
    let rules = new TextRules()
    rules.on(`make the coffee`, () => {
      console.log(`Ok, here's some coffee`)
      return { item: `coffee` }
    })
    rules.on(`make a sandwhich`, () => {
      console.log(`Ok, here's a sandwhich`)
      return { item: `sandwhich` }
    })

    rules.process(`make a sandwhich`).then((made) => {
       console.log(made)
    }).catch((e) => {
       console.error(`I didn't understand`, e)
    })


    rules.process(`make me some tea`).then((made) => {
       console.log(made)
    }).catch((e) => {
       console.error(`I didn't understand`, e)
    })
  ```




  Rules are evaluated in "priority order" until one is found.  Exact matches
  are considered the highest priorty and in the event none exists, it turns to
  'fuzzy matches'.

  For example, what if you wanted to allow for more natural language sorts of variance.. F
  or this purpose, you can use a Regular Expression...

    ```javascript
    rules.on(/.*kill.*all.*processes/, () => {
      console.log(`Ok, I'll kill all the processes`)
    })
    ```

  Now, the callback will inform the user that will it kill all the processes whether you
  process any input that matches.. for example

    ```javascript
    > rules.process('kill all processes')
    OK, I'll kill all the processes

    > rules.process('Jarvis, kill all the processes')
    OK, I'll kill all the processes

    > rules.process('Please kill all the stupid processes')
    OK, I'll kill all the processes

    ```

  By default, the priority of fuzzy rules are the order that they were added,
  the most important first.  It's possible though to add a priority when you
  register by passing a third, numeric argument assigning the weight
  (0 is the highest, shoving it to the top of the search)

  So, for example if we realized later that the following was kind of bad

    ```javascript
    > rules.process('OMG whatever you do don't kill all the processes')
    OK, I'll kill all the processes
    ```

  We could add a more important rule later by providing an index, such as

    ```javascript
    rules.on(/(.*don't.*)/, () => {
      console.log(`Ok, I won't`)
    }, 0)
    ```

  and now when we process:

    ```javascript
    > rules.process('OMG whatever you do don't kill all the processes')
    OK, I won't
    ```

*/

class TextRules {
    static matcher (pattern, ...names) {
      let re = (/RegExp/.test(pattern.constructor.toString())) ? pattern : new RegExp(pattern, 'i')
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
    }

    // how could be a string (exact match)
    // a regexp (simple, fuzzy match)
    on (how, cb, insertionIndex) {
      let index = (typeof insertionIndex !== 'undefined') ? insertionIndex : this._data.rules.length
      if (typeof how === 'string') {
        this._data.exact[how.trim().toLowerCase()] = cb
      } else if (/RegExp/.test(how.constructor.toString())) {
        this._data.rules.splice(index, 0, { matcher: TextRules.matcher(how), cb: cb })
      } else if (how.expression) {
        this._data.rules.splice(index, 0, {
          matcher: TextRules.matcher(how.expression, ...how.captures),
          cb
        })
      }
      return this
    }

    process (textInput) {
      return new Promise((resolve, reject) => {
        let trimmed = textInput.trim(),
            lookup = trimmed.toLowerCase(),
            cb = this._data.exact[lookup],
            args = null

        if (!cb) {
          let match,
              found = this._data.rules.find((x) => {
                  match = x.matcher.match(trimmed)
                  return match && match.text
              }) || {}

          cb = found.cb
          args = match
        }

        if (!cb) {
          reject({text: textInput})
        } else {
          resolve((cb) ? cb(args) : null)
        }
      })
    }

    constructor() {
      this._data = {
        exact: {},
        rules: []
      }
    }
  }
/*
let textRules = new TextRules()
textRules.on(/.*kill.*all.*processes/, () => {
  console.log(`Ok, I'll kill all the processes`)
})

textRules.on(/.*don't.* /, () => {
  console.log(`Ok, I won't`)
}, 0)

textRules.process(`OMG don't kill all the processes`)

/*
textRules.on({ exp: '(Brian|Chace) enters the (room|chamber)', captures: ['name', 'place'] }, (x) => {
  console.log('Hi Brian', x)
  return 'Whee'
})
textRules.process("Brian enters the room").then((final) => {
  console.log('done processing', final)
})

    rules.on(`make the coffee`, () => {
      console.log(`Ok, here's some coffee`)
      return { item: `coffee` }
    })
    rules.on(`make a sandwhich`, () => {
      console.log(`Ok, here's a sandwhich`)
      return { item: `sandwhich` }
    })

    rules.process(`make a sandwhich`).then((made) => {
       console.log(made)
    }).catch((e) => {
       console.error(`I didn't understand`, e)
    })


    rules.process(`make me some tea`).then((made) => {
       console.log(made)
    }).catch((e) => {
       console.error(`I didn't understand`, e)
    })

rules.on({
  expression: '(go|walk|proceed).*(north|south|east|west|up|down)',
  captures: ["go", "direction"]
}, (captured) => {
  console.log(captured)
})

rules.process('walk to the north')*/
