var http =      require("http");            // Launching the HTML server
var express =   require("express");         // Handling get/post requests
var path =      require("path");            // Joing paths
var firebase =  require("firebase");        // Linking up to the firebase server
var sizeOf =    require("object-sizeof");   // Checking object of a javascript object
var fs =        require("fs");              // Reading and writing files
require("datejs");                          // Extension to Date() for better date handling

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
var app = express();
app.use(express.static(path.join(__dirname, "Website")));
app.get("/:page", function(req, res){
   res.sendFile(path.join(__dirname, "Website", req.params.page + ".html")); 
});

app.post("/createroom", (req, res) => {
    onReq(req, res, (data) => {                                 // res will be in the scope of the function when it is run from within onReq
        if(!checkData(res, data, ["type"]))
            return;

        var code = genChars(5);

        if(data.type == 'computer'){                            // If the device type is a computer
            ref.child("/" + code).update({                      // Create the group object on firebase
                userAmt: 0,                                     // Amount of people in the group 
            });
            resp(res, SUC,  {grID: code})
        } else if(data.type == "android"){                                                // If request type is an android device
            if(!checkData(res, data, ["name"]))
                return;
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
        log(INFO, "Created new room with code: "+ code + " Type: " + data.type);
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
            log(INFO, "User [" + data.name + "] successfully joined  room [" + data.grID + "] width id [" + usrAmt +"]")
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
    var screenStop = date.getTime();
    var recMinutes = Math.round(data.milli/60000);
    var currHourMin = 0, lastHourMin = 0;
    var newRef = ref.child("/" + data.grID +"/users/" + data.id + "/");
    
    if(date.getMinutes() >= recMinutes){
        currHourMin = recMinutes;
        recMinutes = 0;
    } else {
        currHourMin = date.getMinutes();
        recMinutes -= currHourMin;
    }
    
    if(recMinutes > 0){
        lastHourMin = recMinutes % 60;
        recMinutes -= lastHourMin;
    }

    // This code should be optimized by downloading the data first instead of requesting each time
    // If we want this to be really bullet proof, it should be recursive to make sure no hour's usage exceeds 60 minutes
    var screenStart = date.getTime() - data.milli;
    var startDate = new Date(screenStart);
    log(INFO, "recMinutes: " + recMinutes + ", currHourMin: " + currHourMin + ", lastHourMin: " + lastHourMin);
    newRef.child("/" + date.getMonth() + "/" + date.getDate() + "/" + date.getHours()).once("value", (snapshot) => {
        var oldValue = ((snapshot.val() == null)? 0 : snapshot.val());
        snapshot.ref.set(oldValue + currHourMin);

        if(oldValue + currHourMin > 60)
            return resp(res, ERR, "TIME KEEPING ISSUE, CURRENT HOUR USAGE EXCEEDS 60");

        if(oldValue != 0 && lastHourMin != 0)
            return resp(res, ERR, "TIME KEEPING ISSUE, TIME SPENT THIS HOUR EXCEEDS ACTUAL TIME");

        if(lastHourMin == 0 && recMinutes == 0)
            return;

        newRef.child("/" + startDate.getMonth() + "/" + startDate.getDate() + "/" + startDate.getHours()).once("value", (snapshot) => {
        var oldValue = ((snapshot.val() == null)? 0 : snapshot.val());
        snapshot.ref.set(oldValue + lastHourMin);

        if(oldValue + lastHourMin > 60)
            return resp(res, ERR, "TIME KEEPING ISSUE, LAST HOUR USAGE EXCEEDS 60");

        startDate.add(1).hour();
        while(recMinutes > 0){
            newRef.child(startDate.getMonth() + "/" + startDate.getDate() + "/" + startDate.getHours()).set(60);
            log("INFO", "Adding 1 hour to " + startDate);
            startDate.add(1).hours();
            recMinutes -= 60;
        }
        resp(res, SUC, "UPDATED TIME TABLES");
        });        
    });
    
}

app.post("/view", (req, res) => {
    onReq(req, res, (data) => {
        if(!checkData(res, data, ["grID"]))
            return;

        var newRef = ref.child(data.grID.toUpperCase());
        log(INFO, "Request data group ID: " + data.grID + "/" + data.id)

        if(!!data.id)
            newRef = newRef.child(data.id);

        newRef.once("value", (snapshot) => {
            var obj = snapshot.val();
            if(obj == null)
                resp(res, ERR, "Group [" + data.grID + "]Doesn't Exist");
            else
                resp(res, SUC, snapshot.val());
        });
    });
});

// Create web server
http.createServer(app).listen(80, function(){
    log(INFO, "The server has been opened on port 80");
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
    log((type == ERR)? WARN: INFO, ((typeof(body) == "object")? JSON.stringify(body) : body) + " [Size: " + sizeOf(body) + "]");
}

function checkData(res, data, args)
{
    for(var x = 0; x < args.length; x++)
        if(!data.hasOwnProperty(args[x]))
        {
            resp(res, ERR, "ARGUMENT [" + args[x] + "] MISSING");
            return false;
        }
    return true;
}

// Random functions
function genChars(amt)
{
    var Alpha = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    var str = "";
    for(var x = 0; x < amt; x++)
        str += Alpha.charAt(Math.random()*36);
    return str;
}

var INFO = 0, WARN = 1, ERROR = 2, strLevel = ["[INFO]", "[WARN]", "[EROR]"];
var logLevel =   INFO;
var writeLevel = WARN;

function log(level, message)
{
    if(level >= logLevel || level >= writeLevel)
    {
        var d = new Date();
        var time = d.toLocaleDateString() + " " + d.toLocaleTimeString();
        var str = strLevel[level] + " " + time + "> " + message;

        if(level >= logLevel)
            console.log(str);
        if(level >= writeLevel)
            fs.appendFile('logs.txt', str + "\r\n" , () => {});
    }
}