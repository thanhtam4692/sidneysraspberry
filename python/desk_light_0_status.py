#!/usr/bin/python
import RPi.GPIO as GPIO
import time
import datetime
from pymongo import MongoClient

mongoclient = MongoClient("mongodb://localhost:27017")
db = mongoclient.sidneyspi
homeonDB = db.homeon

try:
    cursor = homeonDB.find({"name": "desk_light_0"})
    for document in cursor:
        if (document["status"]["power"] == "on"):
            print("on")
        else:
            print("off")


# End program cleanly with keyboard
except KeyboardInterrupt:
    print " Quit"
    # Reset GPIO settings
#    GPIO.cleanup()
