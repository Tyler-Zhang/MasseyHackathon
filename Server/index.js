var http =      require("http");            // Launching the HTML server
var express =   require("express");         // Handling get/post requests
var path =      require("path");            // Joing paths
var sizeOf =    require("object-sizeof");   // Checking object of a javascript object
var fs =        require("fs");              // Reading and writing files
var dot =       require("dot");             // Superfast HTML templating engine
var mongoCli =  require("mongodb")          // Connecting to the mongo Database
.MongoClient;
var log =       require("bunyan")           // Logging library
.createLogger({
    name: "ScreenOff",
    streams: [
        {level: "debug", stream: process.stdout},
        {level: "warn", path: "logs.log"}
    ]});
require("datejs");                          // Extension to Date() for better date handling

// Usage Variables
var totalNetworkSend = 0;       // Stores the total output in size of kb
var totalNetworkRecieve = 0;    // Stores the total input in size of kb
var hitCounter = 0;             // Stores how many times the server has been hit
var totalRequestTime = 0;       // Stores the total amount of time it has taken for the server to resolve the request
var debugMode = true;
var fidelity = 4;

// Database declaration and functions
var groupsColl, timesColl;

mongoCli.connect("mongodb://localhost:27017/ScreenOff", (err, d) => {
    if(err)
    {
        log.fatal(err);
        throw err;
    } else {
        log.info("Connected to the mongo database on port 27017")
        groupsColl  = d.collection("groups");
        timesColl   = d.collection("times");
    }
});
// Default express directory
var app = express();
app.use(express.static(path.join(__dirname, "Website", "public")));

// Load room template
var roomTemplate;

fs.readFile(path.join(__dirname, "Website", "room.html"), "utf8", (err, d) => {
    if(err)
    {
        log.fatal(err);
        throw err;
    }
    roomTemplate = dot.template(d);
});

// Apply template
function getRoom(req, res) {
    var data = {grID:req.query.grID, fidelity};
    res.end(roomTemplate(data));
}

app.get("/room", getRoom);
app.get("/room.html", getRoom);
app.get("/:page", function(req, res){
    res.sendFile(path.join(__dirname, "Website","public", req.params.page + ".html"));
});

addPostListener("createroom", (res, data) => {
    var code = genChars(5);
    groupsColl.insertOne({grID:code, userAmt: 0, users:[]}).then(
        () => resp(res, SUC, {grID:code}),                               // Resolved
        () => resp(res, ERR, "Couldn't update database", true));        // Rejected
});

addPostListener("joinroom", (res, data) => {
    if(!checkData(res, data, ["grID", "name"]))
        return;
    data.grID = data.grID.toUpperCase();
    if(data.grID.match(/^\w{5}$/) == null)                  // Make sure that they sent id of group they want to join
        return resp(res, ERR, "INVALID grID");

    groupsColl.findOne({grID: data.grID}, {userAmt:1})
    .then((d) => {
        if(!d)
            throw resp(res, ERR, "Object with grID [" + data.grID + "] not found");
        return timesColl.insertOne({times:[]}).then((x) => {
            d.tId = x.insertedId;
            return d;
        });
    })
    .then((d) => {
        var setObj = {name: data.name, times: d.tId};
        return groupsColl.updateOne({_id:d._id}, {$push:{users: setObj}}, {upsert:true}).then(() => d);
    })
    .then((d) =>  groupsColl.updateOne({_id: d._id}, {$set: {userAmt: d.userAmt + 1}}).then(() => d.userAmt))
    .then((d) =>  resp(res, SUC, {id: d}))
    .catch((e) => {if(e) res.log.error(e)});
});

addPostListener("report", (res, data) => {
    if(!checkData(res, data, ["grID", "id", "milli"]))
        return;
    data.grID = data.grID.toUpperCase();
    var date = data.time || new Date().getTime();
    var length = Math.floor(data.milli/1000);
    if(length  == 0)
        return resp(res, SUC, "Not logging any time less than 1 second");
    var id = Number(data.id);
    if(isNaN(id))
        return resp(res, ERR, "ID must be a number");

    groupsColl.findOne({grID: data.grID}, {users: {$slice: [id, 1]}})
    .then((d) => {
        if(!d.users[0])
            throw new Error("Object with grID [" + data.grID + "] not found");

        return timesColl.updateOne({_id: d.users[0].times}, {$push:{times:[date, length]}}).then((f) => {
            if(f.result.n == 0)
            {
                var err = new Error("!!DD!! No time entry for user grID [" + data.grID + " ] id [" + data.id + "]");
                res.log.error(err);
                throw err;
            }
        });
    })
    .then(() => resp(res, SUC, "Time uploaded"))
    .catch((e) => resp(res, ERR, e.message));
});

