

module.exports = Backbone.Router.extend({

	initialize: function(){
		this.collections = {
			pokemon: new Pokemon
		}
	}

	routes: {
		'login': 'login',
		'logout': 'logout',
		'inventory': 'inventory',
		'location': 'location'
	},

	login: function(){
		Backbone.Events.trigger('login')
	},

	logout: function(){
		Backbone.Events.trigger('logout')
	},

	pokemon: function(){
		Backbone.Events.trigger('pokemon')

	}

})