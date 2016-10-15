var urlDefinition ={
    "/createroom":{
        desc: "For creating a new room",
        attr: {
            
        }    
    },
    "/joinroom":{
        desc: "Joining a premade room",
        attr: {
            names: ["grID", "name"],
            req: [true, true]
        }    
    },
    "/report":{
        desc: "Logging screen on time",
        attr: {
            names: ["grID", "id", "milli", "time"],
            req: [true, true, true, false]
        }    
    },
    "/view":{
        desc: "Getting screen on data",
        attr: {
            names: ["grID", "id", "minTime", "maxTime"],
            req: [true, false, false, false]
        }    
    },
    "/debuginfo":{
        desc: "Recieving statistics about the server",
        attr: {

        }
    }
}

var attrDefinition = {
    type :{
        desc: "Type of user's device",
        opt: "Android | Computer"
    },
    name :{
        desc: "User's name, must be present if doing /createroom and type is <em>Android</em>",
        opt: 'Any String'
    },
    grID :{
        desc: "Group's identification code",
        opt: '5 character alphanumeric'
    },
    id :{
        desc: "Person's index for user array on firebase",
        opt: 'Positive Interger Number'
    },
    milli :{
        desc: "Screen on time in milliseconds",
        opt: "Positive Interger Number"
    },
    time :{
        desc: "Time when the screen-on session ended, used for reporting offline tracks",
        opt: "UTC time in milliseconds"
    },
    minTime :{
        desc: "The beginning, <em> inclusive </em>, time of data to be returned",
        opt: "Date in milliseconds new Date().getTime()"
    },
    maxTime :{
        desc: "The ending, <em> inclusive </em>, time of data to be returned",
        opt: "Date in milliseconds new Date().getTime()"
    }
}