// Includes start and end date
addPostListener("view", (res, data) => {
    if(!checkData(res, data, ["grID"]))
        return;
    data.grID = data.grID.toUpperCase();
    var personQuery = {$match: {}};
    if(data.id)
        personQuery = {$match: {id: Number(data.id)}}

    var conditions = {$and: []};
    if(data.minTime && !isNaN(Number(data.minTime)))
    {
        data.minTime = Number(data.minTime);
        conditions.$and.push({$or:[{$gte:[{$arrayElemAt: ["$$idx", 0]}, data.minTime]}, {$gte: [{$sum: "$$idx"}, data.minTime]}]});
    }
    if(data.maxTime && !isNaN(Number(data.maxTime)))
    {
        data.maxTime = Number(data.maxTime);
        conditions.$and.push({$lte: [{$arrayElemAt: ["$$idx", 0]}, data.maxTime]});
    }
    groupsColl.aggregate([
        {$match: {grID: data.grID}},
        {$unwind: {path: "$users", preserveNullAndEmptyArrays: true}},
        personQuery,
        {$lookup: {from: "times", localField: "users.times", foreignField: "_id", as: "screenTime"}},
        {$project: {_id: 0, name: "$users.name", times: {$arrayElemAt: ["$screenTime", 0]}}},
        {$project: {name: 1, times: {$filter: {
            input: "$times.times",
            as: "idx",
            cond: conditions}}}}
    ], (e, r) => {
        if(e)
        {
            res.log.error(e);
            return resp(res, SUC, e.message);
        }
        if(r.length == 0)
            return resp(res, ERR, "Couldn't find group with that ID");

        if(!r[0].name)
            return resp(res, ERR, "No one has joined your goup yet.");
        for(var x = 0; x < r.length; x++)
        {
            r[x] = {
                    name: r[x].name,
                    times: formatData(r[x].times, 1)}
        }

        resp(res, SUC, r);
    });
});

function formatData(data, start = getStartDayMilli()) 
{
    if (!data)
        return null;
    var rtnArr = new Array(24 * fidelity).fill(0); // 24 base hours * the amount of sampling points between hours
    data.sort((a,b) => (a[0] < b[0])? -1 : (a[0] === b[0])? 0: 1); // Just to make sure it is sorted

    var dataCounter = 0;                  // Keeps track of which array of data we are on
    var timeRange = 60*60*1000/fidelity;  // The range of time per space of sampling

    mainloop:
    for(var x = 0; x < rtnArr.length; x ++)
    {
        let rangeStart = start + timeRange * x;
        let rangeEnd = rangeStart + timeRange;
        let total = 0;

        while(data[dataCounter] && data[dataCounter][0] + data[dataCounter][1] > rangeStart && data[dataCounter][0] < rangeEnd) // end after start and start before end => overlap
        {
            let [st, len] = data[dataCounter];
            if(st + len <= rangeEnd)
            {
            total += st + len - Math.max(rangeStart, st);
            dataCounter++;
            continue;
            } else {
                data[dataCounter][0] = rangeEnd;
                data[dataCounter][1] -= rangeEnd - st;
                rtnArr[x] =  rangeEnd - Math.max(st, rangeStart);
                continue mainloop;
            }
        }
        rtnArr[x] = total;
    }
    rtnArr = [0].concat(rtnArr);
    return rtnArr;
}

// Create web server
http.createServer(app).listen(80, function(){
    log.info("The server has been opened on port 80");
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
                    req.connection.destroy();
            });

            req.on("end", () => {
                var data = JSON.parse(body);
                totalNetworkRecieve += sizeOf(data);
                res.log = log.child({url: URL, data:data});
                callBack(res, data);
            });
        } catch(err) {
            log.error(err);
        }
    });
}

var ERR = "ERROR";
var SUC = "SUCCESS";
function resp(res, type, body)
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
    var rtnObjSize = sizeOf(rtnObj);
    totalNetworkSend += rtnObjSize;

    res.log.trace({type: type, body: body, time: requestTime, size: rtnObjSize});
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
