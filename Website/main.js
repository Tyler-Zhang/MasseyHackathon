function postRequest(data){
			var request = new XMLHttpRequest();
            request.open("POST","/room.html",true);
            request.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
            request.send(JSON.stringify(data));
            console.log("Request made with data: " + JSON.stringify(data));
			request.onreadystatechange = function(){
				if(request.readyState ==4){
					updateClient(JSON.parse(request.responseText));

				}
			}
		}
