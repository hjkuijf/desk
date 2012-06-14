var fs = require('fs');
var express = require("express"),
    app     = express.createServer(),
    qs      = require('querystring');

var actions=require('./actions');

var path = "trunk/";
var dataRoot=path+"ext/php/";
var port = 1337;

path=fs.realpathSync(path)+"/";
dataRoot=fs.realpathSync(dataRoot)+"/";

app.get("/", function(req, res) {
  res.redirect("/index.html");
});


app.post('/ext/php/listDir.php', function(req, res){
	var body = '';
	req.on('data', function (data) {
		body += data;
	});
	req.on('end', function () {
        var POST = qs.parse(body);

		actions.listDir(dataRoot+POST.dir, function (message) {
			res.send(message);
		});
	});
});

app.post('/ext/php/actions.php', function(req, res){
	res.connection.setTimeout(0);
	var body = '';
	req.on('data', function (data) {
		body += data;
	});
	req.on('end', function () {
        var POST = qs.parse(body);
        actions.performAction(POST, function (message) {
			res.send(message);
		});
	});
});

app.configure(function(){
  app.use(express.methodOverride());
  app.use(express.bodyParser());
  app.use(express.static(path));
  app.use(express.errorHandler({
    dumpExceptions: true, 
    showStack: true
  }));
  app.use(app.router);

});
actions.setupActions(dataRoot, function () {
	app.listen(port);
	console.log ("server running on port "+port+", serving path "+path);
});
