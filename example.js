/*
  Pokemon Go (c) MITM node proxy
  by Michael Strassburger <codepoet@cpan.org>
 */
var DNS, POGOProtos, PokemonGoMITM, Promise, Proxy, _, changeCase, forge, fs, getRawBody, http, https, request, rp, util, zlib,
  bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

Proxy = require('http-mitm-proxy');

POGOProtos = require('pokemongo-protobuf');

changeCase = require('change-case');

http = require('http');

https = require('https');

fs = require('fs');

_ = require('lodash');

request = require('request');

rp = require('request-promise');

util = require('util');

Promise = require('bluebird');

DNS = require('dns');

zlib = require('zlib');

forge = require('node-forge');

getRawBody = require('raw-body');

PokemonGoMITM = (function() {
  var Session;

  PokemonGoMITM.prototype.ports = {
    proxy: 8081,
    endpoint: 8082
  };

  PokemonGoMITM.prototype.endpoint = {
    api: 'pgorelease.nianticlabs.com',
    oauth: 'android.clients.google.com',
    ptc: 'sso.pokemon.com',
    storage: 'storage.googleapis.com'
  };

  PokemonGoMITM.prototype.endpointIPs = {};

  PokemonGoMITM.prototype.clientSignature = '321187995bc7cdc2b5fc91b11a96e2baa8602c62';

  PokemonGoMITM.prototype.responseEnvelope = 'POGOProtos.Networking.Envelopes.ResponseEnvelope';

  PokemonGoMITM.prototype.requestEnvelope = 'POGOProtos.Networking.Envelopes.RequestEnvelope';

  PokemonGoMITM.prototype.requestHandlers = {};

  PokemonGoMITM.prototype.responseHandlers = {};

  PokemonGoMITM.prototype.requestEnvelopeHandlers = [];

  PokemonGoMITM.prototype.responseEnvelopeHandlers = [];

  PokemonGoMITM.prototype.rawRequestHandlers = {};

  PokemonGoMITM.prototype.rawResponseHandlers = {};

  PokemonGoMITM.prototype.rawRequestEnvelopeHandlers = [];

  PokemonGoMITM.prototype.rawResponseEnvelopeHandlers = [];

  Session = (function() {
    Session.prototype.id = null;

    Session.prototype.url = null;

    Session.prototype.expiration = 0;

    Session.prototype.lastRequest = null;

    Session.prototype.requestInjectQueue = [];

    Session.prototype.data = {};

    function Session(id, url) {
      this.id = id;
      this.url = url;
    }

    Session.prototype.setRequest = function(req, url) {
      this.lastRequest = req;
      this.url = url;
      if (req.auth_ticket) {
        this.expiration = parseInt(req.auth_ticket.expire_timestamp_ms);
        return Buffer.concat([req.auth_ticket.start, req.auth_ticket.end]).toString();
      } else if (req.auth_info) {
        return req.auth_info.token.contents;
      }
    };

    Session.prototype.setResponse = function(res) {
      if (res.auth_ticket) {
        this.expiration = parseInt(res.auth_ticket.expire_timestamp_ms);
        return Buffer.concat([res.auth_ticket.start, res.auth_ticket.end]).toString();
      }
    };

    return Session;

  })();

  PokemonGoMITM.prototype.sessions = {};

  PokemonGoMITM.prototype.proxy = null;

  PokemonGoMITM.prototype.server = null;

  function PokemonGoMITM(options) {
    this.handleProxyError = bind(this.handleProxyError, this);
    this.handleProxyRequest = bind(this.handleProxyRequest, this);
    this.handleProxyConnect = bind(this.handleProxyConnect, this);
    this.ports.proxy = options.port || 8081;
    this.ports.endpoint = options.endpoint || 8082;
    this.debug = options.debug || false;
    console.log("[+++] PokemonGo MITM [++++]");
    this.resolveEndpoints().then((function(_this) {
      return function() {
        return _this.setupProxy();
      };
    })(this)).then((function(_this) {
      return function() {
        return _this.setupEndpoint();
      };
    })(this));
  }

  PokemonGoMITM.prototype.close = function() {
    console.log("[+] Stopping MITM Proxy...");
    this.proxy.close();
    return this.server.close();
  };

  PokemonGoMITM.prototype.resolveEndpoints = function() {
    var host, name;
    return Promise.mapSeries((function() {
      var ref, results;
      ref = this.endpoint;
      results = [];
      for (name in ref) {
        host = ref[name];
        results.push(host);
      }
      return results;
    }).call(this), (function(_this) {
      return function(endpoint) {
        return new Promise(function(resolve, reject) {
          _this.log("[+] Resolving " + endpoint);
          return DNS.resolve(endpoint, "A", function(err, addresses) {
            var ip, j, len;
            if (err) {
              return reject(err);
            }
            for (j = 0, len = addresses.length; j < len; j++) {
              ip = addresses[j];
              _this.endpointIPs[ip] = endpoint;
            }
            return resolve();
          });
        });
      };
    })(this)).then((function(_this) {
      return function() {
        return _this.log("[+] Resolving done", _this.endpointIPs);
      };
    })(this));
  };

  PokemonGoMITM.prototype.setupProxy = function() {
    this.proxy = new Proxy().use(Proxy.gunzip).onConnect(this.handleProxyConnect).onRequest(this.handleProxyRequest).onError(this.handleProxyError).listen({
      port: this.ports.proxy
    }, (function(_this) {
      return function() {
        console.log("[+] Proxy listening on " + _this.ports.proxy);
        return console.log("[!] -> PROXY USAGE: install http://<host>:" + _this.ports.endpoint + "/ca.crt as a trusted certificate");
      };
    })(this));
    return this.proxy.silent = true;
  };

  PokemonGoMITM.prototype.setupEndpoint = function() {
    this.server = http.createServer((function(_this) {
      return function(req, res) {
        return _this.handleEndpointRequest(req, res);
      };
    })(this));
    return this.server.listen(this.ports.endpoint, (function(_this) {
      return function() {
        console.log("[+] Virtual endpoint listening on " + _this.ports.endpoint);
        return console.log("[!] -> ENDPOINT USAGE: configure 'custom endpoint' in pokemon-go-xposed");
      };
    })(this));
  };

  PokemonGoMITM.prototype.handleEndpointRequest = function(req, res) {
    this.log("[+++] " + req.method + " request for " + req.url);
    switch (req.url) {
      case '/ca.pem':
      case '/ca.crt':
      case '/ca.der':
        return this.endpointCertHandler(req, res);
    }
    return getRawBody(req).then((function(_this) {
      return function(buffer) {
        return _this.handleEndpointConnect(req, res, buffer);
      };
    })(this));
  };

  PokemonGoMITM.prototype.handleEndpointConnect = function(req, res, buffer) {
    var ref, session;
    this.log("[+] Handling request to virtual endpoint");
    ref = this.handleRequest(buffer, req.url), buffer = ref[0], session = ref[1];
    delete req.headers.host;
    delete req.headers["content-length"];
    req.headers.connection = "Close";
    return rp({
      url: "https://" + this.endpoint.api + req.url,
      method: req.method,
      body: buffer,
      encoding: null,
      headers: req.headers,
      resolveWithFullResponse: true
    }).then((function(_this) {
      return function(response) {
        var send;
        _this.log("[+] Forwarding result from real endpoint");
        send = function(buffer) {
          if (buffer) {
            response.headers["content-length"] = buffer.length;
          }
          res.writeHead(response.statusCode, response.headers);
          return res.end(buffer, "binary");
        };
        if (response.headers["content-encoding"] !== "gzip") {
          return send(_this.handleResponse(response.body, session));
        } else {
          return zlib.gunzip(response.body, function(err, decoded) {
            buffer = _this.handleResponse(decoded, session);
            return zlib.gzip(buffer, function(err, encoded) {
              return send(encoded);
            });
          });
        }
      };
    })(this))["catch"]((function(_this) {
      return function(e) {
        return console.log("[-] " + e);
      };
    })(this));
  };

  PokemonGoMITM.prototype.endpointCertHandler = function(req, res) {
    var path, toDer;
    path = this.proxy.sslCaDir + '/certs' + req.url;
    if (toDer = /\.(crt|der)$/.test(path)) {
      path = path.replace(/\.(crt|der)$/, '.pem');
    }
    return fs.readFile(path, function(err, data) {
      var code, type;
      code = 200;
      type = "application/x-pem-file";
      if (err) {
        code = 404;
        type = "text/html";
        data = "<html>\n<title>404</title>\n<body>Not found</body>\n</html>";
      } else if (toDer) {
        type = "application/x-x509-ca-cert";
        data = forge.pem.decode(data)[0].body;
      }
      res.writeHead(code, {
        "Content-Type": type,
        "Content-Length": data.length
      });
      return res.end(data, 'binary');
    });
  };

  PokemonGoMITM.prototype.handleProxyConnect = function(req, socket, head, callback) {
    var ip;
    if (!req.url.match(/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}:443/)) {
      return callback();
    }
    ip = req.url.split(/:/)[0];
    if (this.endpointIPs[ip]) {
      req.url = this.endpointIPs[ip] + ':443';
    }
    return callback();
  };

  PokemonGoMITM.prototype.handleProxyRequest = function(ctx, callback) {
    switch (ctx.clientToProxyRequest.headers.host) {
      case this.endpoint.api:
        this.proxyRequestHandler(ctx);
        break;
      case this.endpoint.oauth:
        this.proxySignatureHandler(ctx);
    }
    return callback();
  };

  PokemonGoMITM.prototype.proxyRequestHandler = function(ctx) {
    var requestChunks, responseChunks, session;
    this.log("[+++] Request to " + ctx.clientToProxyRequest.url);

    /* Client Reuqest Handling */
    requestChunks = [];
    session = null;
    ctx.onRequestData((function(_this) {
      return function(ctx, chunk, callback) {
        requestChunks.push(chunk);
        return callback(null, null);
      };
    })(this));
    ctx.onRequestEnd((function(_this) {
      return function(ctx, callback) {
        var buffer, ref;
        ref = _this.handleRequest(Buffer.concat(requestChunks), ctx.clientToProxyRequest.url), buffer = ref[0], session = ref[1];
        ctx.proxyToServerRequest.write(buffer);
        _this.log("[+] Waiting for response...");
        return callback();
      };
    })(this));

    /* Server Response Handling */
    responseChunks = [];
    ctx.onResponseData((function(_this) {
      return function(ctx, chunk, callback) {
        responseChunks.push(chunk);
        return callback();
      };
    })(this));
    return ctx.onResponseEnd((function(_this) {
      return function(ctx, callback) {
        var buffer;
        buffer = _this.handleResponse(Buffer.concat(responseChunks), session);
        ctx.proxyToClientResponse.end(buffer);
        return callback(false);
      };
    })(this));
  };

  PokemonGoMITM.prototype.handleRequest = function(buffer, url) {
    var afterHandlers, data, decoded, handler, handlers, j, k, l, len, len1, len2, len3, m, originalData, originalRequest, proto, ref, ref1, ref2, rpcName, session;
    ref = this.rawRequestEnvelopeHandlers;
    for (j = 0, len = ref.length; j < len; j++) {
      handler = ref[j];
      buffer = handler(buffer) || buffer;
    }
    if (!(data = this.parseProtobuf(buffer, this.requestEnvelope))) {
      return [buffer];
    }
    originalData = _.cloneDeep(data);
    session = this.getSession(data, url);
    ref1 = this.requestEnvelopeHandlers;
    for (k = 0, len1 = ref1.length; k < len1; k++) {
      handler = ref1[k];
      data = handler.length > 1 ? handler(session.data, data) || data : handler(data) || data;
    }
    ref2 = data.requests;
    for (l = 0, len2 = ref2.length; l < len2; l++) {
      request = ref2[l];
      rpcName = changeCase.pascalCase(request.request_type);
      proto = "POGOProtos.Networking.Requests.Messages." + rpcName + "Message";
      handlers = [].concat(this.rawRequestHandlers[rpcName] || [], this.rawRequestHandlers['*'] || []);
      for (m = 0, len3 = handlers.length; m < len3; m++) {
        handler = handlers[m];
        request = handler(request, rpcName) || request;
      }
      if (indexOf.call(POGOProtos.info(), proto) < 0) {
        this.log("[-] Request handler for " + rpcName + " isn't implemented yet!");
        continue;
      }
      decoded = {};
      if (request.request_message) {
        if (!(decoded = this.parseProtobuf(request.request_message, proto))) {
          continue;
        }
      }
      originalRequest = _.cloneDeep(decoded);
      afterHandlers = this.handleRequestAction(session, rpcName, decoded);
    }
    session.setRequest(data, url);
    return [buffer, session];
  };

  PokemonGoMITM.prototype.handleResponse = function(buffer, session) {
    var afterHandlers, data, decoded, handler, handlers, id, j, k, l, len, len1, len2, originalData, originalResponse, proto, ref, ref1, ref2, response, rpcName;
    ref = this.rawResponseEnvelopeHandlers;
    for (j = 0, len = ref.length; j < len; j++) {
      handler = ref[j];
      buffer = handler(buffer) || buffer;
    }
    if (!(session && (data = this.parseProtobuf(buffer, this.responseEnvelope)))) {
      return buffer;
    }
    originalData = _.cloneDeep(data);
    ref1 = this.responseEnvelopeHandlers;
    for (k = 0, len1 = ref1.length; k < len1; k++) {
      handler = ref1[k];
      data = handler.length > 1 ? handler(session.data, data) || data : handler(data) || data;
    }
    ref2 = data.returns;
    for (id in ref2) {
      response = ref2[id];
      if (!(response.length > 0)) {
        continue;
      }
      if (!(id < session.lastRequest.requests.length)) {
        this.log("[-] Extra response " + id + " with no matching request!");
        continue;
      }
      rpcName = changeCase.pascalCase(session.lastRequest.requests[id].request_type);
      proto = "POGOProtos.Networking.Responses." + rpcName + "Response";
      handlers = [].concat(this.rawResponseHandlers[rpcName] || [], this.rawResponseHandlers['*'] || []);
      for (l = 0, len2 = handlers.length; l < len2; l++) {
        handler = handlers[l];
        response = handler(response, rpcName) || response;
      }
      if (indexOf.call(POGOProtos.info(), proto) >= 0) {
        if (!(decoded = this.parseProtobuf(response, proto))) {
          continue;
        }
        originalResponse = _.cloneDeep(decoded);
        afterHandlers = this.handleResponseAction(session, rpcName, decoded);
        if (!_.isEqual(afterHandlers, originalResponse)) {
          this.log("[!] Overwriting " + rpcName + " response");
          data.returns[id] = POGOProtos.serialize(afterHandlers, proto);
        }
      } else {
        this.log("[-] Response handler for " + rpcName + " isn't implemented yet!");
      }
    }
    if (id = session.setResponse(data)) {
      this.refreshSession(session, id);
    }
    if (!_.isEqual(originalData, data)) {
      buffer = POGOProtos.serialize(data, this.responseEnvelope);
    }
    return buffer;
  };

  PokemonGoMITM.prototype.proxySignatureHandler = function(ctx) {
    var requestChunks;
    requestChunks = [];
    ctx.onRequestData((function(_this) {
      return function(ctx, chunk, callback) {
        requestChunks.push(chunk);
        return callback(null, null);
      };
    })(this));
    return ctx.onRequestEnd((function(_this) {
      return function(ctx, callback) {
        var buffer;
        buffer = Buffer.concat(requestChunks);
        if (/Email.*com.nianticlabs.pokemongo/.test(buffer.toString())) {
          buffer = new Buffer(buffer.toString().replace(/&client_sig=[^&]*&/, "&client_sig=" + _this.clientSignature + "&"));
        }
        ctx.proxyToServerRequest.write(buffer);
        return callback();
      };
    })(this));
  };

  PokemonGoMITM.prototype.handleProxyError = function(ctx, err, errorKind) {
    var url;
    url = ctx && ctx.clientToProxyRequest ? ctx.clientToProxyRequest.url : '';
    return this.log("[-] " + errorKind + " on " + url + ":", err);
  };

  PokemonGoMITM.prototype.getSession = function(req, url) {
    var i, id, ref, reqId, s, session, timestamp;
    id = req.auth_ticket ? Buffer.concat([req.auth_ticket.start, req.auth_ticket.end]).toString() : req.auth_info ? req.auth_info.token.contents : void 0;
    if (!(id && (session = this.sessions[id]))) {
      timestamp = Date.now();
      reqId = parseInt(req.request_id);
      ref = this.sessions;
      for (i in ref) {
        s = ref[i];
        if (s.lastRequest.request_id === reqId) {
          session = s;
        }
        if (s.expiration < timestamp) {
          delete this.sessions[i];
        }
      }
      if (!session) {
        session = new Session(id, url);
      }
    }
    if (id = session.setRequest(req, url)) {
      this.sessions[id] = session;
    }
    return session;
  };

  PokemonGoMITM.prototype.refreshSession = function(session, newId) {
    if (session.id) {
      delete this.sessions[session.id];
    }
    this.sessions[newId] = session;
    return session.id = newId;
  };

  PokemonGoMITM.prototype.handleRequestAction = function(session, action, data) {
    var handler, handlers, j, len;
    this.log("[+] Request for action " + action + ":", data);
    handlers = [].concat(this.requestHandlers[action] || [], this.requestHandlers['*'] || []);
    for (j = 0, len = handlers.length; j < len; j++) {
      handler = handlers[j];
      data = handler.length > 2 ? handler(session.data, data, action) || data : handler(data, action) || data;
    }
    return data;
  };

  PokemonGoMITM.prototype.handleResponseAction = function(session, action, data) {
    var handler, handlers, j, len;
    this.log("[+] Response for action " + action + ":", data);
    handlers = [].concat(this.responseHandlers[action] || [], this.responseHandlers['*'] || []);
    for (j = 0, len = handlers.length; j < len; j++) {
      handler = handlers[j];
      data = handler.length > 2 ? handler(session.data, data, action) || data : handler(data, action) || data;
    }
    return data;
  };

  PokemonGoMITM.prototype.setRequestHandler = function(action, cb) {
    this.addRequestHandler(action, cb);
    return this;
  };

  PokemonGoMITM.prototype.setResponseHandler = function(action, cb) {
    this.addResponseHandler(action, cb);
    return this;
  };

  PokemonGoMITM.prototype.addRequestHandler = function(action, cb) {
    var base;
    if ((base = this.requestHandlers)[action] == null) {
      base[action] = [];
    }
    this.requestHandlers[action].push(cb.bind(this));
    return this;
  };

  PokemonGoMITM.prototype.addResponseHandler = function(action, cb) {
    var base;
    if ((base = this.responseHandlers)[action] == null) {
      base[action] = [];
    }
    this.responseHandlers[action].push(cb.bind(this));
    return this;
  };

  PokemonGoMITM.prototype.addRequestEnvelopeHandler = function(cb, name) {
    if (name == null) {
      name = void 0;
    }
    this.requestEnvelopeHandlers.push(cb.bind(this));
    return this;
  };

  PokemonGoMITM.prototype.addResponseEnvelopeHandler = function(cb, name) {
    if (name == null) {
      name = void 0;
    }
    this.responseEnvelopeHandlers.push(cb.bind(this));
    return this;
  };

  PokemonGoMITM.prototype.addRawRequestHandler = function(action, cb) {
    var base;
    if ((base = this.rawRequestHandlers)[action] == null) {
      base[action] = [];
    }
    this.rawRequestHandlers[action].push(cb.bind(this));
    return this;
  };

  PokemonGoMITM.prototype.addRawResponseHandler = function(action, cb) {
    var base;
    if ((base = this.rawResponseHandlers)[action] == null) {
      base[action] = [];
    }
    this.rawResponseHandlers[action].push(cb.bind(this));
    return this;
  };

  PokemonGoMITM.prototype.addRawRequestEnvelopeHandler = function(cb, name) {
    if (name == null) {
      name = void 0;
    }
    this.rawRequestEnvelopeHandlers.push(cb.bind(this));
    return this;
  };

  PokemonGoMITM.prototype.addRawResponseEnvelopeHandler = function(cb, name) {
    if (name == null) {
      name = void 0;
    }
    this.rawResponseEnvelopeHandlers.push(cb.bind(this));
    return this;
  };

  PokemonGoMITM.prototype.parseProtobuf = function(buffer, schema) {
    var e;
    try {
      return POGOProtos.parseWithUnknown(buffer, schema);
    } catch (_error) {
      e = _error;
      return this.log("[-] Parsing protobuf of " + schema + " failed: " + e);
    }
  };

  PokemonGoMITM.prototype.log = function() {
    var arg, i, j, len;
    for (i = j = 0, len = arguments.length; j < len; i = ++j) {
      arg = arguments[i];
      if (typeof arg === 'object') {
        arguments[i] = util.inspect(arg, {
          depth: null
        });
      }
    }
    if (this.debug) {
      return console.log.apply(null, arguments);
    }
  };

  return PokemonGoMITM;

})();

module.exports = PokemonGoMITM;

// ---
// generated by coffee-script 1.9.2