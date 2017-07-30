const db = { rooms: [] }
const random = {
	//The maximum is exclusive and the minimum is inclusive
	intBetween: (min, max, modifier = 1) => {
		min = Math.ceil(min);
		max = Math.floor(max);
	  	return Math.floor(
	  		modifier * (Math.floor(Math.random() * (max - min)) + min)
	  	)
	},
	chance: (x, inY) => {
		let rand = random.intBetween(0, inY)
		console.log( rand, x )
		return rand <= x
	},
	itemIn: (arr = []) => {
		return arr[random.intBetween(0, arr.length)]
	},
	shuffle: (arr = []) => {
		let ret = Array.from(arr)
		for (let i = 0; i < ret.length; i++) {
			let randomIndex = random.intBetween(0, ret.length),
			    spliceable = ret[randomIndex]
			    ret.splice(randomIndex, 1)
			    ret.push(spliceable)
		}
		return ret
	},
	removeItemIn: (arr = []) => {
		let choice = random.intBetween(0, arr.length),
			ret = arr[choice]

		arr.splice(choice, 1)
		return ret
	},
	boolean: () => {
		return random.intBetween(0, 2) == 0
	}
}