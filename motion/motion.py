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
GPIO.output(24, GPIO.HIGH)


# Connect the Grove Light Sensor to analog port A0
# SIG,NC,VCC,GND
light_sensor = 0
grovepi.pinMode(light_sensor,"INPUT")

# Connect the Grove Ultrasonic Ranger to digital port D4
# SIG,NC,VCC,GND
ultrasonic_ranger = 4

timeTick = 0
timeCycle = 120 #2 minutes

pir = MotionSensor(25)
isLightUp = False
light_indicator = 200
auto_mode = True

unusual_motion = True #motion detected after a silent period
surveillance = True


# main loop
while True:
    try:
        if pir.motion_detected:
            light = grovepi.analogRead(light_sensor)

            if GPIO.input(24) == 1:
                now = datetime.datetime.now()
                datetime_string = str(now.year) + "" + str(now.strftime('%m')) + "" + str(now.strftime('%d')) + "-" + str(now.strftime('%H')) + "" + str(now.strftime('%M')) + "" + str(now.strftime('%S'))
                homeonDB.update_one(
                    {"name": "desk_light_0"},
                    {"$set": {
                            "status.power": "off",
                            "last_update": datetime_string
                            }
                    }
                )
            cursor = homeonDB.find({"name": "desk_light_0"})
            for document in cursor:
                if (document["status"]["power"] == "on"):
                    isLightUp = True
                else:
                    isLightUp = False

                if (document["mode"] == "auto"):
                    auto_mode = True
                else:
                    auto_mode = False
            timeTick = 0
            now = datetime.datetime.now()
            datetime_string = str(now.year) + "" + str(now.strftime('%m')) + "" + str(now.strftime('%d')) + "-" + str(now.strftime('%H')) + "" + str(now.strftime('%M')) + "" + str(now.strftime('%S'))
            print(datetime_string + ": Motion detected!")

            if not isLightUp and (light < light_indicator) and auto_mode:
                GPIO.output(24, GPIO.LOW)
                homeonDB.update_one(
                    {"name": "desk_light_0"},
                    {"$set": {
                                "status.power": "on",
                                "last_update": datetime_string
                            }
                    }
                )
                print "Light is on"

            cursor = homeonDB.find({"name": "surveillance_0"})
            for document in cursor:
                if (document["status"]["power"] == "on"):
                    surveillance_new = True
                else:
                    surveillance_new = False

            if (surveillance != surveillance_new and surveillance_new == True):
                unusual_motion = True
            surveillance = surveillance_new

            if unusual_motion and surveillance:
                #Get time and take a picture
                now = datetime.datetime.now()
                datetime_string = str(now.year) + "" + str(now.strftime('%m')) + "" + str(now.strftime('%d')) + "-" + str(now.strftime('%H')) + "" + str(now.strftime('%M')) + "" + str(now.strftime('%S'))
                call(["fswebcam", "-r 544x288", "motionimages/image" + datetime_string + ".jpg"])
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
                time.sleep(2)

                #Get time and take another picture
                now = datetime.datetime.now()
                datetime_string = str(now.year) + "" + str(now.strftime('%m')) + "" + str(now.strftime('%d')) + "-" + str(now.strftime('%H')) + "" + str(now.strftime('%M')) + "" + str(now.strftime('%S'))
                call(["fswebcam", "-r 544x288", "motionimages/image" + datetime_string + ".jpg"])
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
                event_trigger = "unusual_motion_noti"
                url = "https://maker.ifttt.com/trigger/" + event_trigger + "/with/key/bceACWINhDS749idRVaBHI"
                local_url = "http://localhost:4000/fb_notify"
                r = requests.post(url, data = {"value1" : "testing", "value2" : "home", "value3" : "unusual_motion_noti"})
                r = requests.post(local_url, data = {"photo" : "image" + datetime_string + ".jpg"})
                print datetime_string + ": Notification sent"

            unusual_motion = False

        #When motionless detected for a timeCycle seconds, check auto_mode and isLightUp to turn off the light if needed
        if timeTick == timeCycle:
            timeTick = 0
            cursor = homeonDB.find({"name": "desk_light_0"})
            for document in cursor:
                if (document["status"]["power"] == "on"):
                    isLightUp = True
                else:
                    isLightUp = False

                if (document["mode"] == "auto"):
                    auto_mode = True
                else:
                    auto_mode = False

            if auto_mode:
                ul1 = grovepi.ultrasonicRead(ultrasonic_ranger)
                time.sleep(0.5)
                ul2 = grovepi.ultrasonicRead(ultrasonic_ranger)
                time.sleep(0.5)
                ul3 = grovepi.ultrasonicRead(ultrasonic_ranger)
                if ul1 > 100 and ul2 > 100 and ul3 > 100:
                    now = datetime.datetime.now()
                    datetime_string = str(now.year) + "" + str(now.strftime('%m')) + "" + str(now.strftime('%d')) + "-" + str(now.strftime('%H')) + "" + str(now.strftime('%M')) + "" + str(now.strftime('%S'))
                    print(datetime_string + ": No body is here. Ultrasonic sensed: " + str(ul1) + " " + str(ul2) + " " + str(ul3))
                    if isLightUp and auto_mode:
                        print(datetime_string + ": Light is on, auto mode is on. Turn light off.")
                        # loop through pins and set them up
                        for i in pinList:
                            GPIO.setup(i, GPIO.OUT)
                        GPIO.output(24, GPIO.HIGH)
                        homeonDB.update_one(
                            {"name": "desk_light_0"},
                            {"$set": {
                                        "status.power": "off",
                                        "last_update": datetime_string
                                    }
                            }
                        )
                    unusual_motion = True
        time.sleep(1)
        timeTick = timeTick + 1
    except (IOError,TypeError, requests.ConnectionError) as e:
        print(e)
    except Exception as err:
        print err
    except KeyboardInterrupt:
        print "Keyboard interupted"
    finally:
        if auto_mode:
            now = datetime.datetime.now()
            datetime_string = str(now.year) + "" + str(now.strftime('%m')) + "" + str(now.strftime('%d')) + "-" + str(now.strftime('%H')) + "" + str(now.strftime('%M')) + "" + str(now.strftime('%S'))
            homeonDB.update_one(
                {"name": "desk_light_0"},
                {"$set": {
                        "status.power": "off",
                        "last_update": datetime_string
                        }
                }
            )
            GPIO.cleanup()
