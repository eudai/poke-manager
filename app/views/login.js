require

module.exports = Backbone.Model.extend({

	render: function(){

	},

	submit: function(event){
		var username = this.username.$el.val()
		var password = this.password.$el.val()
		var provider = this.provider.$el.val()
		var location = this.location.$el.val()

		
	}

})