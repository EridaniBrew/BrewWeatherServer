
"use strict";             // like option explicit

var ERR_SOURCE = "WebWD.Weather ";
var PRP = "Property ";				// Common bits for error messages
var NTI = " is not implemented";
    //
    // Polling interval, do not read file more often than this
    //
var POLL_INT = 15;              // seconds for poll

    //
    // Manifest constants from Clarity II
    //
var cloudUnknown = 0;
var cloudClear = 1;
var cloudCloudy = 2;
var cloudVeryCloudy = 3;

var windUnknown = 0;
var windCalm = 1;
var windWindy = 2;
var windVeryWindy = 3;

var rainUnknown = 0;
var rainDry = 1;
var rainWet = 2;      //sensor has water on it
var rainRain = 3;     //falling rain drops detected

    //
    // State variables
    //
var c_sWDDataFilePath;                                          // Full path/name of WD data file
var c_bBoltwoodII;                     // indicates bOLTWOOD ii FORMAT (ass opposed to boltwood I)
var c_bConnected;
var c_dtLastPollTime;
var c_dtLastLogTime;                   // not used
var c_iSecondsSinceData;               // not used
var c_fAmbientTemp;
var c_fInsideTemp;
var c_fBarometricPressure;
var c_fWindSpeed;
var c_fWindDirection;
var c_fHumidity;
var c_fDewPoint;
var c_iCloudCond;              // constant from above?
var c_iWindCond;               // wind constant from above
var c_iRainCond;
var c_bLastSafe;               // Last safe state - true = safe false = unsafe

    //
    // Code outside of any function or function is executed when this object is created.
    //
c_sWDDataFilePath = "C:\Users\robert\Dropbox\BrewSky\Programs\BrewWeatherServer\WebWD\WebWDGui\daily.txt";
c_bConnected = false;
var nowTime = new Date();
c_dtLastPollTime = nowTime.getSeconds - POLL_INT;         // Force initial poll

    //------------------------------------------------------------------------------
    // Method SetupDialog()
    //
    // Parameters:   (none)
    // Returns:      (nothing)
    //
    // Invokes the weather access setup dialog. I put in a file selection dialog,
    // courtesy of ACP//s Util object which you have use of automatically here.
    //------------------------------------------------------------------------------
function SetupDialog(){

    c_sWDDataFilePath = Util.Profile.GetValue("WeatherDisplayData", "\WXWDDataFile", "");  // Try for previous selection
    if (c_sWDDataFilePath == "") {
        FileDialog.InitialDirectory = "C:\Program Files (x86)\wdisplay\webfiles";
} else {
        FileDialog.InitialDirectory = FSO.GetParentFolderName(c_sWDDataFilePath);
}

    FileDialog.DialogTitle = "Select Weather Display Data file";
    FileDialog.Filter = "Txt files (*.txt)|*.txt|All files (*.*)|*.*";
    FileDialog.Flags = 4096;                                 // Guarantee file exists
    if (FileDialog.ShowOpen()) {
        c_sWDDataFilePath = FileDialog.FileName;
        Util.Profile.WriteValue ("WeatherDisplayData", c_sWDDataFilePath, "\WXWDDataFile");
}
        
}

    //------------------------------------------------------------------------------
    // Property Connected (R/W, REQUIRED)
    //
    // true means weather sensor is connected and operating (Boolean). 
    // Set true to connect.
    //------------------------------------------------------------------------------
function get_Connected(){
    // Return true if connected, else false
    return c_bConnected;
}

    function put_Connected(newValue){
        // Code to establish or terminate the connection
        if (newValue) {                                        // Connecting
            //c_sWDDataFilePath = Util.Profile.GetValue("WeatherDisplayData", "\WXWDDataFile", "");
            //if (c_sWDDataFilePath == "") {
            //    throw ERR_SOURCE + " Cannot connect - WeatherDisplay Data file has not been selected";
            //}
            PollIf;                                               // Get initial data for check and model
            c_bConnected = true;
        } else {
            c_bConnected = false;
        }
    }

//------------------------------------------------------------------------------
// Property AmbientTemperature (R/O, OPTIONAL)
//
// The ambient (outside) air temperature (Single, deg.C)
//------------------------------------------------------------------------------
function get_AmbientTemperature(){
    PollIf;
    return c_fAmbientTemp;
}

