function postRequest(data){
	var request = new XMLHttpRequest();
	request.open("POST","/createroom",true);
	request.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
	request.send(JSON.stringify({type : "computer"}));
	console.log("Request made with data: " + JSON.stringify(data));
	request.onreadystatechange = function(){
		if(request.readyState ==4){
			var obj = JSON.parse(request.responseText);
			if(obj.status == "success")
				updateClient(obj);
			else
				displayError(obj);
			
		}
	}
}

function displayError(obj){
	
}
function updateClient(obj){
	window.location = "localhost:7777/?rmid=" + obj.rmid;
}