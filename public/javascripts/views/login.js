App.Views.Login = Backbone.View.extend({

	className: 'uk-panel uk-panel-box uk-width-1-2 uk-container-center uk-margin-top',

	initialize: function(){
		Backbone.Events.on('logged-in',this.remove,this)
	},

	render: function(){

		var Row = Backbone.View.extend({
			className: 'uk-form-row'
		})
		var head = new Backbone.View({
			tagName: 'h3',
			className: 'uk-panel-title'
		})
		var form = new Backbone.View({
			tagName: 'form',
			className: 'uk-form uk-form-stacked'
		})
		var username = new Backbone.View({
			tagName: 'input',
			className: 'uk-form-width-large'
		})
		var password = new Backbone.View({
			tagName: 'input',
			className: 'uk-form-width-large'
		})
		var provider = new Backbone.View({
			tagName: 'select',
			className: 'uk-form-width-large'
		})
		var google = new Backbone.View({
			tagName: 'option'
		})
		var ptc = new Backbone.View({
			tagName: 'option'
		})
		var location = new Backbone.View({
			tagName: 'input',
			className: 'uk-form-width-large'
		})
		var submit = new Backbone.View({
			tagName: 'button',
			className: 'uk-button uk-form-width-large'
		})
		var rows = []
		for (var i = 0; i < 7; i++){
			var row = new Row
			form.$el.append(row.el)
			rows.push(row)
		}
		head.el.textContent = 'Login'
		google.el.textContent = 'Google'
		google.el.value = 'google'
		ptc.el.textContent = 'Pokemon Trainer Club'
		ptc.el.value = 'ptc'
		submit.el.textContent = 'Login'
		submit.el.type = 'submit'
		username.el.name = 'username'
		username.el.placeholder = 'Username'
		password.el.name = 'password'
		password.el.type = 'password'
		password.el.placeholder = 'Password'
		location.el.placeholder = 'Location'
		location.el.value = 'Columbus, OH'
		this.$el.append(head.el)
		this.$el.append(form.el)
		rows[0].$el.append(google.el)
		rows[1].$el.append(username.el)
		rows[2].$el.append(password.el)
		rows[3].$el.append(provider.el)
		rows[4].$el.append(location.el)
		provider.$el.append(google.el)
		provider.$el.append(ptc.el)
		rows[5].$el.append(submit.el)
		this.username = username
		this.password = password
		this.location = location
		this.provider = provider
		return this
	},

	events: {
		'submit': 'submit'
	},

	submit: function(event){
		event.preventDefault()
		$.post('/login',{
			username: this.username.el.value,
			password: this.password.el.value,
			provider: this.provider.el.value.toLowerCase(),
			location: this.location.el.value
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