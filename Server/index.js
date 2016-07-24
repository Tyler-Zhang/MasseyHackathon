var http =      require("http");            // Launching the HTML server
var express =   require("express");         // Handling get/post requests
var path =      require("path");            // Joing paths
var firebase =  require("firebase");        // Linking up to the firebase server
var sizeOf =    require("object-sizeof");   // Checking object of a javascript object
var fs =        require("fs");              // Reading and writing files
require("datejs");                          // Extension to Date() for better date handling

// Usage Variables
var totalNetworkSend = 0;       // Stores the total output in size of kb
var totalNetworkRecieve = 0;    // Stores the total input in size of kb
var hitCounter = 0;             // Stores how many times the server has been hit
var totalRequestTime = 0;           // Stores the total amount of time it has taken for the server to resolve the request

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
        data.grID = data.grID.toUpperCase();

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
        data.grID = data.grID.toUpperCase();
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
    
    if(recMinutes < 1)
        return resp(res, ERR, "Logged time too small. Must log atleast 1 minute (60000 milli)");

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

        if(oldValue + currHourMin > 60)
            return resp(res, ERR, "TIME KEEPING ISSUE, CURRENT HOUR USAGE EXCEEDS 60");

        snapshot.ref.set(oldValue + currHourMin);
        
        if(oldValue != 0 && lastHourMin != 0)
            return resp(res, ERR, "TIME KEEPING ISSUE, TIME SPENT THIS HOUR EXCEEDS ACTUAL TIME");

        if(lastHourMin == 0 && recMinutes == 0)
            return resp(res, SUC, "UPDATED TIME TABLES");

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
        return resp(res, SUC, "UPDATED TIME TABLES");
        });        
    });
    
}
// Includes start and end date
app.post("/view", (req, res) => {
    onReq(req, res, (data) => {
        if(!checkData(res, data, ["grID"]))
            return;
        
        data.grID = data.grID.toUpperCase();
        var newRef = ref.child(data.grID);

        if(!!data.id)
            newRef = newRef.child("/users/" + data.id);
        
        log(INFO, "Request data group ID: " + newRef);
        newRef.once("value", (snapshot) => {
            var obj = snapshot.val();
            log(INFO, obj);
            if(obj == null)
                return resp(res, ERR, "Group [" + data.grID + "]Doesn't Exist");
            
            if(!data.startDate && !data.endDate)
                return resp(res, SUC, obj);
            
            if(!!data.startDate ^ !!data.endDate)
                return resp(res, ERR, "Must of both or either startDate and endDate");

            var start = data.startDate.split("/");
            var end = data.endDate.split("/");
            var rtnObj = {};
            var firstMonth = {};

            for(var day = start[1]; day <= ((start[0] == end[0])? end[1] : 31); day++)
            {
                if(!obj[start[0]] || !obj[start[0]][day])
                    continue;
                firstMonth[day] = obj[start[0]][day];
            }
            rtnObj[start[0]] = firstMonth;
            for(var month = start[0] + 1; month < end[0]; month ++)
            {
                if(!obj[month])
                    continue;
                rtnObj[month] = obj[month];
            }
            if(start[1] != end[1])
            {
                var lastMonth = {};
                for(var day = 1; day <= end[1]; day ++)
                {
                    if(!obj[end[0]] || !obj[end[0]][end[1]])
                        continue;
                    lastMonth[day] = obj[end[0]][end[1]];
                }
            }
            
            //Count the total time
            var months = Object.keys(rtnObj);
            var total = 0;
            for(var x = 0; x < months.length; x++)
            {
                var currMonth = rtnObj[months[x]];
                var days = Object.keys(currMonth);

                for(var y = 0; y < days.length; y++)
                {
                    var currDay = currMonth[days[y]];
                    var hours = Object.keys(currDay);
                    for(var z = 0; z < hours.length; z++)
                    {
                        total += currDay[hours[z]];
                    }
                }
            }
            rtnObj.total = recurAdd(rtnObj, 2);
            resp(res, SUC, rtnObj);

        });
    });
});

function recurAdd(obj, level)
{
    var keys = Object.keys(obj);
    var total = 0;

    if(level == 0)
        for(var x = 0; x < keys.length; x++)
            total += obj[keys[x]];
    else 
        for(var x = 0; x < keys.length; x++)
            total += recurAdd(obj[keys[x]], level-1);
    
    return total;
}

app.post("/debuginfo", (req, res) => {
    res.json({
        totalNetworkSend: totalNetworkSend,
        totalNetworkRecieve: totalNetworkRecieve,
        hitCounter: hitCounter,
        totalRequestTime: totalRequestTime,
        avgRequestTime: totalRequestTime / hitCounter
    })
});

// Create web server
http.createServer(app).listen(80, function(){
    log(INFO, "The server has been opened on port 80 \r\n");
});

// Network Functions
function onReq(req, res, callBack)
{
    res.startTime = new Date();     // Log start time of the request
    hitCounter++;                   // Log request count

    try{
        var body="";
        req.on("data",function(data){
            body+=data;
            //Check to see if someone is trying to crash the server
            if(body.length >1e6)
                request.connection.destroy();
        });

        req.on("end", () => {          
            var data = JSON.parse(body);
            totalNetworkRecieve += sizeOf(data);
            callBack(data);
        });
    } catch(err) {
        log(ERROR, err);
    }
}

var ERR = "ERROR";
var SUC = "SUCCESS";

function resp(res, type, body)
{
    var rtnObj = {
        type: type,
        body: body
    };
    res.json(rtnObj);

    totalRequestTime += new Date().getTime() - res.startTime.getTime();

    var rtnObj_size = sizeOf(rtnObj);
    totalNetworkSend += rtnObj_size;
    log((type == ERR)? WARN: INFO, ((typeof(body) == "object")? JSON.stringify(body) : body) + " [Size: " + rtnObj_size + "]");
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