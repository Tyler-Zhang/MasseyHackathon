function postRequest(){
	var request = new XMLHttpRequest();
	request.open("POST","/createroom",true);
	request.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
	request.send(JSON.stringify({type : "computer"}));
	request.onreadystatechange = function(){
		if(request.readyState ==4){
			var obj = JSON.parse(request.responseText);
			console.log(obj);
			if(obj.status === "success")
				updateClient(obj);
			else if(obj.status === "error")
				displayError(obj);
			else
				console.log("Null message");
			
		}
	}
}

// Initialize Firebase
  var config = {
    apiKey: "AIzaSyB5tf2H_7BFyLNH1pa4gefH6d8Jo6zoInQ",
    authDomain: "project-3886157552181854094.firebaseapp.com",
    databaseURL: "https://project-3886157552181854094.firebaseio.com",
    storageBucket: "project-3886157552181854094.appspot.com",
  };
  firebase.initializeApp(config);
  
// Firebase functions
var usrData = {};

function getUserData(code){
	firebase.database().ref(code).on('value', function(snapshot) {
  		usrData = snapshot.val;
	});
}





function displayError(obj){
	
}
function updateClient(obj){
	//window.location = "localhost:7777/room?rmID=" + obj.rmid;
	document.getElementById("code").innerHTML = obj.grID;
}


function sendCode(){
	var code = document.getElementById("roomCode");
	var request = new XMLHttpRequest();
	request.open("POST","/room",true);
	request.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
	request.send(code);
}