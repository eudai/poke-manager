var Player = require('./models/player')
var utilities = require('./models/utilities')
var express = require('express')
var api = require('pokemon-go-node-api')
var cookieParser = require('cookie-parser')
var bodyParser = require('body-parser')
var Long = require('long')
var passport = require('passport')
var session = require('express-session')
var favicon = require('serve-favicon')
var _ = require('underscore')


// var GoogleStrategy = require('passport-google-oauth').OAuthStrategy
var LocalStrategy = require('passport-local').Strategy;
var app = express()
var players = {}


passport.use(new LocalStrategy(function(username,password,done){
	player = new Player({
		username: username,
		password: password,
		provider: 'google',
		location: {
			type: 'name',
			name: 'Columbus, OH'
		}
	})
	players[player.username] = player
	player.login(function(error){
		if (error) return done(error,false,'Failed to login.')
		done(null,player)
	})
}))

passport.serializeUser(function(user, done) {
  	done(null, user.username)
})
passport.deserializeUser(function(username, done) {
	done(null,players[username])
});
app.use(cookieParser())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({
	extended: true
}))
app.use(session({
	secret: 'pokemon-go',
	resave: false,
	saveUninitialized: false
}));
app.use(passport.initialize())
app.use(passport.session())
app.use(express.static('public'))
app.use(favicon(__dirname + '/public/pokemon-icon.png'));

app.post('/login',passport.authenticate('local'),function(req,res){
	res.json(req.user)
})

app.get('/login',function(req,res){
	res.json(req.user || {})
})

app.get('/logout',function(req,res){
	players[req.user.username] = null
	req.logout()
	res.json({
		logout: true
	})
})

app.get('/pokemon',function(req,res,next){
	req.user.getInventory(function(error,data){
		if (error) {
			res.status(400)
			if (!error) error = 'Unknown error.'
			return res.json({
				error: error
			})
		}
		res.json(data.pokemon)
	})
})

app.get('/transfer/:id',function(req,res){
	api.TransferPokemon(req.params.id,function(error,data){
		res.json(error || data)
	})
})

app.get('/evolve/:id',function(req,res){
	api.EvolvePokemon(req.params.id,function(error,data){
		res.json(error || data)
	})
})
app.listen(process.env.PORT || 3000, function () {
  	console.log('Server listening...');
});


process.on('uncaughtException', function(error){
	if (error) console.error(error)
});

// initialize()


// list

// evolve

// transfer

// rename
