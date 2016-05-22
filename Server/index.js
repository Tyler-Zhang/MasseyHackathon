var http = require("http");         // Launching the HTML server
var express = require("express");   // Linking to the different web pages
var path = require("path");         // Joing paths
var app = express();
var firebase = require("firebase");
require("datejs");

firebase.initializeApp({
  serviceAccount: "jsonAuth.json",
  databaseURL: "https://project-3886157552181854094.firebaseio.com/"
});

var db = firebase.database();
var ref = db.ref();


// Web paths
app.use(express.static(path.join(__dirname, "Website")));

// Post request to create room
app.post("/createroom", function(req,res){
//logTime({grID: "2JEXT", id : 1, minutes: 1000}, new Date(), res);
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
            res.send(JSON.stringify({status: "error", message: "no type available"}));
            return;
        }
        var code = genChars(5);
        
        
        if(data.type == 'computer'){
            console.log("computer wants to create room");
            // If request type is computer
            var newObj = {};
           
            
            ref.child("/"+code).update({   // Id for the group
                userAmt: 0,         // Amount of people in the group 
                 });
            res.send(JSON.stringify({status: "success", grID: code}));
            console.log("Created new room with code: " + code);
        } else {
            // If request type is an android device
            ref.child("/" + code).update({
                userAmt: 1,     // Amount of people in the group
                users: {
                    1: {
                        name: data.name
                    }
                }
            });
            res.send(JSON.stringify({status: "success", grID: code, id: 1}));
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
            res.send(JSON.stringify({status: "error", message: "invalid code"}));
        else{
            addToRoom(obj, res);}
        
    });
    
});
// Data takes rmID, id, and minutes
function addToRoom(data, res){
    var func = function(snapshot){
        console.log("Attempting to find room id: " + data.grID);
        var obj = snapshot.val();
        console.log(obj);
        if(obj == null){
            console.log("Invalid room ID submitted");
            res.send("ERROR:WRONG ROOM NUMBER");
        } else {
            console.log("room exists");
            var func = function(snapshot){
                var usrAmt = snapshot.val();
                ref.child("/"+data.grID+"/userAmt").set(usrAmt+1);
                ref.child("/"+data.grID+"/users/" + (usrAmt+1)).update({name: data.name});
            }
            ref.child("/"+data.grID+"/userAmt").once("value",func)
            res.send(JSON.stringify({id:usrAmt + 1}));
        }
    }
    ref.child("/"+data.grID).once("value", func);
    
}

app.post("/report", function(req, res){
       var body="";
	req.on("data",function(data){
		body+=data;
		//Check to see if someone is trying to crash the server
		if(body.length >1e6)
			request.connection.destroy();
	});

	req.on("end",function(){
       var obj = JSON.parse(body);
       if(obj.time == null)
            logTime(obj, new Date(), res);
       else
            logTime(obj, obj.time, res);
    
    });
});

function logTime(data, date, res){
    
    console.log(data);
    
    if(!data.hasOwnProperty("grID") || !data.hasOwnProperty("id") || !data.hasOwnProperty("milli")){
        console.log("ERROR: NOT SENDING COMPLETE DATA");
        res.send("ERROR: NOT SENDING COMPLETE DATA");
        
    } else {
        console.log(data);
        
        var screenStop = date.getTime();
        var recMinutes = Math.round(data.milli/60000);
        var currHourMin = 0, lastHourMin = 0;
        var newRef = ref.child("/" + data.grID +"/users/" + data.id + "/");
        
        if(date.getMinutes() >= recMinutes){
            currHourMin = recMinutes;
            recMinutes = 0;
        }
        else {
            currHourMin = date.getMinutes();
            recMinutes -= currHourMin;
        }
        
        if(recMinutes > 0){
            lastHourMin = recMinutes%60;
            recMinutes -= lastHourMin;
        }
        var screenStart = date.getTime() - recMinutes*60*1000;
        var startDate = new Date(screenStart);
        
        newRef.child("/" + date.getMonth() + "/" + date.getDate() + "/" + date.getHours()).once("value", function(snapshot){
            var oldValue = (snapshot.val() == null)? 0 : snapshot.val();
            snapshot.ref.set(oldValue + currHourMin);
            
            newRef.child("/" + startDate.getMonth() + "/" + startDate.getDate() + "/" + startDate.getHours()).once("value", function(snapshot){
            var oldValue = (snapshot.val() == null)? 0 : snapshot.val();
            snapshot.ref.set(oldValue + currHourMin);
            startDate.add(1).hours();
            while(startDate.getTime() < screenStop){
                newRef.child(startDate.getMonth() + "/" + startDate.getDate() + "/" + startDate.getHours()).set(60);
                console.log("adding: " + startDate);
                startDate.add(1).hours();   
            }
            
         });        
    });
            
        
        //newRef.child(startMonth + "/" + startDay + "/" + startHour).once("value", uploadTime);
        //res.send("SUCCESS: UPLOADED");
        
    }
}
app.get("/view",function(){
    
});



// Create web server
http.createServer(app).listen(80, function(){
	console.log("The server has been opened on port 80");
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