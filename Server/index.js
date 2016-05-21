var http = require("http");         // Launching the HTML server
var express = require("express");   // Linking to the different web pages
var path = require("path");         // Joing paths
var app = express();
var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');

// Connect to mongodb
var url = 'mongodb://localhost:27017/test';
var mongoDB;
MongoClient.connect(url, function(err, db) {
  assert.equal(null, err);
  console.log("Connected correctly to groups server");
  mongoDB = db.collection('groups');
});

// Database functions
function dbInsert(obj ,callback) {
   mongoDB.insertOne( obj, function(err, result) {
    assert.equal(err, null);
    callback();
  });
};

function dbFind(obj, callback) {
   var cursor = mongoDB.find(obj);   
   return cursor;
};

// Web paths
app.use(express.static(path.join(__dirname, "public")));

// Post request to create room
app.post("/create", function(req,res){
    var body="";
	req.on("data",function(data){
		body+=data;
		//Check to see if someone is trying to crash the server
		if(body.length >1e6)
			request.connection.destroy();
	});

	req.on("end",function(){
        // After recieving data
        var data = JSON.parse(body);
        
        if(data.type == 'computer'){
            var code = gen5Char();
            dbInsert({grID: code});
            res.end(JSON.stringify({status: "success", grID: code}));
        }
        
    });
});


// Create web server
http.createServer(app).listen(7777, function(){
	console.log("The server has been opened on port 7777");
});

// Random functions
function gen5Char(){
    var Alpha = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    var str = "";
    for(var x = 0; x < 5; x++){
        str += Alpha.charAt(Math.random()*36);
    }
    return str;
}