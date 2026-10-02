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
description: "A comprehensive mathematical guide to Backpropagation Calculus — understanding chain rule, partial derivatives, and gradient flow in Neural Networks."
series: "Artificial Intelligent"
seriesOrder: 2
---

This post covers the mathematical foundation of **Backpropagation Calculus**, explaining step-by-step how gradients flow backwards through a neural network using the *multivariable chain rule*.

![Backpropagation Calculus](@/assets/images/artificial-intelligent/backprop-hero.png)

## Table of contents

## What is Backpropagation Calculus?

**Backpropagation** is the foundational algorithm that computes the **gradient of the cost function** $\nabla C$. The entries of this *gradient vector* represent the **partial derivatives** of the cost function $C$ with respect to every **weight** ($w$) and **bias** ($b$) throughout the network:

$$
\nabla C = \begin{bmatrix}
\frac{\partial C}{\partial w^{(1)}} \\[0.6em]
\frac{\partial C}{\partial b^{(1)}} \\[0.4em]
\vdots \\[0.4em]
\frac{\partial C}{\partial w^{(L)}} \\[0.6em]
\frac{\partial C}{\partial b^{(L)}}
\end{bmatrix}
$$

Calculating these partial derivatives quantifies how sensitive the network's total error is to small perturbations in each parameter, enabling **Gradient Descent** to systematically update parameters in the direction of steepest descent: $w \leftarrow w - \alpha \frac{\partial C}{\partial w}$ (where $\alpha$ is the *learning rate*).

---

## 1. Simple Case: One Neuron per Layer

To understand the calculus intuitively, consider a simplified network where each layer contains a single **neuron**.

![Simple Neural Network with 1 Neuron per Layer](@/assets/images/artificial-intelligent/backprop-simple-network.svg)
*Figure 1: A simplified neural network architecture with one neuron per layer.*

![Weights and Biases in Single Neuron Network](@/assets/images/artificial-intelligent/backprop-weights-biases.svg)
*Figure 2: Parameters ($w$ and $b$) defining connections and activation thresholds between consecutive neurons.*

For a single training sample with desired target output $y$:
* **Weighted Input:** $z^{(L)} = w^{(L)} a^{(L-1)} + b^{(L)}$
* **Activation Output:** $a^{(L)} = \sigma(z^{(L)})$ (where $\sigma$ is the *activation function*)
* **Sample Cost:** $C_0 = (a^{(L)} - y)^2$ (the *squared error loss*)

### The Chain Rule Breakdown

![Dependency Tree of Variables](@/assets/images/artificial-intelligent/backprop-tree.jpg)
*Figure 3: Computational dependency graph illustrating how $w^{(L)}, b^{(L)}, a^{(L-1)}$ determine $z^{(L)}$, which computes activation $a^{(L)}$, ultimately yielding cost $C_0$.*

To determine how a small change in weight $w^{(L)}$ impacts the cost $C_0$, we apply the **Multivariable Chain Rule**:

$$
\frac{\partial C_0}{\partial w^{(L)}} = \frac{\partial z^{(L)}}{\partial w^{(L)}} \cdot \frac{\partial a^{(L)}}{\partial z^{(L)}} \cdot \frac{\partial C_0}{\partial a^{(L)}}
$$

![Chain Rule Breakdown Ratios](@/assets/images/artificial-intelligent/backprop-chain-rule-breakdown.svg)
*Figure 4: Decomposing the partial derivative $\frac{\partial C_0}{\partial w^{(L)}}$ into three constituent derivative ratios.*

### Computing the Three Factors

