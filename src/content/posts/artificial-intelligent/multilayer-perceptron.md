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
description: "Why linear models fail in the real world, how hidden layers and activation functions prevent linear collapse, and how to tame vanishing and exploding gradients in deep MLPs."
series: "Artificial Intelligent"
seriesOrder: 6
---

In the previous posts, we built Linear Regression and Softmax Regression. While they worked well on clean benchmarks like Fashion-MNIST, real-world data quickly breaks them. To tackle complex problems like vision and speech, we need our first truly deep network: the **Multilayer Perceptron (MLP)**.

An MLP overcomes the strict boundaries of linear models by stacking multiple layers of neurons connected by non-linear activations. In this guide, we will explore why linear models hit a wall, the math behind "linear collapse," how hidden layers unlock true learning power, and why numerical stability (vanishing and exploding gradients) governs deep network training.

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
   * If someone's income grows from &dollar;0 to &dollar;50,000, their ability to repay a loan jumps dramatically (say, from 0% to 90%).
   * If their income grows from &dollar;1,000,000 to &dollar;1,050,000, their repayment risk barely changes at all.
   * A linear model rewards both identical &dollar;50,000 jumps with the exact same score increase, which makes no economic sense.

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

![Sigmoid Activation Function: S-shaped curve squashing inputs into (0, 1)](@/assets/images/artificial-intelligent/MLP/sigmoid-function.png)

Historically popular, but rarely used in hidden layers today because its gradients vanish near the tails ($x \to \pm\infty$).

#### 3. Tanh (Hyperbolic Tangent)
Similar to Sigmoid, but centered around zero with output range $(-1, 1)$:

$$
\tanh(x) = \frac{1 - \exp(-2x)}{1 + \exp(-2x)}
$$

![Tanh Activation Function: Zero-centered S-shaped curve squashing inputs into (-1, 1)](@/assets/images/artificial-intelligent/MLP/tan-function.png)

---

## 5. Numerical Stability: Vanishing and Exploding Gradients

Once we start stacking multiple hidden layers, a new critical challenge emerges during training: **Numerical Stability**. 

When computing gradients via backpropagation, signals must travel backwards through every single layer from the output to the input. In deep networks, this backward journey often causes gradients to either shrink to zero (**vanishing**) or blow up to infinity (**exploding**).

### The Math Behind the Danger: Repeated Matrix Multiplication

Consider a deep network with $L$ layers. The output at layer $l$ is produced by a transformation $f_l$ parameterized by weights $\mathbf{W}^{(l)}$:

$$
\mathbf{h}^{(l)} = f_l\left(\mathbf{h}^{(l-1)}\right) \quad \text{and} \quad \mathbf{o} = f_L \circ \dots \circ f_1(\mathbf{x})
$$

To update the weights $\mathbf{W}^{(l)}$ at an earlier layer $l$, backpropagation applies the chain rule, tracing backward from the final layer $L$ to layer $l$:

$$
\partial_{\mathbf{W}^{(l)}} \mathbf{o} = \underbrace{\partial_{\mathbf{h}^{(L-1)}} \mathbf{h}^{(L)}}_{\mathbf{M}^{(L)}} \cdots \underbrace{\partial_{\mathbf{h}^{(l)}} \mathbf{h}^{(l+1)}}_{\mathbf{M}^{(l+1)}} \underbrace{\partial_{\mathbf{W}^{(l)}} \mathbf{h}^{(l)}}_{\mathbf{v}^{(l)}}
$$

Notice the structure:
* **$\mathbf{M}^{(k)} = \partial_{\mathbf{h}^{(k-1)}} \mathbf{h}^{(k)}$:** The Jacobian matrix measuring how layer $k$ changes with respect to the layer before it.
* **$\mathbf{v}^{(l)} = \partial_{\mathbf{W}^{(l)}} \mathbf{h}^{(l)}$:** The local gradient with respect to layer $l$'s own weights.

The gradient for layer $l$ is a **product of $L - l$ matrices**:

$$
\text{Gradient} = \mathbf{M}^{(L)} \times \mathbf{M}^{(L-1)} \times \dots \times \mathbf{M}^{(l+1)} \times \mathbf{v}^{(l)}
$$

### The Two Failure Modes

Think of this repeated multiplication like compounding interest over dozens of cycles:

```
                       ┌─── If factors < 1 (e.g., 0.8) ───► 0.8^50 ≈ 0.000014 (Vanishes to 0)
                       │                                   ==> Early layers stop learning!
Repeated Product (M) ──┤
                       │
                       └─── If factors > 1 (e.g., 1.2) ───► 1.2^50 ≈ 9,100 (Explodes to ∞)
                                                           ==> Loss blows up to NaN!
```

