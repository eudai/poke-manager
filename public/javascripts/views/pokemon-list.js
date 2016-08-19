var PokemonList = Backbone.View.extend({

	tagName: 'table',
	className: 'uk-table uk-table-condensed uk-table-hover tablesorter',

	initialize: function(){
		this.collection.on('update',this.render,this)
		Backbone.Events.on('logged-out',this.remove,this)
	},

	render: function(){
		this.$el.empty()
		var logout = new Backbone.View({
			tagName: 'a',
			className: 'uk-button logout uk-float-right'
		})
		var caption = new Backbone.View({
			tagName: 'caption'
		})
		var head = new Backbone.View({
			tagName: 'thead'
		})
		var body = new Backbone.View({
			tagName: 'tbody',
			className: 'list uk-sortable'
		})
		var header = new Backbone.View({
			tagName: 'tr'
		})
		if (this.collection.models.length > 0){
			var keys = Object.keys(this.collection.models[0].toJSON())
			keys = [
				'Actions',
				'Image',
				'#',
				'Name',
				'Nickname',
				'CP',
				'IV',
				'Attack',
				'Defense',
				'Stamina',
				'Health'
			]
			keys.forEach(function(key){
				var cell = new Backbone.View({
					tagName: 'th'
				})
				if (key == 'id'){
					key = 'Actions'
				}
				cell.$el.addClass('uk-text-center')
				cell.el.textContent = key
				header.$el.append(cell.el)
			},this)
		}
		this.collection.models.forEach(function(model){
			var row = new App.Views.Pokemon({model: model})
			body.$el.append(row.render().el)
		},this)
		logout.el.textContent = 'Logout'
		// header.$el.attr('data-uk-sticky','')
		this.$el.append(caption.el)
		this.$el.append(head.el)
		this.$el.append(body.el)
		head.$el.append(header.el)
		caption.$el.append(logout.el)
		var sortable = UIkit.sortable(body.el, {
			animation: 0
		});
		new Tablesort(this.el);
		return this
	},

	events: {
		'click .logout': 'logout'
	},

	logout: function(event){
		$.get('/logout',function(response){
			Backbone.Events.trigger('logged-out')
			UIkit.notify({
				status: 'success',
				message: 'Successfully logged out.'
			})
		})
	}


})