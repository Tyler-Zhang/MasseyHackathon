function postRequest(url, data, callback){
	var request = new XMLHttpRequest();
	request.open("POST", url, true);
	request.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
	request.send(JSON.stringify(data));
	request.onreadystatechange = function(){
		if(request.readyState ==4){
			var obj = JSON.parse(request.responseText);
			callback(obj);
		}
	}
}

function displayError(msg){
	console.log("Error: " + msg);
	alert("ERROR: " + msg);
}