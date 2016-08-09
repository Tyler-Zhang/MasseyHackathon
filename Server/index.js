var http =      require("http");            // Launching the HTML server
var express =   require("express");         // Handling get/post requests
var path =      require("path");            // Joing paths
var sizeOf =    require("object-sizeof");   // Checking object of a javascript object
var fs =        require("fs");              // Reading and writing files
var mongoCli =  require("mongodb")          // Connecting to the mongo Database
.MongoClient;

require("datejs");                          // Extension to Date() for better date handling

// Usage Variables
var totalNetworkSend = 0;       // Stores the total output in size of kb
var totalNetworkRecieve = 0;    // Stores the total input in size of kb
var hitCounter = 0;             // Stores how many times the server has been hit
var totalRequestTime = 0;           // Stores the total amount of time it has taken for the server to resolve the request
var debugMode = true;

// Database declaration and functions
var db, groupsColl, timesColl, logsColl;


mongoCli.connect("mongodb://localhost:27017/ScreenOff", (err, d) => {
    if(err)
    {
        log(ERROR, err);
        throw "Database didn't connect correctly";
    } else {
        log(INFO, "Connected to the mongo database on port 27017")
        db = d;
        groupsColl  = d.collection("groups");
        timesColl   = d.collection("times");
        //logsColl    = d.collection("logs");
    }
});
// Web paths
var app = express();
app.use(express.static(path.join(__dirname, "Website")));
app.get("/:page", function(req, res){
   res.sendFile(path.join(__dirname, "Website", req.params.page + ".html")); 
});

addPostListener("createroom", (res, data) => {
    var code = genChars(5);
    groupsColl.insertOne({grID:code, userAmt: 0, users:[]}).then( 
        x => resp(res, SUC, {grID:code}),                               // Resolved
        x => resp(res, ERR, "Couldn't updated database", true));        // Rejected
});

addPostListener("joinroom", (res, data) => {
    if(!checkData(res, data, ["grID", "name"]))
        return;
    data.grID = data.grID.toUpperCase();

    if(data.grID.match(/^\w{5}$/) == null)                  // Make sure that they sent id of group they want to join
        return resp(res, ERR, "INVALID grID");
    
    groupsColl.findOne({grID: data.grID}, {userAmt:1})
    .then(d => {
        if(!d)
            throw {message:"Object with grID [" + data.grID + "] not found"};
        return timesColl.insertOne({times:[]}).then(x => {
            d.tId = x.insertedId;
            return d;
        });
    })
    .then(d => {
        var setObj = {
            name: data.name,
            times: d.tId
        };
        return groupsColl.updateOne({_id:d._id}, {$push:{users: setObj}}, {upsert:true}).then(() => {return d});
    })
    .then(d => {
        return groupsColl.updateOne({_id: d._id}, {$set: {userAmt: d.userAmt + 1}}).then(() => {return d.userAmt});
    })
    .then(d => {
        resp(res, SUC, {id: d});
    })
    .catch(e => {
         resp(res, ERR, e.message);
    });
});

addPostListener("report", (res, data) => {
    if(!checkData(res, data, ["grID", "id", "milli"]))
        return;
    data.grID = data.grID.toUpperCase();
    var date = data.date || new Date().getTime();
    var length = Math.floor(data.milli/ 1000);

    var id = Number(data.id);
    if(id == NaN)
        return resp(res, ERR, "ID must be a number");

    groupsColl.findOne({grID: data.grID}, {users: {$slice: [id, 1]}})
    .then(d => {
        if(!d.users[0])
            throw {message:"Object with grID [" + data.grID + "] not found"};
        return d.users[0].times;
    })
    .then(d => {
        return timesColl.updateOne({_id: d}, {$push:{times:{t: date, l: length}}});
    })
    .then(() => {
        resp(res, SUC, "Time uploaded");
    })
    .catch(e => {
        resp(res, ERR, e.message);
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
    addPostListener(req, res, (data) => {
        if(!checkData(res, data, ["grID"]))
            return;
        
        data.grID = data.grID.toUpperCase();
        var newRef = ref.child(data.grID);

        if(!!data.id)
            newRef = newRef.child("/users/" + data.id);
        
        log(INFO, "Request data group ID: " + newRef);
        newRef.once("value", (snapshot) => {
            var obj = snapshot.val();
            if(obj == null)
                return resp(res, ERR, "Group [" + data.grID + "]Doesn't Exist");
            
            if(!data.startDate && !data.endDate)
            {
                obj.total = recurAdd(obj, 4);
                return resp(res, SUC, obj);
            }
            if(!!data.startDate ^ !!data.endDate)
                return resp(res, ERR, "Must of both or either startDate and endDate");

            var start = data.startDate.split("/");
            var end = data.endDate.split("/");

            if(start.length != 2 || end.length != 2)
                return resp(res, ERR, "Dates are formmated incorrectly. Should be Month/Day");

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
            rtnObj.total = recurAdd(rtnObj, 2);
            resp(res, SUC, rtnObj);
        });
    });
});

function recurAdd(obj, level)
{
    if(typeof(obj) != "object")
        return 0;
    var keys = Object.keys(obj);
    if(keys.length == 0)
        return 0;
        
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
    log(INFO, "The server has been opened on port 80");
});

// Network Functions
function addPostListener(URL, callBack)
{
    app.post("/" + URL, (req, res) => {
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
                callBack(res, data);
            });
        } catch(err) {
            log(ERROR, err);
        }
    });
}

var ERR = "ERROR";
var SUC = "SUCCESS";

function resp(res, type, body, er)
{
    var rtnObj = {
        type: type,
        body: body
    };
    var requestTime = new Date().getTime() - res.startTime.getTime();
    if(debugMode)
        rtnObj.responseTime = requestTime;
    res.json(rtnObj);
    totalRequestTime += requestTime;
    var rtnObj_size = sizeOf(rtnObj);
    totalNetworkSend += rtnObj_size;
    console.log(JSON.stringify(body));
    log((er)? ERROR : (type == ERR)? WARN: INFO, ((typeof(body) == "object")? JSON.stringify(body) : body) + 
    " [Size: " + rtnObj_size + "]" + "[RequestTime:"+ requestTime +"ms]");
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