#### 1. Vanishing Gradients (When Factors $< 1$)
If the eigenvalues of the matrices $\mathbf{M}$ are smaller than $1$, each backward step diminishes the gradient signal. By the time the gradient reaches the earliest layers ($\mathbf{W}^{(1)}, \mathbf{W}^{(2)}$), it shrinks to near zero ($10^{-8}$ or smaller).
* **The Consequence:** Because $\mathbf{W} \leftarrow \mathbf{W} - \eta \cdot \text{Gradient}$, early layers receive virtually no update. They remain frozen at their random initializations, and the network fails to learn foundational low-level features (such as edges and textures).

### Case Study: Why Sigmoid Causes Vanishing Gradients

Historically, the **Sigmoid function** was the default choice because it mimicked biological neurons—either firing ($1$) or staying quiet ($0$). However, its derivative is the primary reason deep networks failed to train for decades:

$$
\sigma(x) = \frac{1}{1 + \exp(-x)} \implies \frac{d\sigma}{dx} = \sigma(x)\big(1 - \sigma(x)\big)
$$

During backpropagation, computing the gradient through a hidden layer simply evaluates this derivative at the cached pre-activation value $z$:

$$
\frac{\partial h}{\partial z} = \sigma'(z) = h(1 - h)
$$

Let's inspect what happens to this derivative across different input values using PyTorch:

```python
import torch

# 1. Create input range from -8 to +8
x = torch.arange(-8.0, 8.0, 0.1, requires_grad=True)

# 2. Forward pass through sigmoid
y = torch.sigmoid(x)

# 3. Backward pass to compute dy/dx
y.backward(torch.ones_like(x))
```

Plotting the Sigmoid function alongside its gradient reveals the mathematical trap:

![Sigmoid and its gradient showing vanishing gradient outside Goldilocks zone](@/assets/images/artificial-intelligent/MLP/sigmoid-gradient.png)

Look closely at the derivative curve (dashed line):
1. **The 0.25 Ceiling:** The absolute maximum derivative of Sigmoid occurs at $x = 0$, where $\sigma'(0) = 0.5 \times (1 - 0.5) = \mathbf{0.25}$. Everywhere else, it is even smaller.
2. **The Saturation Trap:** When inputs are large or small ($|x| > 4$), the function flattens out (*saturation*), and the derivative collapses straight to **$0.0$**.
3. **The Goldilocks Zone:** Unless all neurons miraculously stay in the narrow "Goldilocks zone" near $x \approx 0$, gradients vanish immediately.
4. **The Compounding Collapse:** Even in the best-case scenario where every layer sits at $x = 0$, multiplying $0.25$ across layers shrinks the gradient exponentially:
   * Across $5$ layers: $(0.25)^5 \approx 0.00097$
   * Across $10$ layers: $(0.25)^{10} \approx 0.00000095$ ($< 10^{-6}$)
   * Across $20$ layers: $(0.25)^{20} \approx 9 \times 10^{-13}$ (effectively zero)

