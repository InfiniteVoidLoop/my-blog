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
### What are sensors?
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
* These sensors receive voltage from the IoT device and adjust it based on physical world properties (e.g. brightness or temperature).

##### Analog-to-Digital Conversion (ADC)

Digital IoT devices only understand binary (`0`s and `1`s). Therefore, analog voltage levels must be converted into digital numbers by an **Analog-to-Digital Converter (ADC)** (often built into the MCU or an expansion board/HAT).

> [!NOTE]
> **Example of Conversion Process:**
> 1. **Analog Voltage:** Sensor outputs `1.0V` (on a `3.3V` system).
> 2. **Scaled Integer:** ADC maps `1.0V` to an integer scale of `0–1023` → **`300`**.
> 3. **Binary Conversion:** `300` is converted into binary **`0000000100101100`** for the CPU to process.

#### Digital sensors

Unlike analog sensors, **digital sensors** output digital signals (`0`s and `1`s) directly to the IoT device, eliminating the need for an external ADC on the microcontroller or board.

They fall into two main categories:

1. **Simple Binary Sensors (2-State)**
   * **Example:** *Push buttons* or *switches*.
   * **How it works:** 
     * **OFF State:** `0V` output → interpreted directly as **`0`**.
     * **ON State:** `3.3V` (or `5V`) output → interpreted directly as **`1`**.
   * **Voltage Threshold:** GPIO pins read binary states directly (e.g., Raspberry Pi GPIO treats voltage `> 1.8V` as **`1`** and `< 1.8V` as **`0`**).

![Simple Digital Button Sensor](@/assets/images/iot/button.png)

2. **Advanced Digital Sensors (On-Board ADC)**
   * **Example:** *Digital temperature sensors*, *digital cameras*, or *motion sensors*.
   * **How it works:** Contains an **integrated on-board ADC** that measures physical phenomena, converts it internally into binary bits (`0`s and `1`s), and sends formatted data streams to the IoT device.
   * **Complex Data:** Allows sending rich, compressed data such as JPEG images or video streams frame-by-frame.

![Digital Temperature Sensor with On-Board ADC](@/assets/images/iot/temperature-as-digital.png)

> [!NOTE]
> **Key Advantage:** Digital data transmission provides **higher noise immunity**, **consistent precision**, and support for **encrypted payloads** in secure IoT applications.


## Actuators
### What are actuators?
### Use an actuator
### Type of actuators




