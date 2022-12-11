# compass system information
compass_info = {
    'version': 2022.1211
}

# compass data and settings
compass_data = {
    'configuration': {
        'modes': {
            'previous': '',
            'current': 'measurement',
            'measurement': 'number'
        },
        'loading': False,
        'errored': False
    }, 
    'data': {
        'measurement': 0,
        'direction': ArrowNames.NORTH
    }
}

def compass_calibrate(): 
    """
        This triggers calibration.

        Parameters: none
        Returns: none
    """
    # Enter calibration mode, saving the previous mode. 
    compass_data['configuration']['modes']['previous'] = compass_data['configuration']['modes']['current']
    compass_data['configuration']['modes']['current'] = 'calibrate'
    compass_data['configuration']['loading'] = True

    try: 
        # Calibrate the compass. 
        input.calibrate_compass()
   
    except: 
        # Warn that an error has occured. 
        compass_data['configuration']['errored'] = True
    
    finally: 
        # Exit calibration mode, restoring previous mode state. 
        compass_data['configuration']['loading'] = False
        compass_data['configuration']['modes']['current'] = compass_data['configuration']['modes']['previous']
        compass_data['configuration']['modes']['previous'] = 'calibrate'

def measurement_update(): 
    """
        Record the new measurement.

        Parameters: none
        Returns: (float) heading in degrees
    """

    # Get the new measurement. 
    compass_data['data']['measurement'] = input.compass_heading()

    # Return the new measurement. 
    return(compass_data['data']['measurement'])

def measurement_arrow_update(angle = None): 
    """
        Display the correct directional arrow. 

        Parameters: 
            angle: (float) the heading
        Returns: (enum) directional arrow
    """

    # Automatically fill the angle value, if it isn't provided. 
    if angle == None: 
        angle = compass_data['data']['measurement']
    
    # Check if the angle is negative. If it is, get the correct positive equivalent. 
    if angle < 0: 
        angle = 360 + angle

    # Check which range it falls under. (Items are clockwise.)
    direction_ranges = [
        (angle < 22.5) or (angle > 337.5),
        (angle >= 22.5) and (angle <= 67.5),
        (angle > 67.5) and (angle < 112.5),
        (angle >= 112.5) and (angle <= 157.5),
        (angle > 157.5) and (angle < 202.5),
        (angle >= 202.5) and (angle <= 247.5),
        (angle > 247.5) and (angle < 292.5),
        (angle >= 292.5) and (angle <= 337.5)
    ]

    # This is the list of directions. 
    directions = [
        ArrowNames.NORTH,
        ArrowNames.NORTH_EAST,
        ArrowNames.EAST,
        ArrowNames.SOUTH_EAST,
        ArrowNames.SOUTH,
        ArrowNames.SOUTH_WEST,
        ArrowNames.WEST,
        ArrowNames.NORTH_WEST
    ]

    # Set the correct direction. 
    compass_data['data']['direction'] = directions[direction_ranges.index(True)]

    # Return the direction. 
    return(compass_data['data']['direction'])

def modes_measure_toggle(mode_measure_new = None): 
    """
        Toggle between the compass modes. 

        Parameters: 
            mode_measure_new: (str) the new mode
        Returns: (str) the new mode
    """

    # valid modes of measurement
    mode_measure = ['number', 'arrow']
    mode_measure_current_index = mode_measure.index(compass_data['configuration']['modes']['measurement'])

    if mode_measure_new: 
        if mode_measure_new in mode_measure:
            compass_data['configuration']['modes']['measurement'] = mode_measure_new
    else: 
        mode_measure_current_index =+ 1

        # Check if it exceeds the maximum. 
        if mode_measure_current_index >= len(mode_measure): 
            # If so, revert it back to zero. 
            mode_measure_current_index = 0
        
        # Apply the new mode. 
        compass_data['configuration']['modes']['measurement'] = mode_measure[mode_measure_current_index]

    # Return the new mode. 
    return(compass_data['configuration']['modes']['measurement'])


def LEDs_update(status = None): 
    """
        Update the LEDs to display the corresponding pattern. 

        Parameters: 
            status: (str) the pattern
        Returns: none
    """

    # Check if there is a custom status input. 
    if status == None: 
        # Check if an error has occured. 
        if compass_data['configuration']['errored']: 
            status = 'error'
        else: 
            # Otherwise, the current mode might be the basis. 
            status = compass_data['configuration']['modes']['current']

    if (status == 'error'): 
        # Display that an error has occured simply through an exclamation mark. 
        basic.show_string("!")
    
    elif (status == 'measurement'): 
        # measurement display
        
        if compass_data['configuration']['modes']['measurement'] == 'number': 
            # Display the numerical data. 
            basic.show_number(compass_data['data']['measurement'])
        if compass_data['configuration']['modes']['measurement'] == 'arrow': 
            # Display the arrow. 
            basic.show_arrow(compass_data['data']['direction'])
            
    
    else: 
        # Display the loading screen while the current screen is still present. 
        while compass_data['configuration']['loading']: 
            # plot
            for x in range(0,5): 
                led.plot(x, 2)
                basic.pause(100)
            # unplot
            for x in range (0,5): 
                led.unplot(x, 2)
                basic.pause(100)


def startup(): 
    """
        startup script

        Parameters: none
        Returns: none
    """
    
    compass_calibrate()

def on_forever():
    # Update the measurements. 
    measurement_update()
    if compass_data['configuration']['modes']['measurement'] == 'arrow':
        measurement_arrow_update()

    LEDs_update()


def on_button_pressed_ab():
    led.stop_animation()
    compass_calibrate()

def on_button_pressed_a():
    led.stop_animation()
    modes_measure_toggle()

input.on_button_pressed(Button.AB, on_button_pressed_ab)
input.on_button_pressed(Button.A, on_button_pressed_a)
basic.forever(on_forever)
startup()