---
author: DangVoHongPhuc
pubDatetime: 2026-11-04T13:00:00+07:00
title: "Multilayer Perceptrons: Breaking the Limits of Linearity"
slug: multilayer-perceptrons
featured: true
draft: false
tags:
  - series-of-ai
  - machine-learning
  - deep-learning
  - multilayer-perceptron
  - neural-networks
description: "Why linear models fail in the real world, how hidden layers and activation functions prevent linear collapse, and why MLPs form the bedrock of deep learning."
series: "Artificial Intelligent"
seriesOrder: 6
---

In the previous posts, we built Linear Regression and Softmax Regression. While they worked well on clean benchmarks like Fashion-MNIST, real-world data quickly breaks them. To tackle complex problems like vision and speech, we need our first truly deep network: the **Multilayer Perceptron (MLP)**.

An MLP overcomes the strict boundaries of linear models by stacking multiple layers of neurons connected by non-linear activations. In this guide, we will explore why linear models hit a wall, the math behind "linear collapse," and how hidden layers unlock true learning power.

## Table of contents

---

## 1. The Strict Boundaries of Linear Models

Linear models rely entirely on a single **Affine Transformation**:

$$
\mathbf{o} = \mathbf{W}\mathbf{x} + \mathbf{b}
$$

An affine transformation consists of a matrix multiplication followed by a bias shift. While easy to train, it makes one huge, naive assumption: **Monotonicity**.

### The Flaw of Monotonicity

In a linear model, each feature $x_i$ has a fixed weight $w_i$:
* If $w_i > 0$, increasing $x_i$ **always increases** the output score forever.
* If $w_i < 0$, increasing $x_i$ **always decreases** the output score forever.

A linear model **can never turn around**. It cannot represent U-shaped curves, bell curves, or threshold boundaries. Real-world phenomena almost never follow this rigid rule:

1. **Non-constant Returns (Income vs. Credit Risk):**
   * If someone's income grows from $\$0$ to $\$50,000$, their ability to repay a loan jumps dramatically (say, from $0\%$ to $90\%$).
   * If their income grows from $\$1,000,000$ to $\$1,050,000$, their repayment risk barely changes at all.
   * A linear model rewards both identical $\$50,000$ jumps with the exact same score increase, which makes no economic sense.

2. **Non-monotonic Realities (Human Body Temperature):**
   * Normal body temperature is healthy at $37^\circ\text{C}$ ($98.6^\circ\text{F}$).
   * If temperature drops below $35^\circ\text{C}$ (hypothermia) or climbs above $40^\circ\text{C}$ (severe fever), health deteriorates rapidly in both directions.
   * A linear model is completely blind to this bell curve: it must either claim hotter is always healthier, or colder is always healthier!

3. **Complex Visual Context (Cats vs. Dogs):**
   * Does increasing pixel brightness at coordinate $(14, 14)$ always make an image more likely to be a dog?
   * Obviously not. An animal's identity depends on fur patterns, lighting, and surrounding context, not whether a specific pixel is bright or dark.

### Why Not Just Preprocess Features by Hand?

We could manually engineer features—such as replacing raw temperature $x$ with $|x - 37^\circ\text{C}|$. But for high-dimensional data like images, audio, or text, finding the right manual features is nearly impossible.

Instead of hand-crafting features ourselves, we want a model that **learns its own features** directly from raw data.

---

## 2. Introducing Hidden Layers

We can overcome these limitations by stacking layers on top of one another. We place one or more **Hidden Layers** between the input data and the final output layer:

![Multilayer Perceptron architecture with hidden layer](@/assets/images/artificial-intelligent/MLP/hidden-layers.png)

In this architecture:
* **Input Layer:** Receives the raw features $\mathbf{x} \in \mathbb{R}^d$.
* **Hidden Layers:** Extract increasingly abstract representations from the layer below.
* **Output Layer:** Acts as a linear classifier/regressor operating on the learned representation.

This network of stacked fully connected layers is called a **Multilayer Perceptron (MLP)**.

---

## 3. From Linear to Nonlinear: The Collapse Trap

