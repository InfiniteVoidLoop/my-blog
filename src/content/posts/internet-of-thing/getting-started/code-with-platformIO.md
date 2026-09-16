---
author: DangVoHongPhuc
pubDatetime: 2026-09-16T20:09:20+07
title: "Getting Started with PlatformIO & ESP32"
slug: code-with-platformIO
featured: true
draft: false
tags:
  - series-of-iot
  - internet-of-things
  - code-with-platformio
description: "Say goodbye to messy vendor IDEs! A simple, developer-friendly guide to setting up PlatformIO in Neovim and coding your first ESP32 project."
---
Say goodbye to clunky vendor IDEs! In this guide, we will explore **PlatformIO**, understand why it is a game-changer for embedded development, and set up your first **ESP32** project right inside **Neovim**.

> [!NOTE]
> 📌 **IoT Series (Part 6 of 6):** This is the sixth article in our IoT series.
> * 👈 Previous: **[Part 5: Overview of Physical Works in IoT](/posts/internet-of-thing/getting-started/overview-physical-works-iot/)**
> * 🏠 Start: **[Part 1: Introduction to Internet of Things (IoT)](/posts/internet-of-thing/getting-started/getting-started-iot/)**

![Getting Started with PlatformIO](/posts/internet-of-thing/getting-started/code-with-platformIO/index.png)

## Table of contents

## The Embedded Dev Headache 😫

If you have ever tried embedded development, you know the pain:
* Every new board (Arduino, ESP32, STM32, Raspberry Pi Pico) forces you to download a different IDE, toolchain, and driver package.
* Managing external libraries across projects quickly turns into a mess.
* Most vendor IDEs feel stuck in 2005.

That is exactly why **PlatformIO** was born!

---

## What is PlatformIO? 🚀

**PlatformIO** is an open-source, cross-platform ecosystem for IoT and embedded development.

> [!NOTE]
> 💡 **Analogy:** Think of PlatformIO as **`npm` for JavaScript** or **`Cargo` for Rust**, but for embedded hardware microcontrollers! It manages your development environment, toolchains, board configurations, and external libraries automatically.

---

## How Does It Work? ⚙️

Building a project with PlatformIO follows a clean, automated workflow:

1. **Define Your Board:** Specify your target hardware in `platformio.ini` (e.g., `board = esp32dev`).
2. **Auto-Fetch Dependencies:** PlatformIO automatically downloads the exact C/C++ compilers, SDKs, frameworks, and libraries required.
3. **Build & Upload:** With a single command, PlatformIO compiles your code and flashes it straight to your microcontroller!

---

## Setting Up PlatformIO in Neovim 🛠️

For Neovim enthusiasts, you do not need to leave your editor! We can use [`nvim-platformio.lua`](https://github.com/anurag3301/nvim-platformio.lua) for a seamless setup.

### 1. Prerequisites
Make sure **Python** and **PlatformIO Core** are installed on your system:
```bash
pip install platformio
```

### 2. Install the Neovim Plugin
Add `nvim-platformio.lua` to your Neovim plugin manager (e.g., `lazy.nvim`):

```lua
return {
  'anurag3301/nvim-platformio.lua',
  dependencies = {
    { 'akinsho/toggleterm.nvim' },
    { 'nvim-lua/plenary.nvim' },
    { 'folke/which-key.nvim' },
    { 'nvim-treesitter/nvim-treesitter' },

    -- Choose your preferred picker (Telescope, Snacks, or Mini.Pick)
    { 'nvim-telescope/telescope.nvim' },
    { 'nvim-telescope/telescope-ui-select.nvim' },
  },
}
```

---

## Initializing Your First Project 🎯

### Step 1: Trigger Project Setup
Run the `:Pioinit` command in Neovim to start the project initialization wizard:

![Initialize PlatformIO Project](@/assets/images/iot/pioinit.png)

### Step 2: Select Your Microcontroller Board
Search and select your board (for example, **ESP32 Dev Module**):

![Select Board in PlatformIO](@/assets/images/iot/list-boards.png)

> [!TIP]
> The picker displays board specifications, RAM/Flash sizes, and capabilities on the side. You can also manually tweak `platformio.ini` later to adjust baud rates or add external libraries!

### Step 3: Explore the Generated Project Structure
Once initialized, PlatformIO generates a clean workspace structure:

![PlatformIO File Structure](@/assets/images/iot/platformio-file-structure.png)

Key directories & files:
* **`platformio.ini`:** The core project configuration file (defines board, framework, libraries).
* **`src/main.cpp`:** Your main C++ entry point containing `setup()` and `loop()`.
* **`lib/`:** Put your project-specific custom C/C++ libraries here.

Super clean and easy setup! Now you are ready to write code and flash your ESP32 effortlessly. 🎉

---

## 📖 Series Navigation

👈 Back to **[Part 5: Overview of Physical Works in IoT](/posts/internet-of-thing/getting-started/overview-physical-works-iot/)**  
🏠 Return to **[Part 1: Introduction to Internet of Things (IoT)](/posts/internet-of-thing/getting-started/getting-started-iot/)**

### 📚 Complete IoT Getting Started Series
1. **[Part 1: Introduction to Internet of Things (IoT)](/posts/internet-of-thing/getting-started/getting-started-iot/)**
2. **[Part 2: Deeper Dive into Internet of Things (IoT)](/posts/internet-of-thing/getting-started/deeper-dive-iot/)**
3. **[Part 3: Sensors and Actuators in Internet of Things (IoT)](/posts/internet-of-thing/getting-started/sensors-actuators-iot/)**
4. **[Part 4: Connect your device to the Internet](/posts/internet-of-thing/getting-started/iot-connect-internet/)**
5. **[Part 5: Overview of Physical Works in IoT](/posts/internet-of-thing/getting-started/overview-physical-works-iot/)**
6. **[Part 6: Getting Started with PlatformIO](/posts/internet-of-thing/getting-started/code-with-platformIO/)**
