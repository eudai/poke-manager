App.Views.Login = Backbone.View.extend({

	tagName: 'form',
	className: 'uk-form',

	initialize: function(){
		Backbone.Events.on('logged-in',this.remove,this)
	},

	render: function(){
		var username = new Backbone.View({
			tagName: 'input'
		})
		var password = new Backbone.View({
			tagName: 'input'
		})
		var submit = new Backbone.View({
			tagName: 'button',
			className: 'uk-button'
		})
		submit.el.textContent = 'Login'
		submit.el.type = 'submit'
		username.el.name = 'username'
		username.el.placeholder = 'Username'
		password.el.name = 'password'
		password.el.type = 'password'
		password.el.placeholder = 'Password'
		this.username = username
		this.password = password
		this.$el.append(username.el)
		this.$el.append(password.el)
		this.$el.append(submit.el)
		return this
	},

	events: {
		'submit': 'submit'
	},

	submit: function(event){
		event.preventDefault()
		$.post('/login',{
			username: this.username.el.value,
			password: this.password.el.value
		},function(response){
			Backbone.Events.trigger('logged-in')
			UIkit.notify({
				status: 'success',
				message: 'Successfully logged in.'
			})
		}).fail(function(error){
			UIkit.notify({
				status: 'danger',
				message: 'Failed to login.'
			})
		})
	}

})