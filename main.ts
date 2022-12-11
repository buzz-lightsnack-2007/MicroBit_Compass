//  compass system information
let compass_info = {
    "version" : 2022.1211,
}

//  compass data and settings
let compass_data = {
    "configuration" : {
        "modes" : {
            "previous" : "",
            "current" : "measurement",
            "measurement" : "number",
        }
        ,
        "loading" : false,
        "errored" : false,
    }
    ,
    "data" : {
        "measurement" : 0,
        "direction" : ArrowNames.North,
    }
    ,
}

function compass_calibrate() {
    /** 
        This triggers calibration.

        Parameters: none
        Returns: none
    
 */
    //  Enter calibration mode, saving the previous mode. 
    compass_data["configuration"]["modes"]["previous"] = compass_data["configuration"]["modes"]["current"]
    compass_data["configuration"]["modes"]["current"] = "calibrate"
    compass_data["configuration"]["loading"] = true
    try {
        //  Calibrate the compass. 
        input.calibrateCompass()
    }
    catch (_) {
        //  Warn that an error has occured. 
        compass_data["configuration"]["errored"] = true
    }
    finally {
        //  Exit calibration mode, restoring previous mode state. 
        compass_data["configuration"]["loading"] = false
        compass_data["configuration"]["modes"]["current"] = compass_data["configuration"]["modes"]["previous"]
        compass_data["configuration"]["modes"]["previous"] = "calibrate"
    }
    
}

function measurement_update() {
    /** 
        Record the new measurement.

        Parameters: none
        Returns: (float) heading in degrees
    
 */
    //  Get the new measurement. 
    compass_data["data"]["measurement"] = input.compassHeading()
    //  Return the new measurement. 
    return compass_data["data"]["measurement"]
}

function measurement_arrow_update(angle: any = null) {
    /** 
        Display the correct directional arrow. 

        Parameters: 
            angle: (float) the heading
        Returns: (enum) directional arrow
    
 */
    //  Automatically fill the angle value, if it isn't provided. 
    if (angle == null) {
        angle = compass_data["data"]["measurement"]
    }
    
    //  Check if the angle is negative. If it is, get the correct positive equivalent. 
    if (angle < 0) {
        angle = 360 + angle
    }
    
    //  Check which range it falls under. (Items are clockwise.)
    let direction_ranges = [angle < 22.5 || angle > 337.5, angle >= 22.5 && angle <= 67.5, angle > 67.5 && angle < 112.5, angle >= 112.5 && angle <= 157.5, angle > 157.5 && angle < 202.5, angle >= 202.5 && angle <= 247.5, angle > 247.5 && angle < 292.5, angle >= 292.5 && angle <= 337.5]
    //  This is the list of directions. 
    let directions = [ArrowNames.North, ArrowNames.NorthEast, ArrowNames.East, ArrowNames.SouthEast, ArrowNames.South, ArrowNames.SouthWest, ArrowNames.West, ArrowNames.NorthWest]
    //  Set the correct direction. 
    compass_data["data"]["direction"] = directions[_py.py_array_index(direction_ranges, true)]
    //  Return the direction. 
    return compass_data["data"]["direction"]
}

function modes_measure_toggle(mode_measure_new: any = null) {
    /** 
        Toggle between the compass modes. 

        Parameters: 
            mode_measure_new: (str) the new mode
        Returns: (str) the new mode
    
 */
    //  valid modes of measurement
    let mode_measure = ["number", "arrow"]
    let mode_measure_current_index = _py.py_array_index(mode_measure, compass_data["configuration"]["modes"]["measurement"])
    if (mode_measure_new) {
        if (mode_measure.indexOf(mode_measure_new) >= 0) {
            compass_data["configuration"]["modes"]["measurement"] = mode_measure_new
        }
        
    } else {
        mode_measure_current_index = +1
        //  Check if it exceeds the maximum. 
        if (mode_measure_current_index >= mode_measure.length) {
            //  If so, revert it back to zero. 
            mode_measure_current_index = 0
        }
        
        //  Apply the new mode. 
        compass_data["configuration"]["modes"]["measurement"] = mode_measure[mode_measure_current_index]
    }
    
    //  Return the new mode. 
    return compass_data["configuration"]["modes"]["measurement"]
}

function LEDs_update(status: string = null) {
    let x: number;
    /** 
        Update the LEDs to display the corresponding pattern. 

        Parameters: 
            status: (str) the pattern
        Returns: none
    
 */
    //  Check if there is a custom status input. 
    if (status == null) {
        //  Check if an error has occured. 
        if (compass_data["configuration"]["errored"]) {
            status = "error"
        } else {
            //  Otherwise, the current mode might be the basis. 
            status = compass_data["configuration"]["modes"]["current"]
        }
        
    }
    
    if (status == "error") {
        //  Display that an error has occured simply through an exclamation mark. 
        basic.showString("!")
    } else if (status == "measurement") {
        //  measurement display
        if (compass_data["configuration"]["modes"]["measurement"] == "number") {
            //  Display the numerical data. 
            basic.showNumber(compass_data["data"]["measurement"])
        }
        
        if (compass_data["configuration"]["modes"]["measurement"] == "arrow") {
            //  Display the arrow. 
            basic.showArrow(compass_data["data"]["direction"])
        }
        
    } else {
        //  Display the loading screen while the current screen is still present. 
        while (compass_data["configuration"]["loading"]) {
            //  plot
            for (x = 0; x < 5; x++) {
                led.plot(x, 2)
                basic.pause(100)
            }
            //  unplot
            for (x = 0; x < 5; x++) {
                led.unplot(x, 2)
                basic.pause(100)
            }
        }
    }
    
}

function startup() {
    /** 
        startup script

        Parameters: none
        Returns: none
    
 */
    compass_calibrate()
}

input.onButtonPressed(Button.AB, function on_button_pressed_ab() {
    led.stopAnimation()
    compass_calibrate()
})
input.onButtonPressed(Button.A, function on_button_pressed_a() {
    led.stopAnimation()
    modes_measure_toggle()
})
basic.forever(function on_forever() {
    //  Update the measurements. 
    measurement_update()
    if (compass_data["configuration"]["modes"]["measurement"] == "arrow") {
        measurement_arrow_update()
    }
    
    LEDs_update()
})
startup()
