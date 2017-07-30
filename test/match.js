let matcher = (pattern, ...names) => {
  let re = new RegExp(pattern)
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

// we need this to build itself dynamically so like maybe
// (${story.room.listObjects}) and (${story.room.listCharacters})
// or maybe this should be tree-like so that there is only a single test for 'take'?
/*let dict = [
  matcher("(attack).*(orc|fighter|enemy|character|npc)", "action", "identifier"),
  matcher("(talk).*(orc|fighter|enemy|character|npc)", "action", "identifier"),
  matcher("(take).*(note|paper|sword)", "action", "identifier"),
  matcher("(go|walk|proceed).*(north|south|east|west|up|down)", "action", "direction")
]

let parseIn = (str) => {
  var result
  dict.find((toTest) => {
    result = toTest.match(str)
    return result
  })
  return result
}*/

//console.log(`attack the fighter:`,  parseIn('attack the fighter'))
//> attack the fighter: {action: "attack", identifier: "fighter", text: "attack the fighter"}
