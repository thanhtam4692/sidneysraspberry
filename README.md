# sidneysraspberry

A small repository for home automation with motion detector and facebook bot for manual interaction. The license parts in the begining of python files are incorrect, please don't mind it.

There are 4 main features which you should be aware of:

- NodeJS server with UI: this runs a webserver which serves at port 4000. The web interface is for the personal exhibit of my CV, porfolios and contact, is not completed, and had been moved to another repository. The remain here is just for a sake of visual interaction.

- Websocket implementation and facebook bot: is in /routes/index.js. The route is included authentication and other functions to directly connect with another host for other capabilities. The bot use a custom approach for smarter and more flexible, customisable interaction, which can be extended in the future with more equipments and more procedures/capacities. 

- Motion detector: is in /motion/motion.py. It scans for motion every second using an PIR sensor. If there is, the light sensor determines if current ambient light is enough and turn on the light by switching a relay if necessary. A ultrasonic sensor is used in case the room is occupied but the subjects do not move. In additional, a camera can be used to take picture when the motion occurs, and send the picture to facebook bot. The automation procedure is also including fan controlling, and temperature and humidity sensing, which can be revealed using the facebook bot. Some information need to be periodic stored in a databse of your choice (mine is MongoDB).

- Python procedures: are in /python/. Those are to control one or several specific equipment/setting such as light, fan, and other configurations.
