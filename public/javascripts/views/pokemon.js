App.Views.Pokemon = Backbone.View.extend({

	tagName: 'tr',

	render: function(){

		for (var key in this.model.attributes){
			var value = this.model.get(key)
			var cell = new Backbone.View({
				tagName: 'td',
				// className: 'uk-text-center'
			})
			this.$el.append(cell.el)
			if (key == 'id'){
				var checkbox = new Backbone.View({
					tagName: 'input'
				})
				var transferBtn = new Backbone.View({
					tagName: 'a',
					className: 'uk-button uk-icon-button uk-icon-trash transfer'
				})
				var evolveBtn = new Backbone.View({
					tagName: 'a',
					className: 'uk-button uk-icon-button uk-icon-level-up evolve'
				})
				checkbox.el.type = 'checkbox'
				cell.$el.addClass(key)
				this.$el.append(cell.el)
				cell.$el.append(checkbox.el)
				cell.$el.append(evolveBtn.el)
				cell.$el.append(transferBtn.el)
				continue
			}
			if (key == 'img' && value){
				var img = new Backbone.View({
					tagName: 'img'
				})
				img.el.src = value
				cell.$el.append(img.el)
				cell.$el.addClass('uk-width-1-10')
				img.el.style.width = '50%'
				continue
			}
			if (key == 'favorite'){
				if (value){
					cell.$el.append(new Backbone.View({
						tagName: 'i',
						className: 'uk-icon-star'
					}).el)
				} else {
					cell.$el.append(new Backbone.View({
						tagName: 'i',
						className: 'uk-icon-star-o'
					}).el)
				}
				continue
			}
			cell.el.textContent = value
		}
		return this
	},

	events: {
		'click .transfer': 'transfer',
		'click .evolve': 'evolve',
		'click input': 'select'
	},

	transfer: function(event){
		$.get('/transfer/' + this.model.id,_.bind(function(response){
			if (response.Status == 1){
				UIkit.notify({
					status: 'success',
					message: 'Successfully transfered ' + this.model.get('name') + '.'
				})
				this.remove()
			} else {
				UIkit.notify({
					status: 'danger',
					message: 'Failed to transfer ' + this.model.get('name') + '.'
				})
			}
			this.selected = false
			this.model.remove()
		},this))
	},

	evolve: function(event){
		$.get('/evolve/' + this.model.id,_.bind(function(data,status,response){
			debugger
			if (data.Result == 4){
				// cannot evolve
				var msg = 'Failed to evolved ' + this.model.get('name') + '.'
				UIkit.notify({
					status: 'danger',
					message: msg
				})
			} else if (data.Result == 3){
				// not enough candies
				var msg = 'Failed to evolved ' + this.model.get('name') + '.'
				msg += ' (Insufficient Candies)'
				UIkit.notify({
					status: 'danger',
					message: msg
				})
			} else {
				var msg = 'Successfully evolved ' + this.model.get('name') + '.'
				if (data.ExpAwarded) msg += ' (' + data.ExpAwarded + ' xp)'
				UIkit.notify({
					status: 'success',
					message: msg
				})
				this.remove()
				this.model.collection.fetch()
			}

		},this))
	},

	select: function(event){
		this.selected = event.target.value == 'on'
	}

})