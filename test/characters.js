let characterRaces = [ {
					name: 'human',
					modifiers: { intelligence: 5 }
				},
				{
					name: 'orc',
					modifiers: { strength: 5, intelligence: -5, health: 5 }
				},
				{
					name: 'elf',
					modifiers: { intelligence: 5, speed: 5, health: -2  }
				}],
				characterClasses = [
					{
						name: 'fighter',
						modifiers: { strength: 2, defense: 2 }

					},
					{
						name: 'magic user',
						modifiers: { intelligence: 5, mana: 5 }
					},
					{
						name: 'thief',
						modifiers: {intelligence: 3, speed: 5}
					}],
				findRace = (characterRace) => {
					return characterRaces.find((race) => {
						return race.name == characterRace
					})
				},
				findClass = (characterClass) => {
					return characterClasses.find((c) => {
						return c.name == characterClass
					})
				},
				createCharacter = (characterRace, characterClass, level = 1, generalModifier = 1) => {
					let attrs = {
							race: characterRace,
							class: characterClass,
							level: level,
							health: random.intBetween(10, 15, generalModifier),
							strength: random.intBetween(10, 15, generalModifier),
							speed: random.intBetween(10, 15, generalModifier),
							defense: random.intBetween(10, 15, generalModifier),
							intelligence: random.intBetween(10, 15, generalModifier) ,
							mana: random.intBetween(10, 15, generalModifier),
							attack: (otherChar, onResult) => {
								let c = 50 + ((attrs.speed / otherChar.speed) * 10),
								    hit = random.chance(c, 100)

								if (hit) {
									// need to know how hard now..
									let strengthOfHit = random.intBetween(0, attrs.strength),
									    protection = Math.floor(otherChar.defense/2),
									    damage = strengthOfHit - protection

									damage = (damage >= 0) ? damage : 0
									otherChar.health -= damage
									if (onResult) {
										onResult({type: 'hit', damage: damage, isDead: otherChar.health <= 0})
									}
									console.log('hit!')
								} else {
									if (onResult) {
										onResult({type: 'miss', damage: 0, isDead: 0})
									}
									console.log('miss!')
								}
							}
						},
						modifiers = findRace(characterRace).modifiers

					Object.keys(modifiers).forEach((key) => {
						attrs[key] += modifiers[key]
 					})
 					modifiers = findClass(characterClass).modifiers
 					Object.keys(modifiers).forEach((key) => {
						attrs[key] += modifiers[key]
 					})
 					return attrs
				},
				randoCharacter = (level, generalModifier) => {
					return createCharacter(
						random.itemIn(characterRaces).name,
						random.itemIn(characterClasses).name,
						level,
						generalModifier
					)
				}

