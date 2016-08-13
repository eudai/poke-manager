var Long = require('long')
var api = require('pokemon-go-node-api')
var _ = require('underscore')

module.exports = function(config){

	var loggedIn = false
	var location = config.location
	var username = config.username
	var password = config.password
	var provider = config.provider
	var inventory
	var profile
	var journal

	this.login = function(callback){
		if (loggedIn) {
			console.log('Player already logged in.')
			return callback()
		}
		api.init(username,password,location,provider,function(error){
			if (error) return callback(error)
			loggedIn = true
			callback()
		})
	}

	var getProfile = function(callback){
		api.GetProfile(callback)
	}

	var getJournal = function(callback){
		api.GetJournal(callback)
	}

	var getInventory = function(callback){
		api.GetInventory(function(error,data){
			if (error) return callback(error)
			if (!data) debugger
			var inventory = data.inventory_delta.inventory_items
			var pokemon = _.map(_.filter(inventory,function(item){
				return item.inventory_item_data.pokemon
			}),function(item){
				return item.inventory_item_data.pokemon
			})
			var items = _.map(_.filter(inventory,function(item){
				return item.inventory_item_data.item
			}),function(item){
				return item.inventory_item_data.item
			})
			pokemon = _.map(pokemon,function(p){
				var info = _.find(api.pokemonlist,function(i){
					return i.id == p.pokemon_id
				})
				var high = parseInt(p.id.high)
				var low = parseInt(p.id.low)
				p.id = new Long(low,high).toString()
				if (!p.id) debugger
				if (!info && !p.is_egg) debugger
				return _.extend(p,_.omit(info,'id'))
			})
			pokemon = _.reject(pokemon,function(p){
				return p.is_egg
			})
			callback(error,{
				pokemon: pokemon,
				items: items
			})
		})
	}

	this.username = username
	this.provider = provider
	this.location = location
	this.getInventory = getInventory

}