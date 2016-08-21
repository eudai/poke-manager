const Poke = new PokeAPI()

Poke.player.location = {
  latitude: parseFloat(lat),
  longitude: parseFloat(lng)
}

const api = await Poke.login(username, password, provider)

let player = await Poke.GetPlayer()
let inventory = await Poke.GetInventory()
let {items} = inventory

while( true ) {
  let objects = await Poke.GetMapObjects()

  // catchable pokemons from here?
  for (let pokemon of objects.catchable_pokemons) {
    await pokemon.encounter()
    await pokemon.catch()
  }

  // Gym's (are sorted by distance)
  for (let gym of objects.forts.gyms) {
    // We have a gym
    if (gym.withinRange) {
      // Do something with the gym
    }
  }

  // Checkpoint's (aka: pokestop) (are sorted by distance)
  for (let checkpoint of objects.forts.checkpoints) {
    if (!checkpoint.cooldown && checkpoint.withinRange) {
      // Collect pokestop rewards
      let res = await checkpoint.search()
    }
  }

  //just walk a little (1 - 15 meters..)
  await Poke.player.walkAround()
  await new Promise(resolve => setTimeout(resolve, 3000))
}