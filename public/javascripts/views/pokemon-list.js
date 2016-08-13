var PokemonList = Backbone.View.extend({

	tagName: 'table',
	className: 'uk-table uk-table-condensed tablesorter',

	initialize: function(){
		this.collection.on('update',this.render,this)
		Backbone.Events.on('logged-out',this.remove,this)
		this.children = []
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
		var evolveAll = new Backbone.View({
			tagName: 'a',
			className: 'uk-button evolve'
		})
		var transferAll = new Backbone.View({
			tagName: 'a',
			className: 'uk-button transfer'
		})
		// var delayInput = new Backbone.View({
		// 	tagName: 'input',
		// 	className: 'delay'
		// })
		var head = new Backbone.View({
			tagName: 'thead'
		})
		var body = new Backbone.View({
			tagName: 'tbody',
			className: 'list'
		})
		var header = new Backbone.View({
			tagName: 'tr'
		})
		if (this.collection.models.length > 0){
			var keys = Object.keys(this.collection.models[0].toJSON())
			keys.forEach(function(key){
				var cell = new Backbone.View({
					tagName: 'th'
				})
				cell.el.textContent = key
				header.$el.append(cell.el)
			},this)
		}
		this.collection.models.forEach(function(model){
			var row = new App.Views.Pokemon({model: model})
			body.$el.append(row.render().el)
			this.children.push(row)
		},this)
		evolveAll.el.textContent = 'Evolve Selected'
		transferAll.el.textContent = 'Transfer Selected'
		// delayInput.el.placeholder = 'Evolution Delay'
		// this.delay = delayInput
		logout.el.textContent = 'Logout'

		this.$el.append(caption.el)
		this.$el.append(head.el)
		this.$el.append(body.el)
		head.$el.append(header.el)

		caption.$el.append(evolveAll.el)
		caption.$el.append(transferAll.el)
		// caption.$el.append(delayInput.el)
		caption.$el.append(logout.el)
		new Tablesort(this.el);

		return this
	},

	events: {
		'click .evolve': 'evolve',
		'click .transfer': 'transfer',
		'click .logout': 'logout'
	},

	evolve: function(event){
		var selected = _.where(this.children,{
			selected: true
		})
		for ( var i in selected){
			var child = selected[i]
			child.evolve()
		}
		selected.forEach(function(child){
			child.evolve()
		})
	},

	transfer: function(event){
		var selected = _.where(this.children,{
			selected: true
		})
		selected.forEach(function(child){
			child.transfer()
		})
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