//------------------------------------------------------------------------------
// Property BarometricPressure (R/O, OPTIONAL)
//
// The barometric pressure (Single, millibars)
// NOTE: This must be in millibars, per international aviation weather reporting
//       standards.
//------------------------------------------------------------------------------
function get_BarometricPressure(){
    //throw ERR_SOURCE + PRP + "Get BarometricPressure" + NTI;
    PollIf;
    return c_fBarometricPressure;
}

//------------------------------------------------------------------------------
// Property Clouds (R/O, OPTIONAL)
//
// Cloud coverage (Single, fractional 0-1)
//------------------------------------------------------------------------------
function get_Clouds(){
    var cloudFrac = 0;
    PollIf;
    switch (c_iCloudCond) {
        case cloudUnknown:
            throw ERR_SOURCE + "No cloud data currently available";
            break;
        case cloudClear:
            cloudFrac = 0.0;
            break;
        case cloudCloudy:
            cloudFrac = 0.5;
            break;
        case cloudVeryCloudy:
            cloudFrac = 1.0;
            break;
        default:
            throw ERR_SOURCE + "Unknown cloud value from web";
    };
    return cloudFrac;
}

//------------------------------------------------------------------------------
// Property DewPoint (R/O, OPTIONAL)
//
// The dew point temperature (Single, deg C)
//------------------------------------------------------------------------------
function get_DewPoint(){
    PollIf;
    return c_fDewPoint;
}

//------------------------------------------------------------------------------
// Property InsideTemperature (R/O, OPTIONAL)
//
// The temperature inside the observatory (Single, deg C)
//------------------------------------------------------------------------------
function get_InsideTemperature(){
    //throw ERR_SOURCE + PRP + "Get InsideTemperature" + NTI;
    PollIf;
    return c_fInsideTemp;
}

//------------------------------------------------------------------------------
// Property Name (R/O, OPTIONAL)
//
// The display name of the weather system (String)
//------------------------------------------------------------------------------
function get_Name(){
    PollIf;
    return "WebWD.Weather";
}

//------------------------------------------------------------------------------
// Property Precipitation (R/O, OPTIONAL)
//
// True if precipitation is present (Boolean)
//------------------------------------------------------------------------------
function get_Precipitation(){
    PollIf;
    return (c_iRainCond == rainRain);
}

//------------------------------------------------------------------------------
// Property RelativeHumidity (R/O, OPTIONAL)
//
// The relative humidity (Single, fractional 0-1)
//------------------------------------------------------------------------------
function get_RelativeHumidity(){
    PollIf;
    return c_fHumidity;
}

//------------------------------------------------------------------------------
// Property Safe (R/O, REQUIRED)
//
// Return true when weather is safe, false when not. Returning false will
// stop any ACP script in progress and cause alarm and shutdown processes
// to be initiated.
//------------------------------------------------------------------------------
function get_Safe(){
    // WARNING: TRAP ERRORS HERE! Raised error on Safe property will kill ACP!
    var mySafe;
    try {
        PollIf;
    } catch (ex) {
        //Util.Console.PrintLine "Weather Unsafe! Weather Display data-file acquisition error:";
        //Util.Console.PrintLine "  " + Err.Description;
        get_Safe = false;
        return;
    }
    
    mySafe = (c_iRainCond != rainUnknown) && 
    (c_iRainCond != rainRain) && 
    (c_iWindCond >= 0) && 
    (c_iWindCond != windVeryWindy) && 
    (c_iSecondsSinceData < 30);
    /********
            if (!get_Safe && c_bLastSafe) {                // if this is a change from safe to unsafe
                Util.Console.PrintLine("Weather Display: Weather is unsafe!");
                if(c_iRainCond == rainUnknown) {
                    Util.Console.PrintLine("               Rain sensor is not ready or broken");
                } else if(c_iRainCond == rainRain) {
                            Util.Console.PrintLine("               Rain condition is Rainy");
                } else if (c_iWindCond < 0) {
                            Util.Console.PrintLine("               Wind sensor is not ready or broken");
                } else if(c_iWindCond == windVeryWindy) {
                            Util.Console.PrintLine("               WindCondition is Very Windy");
                } else if (c_iSecondsSinceData >= 60) {
                            Util.Console.PrintLine("               No data from WeatherDisplay for " & CStr(c_iSecondsSinceData) & " sec.");
                }
            }
            ***********/
    
    c_bLastSafe = mySafe;
    return mySafe;
}

