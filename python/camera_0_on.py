#!/usr/bin/env python
#
# GrovePi Example for using the Grove Ultrasonic Ranger (http://www.seeedstudio.com/wiki/Grove_-_Ultrasonic_Ranger)
#
# The GrovePi connects the Raspberry Pi and Grove sensors.  You can learn more about GrovePi here:  http://www.dexterindustries.com/GrovePi
#
# Have a question about this example?  Ask on the forums here:  http://forum.dexterindustries.com/c/grovepi
#
'''
## License

The MIT License (MIT)

GrovePi for the Raspberry Pi: an open source platform for connecting Grove Sensors to the Raspberry Pi.
Copyright (C) 2015  Dexter Industries

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
'''
import time
import datetime
import grovepi
import RPi.GPIO as GPIO
from subprocess import call
from gpiozero import MotionSensor
from pymongo import MongoClient
import requests
import os

GPIO.setmode(GPIO.BCM)
GPIO.setwarnings(False)
mongoclient = MongoClient("mongodb://localhost:27017")
db = mongoclient.sidneyspi
homeonDB = db.homeon
photoDB = db.photos

# init list with pin numbers
pinList = [24]
# loop through pins and set them up
for i in pinList:
    GPIO.setup(i, GPIO.OUT)

light_sensor = 0
grovepi.pinMode(light_sensor,"INPUT")
light_indicator = 200
isLightUp = False

# main loop
try:
    light = grovepi.analogRead(light_sensor)
    if light < light_indicator:
        GPIO.output(24, GPIO.LOW)
        homeonDB.update_one(
            {"name": "desk_light_0"},
            {"$set": {
                        "status.power": "on"
                    }
            }
        )
        isLightUp = True
        print "Light is on for taking photo."

    #Get time and take a picture
    now = datetime.datetime.now()
    datetime_string = str(now.year) + "" + str(now.strftime('%m')) + "" + str(now.strftime('%d')) + "-" + str(now.strftime('%H')) + "" + str(now.strftime('%M')) + "" + str(now.strftime('%S'))
    call(["fswebcam", "-r 544x288", "./motion/motionimages/image" + datetime_string + ".jpg"])
    homeonDB.update_one(
        {"name": "camera_0"},
        {"$set": {
            "last_update": datetime_string,
            "last_photo" : "image" + datetime_string + ".jpg"
                }
        }
    )
    photoDB.insert({
        "last_update": datetime_string,
        "last_photo" : "image" + datetime_string + ".jpg"
    })

    #sleep for 2 seconds
    time.sleep(0.5)

    #Get time and take another picture
    now = datetime.datetime.now()
    datetime_string = str(now.year) + "" + str(now.strftime('%m')) + "" + str(now.strftime('%d')) + "-" + str(now.strftime('%H')) + "" + str(now.strftime('%M')) + "" + str(now.strftime('%S'))
    call(["fswebcam", "-r 544x288", "./motion/motionimages/image" + datetime_string + ".jpg"])
    homeonDB.update_one(
        {"name": "camera_0"},
        {"$set": {
            "last_update": datetime_string,
            "last_photo" : "image" + datetime_string + ".jpg"
                }
        }
    )
    photoDB.insert({
        "last_update": datetime_string,
        "last_photo" : "image" + datetime_string + ".jpg"
    })


    #Send a request to notify unusual motion
    local_url = "http://localhost:4000/fb_notify"
    r = requests.post(local_url, data = {"photo" : "image" + datetime_string + ".jpg"})
    print datetime_string + ": photo sent"
except (IOError,TypeError, requests.ConnectionError) as e:
    print(e)
except Exception as err:
    print(e)
except KeyboardInterrupt:
    print "Keyboard interupted"
finally:
    if isLightUp:
        GPIO.output(24, GPIO.HIGH)
        homeonDB.update_one(
            {"name": "desk_light_0"},
            {"$set": {
                        "status.power": "off",
                    }
            }
        )
