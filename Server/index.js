var http = require("http");         // Launching the HTML server
var express = require("express");   // Linking to the different web pages
var path = require("path");         // Joing paths
var app = express();
var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');

// Connect to mongodb
var url = 'mongodb://localhost:27017/screenoff';
var mongoDB;
MongoClient.connect(url, function(err, db) {
  assert.equal(null, err);
  console.log("Connected correctly to screenoff server");
  mongoDB = db.collection('groups');
});

// Database functions
function dbInsert(obj ,callback) {
   mongoDB.insertOne( obj, function(err, result) {
    assert.equal(err, null);
    callback();
  });
};

function dbFind(obj) {
   var cursor = mongoDB.find(obj);   
   return cursor.toArray();
};

// Web paths
app.use(express.static(path.join(__dirname, "public")));

// Post request to create room
app.post("/createroom", function(req,res){
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
        if(data.type != 'computer' && data.type!= 'android'){
            res.end(JSON.stringify({status: "error", message: "no type available"}));
            return;
        }
        var code;
        while(true){
            code = genChars(5);
            if(dbFind({rmid: code}).length == 0)
                break;
        }
        if(data.type == 'computer'){
            // If request type is computer
            dbInsert({
                grID: code,     // Id for the group
                userAmt: 0,     // Amount of people in the group
                users: []
            });
            res.end(JSON.stringify({status: "success", grID: code}));
        } else {
            // If request type is an android device
            dbInsert({
                grID: code,     // Id for the group
                userAmt: 1,     // Amount of people in the group
                users: [{       // Arraylist of users in the group
                    id: 1,      // Individual user ID's
                    name: data.usrName, // Name of the individual user 
                    rDay: [],
                    rWeek: []
                }]
            });
            res.end(JSON.stringify({status: "success", grID: code, id: 1}));            
        }
    });
});

app.post("/joinroom", function(req, res){
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
        
    });
    
});

app.post("/report", function(req, res){
    
});

app.get("/g/")


// Create web server
http.createServer(app).listen(7777, function(){
	console.log("The server has been opened on port 7777");
});

// Random functions
function genChars(amt){
    var Alpha = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    var str = "";
    for(var x = 0; x < amt; x++){
        str += Alpha.charAt(Math.random()*36);
    }
    return str;
}