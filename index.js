var Phant = require('phant'),
    Printer = require('phant-output-thermalprinter'),
    Keychain = require('phant-keychain-hex'),
    Meta = require('phant-meta-nedb'),
    app = Phant()
    http_port = process.env.PHANT_PORT || 8080,
    telnet_port = process.env.PHANT_PORT || 8081;

var keys = Keychain({
  publicSalt: process.env.PHANT_PUBLIC_SALT || 'public salt',
  privateSalt: process.env.PHANT_PRIVATE_SALT || 'private salt'
});

var meta = Meta({
  directory: process.env.PHANT_STORAGEDIR || 'phant_streams'
});

var validator = Phant.Validator({
  metadata: meta
});

var httpInput = Phant.HttpInput({
  throttler: Phant.MemoryThrottler(),
  validator: validator,
  keychain: keys
});

// start listening for connections
Phant.HttpServer.listen(http_port);

// handle 404s
Phant.HttpServer.use(function(req, res) {

  if(res.headerSent) {
    return;
  }

  if(req.url.match(/^\/input\//)) {
    return;
  }

  var body = 'phant is ready and listening for input.\n';

  res.writeHead(404, {
    'Content-Type': 'text/plain',
    'Content-Length': body.length
  });

  res.end(body);

});

// attach input to http server
Phant.HttpServer.use(httpInput);

// register input with phant
app.registerInput(httpInput);

// register printer output with phant
app.registerOutput(Printer({
  path: '/dev/ttyO0',
  keychain: keys
}));

// register manager with phant
app.registerManager(
  Phant.TelnetManager({
    port: telnet_port,
    metadata: meta,
    keychain: keys,
    validator: validator
  })
);

console.log('phant http server running on port ' + http_port);
console.log('phant telnet server running on port ' + telnet_port);

