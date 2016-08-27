var request = require('request')
var google = new GoogleOAuth()
var data = {
	pokemon: require('./data/pokemon.json')
}
var builder = ProtoBuf.loadProtoFile('./pokemon.proto')
var proto = builder.build()
var RequestEnvelop = proto.RequestEnvelop
var ResponseEnvelop = proto.ResponseEnvelop

module.exports = function(info, req, callback) {

	var auth = new RequestEnvelop.AuthInfo({
		provider: info.provider,
		token: new RequestEnvelop.AuthInfo.JWT(info.token, 59)
	})

	var envelope = new RequestEnvelop({
		unknown1: 2,
		rpc_id: 1469378659230941192,
		requests: req,
		latitude: info.latitude,
		longitude: info.longitude,
		altitude: info.altitude,
		auth: auth,
		unknown12: 989
	})

	var protobuf = envelope.encode().toBuffer()

	var options = {
		url: info.endpoint,
		body: protobuf,
		encoding: null,
		headers: {
			'User-Agent': 'Niantic App'
		}
	}

	request.post(options,function(error,response,body){
		if (error) return callback(error)
		if (!response || !body) return callback(new Error('Server offline.'))
		try {
			var decoded = ResponseEnvelop.decode(body)
			callback(null,decoded)
		} catch (e) {
			if (e.decoded) {
				console.warn(e);
				callback(null,e.decoded)
			}
		}
	})

}