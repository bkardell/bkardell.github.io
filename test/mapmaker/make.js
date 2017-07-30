
let descDb = {
	"direction": ["north", "south", "east", "west"],
	"lighting-conditions": ["dark", "well lit"],
	"walls": ["rough hewn stone", "brick", "moss covered", "damp and slimey", "wood paneled", "stained reddish-brown"],
	"floor": ["stone", "well-worn wooden planks", "dirt", "wet"],
	"air": ["musty", "damp, hot", "misty"],
	"things on shelves": [ "books", "broken vials", "shards of pottery", "rodent excrement", "well burned candles" ],
	"vermin": ["a large spider", "several spiders", "a large rat", "a family of rats", "a group of mice", "a few cockroaches"],
	"vermin-actions": ["nests in the corner", "scurry across the floor", "dart out of sight"],
	getRandom: (classification) => {
		return random.itemIn(descDb[classification])
	}
}



let createDesc = (type = 'room') => {
	let buff = []
	buff.push(random.chance(1,4) ? `a ${descDb.getRandom("lighting-conditions")} ${type}` : `a ${type}`)

	if (random.chance(1,4)) {
		buff.push (`The air is ${descDb.getRandom("air")}`)
	}

	if (random.chance(1,4)) {
		buff.push (`The walls are ${descDb.getRandom("walls")}`)
	}

	if (random.chance(1,4)) {
		buff.push (`The floor is ${descDb.getRandom("floor")}`)
	}

	if (random.chance(1,4)) {
		buff.push (`Shelves line the ${descDb.getRandom("direction")} wall.`)
		if (random.chance(1,4)) {
			buff.push (`Scattered ${descDb.getRandom("things on shelves")} lie about the shelves.`)
		}
	}

	if (random.chance(1,4)) {
		buff.push (`${descDb.getRandom("vermin")} ${descDb.getRandom("vermin-actions")}`)
	}

	return (buff.join('. '))
}