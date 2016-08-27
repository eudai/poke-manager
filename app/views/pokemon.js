module.exports = Backbone.View.extend({

	initialize: function(){
		Backbone.Events.on('pokemon:list',this.render,this)
		this.collection.on('update',this.update,this)
	},

	render: function(){
		return this
	},

	update: function(){
		return this
	}

})