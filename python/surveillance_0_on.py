#!/usr/bin/python
import time
import datetime
from pymongo import MongoClient

mongoclient = MongoClient("mongodb://localhost:27017")
db = mongoclient.sidneyspi
homeonDB = db.homeon

try:
    now = datetime.datetime.now()
    datetime_string = str(now.year) + "" + str(now.strftime('%m')) + "" + str(now.strftime('%d')) + "-" + str(now.strftime('%H')) + "" + str(now.strftime('%M')) + "" + str(now.strftime('%S'))
    
    homeonDB.update_one(
        {"name": "surveillance_0"},
        {"$set": {
                    "status.power": "on",
                    "last_update": datetime_string
                }
        }
    )

# End program cleanly with keyboard
except KeyboardInterrupt:
    print " Quit"
    # Reset GPIO settings
#    GPIO.cleanup()