1. **Previous Activation Sensitivity:**
   $$
   \frac{\partial z^{(L)}}{\partial w^{(L)}} = a^{(L-1)}
   $$
   *(Reflects **Hebbian learning**: higher activation $a^{(L-1)}$ amplifies the weight change's effect on the weighted input).*

2. **Activation Function Gradient:**
   $$
   \frac{\partial a^{(L)}}{\partial z^{(L)}} = \sigma'(z^{(L)})
   $$
   *(Measures the local derivative/slope of the non-linear activation function).*

3. **Output Error Sensitivity:**
   $$
   \frac{\partial C_0}{\partial a^{(L)}} = 2(a^{(L)} - y)
   $$
   *(Proportional to the raw prediction error; larger errors induce steeper gradient updates).*

### Combining the Partial Derivatives

Multiplying these three factors yields the exact sensitivity for a single weight:

$$
\frac{\partial C_0}{\partial w^{(L)}} = a^{(L-1)} \cdot \sigma'(z^{(L)}) \cdot 2(a^{(L)} - y)
$$

Similarly, for the **bias** $b^{(L)}$, since $\frac{\partial z^{(L)}}{\partial b^{(L)}} = 1$:

$$
\frac{\partial C_0}{\partial b^{(L)}} = 1 \cdot \sigma'(z^{(L)}) \cdot 2(a^{(L)} - y)
$$

---

## 2. Propagating Backwards to Hidden Layers

To compute gradients for parameters in earlier hidden layers (e.g., $w^{(L-1)}$), we first evaluate the cost's sensitivity to the previous activation $a^{(L-1)}$:

$$
\frac{\partial C_0}{\partial a^{(L-1)}} = \frac{\partial z^{(L)}}{\partial a^{(L-1)}} \cdot \frac{\partial a^{(L)}}{\partial z^{(L)}} \cdot \frac{\partial C_0}{\partial a^{(L)}} = w^{(L)} \cdot \sigma'(z^{(L)}) \cdot 2(a^{(L)} - y)
$$

By computing $\frac{\partial C_0}{\partial a^{(L-1)}}$, we **backward propagate** the error signal layer-by-layer, efficiently evaluating derivatives for all preceding weights and biases.

---

## 3. Cost Over All Training Examples

The overall **cost function** $C$ across a full dataset of $n$ samples is the arithmetic mean:

$$
C = \frac{1}{n} \sum_{k=0}^{n-1} C_k
$$

By the linearity of differentiation, the derivative of total cost $C$ with respect to any parameter is the average of individual sample derivatives:

$$
\frac{\partial C}{\partial w^{(L)}} = \frac{1}{n} \sum_{k=0}^{n-1} \frac{\partial C_k}{\partial w^{(L)}}
$$

---

## 4. Generalizing to Multineuron Layers

In a general deep network with multiple neurons per layer:
* $a_k^{(L-1)}$: Activation of neuron $k$ in layer $L-1$.
* $a_j^{(L)}$: Activation of neuron $j$ in layer $L$.
* $w_{jk}^{(L)}$: Weight connecting neuron $k$ in layer $L-1$ to neuron $j$ in layer $L$.

![Multineuron Layer Indexing](@/assets/images/artificial-intelligent/backprop-multineuron-indices.jpg)
*Figure 5: Indexing activations $a_k^{(L-1)}$ and $a_j^{(L)}$ alongside weight matrix entry $w_{jk}^{(L)}$ across dense layers.*

The weighted sum $z_j^{(L)}$ for neuron $j$ is:

$$
z_j^{(L)} = \sum_{k} w_{jk}^{(L)} a_k^{(L-1)} + b_j^{(L)}
$$

### Multiple Paths of Computational Influence

In fully connected layers, a single neuron $k$ in layer $L-1$ influences **every** neuron $j$ in layer $L$. Consequently, changing $a_k^{(L-1)}$ affects the cost through **multiple computation paths**. By multivariate calculus, we sum the chain rule across all output neurons in layer $L$:

$$
\frac{\partial C_0}{\partial a_k^{(L-1)}} = \sum_{j=0}^{n_L - 1} \frac{\partial z_j^{(L)}}{\partial a_k^{(L-1)}} \cdot \frac{\partial a_j^{(L)}}{\partial z_j^{(L)}} \cdot \frac{\partial C_0}{\partial a_j^{(L)}} = \sum_{j=0}^{n_L - 1} w_{jk}^{(L)} \cdot \sigma'(z_j^{(L)}) \cdot \frac{\partial C_0}{\partial a_j^{(L)}}
$$

---

## Conclusion & Algorithmic Summary

![Backpropagation Calculus Formula Summary](@/assets/images/artificial-intelligent/backprop-summary.jpg)
*Figure 6: Complete mathematical formulation of backpropagation partial derivatives across multi-layer neural networks.*

* **Chain Rule Engine:** Backpropagation reduces high-dimensional neural network optimization into recursive multiplications of **local partial derivatives**.
* **Reverse Information Flow:** Gradients are evaluated backwards from the output layer towards the input layer (**backward pass**).
* **Matrix Vectorization:** Modern deep learning frameworks (PyTorch, TensorFlow) convert these scalar partial derivatives into vectorized **matrix multiplications** ($\nabla_W C$), maximizing GPU parallelization.
