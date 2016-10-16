/*
 * This is a JavaScript Scratchpad.
 *
 * Enter some JavaScript, then Right Click or choose from the Execute Menu:
 * 1. Run to evaluate the selected text (Ctrl+R),
 * 2. Inspect to bring up an Object Inspector on the result (Ctrl+I), or,
 * 3. Display to insert the result in a comment after the selection. (Ctrl+L)
 */
function getStartDayMilli() {
    var d = new Date();
    return d.getTime() - d.getUTCHours() * 60 * 60000 - d.getUTCMinutes() * 60000 - d.getUTCSeconds() * 1000 - d.getUTCMilliseconds();
}

var currStartTime = getStartDayMilli();
var nextAdd = 0;
for(var x = getStartDayMilli(); x <= getStartDayMilli() + 24*60*60*1000; x += nextAdd)
  {
    nextAdd = Math.random()*1200000 + 120000;
    obj.time = x;
    obj.milli = nextAdd * Math.random();
    console.log(x);
    if(Math.random() > 0.80)
     post();
  }


