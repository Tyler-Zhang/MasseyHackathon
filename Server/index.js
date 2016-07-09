var http = require("http");         // Launching the HTML server
var express = require("express");   // Linking to the different web pages
var path = require("path");         // Joing paths
var app = express();                // Handling get/post requests
var firebase = require("firebase"); // Linking up to the firebase server
require("datejs");                  // Extension to Date() for better date handling

/* 
 * This provides the authorization for the data base
 * Currently the authorization is open anyways though
*/
firebase.initializeApp({
  serviceAccount: "jsonAuth.json",
  databaseURL: "https://project-3886157552181854094.firebaseio.com/"
});

var db = firebase.database();
var ref = db.ref();                 // Ref is the reference to the values in the data base


// Web paths
app.use(express.static(path.join(__dirname, "Website")));
app.get("/:page", function(req, res){
   res.sendFile(path.join(__dirname, "Website", req.params.page + ".html")); 
});

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
        console.log(data);
        // Check which kind of device is trying to connect, if android, automatically add them to the group
        if(data.type != 'computer' && data.type!= 'android'){
            res.json(msg(ERR, "NO DEVICE TYPE SENT"));
            return;
        }
        var code = genChars(5);

        if(data.type == 'computer'){
            // If request type is computer
            var newObj = {};
           
            ref.child("/" + code).update({   // Id for the group
                userAmt: 0,         // Amount of people in the group 
                 });

            resp(res, RSP,  {grID: code})
            console.log("Created new room with code: %s Type: %s", code, data.type);
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
            resp(res, RSP, {grID: code, id: 1});
            console.log("Created new room with code: %s Type: %s", code, data.type);        
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
        if(obj.grID.length != 5){
            resp(res, ERR, "INVALID grID")
            console.log("Error: tried to join room with invalid code length: %s", obj.grID);
        }
        else
            addToRoom(obj, res);
        
    });
    
});
// Data takes rmID, id, and minutes
function addToRoom(data, res){
    var func = function(snapshot){
        var obj = snapshot.val();
        console.log(obj);
        if(obj == null){
            console.log("Error: Room ID [%s] not found", data.grID);
            resp(res, ERR, "grID NOT FOUND");
        } else {
             console.log("User [%s] successfully joined  room [%s]", data.name, data.grID);
            var func = function(snapshot){
                var usrAmt = snapshot.val();
                ref.child("/"+data.grID+"/userAmt").set(usrAmt+1);
                ref.child("/"+data.grID+"/users/" + (usrAmt+1)).update({name: data.name});
            }
            ref.child("/"+data.grID+"/userAmt").once("value",func);
            res.json({id:usrAmt + 1});
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
       console.log(obj.time);
       console.log(new Date().getTime());
       if(obj.time == null)
            logTime(obj, new Date(), res);
       else
            logTime(obj, new Date(obj.time), res);
    
    });
});

function logTime(data, date, res){
    
    console.log(data);
    // Check to make sure information payload is complete

    if(!data.hasOwnProperty("grID") || !data.hasOwnProperty("id") || !data.hasOwnProperty("milli")){
        console.log("ERROR: NOT SENDING COMPLETE DATA");
        resp(res, ERR, "LOGTIME REQUIRES ADDITIONAL DATA");
        
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

        //This code should be optimized by downloading the data first instead of requesting each time

        var screenStart = date.getTime() - data.milli;
        var startDate = new Date(screenStart);
        console.log("recMinutes: %d, currHourMin: %d, lastHourMin: %d, ", recMinutes, currHourMin, lastHourMin);
        newRef.child("/" + date.getMonth() + "/" + date.getDate() + "/" + date.getHours()).once("value", function(snapshot){
            var oldValue = ((snapshot.val() == null)? 0 : snapshot.val());
            snapshot.ref.set(oldValue + currHourMin);
            
            if(lastHourMin == 0)
                return;

            newRef.child("/" + startDate.getMonth() + "/" + startDate.getDate() + "/" + startDate.getHours()).once("value", function(snapshot){
            var oldValue = ((snapshot.val() == null)? 0 : snapshot.val());
            snapshot.ref.set(oldValue + lastHourMin);
            startDate.add(1).hours();
            while(startDate.getTime() < screenStop){
                newRef.child(startDate.getMonth() + "/" + startDate.getDate() + "/" + startDate.getHours()).set(60);
                console.log("adding: " + startDate);
                startDate.add(1).hours();   
            }
            
         });        
    });     
    }
}

/*  This is to get the data from firebase
    grID
    id
    timeStart
    timeStop
*/

app.post("/view",function(req, res){
    var body="";
	req.on("data", function(data){
		body+=data;
		//Check to see if someone is trying to crash the server
		if(body.length >1e6)
			request.connection.destroy();
	});

	req.on("end",function(){
        var obj = JSON.parse(body);
        if(!obj.grID)
        {
            console.log("ERROR: NO GROUP ID RECIEVED");
            resp(res, ERR, "NO GROUP ID RECIEVED");
        }

        console.log("Request data group ID: " + obj.grID);
        var newRef = ref.child(obj.grID);
        
        console.log("Request data group ID: " + obj.grID + "/" + obj.id);
        if(!!obj.id)
            newRef = newRef.child(obj.id);

        newRef.once("value",function(snapshot){
            console.log(snapshot.val());
            res.json(snapshot.val());
        });
    });
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

var ERR = "ERROR";
var RSP  = "RESPONSE";

function resp(res, type, body)
{
    res.json({
        type: type,
        body: body
    });
}