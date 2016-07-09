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


function makeChart(){
	
	var arr = document.URL.match(/grID=(.*)/);
	var room = arr[1];
	console.log("Making request with " + room);
	
	postRequest("/view", {grID: room}, (obj) => {
		console.log(obj);
	});
}