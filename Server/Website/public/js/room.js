// Data is the data from the server per user, fidelity is the x-variable stepping rate by minutes
"use strict"


var colors = ["255, 99, 132", "75, 198, 172", "173, 120, 195", "237, 208, 64", "223, 130, 18"];

function makeCharts(data) {
    setInner("status", "Calculating charts");
    var ctx = document.getElementById("acumDayChart").getContext("2d");
    var ctx2 = document.getElementById("totalDayChart").getContext("2d");

    var hourLabels = ["12:00 am"];
    var nameLabels = [];
    var max = 0;
    var accumDataset = [], totalDayDataset = [];
    data = data.body;

    for (var x = 1; x <= 23; x++)
    {
        for(let y = 0; y < fidelity - 1; y ++)  // Add blank spaces
          hourLabels.push("");
        hourLabels.push(((x > 12) ? x % 12 : x) + ":00 " + ((x > 12) ? "pm" : "am"));
    }
    for(let y = 0; y < fidelity - 1; y ++)      // Add blank spaces
      hourLabels.push("");
    hourLabels.push("12:00 pm");


    for (var x = 0; x < data.length; x++) {

        let total = 0;
        let displayArr = new Array(data[x].length);
        displayArr[0] = 0;

        for(let y = 1; y < data[x].times.length; y ++)
        {
            displayArr[y] = Math.round((total +data[x].times[y])/6000) / 10;
            total += data[x].times[y];                   // Keeps running total for max scale
            
        }
        total = Math.round(total/6000) /10;

        max = Math.max(max, total);
        max = Math.ceil(max/ 100) * 100;
        accumDataset.push(new datasetObj(data[x].name, displayArr, colors[x], "line"));
        nameLabels.push(data[x].name);
        totalDayDataset.push(new datasetObj(data[x].name, genArray(x, data.length, total), colors[x], "bar"));

    }
    function genArray(idx, total, val)
    {
      var rtnArr = new Array(total);
      rtnArr[idx] = val;
      return rtnArr;
    }

    // Draw date accumulated chart

    function datasetObj(name, data, color, type) {
        this.label = name;
        this.data = data;
        this.backgroundColor = 'rgba(' + color + ',0.2)';
        this.borderColor = 'rgba(' + color + ',1)';
        this.borderWidth = 1;
        if (type == "line")
            this.lineTension = 0.3;
    }

    var mChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: hourLabels,
            datasets: accumDataset
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
                    boxWidth: 12,
                    fontSize: 13,
                    padding: 30
                }
            },
            scales: {
                yAxes: [{
                    ticks: {
                        min: 0,
                        max: Math.max(max, 100)
                    }
                }]
            }
        }
    });
    // This is such a hack, but Chart.js is broken. It keeps resizing the canvas.
    ctx2.canvas.height = ctx.canvas.height / 1.3;
    var tChart = new Chart(ctx2, {
        type: 'bar',
        data: {
            labels: nameLabels,
            datasets: totalDayDataset
        },
        options: {
            title: {
                display: true,
                fontSize: 25,
                padding: 20,
                text: "Total Usage by Day"
            },
            legend: {
                display: false
            },
            scales: {
                xAxes: [{
                    stacked: true,
                }],
                yAxes: [{
                    stacked: true,
                    ticks: {
                        min: 0,
                        max: Math.max(max, 100)
                    }
                }]
            }
        }
    });
}
