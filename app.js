var fs      = require('fs'),
    express = require('express'),
    http    = require ('http'),
    https   = require ('https'),
   	exec = require('child_process').exec,
   	os=require('os');

var	user=process.env.USER;
console.log("UID : "+process.getuid());

// user parameters
var serverPath = fs.realpathSync('trunk')+'/',
	deskPath= '/home/'+user+'/desk/',
	phpSubdir='ext/php/',
	phpDir=serverPath+phpSubdir,
	phpURL='/'+user+'/'+phpSubdir;
	port = process.getuid(),
	uploadDir=deskPath+'upload/';

// use port 8080 if not running on desk.creatis.insa-lyon.fr
var hostname=os.hostname();
console.log('hostname : '+hostname);
if (hostname!='desk.creatis.insa-lyon.fr') {
	port=8080;
}

// certificate default file names
var passwordFile="./password.json",
	privateKeyFile="privatekey.pem",
	certificateFile="certificate.pem";

var separator="*******************************************************************************";

console.log(separator);
console.log(separator);
console.log('Welcome to Desk');
console.log('Running as user : '+user);
console.log(separator);

//configure middleware : static file serving, errors
var app=express();

// set upload limit
app.use(express.limit('20000mb'));

// look for correctly formated password.json file.
var identity=null;
if (fs.existsSync(passwordFile)) {
	var identity=require(passwordFile);
	if ( (typeof identity.username !== "string") ||
		(typeof identity.password !== "string")) {
		identity=null;
	}
}

// use basicAuth depending on password.json
if (identity) {
	app.use(express.basicAuth( function (username, password) {
			return identity.username === username & identity.password === password;}
	));
	console.log("Using basic authentication");
} else {
	console.log("No password file "+passwordFile+" provided or incorrect file");
	console.log("see "+passwordFile+".example file for an example");
}

app.use(express.methodOverride());

//~ <<<<<<< HEAD
	//~ // redirect from source dir
//~ //	var homeURL='/'+user+'/demo/default/release';
	//~ var homeURL='/'+user+'/';
	//~ /*
	//~ app.get('/'+user+'/source/*', function(req, res){
		//~ res.redirect(homeURL);
	//~ });
	//~ */
//~ =======
// handle body parsing
app.use(express.bodyParser({uploadDir: uploadDir }));

// redirect from source dir
var homeURL='/'+user+'/';
/*	app.get('/'+user+'/source/*', function(req, res){
	res.redirect(homeURL);
});*/
//~ >>>>>>> 8bc507d4fb6693cc8a3418ac05b6cbaa50986039

app.use('/'+user,express.static(serverPath+'demo/default/release/'));
//	app.use('/'+user,express.directory(serverPath+'demo/default/release'));

//~ <<<<<<< HEAD
	//~ var devDir='/home/'+user+'/desk/dev/';
	//~ app.use('/'+user+'/dev',express.static(devDir));
	//~ app.use('/'+user+'/dev',express.directory(devDir));
//~ 
//~ 
	//~ // enable static file server
	//~ app.use('/'+user,express.static(path));
//~ 
	//~ /*
	//~ // redirect from url '/user'
	//~ app.get('/'+user, function(req, res){
		//~ res.redirect(homeURL);
	//~ });
	//~ */
//~ =======
// serve data files
app.use('/'+user+'/files',express.static(deskPath));
app.use('/'+user+'/files',express.directory(deskPath));

// enable static file server
app.use('/'+user,express.static(serverPath));
//~ >>>>>>> 8bc507d4fb6693cc8a3418ac05b6cbaa50986039

// display directories
app.use('/'+user,express.directory(serverPath));

// handle directory listing
console.log(phpURL+'listDir.php')
app.post(phpURL+'listDir.php', function(req, res){
	actions.listDir(req.body.dir, function (message) {
		res.send(message);
	});
});

// handle uploads
app.post(phpURL+'upload', function(req, res) {
	var file=req.files.file;
	var outputDir=req.body.uploadDir.toString().replace('%2F','/') || 'upload';
	outputDir=deskPath+outputDir;
	console.log("file : "+file.path.toString());
	console.log("uploaded to "+ outputDir+'/'+file.name.toString());
	fs.rename(file.path.toString(), outputDir+'/'+file.name.toString(), function(err) {
		if (err) throw err;
		// delete the temporary file
		fs.unlink(file.path.toString(), function() {
		    if (err) throw err;
		});
	});
	res.send('files uploaded!');
});

// handle actions
app.post(phpURL+'actions.php', function(req, res){
	res.connection.setTimeout(0);
    actions.performAction(req.body, function (message) {
		res.send(message);
	});
});

//~ <<<<<<< HEAD
	// handle cache clear
	app.get(phpURL+'clearcache.php', function(req, res){
		exec("rm -rf *",{cwd:phpDir+'cache', maxBuffer: 1024*1024}, function (err) {
			res.send('cache cleared!');
		});
//~ =======
//~ // handle cache clear
//~ app.get(phpURL+'clearcache.php', function(req, res){
	//~ exec("rm -rf *",{cwd:deskPath+'cache'}, function (err) {
		//~ res.send('cache cleared!');
//~ >>>>>>> 8bc507d4fb6693cc8a3418ac05b6cbaa50986039
	//~ });
});

//~ <<<<<<< HEAD
	// handle actions clear
	app.get(phpURL+'clearactions.php', function(req, res){
		exec("rm -rf *",{cwd:phpDir+'actions', maxBuffer: 1024*1024}, function (err) {
			res.send('actions cleared!');
		});
//~ =======
//~ // handle actions clear
//~ app.get(phpURL+'clearactions.php', function(req, res){
	//~ exec("rm -rf *",{cwd:deskPath+'actions'}, function (err) {
		//~ res.send('actions cleared!');
//~ >>>>>>> 8bc507d4fb6693cc8a3418ac05b6cbaa50986039
	//~ });
});

// handle errors
app.use(express.errorHandler({
	dumpExceptions: true, 
	showStack: true
}));

// use router
app.use(app.router);

console.log(separator);

var server;
var baseURL;
// run the server in normal or secure mode depending on provided certificate
if (0) {//fs.existsSync(privateKeyFile) && fs.existsSync(certificateFile)) {
	var options = {
		key: fs.readFileSync('privatekey.pem').toString(),
		cert: fs.readFileSync('certificate.pem').toString()
	};
	server = https.createServer(options, app);
	console.log("Using secure https mode");
	baseURL="https://";
}
else {
	server=http.createServer(app);
	console.log("No certificate provided, using non secure mode");
	console.log("You can generate a certificate with these 3 commands:");
	console.log("(1) openssl genrsa -out privatekey.pem 1024");
	console.log("(2) openssl req -new -key privatekey.pem -out certrequest.csr");
	console.log("(3) openssl x509 -req -in certrequest.csr -signkey privatekey.pem -out certificate.pem");
	baseURL="http://";
}
console.log(separator);

// setup actions
var actions=require('./actions');
//actions.setup( phpDir, function () {
actions.setup( deskPath, function () {
	server.listen(port);
	console.log(separator);
	console.log(new Date().toLocaleString());
	console.log ("server running on port "+port+", serving path "+serverPath);
	console.log(baseURL+"localhost:"+port+'/'+user+'/');
});
