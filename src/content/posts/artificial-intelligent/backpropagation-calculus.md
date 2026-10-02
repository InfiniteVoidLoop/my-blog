---
author: DangVoHongPhuc
pubDatetime: 2026-10-03T00:58:00+07
title: "Backpropagation Calculus"
slug: backpropagation-calculus
featured: true
draft: false
tags:
  - series-of-ai
  - neural-network
  - backpropagation
  - calculus
description: "A deep dive into the calculus behind Backpropagation — understanding chain rule, partial derivatives, and gradient flow in Neural Networks."
series: "Artificial Intelligent"
seriesOrder: 2
---

This post covers the mathematical foundation of **Backpropagation Calculus**, explaining step-by-step how gradients flow backwards through a neural network using the multivariable chain rule.

![Backpropagation Calculus](@/assets/images/artificial-intelligent/backprop-hero.png)

## Table of contents

## Introduction to Backpropagation

Backpropagation is the engine that drives neural network learning. While forward propagation computes the network's output prediction, backpropagation calculates how sensitive the final cost/loss is to small changes in every weight ($w$) and bias ($b$) throughout the network.

---

## 1. The Goal: Gradient of the Loss Function

To minimize the network's error (Loss $\mathcal{L}$), we need to find the partial derivatives with respect to each weight and bias:

$$
\frac{\partial \mathcal{L}}{\partial w^{(L)}}, \quad \frac{\partial \mathcal{L}}{\partial b^{(L)}}
$$

Using these partial derivatives, Gradient Descent updates weights and biases in the direction that decreases the loss:

$$
w \leftarrow w - \alpha \frac{\partial \mathcal{L}}{\partial w}
$$

where $\alpha$ is the learning rate.

---

## 2. Applying the Chain Rule (A Single Neuron)

Consider a single neuron in layer $L$:

1. **Weighted Input:** $z^{(L)} = w^{(L)} a^{(L-1)} + b^{(L)}$
2. **Activation Output:** $a^{(L)} = \sigma(z^{(L)})$
3. **Cost/Loss:** $\mathcal{L} = (a^{(L)} - y)^2$

By the Multivariable Chain Rule, the derivative of loss with respect to weight $w^{(L)}$ is split into three factors:

$$
\frac{\partial \mathcal{L}}{\partial w^{(L)}} = \frac{\partial \mathcal{L}}{\partial a^{(L)}} \cdot \frac{\partial a^{(L)}}{\partial z^{(L)}} \cdot \frac{\partial z^{(L)}}{\partial w^{(L)}}
$$

Evaluating each component:

* $\frac{\partial \mathcal{L}}{\partial a^{(L)}} = 2(a^{(L)} - y)$ (How much loss changes with activation)
* $\frac{\partial a^{(L)}}{\partial z^{(L)}} = \sigma'(z^{(L)})$ (Derivative of activation function)
* $\frac{\partial z^{(L)}}{\partial w^{(L)}} = a^{(L-1)}$ (Activation of previous neuron)

Combining them yields:

$$
\frac{\partial \mathcal{L}}{\partial w^{(L)}} = 2(a^{(L)} - y) \cdot \sigma'(z^{(L)}) \cdot a^{(L-1)}
$$

---

## What's Next?

In the next sections, we will expand this formulation to multilayer networks using matrix calculus and index notation ($\delta^{(L)}$ error vectors).
