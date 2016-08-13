$(document).ready(function(){
	Backbone.Events.on('logged-in',function(){
		var pokemon = new App.Collections.Pokemon
		var table = new PokemonList({collection: pokemon})
		document.body.appendChild(table.render().el)
		pokemon.fetch(function(){
			new Tablesort(table.el);
		})
	})
	Backbone.Events.on('logged-out',function(){
		var login = new App.Views.Login
		document.body.appendChild(login.render().el)
	})
	$.get('/login',function(response){
		var loggedIn = response.username
		if (loggedIn){
			Backbone.Events.trigger('logged-in')
		} else {
			Backbone.Events.trigger('logged-out')
		}
	})
})


// $.post('/login',{
// 	username: 'miles.mus.musculus@gmail.com',
// 	password: 'nibblers',
// 	provider: 'google',
// 	location: 'Columbus, OH'
// },function(response){
// 	var pokemon = new App.Collections.Pokemon
// 	var table = new PokemonList({collection: pokemon})
// 	document.body.appendChild(table.render().el)
//
// 	pokemon.fetch(function(){
// 		new Tablesort(table.el);
// 	})
// })


