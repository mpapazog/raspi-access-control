#Based on script by Alex Eames http://RasPi.tv/

import RPi.GPIO as GPIO
import requests, time

PORT_BUTTON             = 22
PORT_DOOR_REJECT        = 5
PORT_DOOR_APPROVE       = 6

TRIGGER_URL             = "https://127.0.0.1:8081/accessControl/button"
RESPONSE_URL            = "https://127.0.0.1:8081/accessControl/door"
CONNECT_TIMEOUT         = 30
TRANSMIT_TIMEOUT        = 30

MAX_APPROVAL_RETRIES    = 30
APPROVAL_RETRY_INTERVAL = 1
APPROVAL_RESPONSE_TIME  = 15

def button_listener():
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
            if rjson['approval'] in ['approved', 'rejected']:
                if rjson['approval'] == 'approved':
                    port = PORT_DOOR_APPROVE
                else:
                    port = PORT_DOOR_REJECT
                    
                GPIO.setup(port,GPIO.OUT)
                print("Approval response active")
                GPIO.output(port,GPIO.HIGH)
                time.sleep(APPROVAL_RESPONSE_TIME)
                print("Approval response inactive")
                GPIO.output(port,GPIO.LOW)
                
                break
            
    except KeyboardInterrupt:
        GPIO.cleanup()       # clean up GPIO on CTRL+C exit
    except Exception as e:
        print(e)
    button_listener()

GPIO.setmode(GPIO.BCM)

button_listener()
    
GPIO.cleanup()           # clean up GPIO on normal exit