A natural question arises: *Can we simply stack multiple linear layers together to make a deep model?*

Let's test this mathematically. Suppose we add one hidden layer $\mathbf{H}$ using only linear transformations:

$$
\begin{aligned}
\mathbf{H} &= \mathbf{X}\mathbf{W}^{(1)} + \mathbf{b}^{(1)} \quad \text{(Hidden Layer)} \\
\mathbf{O} &= \mathbf{H}\mathbf{W}^{(2)} + \mathbf{b}^{(2)} \quad \text{(Output Layer)}
\end{aligned}
$$

Now, substitute $\mathbf{H}$ directly into the equation for $\mathbf{O}$:

$$
\begin{aligned}
\mathbf{O} &= \left(\mathbf{X}\mathbf{W}^{(1)} + \mathbf{b}^{(1)}\right)\mathbf{W}^{(2)} + \mathbf{b}^{(2)} \\
&= \mathbf{X}\underbrace{\left(\mathbf{W}^{(1)}\mathbf{W}^{(2)}\right)}_{\mathbf{W}'} + \underbrace{\left(\mathbf{b}^{(1)}\mathbf{W}^{(2)} + \mathbf{b}^{(2)}\right)}_{\mathbf{b}'} \\
&= \mathbf{X}\mathbf{W}' + \mathbf{b}'
\end{aligned}
$$

> [!WARNING]
> **The Linear Collapse:**
> The product of two linear operations is **just another linear operation**. Even if you stack $1,000$ linear layers, the entire deep network algebraically collapses into **a single linear layer** with weight matrix $\mathbf{W}'$ and bias $\mathbf{b}'$. You gain zero expressive power!

---

## 4. The Solution: Activation Functions

To prevent linear collapse and unlock true deep representation learning, we need one essential ingredient: an **element-wise non-linear activation function** $\sigma(\cdot)$ applied to each hidden node:

$$
\begin{aligned}
\mathbf{H} &= \sigma\left(\mathbf{X}\mathbf{W}^{(1)} + \mathbf{b}^{(1)}\right) \\
\mathbf{O} &= \mathbf{H}\mathbf{W}^{(2)} + \mathbf{b}^{(2)}
\end{aligned}
$$

Because $\sigma$ is non-linear, we can no longer factor out the matrices. The model can no longer collapse into a single linear equation!

### Common Activation Functions

#### 1. ReLU (Rectified Linear Unit)
The most popular activation function in modern deep learning because it is fast to compute and prevents gradients from vanishing on positive values:

$$
\text{ReLU}(x) = \max(0, x)
$$

![ReLU Activation Function: Zero for negative inputs, linear for positive inputs](@/assets/images/artificial-intelligent/MLP/relu-function.png)

If $x > 0$, it lets the signal pass through untouched ($\text{gradient} = 1$). If $x \le 0$, it turns the neuron off ($\text{gradient} = 0$).

#### 2. Sigmoid
Smoothly squashes any real value into the probability interval $(0, 1)$:

$$
\sigma(x) = \frac{1}{1 + \exp(-x)}
$$

Historically popular, but rarely used in hidden layers today because its gradients vanish near the tails ($x \to \pm\infty$).

#### 3. Tanh (Hyperbolic Tangent)
Similar to Sigmoid, but centered around zero with output range $(-1, 1)$:

$$
\tanh(x) = \frac{1 - \exp(-2x)}{1 + \exp(-2x)}
$$

---

## 5. Summary & Key Takeaways

* **Linear Limitations:** Linear models enforce monotonicity, making them unable to learn bell curves, thresholds, or spatial contexts.
* **The Linear Collapse Trap:** Stacking linear layers without non-linear activations mathematically collapses back into a single linear model.
* **The Power of MLPs:** Stacking linear layers with non-linear activations ($\sigma$) enables the network to learn rich, hierarchical feature representations automatically.
* **ReLU is King:** For hidden layers in modern deep learning, $\text{ReLU}(x) = \max(0, x)$ is the standard default choice due to its simplicity and robust gradients.