Before the gradient can travel back to the first layer, the signal is completely snuffed out. This is why **ReLU** ($\text{ReLU}'(x) = 1$ for $x > 0$) replaced Sigmoid as the standard activation function for deep hidden layers.

#### 2. Exploding Gradients (When Factors $> 1$)
If the eigenvalues of $\mathbf{M}$ are consistently greater than $1$, the product grows exponentially. 

To see this in action, multiply $100$ small random matrices of size $4 \times 4$ with variance $\sigma^2 = 1$:

```python
import torch

M = torch.normal(0, 1, size=(4, 4))
for _ in range(100):
  M = M @ torch.normal(0, 1, size=(4, 4))
print(M)
```

The output explodes to astronomical scales:

```text
tensor([[-2.9185e+23,  1.3915e+25, -1.1865e+25,  1.4354e+24],
        [ 4.9142e+23, -2.3430e+25,  1.9979e+25, -2.4169e+24], ...]])
```

* **The Consequence:** When gradients reach $10^{25}$, weight updates take colossal leaps that blow up parameters. In code, this manifests as numerical overflow: `loss: NaN` or `Inf`.

> [!NOTE]
> **Why Can't We Use the Log-Space Trick?**  
> In probability, multiplying many small probabilities causes numerical underflow, which is easily fixed by summing logarithms: $\log(p_1 \times p_2) = \log p_1 + \log p_2$.  
> With gradients, however, the matrices contain both positive and negative values (for which real logarithms are undefined), and optimization requires the exact numeric values to update weights directly.

---

### Breaking the Symmetry: The "Twin Trap"

Why can't we initialize all weights to zero ($W = 0$) or a constant ($W = c$)?

In linear regression, starting at $W = 0$ works fine. In neural networks, it completely paralyzes learning:

1. **Identical Forward Pass:** If all neurons in a layer share identical weights, they compute the exact same activation ($h_A = h_B$).
2. **Identical Gradients:** During backpropagation, they receive the exact same error signal, giving identical gradients ($\nabla W_A = \nabla W_B$).
3. **Identical Updates:** Both neurons update to the exact same new weights.

> [!WARNING]
> **The Twin Trap:**  
> If weights start equal, neurons stay locked as identical twins forever. A hidden layer of $1,000$ neurons will act like **just a single neuron**, wasting your network's capacity.

* **The Solution (Random Initialization):** We must initialize weights randomly. This **breaks the symmetry**, allowing each neuron to specialize in a distinct feature.
* **Dropout Bonus:** While standard gradient descent cannot break symmetry on its own, **Dropout** can—by randomly turning off one neuron while keeping its twin active.

---

### Xavier Initialization: Keeping Variance Stable

If we must initialize randomly, *how big or small should those initial random weights be?*

Think of a deep network like a chain of audio amplifiers:
* If each layer amplifies the signal by $2\times$, the output rapidly deafens into an ear-piercing screech ($10^{25}$ — **Exploding**).
* If each layer cuts the signal in half ($0.5\times$), the audio fades into complete silence ($0$ — **Vanishing**).
* **The Goal:** Keep the signal's spread (**variance**) stable at roughly $1.0\times$ from layer to layer.

#### The Math Made Simple

A neuron computes the sum of its $n_{\text{in}}$ incoming inputs: $o_i = \sum_{j=1}^{n_{\text{in}}} w_{ij} x_j$.

1. **Forward Pass:** Adding $n_{\text{in}}$ inputs multiplies the variance by $n_{\text{in}} \sigma^2$. To keep the signal stable, we want $\sigma^2 = \frac{1}{n_{\text{in}}}$.
2. **Backward Pass:** Gradients flowing backward pass through $n_{\text{out}}$ outputs. To keep gradients stable, we want $\sigma^2 = \frac{1}{n_{\text{out}}}$.
3. **The Xavier Compromise:** Since $n_{\text{in}} \neq n_{\text{out}}$, Xavier initialization takes their harmonic balance:

$$
\sigma^2 = \frac{2}{n_{\text{in}} + n_{\text{out}}} \iff \sigma = \sqrt{\frac{2}{n_{\text{in}} + n_{\text{out}}}}
$$

In PyTorch, Xavier initialization samples weights from:
* **Normal Distribution:** $W \sim \mathcal{N}\left(0, \frac{2}{n_{\text{in}} + n_{\text{out}}}\right)$
* **Uniform Distribution:** $W \sim U\left(-\sqrt{\frac{6}{n_{\text{in}} + n_{\text{out}}}}, \sqrt{\frac{6}{n_{\text{in}} + n_{\text{out}}}}\right)$

> [!TIP]
> **The Core Rule:**  
> The more inputs and outputs a layer has, the **smaller** its initial weights must be. This simple rule prevents signals and gradients from ever blowing up or dying out.

---

### How Modern Deep Learning Tames the Gradients

To train deep networks reliably, deep learning uses several complementary solutions:
1. **ReLU Activations:** For positive inputs, $\text{ReLU}'(x) = 1$, allowing gradients to pass backward without being compressed by fractions.
2. **Xavier / He Initialization:** Scales initial weights so signal variance stays constant across layers.
3. **Gradient Clipping:** Setting a hard cap on gradient magnitude ($\|\mathbf{g}\| \le \theta$) to prevent explosions.
4. **Normalization & Skip Connections:** Techniques like Batch Normalization and ResNet residual links provide direct highways for gradient flow.

---

## 6. Handwritten Study Notes & Derivations

If you would like to explore the full step-by-step mathematical derivations, backpropagation chain rule walkthroughs, and visual diagrams from this post, you can download the original study notes below:

> [!NOTE]
> * 📥 **[Download Original Rnote File (.rnote)](/notes/multiperceptron.rnote)** *(open with the open-source [Rnote](https://rnote.flathub.org/) app)*

---

## 7. Summary & Key Takeaways

* **Linear Limitations:** Linear models enforce monotonicity, making them unable to learn bell curves, thresholds, or spatial contexts.
* **The Linear Collapse Trap:** Stacking linear layers without non-linear activations mathematically collapses back into a single linear model.
* **The Power of MLPs:** Stacking linear layers with non-linear activations ($\sigma$) enables the network to learn rich, hierarchical feature representations automatically.
* **ReLU is King:** For hidden layers in modern deep learning, $\text{ReLU}(x) = \max(0, x)$ is the standard default choice due to its simplicity and robust gradients.
* **Numerical Stability Matters:** Deep networks risk **vanishing gradients** (decaying to 0) or **exploding gradients** (blowing up to $\infty$, causing `NaN` loss) due to repeated matrix multiplication.
* **Break the Symmetry:** Never initialize weights to zero or constants. Use random initialization so neurons learn distinct features rather than mirroring each other.
* **Xavier Initialization:** Automatically scales weights based on layer size ($\sqrt{\frac{2}{n_{\text{in}} + n_{\text{out}}}}$) to keep variance stable through all layers.
