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

#### Simulation & Arduino Code ⚡

Here is a simple simulation circuit connecting an LDR with an **Arduino Uno** using a voltage divider configuration:

![Photoresistor Arduino Simulation](@/assets/images/iot/photonresistor-simulation.png)
*Figure 2: Breadboard simulation circuit connecting an LDR to Arduino Uno analog pin A0.*

##### Circuit Connections
- **5V $\rightarrow$ LDR:** One leg connects to the **5V** rail.
- **LDR $\rightarrow$ A0 & Resistor:** The other leg connects to **A0** and a pull-down resistor ($10\text{k}\Omega$).
- **Resistor $\rightarrow$ GND:** The resistor connects to **GND** to complete the voltage divider.

##### Arduino Example Code
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

---

#### Automatic Night Light: Integrating with an LED 💡

Now, let's turn this into a real-world smart application: an **automatic night light** that turns an LED on when it gets dark and turns it off when the room is bright!

![Photoresistor and LED Integrated Circuit](@/assets/images/iot/photoresistor-led-integrate.png)
*Figure 3: Arduino circuit controlling an LED based on LDR light readings.*

##### Additional Circuit Connections
- **Digital Pin 5 $\rightarrow$ LED Anode (+):** Connects to the positive leg of the LED to control power via code.
- **LED Cathode (-) $\rightarrow$ LDR / GND:** Ground connection completes the circuit.

##### Arduino Example Code
```cpp
const int LDR_PIN = A0;   // Photoresistor connected to Analog A0
const int LED_PIN = 5;    // LED connected to Digital Pin 5
const int THRESHOLD = 500; // Darkness threshold value

void setup() {
  pinMode(LED_PIN, OUTPUT);
  Serial.begin(9600);
}

void loop() {
  int lightLevel = analogRead(LDR_PIN);
  Serial.print("Light level: ");
  Serial.println(lightLevel);

  // If it's dark (reading below threshold), turn on the LED
  if (lightLevel < THRESHOLD) {
    digitalWrite(LED_PIN, HIGH);
  } else {
    digitalWrite(LED_PIN, LOW);
  }

  delay(200);
}
```

---

### Ultrasonic Sensor (HC-SR04) 🦇

![Ultrasonic Sensor Module](@/assets/images/iot/ultrasonic-sensor.png)
*Figure 4: The HC-SR04 Ultrasonic distance sensor and its echo-ranging principle.*

The **HC-SR04** uses high-frequency sound waves (ultrasound at $40\text{ kHz}$) to measure distance without physical contact—just like bats navigate in the dark!

#### How It Works (Echo Principle)
1. **Trigger (Transmitter "T"):** Sends out an ultrasonic sound burst (8 pulses at $40\text{ kHz}$).
2. **Reflect:** The sound wave travels forward, hits an obstacle, and bounces back.
3. **Echo (Receiver "R"):** Detects the reflected wave and outputs a pulse whose duration equals the round-trip travel time.

#### Pinout
- **VCC:** $5\text{V}$ power supply.
- **Trig (Trigger):** Input pin to send the signal (set to `HIGH` for $10\mu\text{s}$ to trigger).
- **Echo:** Output pin that stays `HIGH` for the duration of the sound's travel time.
- **GND:** Ground ($0\text{V}$).

#### Distance Formula
Since sound travels through air at approximately $0.034\text{ cm}/\mu\text{s}$ (or $340\text{ m/s}$), and the wave travels to the object and back:

$$\text{Distance (cm)} = \frac{\text{Time} \times 0.034}{2}$$

---

#### Simulation & Arduino Code ⚡

Here is a simple simulation wiring the HC-SR04 with an **Arduino Uno**:

![Ultrasonic Arduino Simulation](@/assets/images/iot/ultrasonic-simulation.png)
*Figure 5: HC-SR04 ultrasonic sensor simulation connected to Arduino Uno pins 5 (Trig) and 4 (Echo).*

#### Circuit Connections
- **VCC $\rightarrow$ 5V:** Powers the sensor.
- **GND $\rightarrow$ GND:** Ground reference.
- **Trig $\rightarrow$ Pin 5:** Outputs pulses to fire ultrasonic bursts.
- **Echo $\rightarrow$ Pin 4:** Reads the incoming pulse length from reflected sound.

