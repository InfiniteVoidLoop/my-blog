---
author: DangVoHongPhuc
pubDatetime: 2026-09-04T20:09:20+07
title: "Connect your device to the Internet" 
slug: iot-connect-internet
featured: true
draft: false
tags:
  - series-of-iot
  - introduction-to-iot
  - internet-of-things
description: "A friendly guide to connecting your IoT device to the Internet, completely series of IoT for learning from scratch."
---
This blog will introduce some of the communication protocols that IoT devices can use to connect to the cloud, and types of data they might send or receive.

![Connect Device into Internet](/posts/internet-of-thing/getting-started/deeper-dive-iot/index.png)
## Tables of contents
## Introduction
The **I** in IoT stands for **Internet** - the cloud connectivity can enable a lot of features for your IoT devices from gathering measure data from *sensors*, to sending messages to control the *actuators*.

> [!NOTE]
> * Data gathered from sensors and sent to the cloud is called **telemetry**.
> * Message received from cloud often contains commands to control actuators to perform an action.

## Communication Protocols
* One of the most popular protocols are based around **publish/subscribe messaging** via some kind of broker.  
* The IoT devices connect to the broker, publish telemetry messages and subscribe to commands.
* The cloud services also connect to broker, subscribe to telemetry messages and publish commands to specific devices or to group of devices.

![Publish Subscribe Protocols](@/assets/images/iot/pub-sub.png)

**MQTT** is the most popular communication protocol in IoT.

### Messaging Queueing Telemetry Transport (MQTT)
MQTT has a single broker and multiple clients. All clients connect to the broker and broker routes messages to the relevant clients. Messages are routed based on the *topics**. A client can publish to a topic and any clients that subscribe to that topic can receive the message.

![Message Queuing Telemetry Transport (MQTT)](@/assets/images/iot/mqtt.png)


#### Connect IoT device into MQTT
We will look how to connect IoT nightlight to the internet and allow it to be remotely controlled.
![MQTT_Assignment_1](@/assets/images/iot/assignment-1-internet-flow.png)

##### 1. Add library to communicate over MQTT
```Python
import paho.mqtt.client as mqtt
```
                               
##### 2. Add client_name unique (user older version of MQTT)
```Python

id = '680a5957-ed79-4b84-be34-6c3910a8237c'
client_name = id + 'nightlight_client'

mqtt_client = mqtt.Client(callback_api_version=mqtt.CallbackAPIVersion.VERSION1, client_id=client_name)
```

##### 3. Connect to MQTT broker and starts loop that runs in a background thread listening for messages on any subscribed topics
```Python
mqtt_client.connect('test.mosquitto.org')
mqtt_client.loop_start()
```

