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
    logTime({grID: "70EFD", id:1, minutes: 400}, new Date(), res);
    //addToRoom({grID: "ZEUQM", name: "poop"},res);
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
            console.log("computer wants to create room");
            // If request type is computer
            var newObj = {};
           
            
            ref.child("/" +code).update({   // Id for the group
                userAmt: 0,         // Amount of people in the group 
                 });
            res.end(JSON.stringify({status: "success", grID: code}));
            console.log("Created new room with code: " + code);
        } else {
            // If request type is an android device
            ref.child("/" + code).update({
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
        if(obj.grID.length != 5)
            res.end(JSON.stringify({status: "error", message: "invalid code"}));
        else{
            addToRoom(obj, res);}
        
    });
    
});

function addToRoom(data, res){
    var func = function(snapshot){
        console.log("Attempting to find room id: " + data.grID);
        var obj = snapshot.val();
        console.log(obj);
        if(obj == null){
            console.log("Invalid room ID submitted");
            res.end("ERROR:WRONG ROOM NUMBER");
        } else {
            console.log("room exists");
            var func = function(snapshot){
                var usrAmt = snapshot.val();
                ref.child("/"+data.grID+"/userAmt").set(usrAmt+1);
                ref.child("/"+data.grID+"/users/" + (usrAmt+1)).update({name: data.name});
            }
            ref.child("/"+data.grID+"/userAmt").once("value",func)
            res.end(usrAmt + 1);
        }
    }
    ref.child("/"+data.grID).once("value", func);
    
}

app.post("/report", function(req, res){
       var time = new Date;
       var body="";
	req.on("data",function(data){
		body+=data;
		//Check to see if someone is trying to crash the server
		if(body.length >1e6)
			request.connection.destroy();
	});

	req.on("end",function(){
       var obj = JSON.parse(body);
       logTime(obj, time, res);
    
    });
});

function logTime(data, date, res){
    
    console.log(data);
    
    if(!data.hasOwnProperty("grID") || !data.hasOwnProperty("id") || !data.hasOwnProperty("minutes")){
        res.end("ERROR: NOT SENDING COMPLETE DATA");
    } else {
        console.log(data);
        var minutes = date.getMinutes();
        var hour = date.getHours();
        var recMinutes = data.minutes;
        
        var pushData = [];
        if(recMinutes <= minutes)
            pushData[0] = recMinutes;
        else{
            pushData[0] = minutes;
            recMinutes -= minutes;
            while(recMinutes > 0 ){
                if(recMinutes >= 60){
                    pushData.push(60);
                    recMinutes -= 60;
                } else {
                    pushData.push(recMinutes);
                    recMinutes = 0;
                }
            }
        }
        var i = 0;
        var uploadTime = function(snapshot){
            var obj = snapshot.val();
            if(obj == null)
                res.end("ERROR: ROOMID DOESN'T EXIST");
            else if(data.id > obj.userAmt)
                res.end("ERROR: USER SHOULDN'T EXIST");
            else {
                console.log(i);
                console.log(pushData);
                
                var newRef = ref.child("/" + data.grID +"/users/" + data.id + "/hours/");
                
                    //console.log("pos: %d addingHour: %d currentHour %d", pos, addingHour, currentHour);
                     var pos = hour - i;
                    newRef.child("/"+ pos).once("value", function(snapshot){
                        var oldValue = (snapshot.val() == null)? 0 : snapshot.val();
                        var newValue = oldValue + pushData[i];
                        newRef.child("/"+ pos + "/").set((newValue > 60)? 60: newValue);
                        i++;
                        if(i < pushData.length)
                            ref.child("/" + data.grID).once("value", uploadTime);
                        else
                            return;
                    });
                }
                
            }
        }
        ref.child("/" + data.grID).once("value", uploadTime);
        //res.end("SUCCESS: UPLOADED");
        
    }
    
    
    

app.get("/view",function(){
    
});



// Create web server
http.createServer(app).listen(8080, function(){
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


