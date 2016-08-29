var Long = require('long')
var _ = require('underscore')
var moment = require('moment')
var family = require('../data/family.json')
var evolution = require('../data/evolution.json')
var Api = require('../library/api')

module.exports = function(config){

	var api = new Api
	var location = config.location
	var username = config.username
	var password = config.password
	var provider = config.provider

	this.login = function(callback){
		api.login(username,password,location,provider,function(error){
			callback(error)
		})
	}

	this.getInventory = function(callback){
		api.getInventory(function(error,data){
			if (error) return callback(error)
			var inventory = data.inventory_delta.inventory_items
			var pokemon = _.map(_.filter(inventory,function(item){
				return item.inventory_item_data.pokemon
			}),function(item){
				return item.inventory_item_data.pokemon
			})
			var candies = _.map(_.filter(inventory,function(item){
				return item.inventory_item_data.pokemon_family
			}),function(item){
				return item.inventory_item_data.pokemon_family
			})
			var items = _.map(_.filter(inventory,function(item){
				return item.inventory_item_data.item
			}),function(item){
				return item.inventory_item_data.item
			})
			pokemon = _.reject(pokemon,function(p){
				return p.is_egg
			})
			pokemon = _.map(pokemon,function(p){
				var info = _.find(api.pokedex,function(i){
					return i.id == p.pokemon_id
				})
				var candy = _.find(candies,function(c){
					var family_id = family[p.pokemon_id]
					return c.family_id == family_id
				}) || {}
				var high = parseInt(p.id.high)
				var low = parseInt(p.id.low)
				p.id = new Long(low,high).toString()
				var createdLow = p.creation_time_ms.low
				var createdHigh = p.creation_time_ms.high
				var createdAt = new Long(createdLow,createdHigh).toString()
				p.creation_time = moment(parseInt(createdAt))
				p.candy = parseInt(candy.candy || 0)
				p.evolutions = Math.floor(p.candy / evolution[p.pokemon_id])
				p.count = _.where(pokemon,{pokemon_id: p.pokemon_id}).length
				return _.extend(p,_.omit(info,'id','candy'))
			})
			callback(error,{
				pokemon: pokemon,
				items: items
			})
		})
	}

	this.transferPokemon = api.transferPokemon
	this.evolvePokemon = api.evolvePokemon
	this.username = username
	this.provider = provider
	this.location = location
}