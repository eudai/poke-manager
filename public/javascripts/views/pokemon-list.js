var PokemonList = Backbone.View.extend({

	tagName: 'table',
	className: 'uk-table uk-table-condensed uk-table-hover tablesorter',

	initialize: function(){
		this.collection.on('update',this.update,this)
		Backbone.Events.on('logged-out',this.remove,this)
		this.priorities = []
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
		var total = new Backbone.View({
			tagName: 'span'
		})
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
			'Health',
			'Candy',
			'Evolutions'
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
		this.collection.models.forEach(function(model){
			var row = new App.Views.Pokemon({model: model})
			body.$el.append(row.render().el)
		},this)
		logout.el.textContent = 'Logout'
		this.$el.append(caption.el)
		this.$el.append(head.el)
		this.$el.append(body.el)
		head.$el.append(header.el)
		caption.$el.append(total.el)
		caption.$el.append(logout.el)

		var sortable = UIkit.sortable(body.el, {
			animation: 0
		});
		// this.$el.toSearchable({
		// 	headerTRStyle: 'uk-form'
		// })
		this.body = body
		this.total = total
		return this
	},

	update: function(collection,request){
		var models = _.reject(this.collection.models,function(m){
			return m.rendered
		})
		models.forEach(function(model){
			var row = new App.Views.Pokemon({model: model})
			this.body.$el.append(row.render().el)
		},this)
		if (this.sorted){
			this.sort.refresh()
		} else {
			this.sort = new Tablesort(this.el)
			this.sorted == true
		}
		var parent = this.$el.find('.searchable-general-search').parent('tr')
		parent.remove()
		this.$el.toSearchable({
			headerTRStyle: 'uk-form'
		})
		var total = models.length
		var evolutions = 0
		var counted = []
		for (var i in models){
			var model = models[i]
			var number = model.get('#')
			if (counted.indexOf(number) > -1) continue
			counted.push(number)
			evolutions += model.get('evolutions')
		}
		console.log(evolutions)
		this.total.el.textContent = 'Total Pokemon: ' + total
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