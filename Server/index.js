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

app.post("/createroom", (req, res) => {
    onReq(req, res, (data) => {                                 // res will be in the scope of the function when it is run from within onReq
        if(!checkData(res, data, ["type", "name"]))
            return;

        var code = genChars(5);

        if(data.type == 'computer'){                            // If the device type is a computer
            ref.child("/" + code).update({                      // Create the group object on firebase
                userAmt: 0,                                     // Amount of people in the group 
            });
            resp(res, SUC,  {grID: code})
        } else if(data.type == "android"){                                                // If request type is an android device
            ref.child("/" + code).update({
                userAmt: 1,
                users: {
                    0: {name: data.name}                        // Create the group with one user inplace
                }
            });
            resp(res, SUC, {grID: code, id: 1});
        } else {
            resp(res, ERR, "MUST SPECIFY DEVICE AS EITHER COMPUTER OR ANDROID");
            return;
        }
        console.log("Created new room with code: %s Type: %s", code, data.type);     
    })
});

app.post("/joinroom", (req, res) => {
    onReq(req, res, (data) => {
        if(!checkData(res, data, ["grID", "name"]))
            return;

        if(data.grID.match(/^\w{5}$/) == null)                  // Make sure that they sent id of group they want to join
            resp(res, ERR, "INVALID grID")
        else
            addToRoom(data, res);
    });
});

// Data takes rmID, id, and minutes
function addToRoom(data, res){
    var func = function(snapshot){
        var obj = snapshot.val();
        console.log(obj);
        if(obj == null)
        {
            resp(res, ERR, "grID NOT FOUND");
            return;
        }
        var func = function(snapshot){
            var usrAmt = snapshot.val();
            ref.child("/"+data.grID+"/userAmt").set(usrAmt+1);
            ref.child("/"+data.grID+"/users/" + (usrAmt)).update({name: data.name});
            resp(res, SUC, {id: usrAmt});
            console.log("User [%s] successfully joined  room [%s] width id [%d]", data.name, data.grID, usrAmt);
        }
        ref.child("/"+data.grID+"/userAmt").once("value",func);
    }
    ref.child("/"+data.grID).once("value", func);
}

app.post("/report", (req, res) => {
    onReq(req, res, (data) => {
        if(!checkData(res, data, ["grID", "id", "milli"]))
            return;

        if(data.time == null)
            logTime(data, new Date(), res);
        else
            logTime(data, new Date(data.time), res);
    });
});

function logTime(data, date, res){
    
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
        lastHourMin = recMinutes % 60;
        recMinutes -= lastHourMin;
    }

    //This code should be optimized by downloading the data first instead of requesting each time
    // If we want this to be really bullet proof, it should be recursive to make sure no hour's usage exceeds 60 minutes
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
    resp(res, SUC, "UPDATED TIME TABLES");
}

app.post("/view", (req, res) => {
    onReq(req, res, (data) => {
        if(!checkData(res, data, ["grID"]))
            return;

        var newRef = ref.child(data.grID);
        
        console.log("Request data group ID: " + data.grID + "/" + data.id);
        if(!!data.id)
            newRef = newRef.child(data.id);

        newRef.once("value",function(snapshot){
            console.log(snapshot.val());
            resp(res, SUC, snapshot.val());
        });
    });
});

// Create web server
http.createServer(app).listen(80, function(){
	console.log("The server has been opened on port 80");
});

// Network Functions

function onReq(req, res, callBack)
{
    var body="";
	req.on("data",function(data){
		body+=data;
		//Check to see if someone is trying to crash the server
		if(body.length >1e6)
			request.connection.destroy();
	});

	req.on("end", () => {
        var data = JSON.parse(body);
        callBack(data);
    });
}

var ERR = "ERROR";
var SUC = "SUCCESS";

function resp(res, type, body)
{
    res.json({
        type: type,
        body: body
    }); 
    console.log(type + ": " + body);
}

function checkData(res, data, args)
{
    console.log(data);
    for(var x = 0; x < args.length; x++)
        if(!data.hasOwnProperty(args[x]))
        {
            resp(res, ERR, "ARGUMENT [" + args[x] + "] MISSING");
            return false;
        }
    return true;
}

// Random functions
function genChars(amt){
    var Alpha = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    var str = "";
    for(var x = 0; x < amt; x++){
        str += Alpha.charAt(Math.random()*36);
    }
    return str;
}