//------------------------------------------------------------------------------
// Property WindDirection (R/O, OPTIONAL)
//
// The azimuth FROM which the wind is blowing (Single, deg. magnetic)
// NOTE: This must be in degrees MAGNETIC, per international aviation weather 
//       reporting standards.
//------------------------------------------------------------------------------
function get_WindDirection(){
    //throw ERR_SOURCE + PRP + "Get WindDirection" + NTI;
    PollIf();
    return c_fWindDirection;
}

//------------------------------------------------------------------------------
// Property WindVelocity (R/O, OPTIONAL)
//
// The wind velocity (Single, knots)
//------------------------------------------------------------------------------
function get_WindVelocity(){
    PollIf;
    return c_fWindSpeed;
}

// ===============
// Local functions
// ===============


//------------------------------------------------------------------------------
// function PollIf()
//
// if the poll time has expired, attempt to read the one line from the WeatherDisplay 
// data file. if it is locked, wait 500ms and try again. Try 10 times { fail. 
// if succeeded, update the "last poll time". Then parse the file 
// ---------------------------------------------------------------------------------------------------
//
// Raises error if something isn//t right
//------------------------------------------------------------------------------
function PollIf(){
    var S, i, buf, bits, mph, faren, RX;
    var nowTime = new Date();
    
    if ((nowTime - c_dtLastPollTime) < POLL_INT) {     // Too soon, use previous data
        return;
    }
    
    if (! FSO.FileExists(c_sWDDataFilePath)) {              // Catch vaporized WD file
        throw ERR_SOURCE + "PollIf: The WeatherDisplay data file doesn//t exist!";
    }
    
    for (i = 0; i++; i <10) {                             // Try twice a sec. for 5 sec.
        try {
            S = FSO.OpenTextFile(c_sWDDataFilePath, 1);
            break;
        } catch(ex) {
            HardSleep(500);
        }
    }
        
    if (i >= 10) { 
        throw ERR_SOURCE + "PollIf: Failed to open WeatherDisplay data file";
    }
    //
    // OK We have the file open. Read the data line
    //
    buf = S.ReadLine;
    S.Close;                                               // And close it right away
    c_dtLastPollTime = nowTime;                                  // Update last poll time
    
    //
    // Interpret log file. Detect old/new format
    //
    buf = buf.replace(/ +/, " ");                          // Compress runs of whitgespace
    bits = Split(buf, " ");                                  // Now just split on space
    if (bits.length > 1) {                               // good format
        faren = true;                                        // (UCase(bits(2)) = "F")
        mph = true;                                          //(UCase(bits(3)) = "M")
        c_fAmbientTemp = 65.0;                               //CSng(bits(5))
        //if faren {                                       // Convert F to C if needed
        //    c_fAmbientTemp = (c_fAmbientTemp - 32) * 5 / 9;
        //}
        c_fWindSpeed = 12.0;                                 //CSng(bits(7))
        //if mph {
        //    c_fWindSpeed = 0.8688 * c_fWindSpeed;            // Convert miles/hr to knots
        //else
        //    c_fWindSpeed = 0.5400 * c_fWindSpeed;            // Convert km/hr to knots
        //}
        c_fHumidity = 0.12;                // CSng(bits(8)) / 100                   // Humidity, frac (0-1)
        c_fDewPoint = 25.0;            //CSng(bits(9))                         // Dew point temp
        //if faren {                                       // Convert F to C if needed
        //    c_fDewPoint = (c_fDewPoint - 32) * 5 / 9;
        //}
        //c_iSecondsSinceData = CInt(bits(13));
        //c_dtLastLogTime = new Date(bits(14));
        c_iCloudCond = cloudClear;       //CInt(bits(15))
        c_iWindCond = windCalm ;       //CInt(bits(16))
        c_iRainCond = rainDry;        //CInt(bits(17))
    } else  {                                                  // Some sort of bogus data line
        throw ERR_SOURCE + "PoolIf: WeatherDisplay data file does not contain valid data";
    }
    
    //if ((Now - c_dtLastLogTime) > #00:00:30#) Or (c_iSecondsSinceData > 30) {
    //    throw ERR_SOURCE + "PoolIf: Weather Display is not sending data for at least 30 seconds"
    //}
    
}

// function to emulate sleep().
// Yes, it is a bad way, will peg CPU
// pass in delay in msec
function HardSleep(delay){
    var start = new Date().getTime();
    while (new Date().getTime() < start + delay);
}


