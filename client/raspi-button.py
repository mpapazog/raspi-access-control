#Based on script by Alex Eames http://RasPi.tv/

import RPi.GPIO as GPIO
import requests

PORT_BUTTON             = 22
PORT_DOOR_REJECT        = 5
PORT_DOOR_APPROVE       = 6

TRIGGER_URL             = "http://192.168.11.6:8080/accessControl/button"
RESPONSE_URL            = "http://192.168.11.6:8080/accessControl/door"
CONNECT_TIMEOUT         = 30
TRANSMIT_TIMEOUT        = 30

MAX_APPROVAL_RETRIES    = 30
APPROVAL_RETRY_INTERVAL = 1

def button_listener():
    GPIO.setmode(GPIO.BCM)
    # GPIO PORT_BUTTON set up as input. It is pulled up to stop false signals
    GPIO.setup(PORT_BUTTON, GPIO.IN, pull_up_down=GPIO.PUD_UP)
    print ("Waiting for falling edge on port %s" % PORT_BUTTON)
    
    try:
        GPIO.wait_for_edge(PORT_BUTTON, GPIO.FALLING)
        print ("\nButton press detected. Sending request...")
        requests.put(TRIGGER_URL, timeout=(CONNECT_TIMEOUT, TRANSMIT_TIMEOUT))
        print("Request sent. Polling for approval...")
        for i in range(0, MAX_APPROVAL_RETRIES):
            time.sleep(APPROVAL_RETRY_INTERVAL)
            response = requests.get(RESPONSE_URL, timeout=(CONNECT_TIMEOUT, TRANSMIT_TIMEOUT))
            rjson = response.json()
            print(rjson)            
            
    except KeyboardInterrupt:
        GPIO.cleanup()       # clean up GPIO on CTRL+C exit
    except Exception as e:
        print(e)
    button_listener()


button_listener()
    
GPIO.cleanup()           # clean up GPIO on normal exit