---
author: DangVoHongPhuc
pubDatetime: 2026-09-12T20:09:20+07
title: "Overview of Physical Works in IoT"
slug: overview-physical-works-iot
featured: true
draft: false
tags: 
    - series-of-iot
    - introduction-to-iot
    - internet-of-things
description: "A friendly guide to understanding the physical works in Internet of Things (IoT), completely series of IoT for learning from scratch."
---
This blog will provide an overview of the physical layer of IoT devices and how microcontrollers interact with hardware components via GPIO.

![Overview of Physical Work](/posts/internet-of-thing/getting-started/overview-physical-works-iot/index.png)

## Table of contents

## What is GPIO?
* **GPIO** stands for **General Purpose Input/Output**.
* Standard hardware pins on microcontrollers used to interface with external hardware or communication protocols.
* Provides connections for **Power (3.3V / 5V)**, **Ground (0V)**, and **Programmable Pins (Analog / Digital)**.
* Typically dedicated to one device per set of pins unless using a shared bus protocol (e.g., I2C, SPI).
### GPIO Digital Pins

![GPIO Digital Pins](@/assets/images/iot/gpio-digital.png)

#### Digital Input (Reading Signals)
Microcontrollers read external voltages relative to Ground to determine binary states:
* **HIGH (Bit 1):** External voltage is ~3.3V (or 5V, above Ground) → Microcontroller interprets as **1 (HIGH)**.
* **LOW (Bit 0):** External voltage is ~0V (equal to Ground) → Microcontroller interprets as **0 (LOW)**.

#### Digital Output (Controlling Components)
The microcontroller actively drives voltage at the pin based on your code to control connected components (e.g., turning on an LED, triggering a relay, or sounding a buzzer):
* **HIGH (Bit 1):** Connects the pin to the internal power rail → Outputs **3.3V** (or **5V**).
* **LOW (Bit 0):** Connects the pin directly to Ground → Returns to **0V**.

### GPIO Analog Pins
![GPIO Analog Pins](@/assets/images/iot/gpio-analog.png)
* Analog pins can send or receive a range of voltages from 0 to 3.3/5V.
* Input pins use an ADC to convert to a 10-bit number.
* Output pins use an DAC to convert from a 10-bit number.
