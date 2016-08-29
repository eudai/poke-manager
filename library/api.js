var request = require('request')
var geocoder = require('geocoder')
var ProtoBuf = require('protobufjs')
var GoogleOAuth = require('gpsoauthnode')
var Logins = require('./logins')
var pokedex = require('../data/pokedex.json')
var builder = ProtoBuf.loadProtoFile(__dirname + '/pokemon.proto')
var pokemonProto = builder.build()
var RequestEnvelop = pokemonProto.RequestEnvelop
var ResponseEnvelop = pokemonProto.ResponseEnvelop
var root = 'https://pgorelease.nianticlabs.com/plfe/rpc'


request.defaults({
	jar: request.jar()
})

module.exports = function(){

	this.pokedex = pokedex

	var player = {
		token: null,
		endpoint: null,
		provider: 'google',
		location: {
			latitude: 0,
			longitude: 0,
			altitude: 0
		}
	}

	var call = function(endpoint,token,req,callback){
		var auth = new RequestEnvelop.AuthInfo({
            provider: player.provider,
            token: new RequestEnvelop.AuthInfo.JWT(token, 59)
        })
        var envelop = new RequestEnvelop({
            unknown1: 2,
            rpc_id: 1469378659230941192,
            requests: req,
            latitude: player.location.latitude,
            longitude: player.location.longitude,
            altitude: player.location.altitude || 0,
            auth: auth,
            unknown12: 989
        })
        var protobuf = envelop.encode().toBuffer()
        var options = {
            url: endpoint,
            body: protobuf,
            encoding: null,
            headers: {
                'User-Agent': 'Niantic App'
            }
        }
        request.post(options, function (err, response, body) {
            if (err) return callback(err)
            if (!response || !body) return callback(new Error('RPC Server offline'))
			var decoded = ResponseEnvelop.decode(body)
			callback(null,decoded)
        })
	}

	this.login = function(username,password,location,provider,callback){
		getLocation(location,function(error,response){
			player.location.latitude = response.latitude
			player.location.longitude = response.longitude
			if (error) return callback(error)
			getToken(username,password,provider,function(error,token){
				if (error) return callback(error)
				player.token = token
				getEndpoint(token,function(error,endpoint){
					if (error) return callback(error)
					player.endpoint = endpoint
					callback(null,player)
				})
			})
		})
	}

	var getLocation = function(loc,callback){
		geocoder.geocode(loc, function (error, data) {
			if (error) return callback(error)
			if (data.status == 'ZERO_RESULTS') return callback(new Error('Location not found.'))
			var location = data.results[0].geometry.location
			callback(null,{
				latitude: location.lat,
				longitude: location.lng
			})
		})
	}

	var getToken = function(username,password,provider,callback){
		if (provider == 'ptc') {
            Logins.PokemonClub(username,password,callback)
        } else {
			Logins.GoogleAccount(username,password,callback)
        }
	}

	var getEndpoint = function(token,callback){
		var req = [
			new RequestEnvelop.Requests(2),
			new RequestEnvelop.Requests(126),
			new RequestEnvelop.Requests(4),
			new RequestEnvelop.Requests(129),
			new RequestEnvelop.Requests(5)
		]
		call(root,token,req,function(error,response){
			if (error) return callback(error)
			var endpoint = 'https://' + response.api_url + '/rpc'
			callback(null,endpoint)
		})
	}

	this.getInventory = function(callback){
		var req = new RequestEnvelop.Requests(4)
		call(player.endpoint,player.token,req,function(error,response) {
			if (error) return callback(error)
			var inventory = ResponseEnvelop.GetInventoryResponse.decode(response.payload[0])
			callback(null,inventory)
		})
	}

	this.getProfile = function(){
		var req = new RequestEnvelop.Requests(2)
		call(player.endpoint,player.token,req,function(error,response){
			if (error) return callback(error)
			var profile = ResponseEnvelop.ProfilePayload.decode(response.payload[0]).profile
			callback(null, profile)
		})
	}

	this.evolvePokemon = function(pokemonId,callback){
        var evolvePokemon = new RequestEnvelop.EvolvePokemonMessage({
            'PokemonId': pokemonId
        })
        var req = new RequestEnvelop.Requests(125, evolvePokemon.encode().toBuffer())
        call(player.endpoint,player.token,req,function(error,response){
            if (error) return callback(error)
			if (!response || !response.payload || !response.payload[0])
				return callback(new Error('Pokemon not found.'))
            try {
                var evolved = ResponseEnvelop.EvolvePokemonResponse.decode(response.payload[0])
                callback(null,evolved)
            } catch (error) {
                callback(error)
            }
        })
	}

	this.transferPokemon = function(pokemonId,callback){
		var evolvePokemon = new RequestEnvelop.TransferPokemonMessage({
			'PokemonId': pokemonId
		})
		var req = new RequestEnvelop.Requests(112, evolvePokemon.encode().toBuffer())
		call(player.endpoint,player.token,req,function(error,response){
			if (error) return callback(error)
			if (!response || !response.payload || !response.payload[0])
				return callback(new Error('Pokemon not found.'))
			try {
				var transferred = ResponseEnvelop.TransferPokemonResponse.decode(response.payload[0])
				callback(null,transferred)
			} catch (error) {
				callback(error)
			}
		})
	}

	this.favoritePokemon = function(){

	}

	this.upgradePokemon = function(){

	}

	this.renamePokemon = function(){

	}

}