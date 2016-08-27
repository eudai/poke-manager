var request = require('../library/request')
request.defaults({
	jar: request.jar()
})

module.exports = Backbone.Model.extend({

	getEndpoint: function(callback){
		var req = [
			new RequestEnvelop.Requests(2),
			new RequestEnvelop.Requests(126),
			new RequestEnvelop.Requests(4),
			new RequestEnvelop.Requests(129),
			new RequestEnvelop.Requests(5)
		]
		request({
			provider: this.get('provider'),
			token: this.get('token')
		},req,function(error,response){
			var endpoint = response ? 'https://' + response.api_url + '/rpc' : null
			callback(error,endpoint)
		})
	},

	getToken: function(callback){
		var provider = this.get('provider')
		if (self.playerInfo.provider === 'ptc') {
            Logins.PokemonClub(user, pass, self, function (err, token) {
                if (err) return callback(err)
                self.playerInfo.accessToken = token
                self.DebugPrint('[i] Received PTC access token!')
                callback(null, token)
            })
        } else {
            Logins.GoogleAccount(user, pass, self, function (err, token) {
                if (err) return callback(err)
                self.playerInfo.accessToken = token
                self.DebugPrint('[i] Received Google access token!')
                callback(null, token)
            })
        }
	},

	setLocation: function(callback){

	},

	getInventory: function(){

	},

	create: function(model,options){
		debugger
		this.login(token)
	},

	read: function(){

	}

	update: function(){

	},

	destroy: function(){

	},

	sync: function(method,model,options){
		this[method](model,options)
	}


})