---
author: DangVoHongPhuc
pubDatetime: 2026-09-02T20:09:20+07
title: "Deeper Dive into Internet of Things (IoT)"
slug: deeper-dive-iot
featured: true
draft: false
tags:
  - series-of-iot
  - introduction-to-iot
  - internet-of-things
description: "A friendly guide to understanding the deeper concepts of Internet of Things (IoT), completely series of IoT for learning from scratch."
---
This blog will go deep down into concepts around **Internet of Things (IoT)**, its applications, and how to get started with IoT development.

![Deeper Dive into Internet Of Things](/posts/internet-of-thing/getting-started/deeper-dive-iot/index.png)

## Table of contents
## Components of IoT Applications
**The two main components of an IoT Application are the *Internet* and the *Thing***
### The Thing
* **The Thing** refers to the device that can interact with the physical world.
* These devices are usually small, low-priced, running at low-speed and consuming low power.

* For example, a simple **MCU** with kilobytes of RAM (as opposed to gigabytes in a PC) running at only a few hundred megahertz (as opposed to gigahertz in a PC), but consuming very low power that they can run weeks and months or even years on batteries. 

One typical example is the **smart thermostat** - device that has a temperature sensor, the temperature sensor can detect the room is too cold and the actuator can turn on the heater to warm up the room.

![Basic Thermostat](@/assets/images/iot/basic-thermostat.png)

### The Internet
* The **Internet** side of IoT consists applications that can process data from the *Thing* and send data back to the *Thing* to perform actions. These applications are usually running on **cloud servers** and can be accessed via **web browsers** or **mobile apps**.
* Typical used are **cloud service** for security, making decisions, store sensor data.
* Devices also don't always connect to each other via Wifi or wired-connection. Some devices can use mesh network such as *Bluetooth*, connecting via a *hub device* that has an internet connection.

* With the example of the **Thermostat**, we can use home Wifi to connect to cloud service to store data or other services that the homeowner want like sending to mobile app and the homeowner can turn on or off...
![Mobile Controller Thermostat](@/assets/images/iot/mobile-controlled-thermostat.png)

* Even smarter version could use AI in cloud service for making decisions like turning on or off heater based on the calendar like the rainy day, summer, winter, ...

![AI Thermostat](@/assets/images/iot/smarter-thermostat.png)

## Deeper dive into microcontrollers
In the last blog, I already mentioned about **Microcontroller - MCU**. Let's now deeper dive into it.
### The CPU
* The **brain** of the microcontroller, CPU can have multiple cores that can work to run your code.
* CPUs rely on a clock to tick many millions or billions of times per second. Each tick, or cycle is the actions that CPU can take.
* CPU speed is measured in **Hertz (Hz)**, a standard unit where 1 Hz means one cycle or clock tick per second.
> [!NOTE] 
> * CPU speeds are often at **megahertz (MHz)** or **gigahertz (GHz)**. 1 MHz = 1 million cycles per second, 1 GHz = 1 billion cycles per second.
> * CPUs execute programs using the **fetch-decode-execute** cycle. It executes using arithmetic logic unit (ALU) to perform addition from 2 registers.

![Fetch Decode Execute Cycle](@/assets/images/iot/fetch-decode-execute.png)

### The Memory

Microcontrollers typically feature two types of memory, which are thousands of times smaller than those in a typical PC:

* **Program Memory (Non-volatile):** Stores your program code. Data is retained even when power is turned off.
* **RAM (Volatile):** Used while your program runs to store variables and sensor data. Data is reset when power is lost.

> [!NOTE]
> **RAM Scale:** A typical PC has **8 Gigabytes (GB)** of RAM, whereas a microcontroller may only have **Kilobytes (KB)** (e.g. 192KB) — over 40,000 times smaller!

![RAM Comparison 192KB vs 8GB](@/assets/images/iot/ram-comparison.png)

### Input/Output (I/O) Connections
## Deeper dive into single-board computers
