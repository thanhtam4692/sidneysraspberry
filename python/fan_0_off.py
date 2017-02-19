#!/usr/bin/python
import RPi.GPIO as GPIO
import time
import datetime
from pymongo import MongoClient

GPIO.setmode(GPIO.BCM)
GPIO.setwarnings(False)
mongoclient = MongoClient("mongodb://localhost:27017")
db = mongoclient.sidneyspi
homeonDB = db.homeon

# init list with pin numbers

pinList = [17]

# loop through pins and set mode and state to 'low'

for i in pinList:
    GPIO.setup(i, GPIO.OUT)
    GPIO.output(i, GPIO.HIGH)

# time to sleep between operations in the main loop

SleepTimeL = 0.2

# main loop

try:
    GPIO.output(17, GPIO.LOW)
    print "Fan is off"
    
    time.sleep(SleepTimeL);
    GPIO.output(17, GPIO.HIGH)
    GPIO.cleanup(17)

    now = datetime.datetime.now()
    datetime_string = str(now.year) + "" + str(now.strftime('%m')) + "" + str(now.strftime('%d')) + "-" + str(now.strftime('%H')) + "" + str(now.strftime('%M')) + "" + str(now.strftime('%S'))
    
    homeonDB.update_one(
        {"name": "fan_0"},
        {"$set": {
                "status.power": "off",
                "last_update": datetime_string
                }
        }
    )

# End program cleanly with keyboard
except KeyboardInterrupt:  
    print " Quit"
    # Reset GPIO settings
    GPIO.cleanup(17)
