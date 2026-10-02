---
author: DangVoHongPhuc
pubDatetime: 2026-10-02T20:09:20+07
title: "What is a Neural Network?"
slug: introducing-neural-network
featured: true
draft: false
tags:
  - series-of-ai
  - neural-network
description: "A friendly guide to understanding the concepts of Neural Networks, part of the AI series for learning from scratch."
series: "Artificial Intelligent"
seriesOrder: 1
---

This blog will briefly introduce the core concepts of **Neural Networks**.

![What is a Neural Network?](/posts/artificial-intelligent/introducing-neural-network/index.png)

## Table of contents

## What is the Neural Network?

On the surface, a machine recognizing handwritten digits seems not an impressive task at all. I bet you can tell that these are all images of the digit three:

![Handwritten Digit Three Samples](@/assets/images/artificial-intelligent/digit-recognition-1.png)

* Each "three" is drawn differently, yet you can somehow easily recognize it. But if I told you to sit down and write a program that takes in a grid of 28x28 pixels and outputs a single number between 0 and 9, the task goes from easy to extremely difficult.

* Somehow, identifying digits is incredibly easy for your brain to do, but almost impossible for you to describe *how* you do it. Furthermore, traditional methods of computer programming—with normal loops, classes, objects, and functions—don't seem suitable to tackle this problem.

* But **what if** we could write a program that mimics the structure of your brain? That's exactly the core idea behind **neural networks**.

---

## The Structure of a Neural Network

An **Artificial Neural Network (ANN)** is composed of interconnected units called **neurons** (or nodes) organized into distinct **layers**:

### 1. Neurons & Activations
* A **neuron** is a container holding a single number, known as its **activation value** (typically ranging from `0.0` to `1.0`).
* Higher activation means the neuron is strongly "lit up" or firing.

---

### 2. The Three Types of Layers

1. **Input Layer:**
   * Receives raw data from the outside world.
   * For our 28x28 pixel digit image, the input layer consists of **784 neurons** ($28 \times 28 = 784$), where each neuron's activation corresponds to the brightness of a single pixel.

2. **Hidden Layers:**
   * Located between the input and output layers.
   * These layers extract patterns step-by-step. The first hidden layer might recognize small edges or line segments; the second might assemble those edges into loops or curves (like the top half of a 3).

3. **Output Layer:**
   * Provides the final answer.
   * Consists of **10 neurons** representing the digits `0` through `9`. The neuron with the highest activation score is the network's final prediction!

---

### 3. How Neurons Connect: Weights & Biases

Information flows through connections between neurons:

* **Weights ($w$):** Every connection has an assigned weight—a number indicating how strongly one neuron influences another. Positive weights excite target neurons, while negative weights inhibit them.
* **Biases ($b$):** An extra offset added to each neuron to control its threshold for activation (how easily it fires).

---

### 4. How a Neuron Computes its Output

Each neuron calculates a weighted sum of its inputs plus a bias:

$$z = (w_1 x_1 + w_2 x_2 + \dots + w_n x_n) + b$$

Then, it passes this result through an **activation function** (such as Sigmoid or ReLU) to compress the output into a normalized range and introduce non-linearity.

---

## How Neural Networks Learn 🎯

A brand-new neural network starts with completely random weights and biases—meaning its initial guesses are pure garbage!

Learning happens through a 3-step loop:

1. **Forward Propagation:** Pass the input image through the network to compute a prediction.
2. **Loss Calculation:** Compare the prediction with the true label to calculate the **Cost / Loss** (how wrong the network was).
3. **Backpropagation & Optimization:** Use gradient descent to tweak every weight and bias slightly to reduce the error on the next try.

Repeat this process over thousands of training examples, and the network gradually learns to recognize digits with remarkable accuracy!
