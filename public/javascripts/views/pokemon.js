App.Views.Pokemon = Backbone.View.extend({

	tagName: 'tr',

	initialize: function(){
		this.model.on('change',this.render,this)
	},

	render: function(){
		this.$el.empty()
		var keys = [
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
			'Evolutions',
			'Count'
		]
		for (var i in keys){
			var key = keys[i].toLowerCase()
			var value = this.model.get(key)
			var cell = new Backbone.View({
				tagName: 'td'
			})
			cell.$el.addClass('uk-text-center')
			this.$el.append(cell.el)
			if (key == 'actions'){
				var transferBtn = new Backbone.View({
					tagName: 'a',
					className: 'uk-icon-button uk-icon-trash transfer'
				})
				var evolveBtn = new Backbone.View({
					tagName: 'a',
					className: 'uk-icon-button uk-icon-level-up evolve'
				})
				var nicknameBtn = new Backbone.View({
					tagName: 'a',
					className: 'uk-icon-button uk-icon-tag nickname'
				})
				var favoriteBtn = new Backbone.View({
					tagName: 'a',
					className: 'uk-icon-button favorite'
				})
				var upgradeBtn = new Backbone.View({
					tagName: 'a',
					className: 'uk-icon-button uk-icon-plus upgrade'
				})
				transferBtn.$el.attr('data-uk-tooltip','{delay:500,pos:"bottom",animation:true}')
				transferBtn.$el.attr('title','Transfer')
				evolveBtn.$el.attr('data-uk-tooltip','{delay:500,pos:"bottom",animation:true}')
				evolveBtn.$el.attr('title','Evolve')
				nicknameBtn.$el.attr('data-uk-tooltip','{delay:500,pos:"bottom",animation:true}')
				nicknameBtn.$el.attr('title','Nickname')
				upgradeBtn.$el.attr('data-uk-tooltip','{delay:500,pos:"bottom",animation:true}')
				upgradeBtn.$el.attr('title','Upgrade')
				favoriteBtn.$el.attr('data-uk-tooltip','{delay:500,pos:"bottom",animation:true}')
				favoriteBtn.$el.attr('title','Favorite')
				favoriteBtn.$el.addClass(this.model.get('favorite') ? 'uk-icon-star' : 'uk-icon-star-o')
				cell.$el.addClass(key)
				this.$el.append(cell.el)
				// cell.$el.append(favoriteBtn.el)
				// cell.$el.append(nicknameBtn.el)
				// cell.$el.append(upgradeBtn.el)
				cell.$el.append(evolveBtn.el)
				cell.$el.append(transferBtn.el)
				continue
			}
			if (key == 'image' && value){
				var img = new Backbone.View({
					tagName: 'img'
				})
				img.el.src = value
				cell.$el.append(img.el)
				cell.$el.addClass('uk-width-1-10')
				img.el.style.width = '50%'
				continue
			}
			if (key == 'iv'){
				cell.$el.addClass('uk-text-bold')
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
					pos: 'bottom-right',
					status: 'success',
					message: 'Successfully transfered ' + this.model.get('name') + '.'
				})
				this.remove()
			} else {
				UIkit.notify({
					pos: 'bottom-right',
					status: 'danger',
					message: 'Failed to transfer ' + this.model.get('name') + '.'
				})
			}
			this.selected = false
			this.model.collection.remove(this.model.id)
			this.model.collection.fetch()
		},this))
	},

	evolve: function(event){
		$.get('/evolve/' + this.model.id,_.bind(function(data,status,response){
			if (data.Result == 4){
				// cannot evolve
				var msg = 'Failed to evolved ' + this.model.get('name') + '.'
				UIkit.notify({
					pos: 'bottom-right',
					status: 'danger',
					message: msg
				})
			} else if (data.Result == 3){
				// not enough candies
				var msg = 'Failed to evolved ' + this.model.get('name') + '.'
				msg += ' (Insufficient Candies)'
				UIkit.notify({
					pos: 'bottom-right',
					status: 'danger',
					message: msg
				})
			} else {
				var name = this.model.get('name')
				var msg = 'Successfully evolved ' + name + '.'
				if (data.ExpAwarded) msg += ' (' + data.ExpAwarded + ' xp)'
				UIkit.notify({
					pos: 'bottom-right',
					status: 'success',
					message: msg
				})
				this.remove()
				this.model.collection.fetch()
				setTimeout(function(){
					UIkit.notify({
						pos: 'bottom-right',
						status: 'success',
						message: 'Evolution sequence complete: ' + name
					})
				},20000)
			}

		},this))
	},

	select: function(event){
		this.selected = event.target.value == 'on'
	}

})