#### Arduino Example Code
```cpp
const int trigger_pin = 5;
const int echo_pin = 4;

void setup() {
    Serial.begin(9600);
    pinMode(trigger_pin, OUTPUT);
    pinMode(echo_pin, INPUT);
}

long getDistance() {
    digitalWrite(trigger_pin, LOW);
    delayMicroseconds(2);
    digitalWrite(trigger_pin, HIGH);
    delayMicroseconds(10);
    digitalWrite(trigger_pin, LOW);
    long duration = pulseIn(echo_pin, HIGH);
    long distance = duration * 0.034 / 2;
    return distance;
}

void loop() {
    int distance = getDistance(); // unit: cm
    Serial.print("Distance: ");
    Serial.print(distance);
    Serial.println(" cm");
    delay(200);
}
```

> [!NOTE]
> **Why a $10\mu\text{s}$ trigger pulse?**  
> - According to the HC-SR04 datasheet, the module's internal controller requires a **`HIGH` pulse of at least $10\mu\text{s}$** on the `Trig` pin to initiate measurement. 
> - Upon receiving this, it automatically emits an **8-cycle ultrasonic burst at $40\text{ kHz}$**. 
> - $2\mu\text{s}$ `LOW` pulse ensures a clean, noise-free rising edge.


## Actuator Devices

### Buzzer (Active & Passive) 🔊

![Buzzer Module](@/assets/images/iot/buzzer.png)
*Figure 6: A standard buzzer module.*

A **buzzer** is a small component that makes sound—like beeps, clicks, or alarms.

#### Active vs. Passive Buzzer

There are two main types of buzzers:

| Feature | Active Buzzer 🟢 | Passive Buzzer 🔵 |
| :--- | :--- | :--- |
| **How it works** | Has a built-in sound generator | Needs an external sound wave |
| **How to control** | Just turn power on/off (`HIGH` / `LOW`) | Send frequencies using `tone()` |
| **Sound** | One fixed "beep" sound | Can play different musical notes |
| **Best used for** | Simple warning beeps & alarms | Songs, melodies, and sound effects |

#### Pins (Polarity)
- **Longer leg (+):** Marked with a `+` on the plastic cap $\rightarrow$ Connect to an Arduino digital pin (or $5\text{V}$).
- **Shorter leg (-):** Connect to `GND`.

---

#### Simulation & Arduino Code 🎵

Here is a simple simulation wiring a buzzer to an **Arduino Uno** to play a melody:

![Buzzer Arduino Simulation](@/assets/images/iot/buzzer-simulation.png)
*Figure 7: Buzzer simulation connected to Arduino Uno Pin 5 and GND.*

#### Circuit Connections
- **Positive Pin (+) $\rightarrow$ Digital Pin 5:** Sends frequency pulses to produce sound notes.
- **Negative Pin (-) $\rightarrow$ GND:** Ground reference.

#### Arduino Example Code
```cpp
int buzzer_pin = 5;

void setup() {
  pinMode(buzzer_pin, OUTPUT);
}

void loop() {
  int notes_len = 25;
  int frequency[] = {262, 262, 294, 262, 349, 330, 262, 262, 294, 262, 
  392, 349, 262, 262, 523, 440, 349, 330, 294, 466, 466, 440, 349, 392, 349};
  float duration[] = {0.5, 0.5, 1, 1, 1, 2, 0.5, 0.5, 1, 1, 1, 2, 0.5, 
  0.5, 1, 1, 1, 1, 3, 0.5, 0.5, 1, 1, 1, 2};

  for (int i = 0; i < notes_len; i++) {
    tone(buzzer_pin, frequency[i], duration[i] * 1000);
    delay(500);
  }
  noTone(buzzer_pin);
}
```

> [!TIP]
> - `tone(pin, frequency, duration)` sends a sound frequency (in Hz) to the buzzer for a set duration.
> - `noTone(pin)` shuts off the sound when the melody finishes.


