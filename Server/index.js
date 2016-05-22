var http = require("http");         // Launching the HTML server
var express = require("express");   // Linking to the different web pages
var path = require("path");         // Joing paths
var app = express();
var firebase = require("firebase");

firebase.initializeApp({
  serviceAccount: "jsonAuth.json",
  databaseURL: "https://project-3886157552181854094.firebaseio.com/"
});

var db = firebase.database();
var ref = db.ref();



// Database functions
function dbInsert(path, obj) {
    db.ref(path).update(obj);
};

function dbFind(loc, obj, cb) {
    ref.child(loc).on(obj, cb);
    
};

// Web paths
app.use(express.static(path.join(__dirname, "Website")));

// Post request to create room
app.post("/createroom", function(req,res){
    addToRoom({grID: "1WBD6", name: "Tyler"}, res);
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
        console.log(data);
        if(data.type != 'computer' && data.type!= 'android'){
            res.end(JSON.stringify({status: "error", message: "no type available"}));
            return;
        }
        var code = genChars(5);
        
        
        if(data.type == 'computer'){
            console.log("computer");
            // If request type is computer
            var newObj = {};
            newObj[code] = {    // Id for the group
                userAmt: 0,     // Amount of people in the group 
        };
            
            dbInsert("/", newObj);
            res.end(JSON.stringify({status: "success", grID: code}));
            console.log("Created new room with code: " + code);
        } else {
            // If request type is an android device
            dbInsert({
                grID: code,     // Id for the group
                userAmt: 1,     // Amount of people in the group
                users: [{       // Arraylist of users in the group
                    id: 1,      // Individual user ID's
                    name: data.usrName, // Name of the individual user 
                }]
            });
            res.end(JSON.stringify({status: "success", grID: code, id: 1}));
            console.log("Created new room with code: " + code);            
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
        if(obj.rmID.length != 5)
            res.end(JSON.stringify({status: "error", message: "invalid code"}));
        else{
            addToRoom(obj, res);}
        
    });
    
});

function addToRoom(data, res){
   var ctx = {data: data, res: res};
   
    var func = function(snapshot){
        console.log("Attempting to find room id: " + data.grID);
        var obj = snapshot.val();
        console.log(obj);
        if(obj == null){
            console.log("Invalid room ID submitted");
            res.end("ERROR:WRONG ROOM NUMBEr");
        } else {
            console.log("room exists");
            var func = function(snapshot){
                var usrAmt = snapshot.val();
                ref.child("/"+data.grID+"/userAmt").set(usrAmt+1);
                var newobj = {};
                newobj[usrAmt+1] = {
                    id: usrAmt+1,
                    name: data.name
                };
                ref.child("/"+data.grID+"/users").update(newobj);
            }
            func.bind(this);
            ref.child("/"+data.grID+"/userAmt").once("value",func)
        }
    }
    func.bind(ctx);
    ref.child("/"+data.grID).once("value", func);
    
}

app.post("/report", function(req, res){
    
    
});

app.get("/view",function(){
    
});



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


