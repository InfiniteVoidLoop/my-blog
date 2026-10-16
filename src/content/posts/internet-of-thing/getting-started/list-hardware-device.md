---
author: DangVoHongPhuc
pubDatetime: 2026-09-16T20:09:20+07
title: "Some basic hardware devices in IoT"
slug: hardware-devices-iot
featured: false
draft: false
tags:
    - series-of-iot
    - list-of-hardware-devices
    - internet-of-things
description: "Introduce some basic hardware devices in IoT, including sensors, actuators."
series: "Internet of Things"
seriesOrder: 7
---
This blog is my diary recording my journey of learning about IoT, particularly the hardware devices used in IoT applications. I will introduce some basic hardware devices in IoT, including sensors and actuators.

## Table of contents
## Sensor Devices

### Photoresistor Sensor (LDR Module) ☀️

![Photoresistor Sensor Module](@/assets/images/iot/photoresistor-sensor.png)
*Figure 1: The standard 4-pin photoresistor (LDR) sensor module.*

#### Main Components
- **Light Dependent Resistor (LDR):** Changes its resistance inversely with light intensity (high resistance in the dark, low resistance under bright light).
- **Op-Amp (LM393):** Compares the LDR's voltage against a reference threshold to output a clean digital signal (`HIGH` or `LOW`) on pin **D0**.
- **Potentiometer:** Fine-tunes the sensitivity threshold for the digital output trigger.
- **Power LED:** Glows when the module receives proper power.
- **D0 LED:** Lights up when the digital output **D0** is active.

#### Pinout
- **VCC:** Power supply pin ($3.3\text{V} - 5\text{V}$).
- **GND:** Ground ($0\text{V}$).
- **D0:** Digital output (`HIGH` / `LOW` based on the potentiometer threshold).
- **A0:** Analog output (continuous voltage proportional to ambient brightness).

---

### Simulation & Arduino Code ⚡

Here is a simple simulation circuit connecting an LDR with an **Arduino Uno** using a voltage divider configuration:

![Photoresistor Arduino Simulation](@/assets/images/iot/photonresistor-simulation.png)
*Figure 2: Breadboard simulation circuit connecting an LDR to Arduino Uno analog pin A0.*

#### Circuit Connections
- **5V $\rightarrow$ LDR:** One leg connects to the **5V** rail.
- **LDR $\rightarrow$ A0 & Resistor:** The other leg connects to **A0** and a pull-down resistor ($10\text{k}\Omega$).
- **Resistor $\rightarrow$ GND:** The resistor connects to **GND** to complete the voltage divider.

#### Arduino Example Code
```cpp
const int LDR_PIN = A0; // Connect to Analog pin A0

void setup() {
  Serial.begin(9600);
}

void loop() {
  int lightLevel = analogRead(LDR_PIN); // Reads value between 0 - 1023
  
  Serial.print("Ambient Light Level: ");
  Serial.println(lightLevel);

  delay(500); // Read every half second
}
```

> [!TIP]
> Higher ambient light reduces the LDR resistance, causing the voltage reading on **A0** to increase towards $1023$. In pitch black, the value drops closer to $0$.


