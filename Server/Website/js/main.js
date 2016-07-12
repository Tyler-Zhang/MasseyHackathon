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

var colors = ["255, 99, 132", "75, 198, 172", "173, 120, 195", "237, 208, 64", "223, 130, 18"];
function makeCharts(data)
{
	var ctx = document.getElementById("myChart");
	var hourLabels = ["12:00"];
	var datasets = [];
	var obj = data.body;
	
	for(var x = 1; x <= 24; x ++)
		hourLabels.push(x + ":00");
	
	var date = new Date();

	for(var x = 0; x < obj.userAmt; x++)
	{
		var usrObj = obj.users[x][date.getMonth()][date.getDate()];
		if(usrObj == undefined)
		{
			datasets.push(datasetObj(obj.users[x].name, null, colors[x]));
			continue;
		}
		var data = [];
		var total = 0;
		for(var y = 0; y < date.getHours() + 1; y ++)
		{
			total += ((usrObj[y] == null)? 0 : usrObj[y]);
			data.push(total);
		}
		datasets.push(datasetObj(obj.users[x].name, data, colors[x]));
	}

	function datasetObj(name, data, color)
	{
		var x = {};
		x.label = name;
		x.data = [0].concat(data);
		x.backgroundColor = 'rgba(' + color + ',0.2)';
		x.borderColor = 'rgba(' + color + ',1)';
		x.borderWidth = 1;
		x.lineTension = 0.3;
		return x;
	}
		var mChart = new Chart(ctx, {
			type: 'line',
			data: {
				labels: hourLabels,
				datasets: datasets		
			},
			options: {
				title: {
					display: true,
					fontSize: 25,
					padding: 20,
					text: "Acumulated Cellphone Usage for the Day by Minutes"
				},
				legend: {
					position: "bottom",
					labels: {
						boxWidth:12,
						fontSize:13,
						padding: 30
					}
				}				
			}
		});
}