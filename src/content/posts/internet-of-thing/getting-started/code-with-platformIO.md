---
author: DangVoHongPhuc
pubDatetime: 2026-07-16T20:09:20+07
title: "Getting Started with PlatformIO"
slug: code-with-platformIO
featured: true
draft: false
tags:
  - series-of-iot
  - internet-of-things
  - code-with-platformio
description: "A simple introduction to platformIO following with basic project with esp32 microcontroller."
---
This blog will introduce you about **platformIO**, some basic concepts and tutorial to code with MCU **ESP32** using platformIO.


![Getting Started with PlatformIO](/posts/internet-of-thing/getting-started/code-with-platformIO/index.png)

## Table of contents
## Problematic 
* The main problem that repulses people from embedded system development is the complexity of setting up the development environment for specific MCU/board, ...
* Multiple hardware requires different toolchains, libraries, IDEs, etc

* Therefore, platformIO is created to solve this problem.

## What is PlatformIO?
PlatformIO is an open-source ecosystem for IoT development. It includes a cross-platform build system, a library manager, and full support for multiple IDEs. PlatformIO is designed to simplify the development process for embedded systems and microcontrollers.

> [!NOTE]
> * Think of it as nodejs ecosystem you often see or already heard about in frontend, or like a .NET ecosystem in backend. 
> * PlatformIO is a tool that helps you manage your development environment, dependencies, and build process for embedded systems.

## How does it work?
Without going to deep into **PlatformIO** detailed, I will introduce you the basic flow of the project develop using platformIO:
* Users choose boards interested in **platformio.ini** (Project Configuration File)
* Based on this list of boards, PlatformIO will automatically downloads required toolchains, libraries, and dependencies for the selected boards.
* Users develop code and **PlatformIO** makes sure that it is compiled, prepared and uploaded to the selected board.
