---
author: DangVoHongPhuc
pubDatetime: 2026-09-02T20:09:20+07
title: "Sensors and Actuators in Internet of Things (IoT)"
slug: sensors-actuators-iot
featured: true
draft: false
tags:
  - series-of-iot
  - introduction-to-iot
  - internet-of-things
  - sensors
  - actuators
description: "A comprehensive guide to understanding sensors and actuators in Internet of Things (IoT), their types, applications, and how they work together in IoT systems."
---
This blog will explore the concepts of **sensors** and **actuators** in the context of **Internet of Things (IoT)**, their types, applications, and how they work together in IoT systems.

![Sensors and Actuators](/posts/internet-of-thing/getting-started/sensors-actuators-iot/index.png)

## Table of contents
## Sensors 
### What is sensors?
* Sensors are hardware devices that sense the physical world. It can measure one or more properties around and send the information to IoT device.
* Some common sensors include: 
1. Temperature sensors - sense air temperature, water temperature, humidity, air pressure.
2. Buttons sensors - sense button press.
3. Light sensors - sense light intensity/level.
4. Camera sensors - sense image and video.

### Use a sensor

> [!NOTE]
> In this blog, we will use **CounterFit** (a virtual IoT device simulator) to program and test sensors locally on your computer without needing physical hardware.

In this section, we will build a light sensor simulation application using Python.

> [!NOTE]
> * **Hardware Concept:** A physical light sensor uses a [photodiode](https://en.wikipedia.org/wiki/Photodiode) to convert light into an electrical signal.
> * **Data Type:** Light sensors return analog values (integers indicating relative brightness, not mapped to a standard unit).

#### Step-by-step Guide: Connecting and Reading a Virtual Light Sensor

**Step 1: Launch the CounterFit App**
Run the following command in your terminal:
```bash
counterfit
```
This starts the simulation web server at `http://127.0.0.1:5000`.

![CounterFit Disconnected](@/assets/images/iot/counterfit_not_connected.png)

**Step 2: Create the Virtual Light Sensor**
1. Open `http://127.0.0.1:5000` in your web browser.
2. Under **Sensors** (left side):
   * Set **Sensor Type** to `Light`.
   * Set **Pin** to `0`.
   * Click **Add**.

**Step 3: Write the Python Code (`app.py`)**

Create `app.py` in your project folder with the following code:

```python
import time
from counterfit_connection import CounterFitConnection
from counterfit_shims_grove.grove_light_sensor_v1_2 import GroveLightSensor

# 1. Connect to the local CounterFit simulation server
CounterFitConnection.init('127.0.0.1', 5000)

# 2. Initialize the Grove Light Sensor connected to Pin 0
light_sensor = GroveLightSensor(0)

# 3. Read and print light level every 1 second
while True:
    light = light_sensor.light
    print('Light level:', light)
    time.sleep(1)
```

**Step 4: Execute the Application & Verify**
1. Open a new terminal window (keeping `counterfit` running) and run:
```bash
python app.py
```

2. **CounterFit UI with Light Sensor Added:**
![Add Light Sensor](@/assets/images/iot/add-light-sensor-1.png)

3. **Terminal Output Printing Light Level:**
![Terminal Output Light Level](@/assets/images/iot/output-sensor-1.png)

> [!TIP]
> **Verification:** The light sensor will show active connection status in CounterFit UI, and your terminal will continuously print the current light readings!

### Type of sensors
#### Analog sensors
#### Digital sensors


## Actuators
### What is actuators?
### Use an actuator
### Type of actuators




