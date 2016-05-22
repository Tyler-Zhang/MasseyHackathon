var grID;
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

function displayError(obj){
	
}
function updateClient(obj){
	//window.location = "localhost:7777/room?grID=" + obj.grid;
	document.getElementById("code").innerHTML = obj.grID;
	grID= obj.grID;
}

function viewRoom(grID){
	window.location = "room.html?grID=" + grID;
}

function sendCode(){
	var code = document.getElementById("roomCode").value;
	console.log(code);
	window.location = "/room.html?grID="+code;
	return false;
	/*var request = new XMLHttpRequest();
	request.open("POST","/room",true);
	request.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
	request.send(code);*/
}

function makeChart(){
	
	var arr = document.URL.match(/grID=(.*)/);
	var room = arr[1];
	console.log("Making request with " + room);
	
	var request = new XMLHttpRequest();
	request.open("POST","/view",true);
	request.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
	request.send(JSON.stringify({grID: room}));
	request.onreadystatechange = function(){
		if(request.readyState ==4){
			var obj = JSON.parse(request.responseText);
			
			console.log(obj);
			
		}
	}
}