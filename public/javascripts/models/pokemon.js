App.Models.Pokemon = Backbone.Model.extend({

	parse: function(data,options){
		var total = data.individual_attack + data.individual_defense + data.individual_stamina
		var iv =  Math.round(total / 45 * 100)
		return {
			id: data.id,
			'#': data.num,
			img: data.img,
			name: data.name,
			nickname: data.nickname,
			cp: data.cp,
			health: data.stamina_max,
			iv: iv,
			attack: data.individual_attack,
			defence: data.individual_defense,
			stamina: data.individual_stamina,
			favorite: data.favorite
		}
	}

})