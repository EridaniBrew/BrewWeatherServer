WScript.Echo("Starting");
var BW = new ActiveXObject("WebWD.Weather");
try {
    BW.Connected = true;
} catch (ex) {
    WScript.Echo("Connected error " + ex.message);
}

try {
    var mytemp = BW.AmbientTemperature;
    WScript.Echo("Temperature = " + mytemp);
} catch (ex) {
    WScript.Echo("Temperature error " + ex.message);
}