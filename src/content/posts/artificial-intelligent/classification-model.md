---
author: DangVoHongPhuc
pubDatetime: 2026-11-02T20:00:00+07
title: "Classification and Softmax Regression"
slug: classification-and-softmax-regression
featured: true
draft: false
tags:
  - series-of-ai
  - machine-learning
  - deep-learning
  - classification
  - softmax
description: "A simple, visual guide to Classification, One-Hot Encoding, the Softmax Function, Cross-Entropy Loss, and its clean gradient derivation."
series: "Artificial Intelligent"
seriesOrder: 5
---

In Machine Learning, **Regression** is the tool we use to answer *"How much?"* or *"How many?"* (such as predicting a house price). **Classification**, on the other hand, answers *"Which category?"*:

* Does this email belong in the spam folder?
* Is this image a cat, a dog, or a chicken?

Even though the question changes, the core training pipeline stays the same: load data, pass it through the model, calculate loss, compute gradients, and update weights. What changes are **how we represent labels**, **the shape of the output layer**, and **the loss function**.

## Table of contents

---

## 1. Types of Classification

When classifying data, we usually distinguish between:

* **Hard Assignment:** Picking one exact class label right away (e.g., *"This is definitely a dog"*).
* **Soft Assignment:** Predicting the probability of every possible class (e.g., *85% dog, 10% cat, 5% chicken*). In practice, models output soft probabilities first, and we pick the highest one to make a hard decision.
* **Multi-Label Classification:** When a single item can belong to multiple categories at once (for example, a news article that is about *business*, *technology*, and *space flight* at the same time).

---

## 2. Representing Labels: Why One-Hot Encoding?

How should we turn words like `{dog, cat, chicken}` into numbers for our model?

### The Trap of Integer Encoding

A natural first thought is to assign each class a number:

$$
\text{dog} = 1, \quad \text{cat} = 2, \quad \text{chicken} = 3
$$

> [!NOTE]
> **When integer labels work:** If your categories have a natural order (**Ordinal Data**), like age groups `{baby = 1, child = 2, adult = 3}`, integers make sense because $3 > 2 > 1$ reflects real-world order.

However, for normal categories like `{dog, cat, chicken}`, there is **no natural order**. Using $1, 2, 3$ tricks the math into assuming two false rules:
1. "Chicken" ($3$) is greater than "Dog" ($1$).
2. The distance between "Dog" ($1$) and "Cat" ($2$) is $1$, while the distance between "Dog" ($1$) and "Chicken" ($3$) is $2$ — implying a dog is mathematically closer to a cat than a chicken!

### The Solution: One-Hot Encoding

To remove this fake ordering, we use **One-Hot Encoding**. We create a vector with one slot per class: the true class gets a $1$, and all other slots get $0$.

For 3 classes `{cat, chicken, dog}`, our target label $\mathbf{y}$ becomes a 3-element vector:

$$
\text{cat} \rightarrow (1, 0, 0), \quad \text{chicken} \rightarrow (0, 1, 0), \quad \text{dog} \rightarrow (0, 0, 1)
$$

Every class is now treated equally at the exact same distance from one another.

---

## 3. Linear Model for Classification

In Linear Regression, we only needed a single output node to predict one continuous number:

![Linear Regression: Single output node](@/assets/images/artificial-intelligent/classification/linear_regression.png)

In Classification, to predict probabilities for $q$ different classes, our model needs **$q$ outputs** — one score per class.

For example, if we have $4$ input features $(x_1, x_2, x_3, x_4)$ and $3$ output classes $(o_1, o_2, o_3)$, we need $4 \times 3 = 12$ weights and $3$ biases:

![Classification Model: Multiple output nodes, one per class](@/assets/images/artificial-intelligent/classification/classification.png)

Each output score (called a **logit**) is calculated as its own linear equation:

$$
\begin{aligned}
o_1 &= x_1 w_{11} + x_2 w_{21} + x_3 w_{31} + x_4 w_{41} + b_1 \\
o_2 &= x_1 w_{12} + x_2 w_{22} + x_3 w_{32} + x_4 w_{42} + b_2 \\
o_3 &= x_1 w_{13} + x_2 w_{23} + x_3 w_{33} + x_4 w_{43} + b_3
\end{aligned}
$$

In compact matrix form:

$$
\mathbf{o} = \mathbf{W}^\top \mathbf{x} + \mathbf{b}
$$

---

## 4. The Softmax Function

We cannot use the raw outputs $\mathbf{o} = (o_1, o_2, o_3)$ directly as probabilities for two reasons:
1. Raw scores $o_i$ can be **negative**.
2. Raw scores do **not add up to $1$**.

To turn raw logits into valid probabilities, we pass them through the **Softmax** function in two simple steps:

1. **Exponentiate ($e^{o_i}$):** Forces every score to be strictly positive ($> 0$).
2. **Normalize:** Divide each positive value by their total sum so they add up to $1$.

![Exponential Function maps any real logit score to a positive number](@/assets/images/artificial-intelligent/classification/exp-function.png)

Putting both steps together gives the **Softmax equation**:

$$
\hat{y}_j = \text{softmax}(\mathbf{o})_j = \frac{\exp(o_j)}{\sum_{k=1}^{q} \exp(o_k)}
$$

Now $\hat{\mathbf{y}} = (\hat{y}_1, \hat{y}_2, \dots, \hat{y}_q)$ is a valid probability distribution where $0 < \hat{y}_j < 1$ and $\sum_{j=1}^q \hat{y}_j = 1$.

---

## 5. Cross-Entropy Loss

How do we measure how good our predicted probabilities $\hat{\mathbf{y}}$ are compared to the true label $\mathbf{y}$?

Given a dataset of $n$ examples, we want to maximize the probability that our model assigns to the true classes:

$$
P(\mathbf{Y} \mid \mathbf{X}) = \prod_{i=1}^{n} P(\mathbf{y}^{(i)} \mid \mathbf{x}^{(i)})
$$

Multiplying thousands of small probabilities together quickly causes numerical underflow, and products are hard to differentiate. Instead, we use the **natural logarithm** $\log(x)$.

![Natural Logarithm Function: negative on the probability interval (0, 1](@/assets/images/artificial-intelligent/classification/log-function.png)

Because probabilities lie between $0$ and $1$, $\log(x)$ is always **negative or zero** ($\le 0$) on $(0, 1]$. By adding a minus sign — taking the **negative logarithm** — we flip the values to be positive and turn maximizing probability into **minimizing loss**:

$$
-\log P(\mathbf{Y} \mid \mathbf{X}) = \sum_{i=1}^{n} -\log P(\mathbf{y}^{(i)} \mid \mathbf{x}^{(i)}) = \sum_{i=1}^{n} l(\mathbf{y}^{(i)}, \hat{\mathbf{y}}^{(i)})
$$

For a single pair of true one-hot label $\mathbf{y}$ and predicted probabilities $\hat{\mathbf{y}}$ over $q$ classes, this gives the **Cross-Entropy Loss**:

$$
l(\mathbf{y}, \hat{\mathbf{y}}) = -\sum_{j=1}^{q} y_j \log \hat{y}_j
$$

### Why Negative Log Works So Intuitively

Since $\mathbf{y}$ is a one-hot vector (only one $y_c = 1$ and all other $y_j = 0$), the entire sum collapses to just the true class $c$:

$$
l(\mathbf{y}, \hat{\mathbf{y}}) = -\log(\hat{y}_c)
$$

![Negative Log Loss curve showing how confident wrong predictions are heavily penalized](@/assets/images/artificial-intelligent/classification/neg-log-function.png)

* **If $\hat{y}_c \to 1$ (Confident & Correct):** $\log(1) = 0 \implies -\log(1) = 0$. The loss is zero!
* **If $\hat{y}_c \to 0$ (Confident & Wrong):** $\log(\hat{y}_c) \to -\infty \implies -\log(\hat{y}_c) \to +\infty$. The model gets heavily penalized!

---

## 6. Softmax and Cross-Entropy Gradient

To train our model with Gradient Descent, we need the derivative of the Cross-Entropy loss with respect to each raw logit $o_j$.

> [!TIP]
> **Quick Calculus Recall (Logarithm Rules):**
> * Quotient Rule for Logs: $\log\left(\frac{a}{b}\right) = \log(a) - \log(b)$
> * Log of Exponential: $\log(\exp(x)) = x$
> * Derivative of Natural Log: $\frac{d}{dx} \log(x) = \frac{1}{x}$
> * Chain Rule with Log: $\frac{d}{dx} \log(u(x)) = \frac{u'(x)}{u(x)}$

Let's plug the Softmax formula into the Cross-Entropy loss and simplify step-by-step:

$$
\begin{aligned}
l(\mathbf{y}, \hat{\mathbf{y}}) &= -\sum_{j=1}^{q} y_j \log \hat{y}_j = -\sum_{j=1}^{q} y_j \log \left( \frac{\exp(o_j)}{\sum_{k=1}^{q} \exp(o_k)} \right) \\
&= -\sum_{j=1}^{q} y_j \left[ \log(\exp(o_j)) - \log \left( \sum_{k=1}^{q} \exp(o_k) \right) \right] \\
&= -\sum_{j=1}^{q} y_j o_j + \left(\sum_{j=1}^{q} y_j\right) \log \sum_{k=1}^{q} \exp(o_k)
\end{aligned}
$$

Since $\mathbf{y}$ is a one-hot vector, the sum of all its elements is $\sum_{j=1}^{q} y_j = 1$. This simplifies the loss to:

$$
l(\mathbf{y}, \hat{\mathbf{y}}) = -\sum_{j=1}^{q} y_j o_j + \log \sum_{k=1}^{q} \exp(o_k)
$$

Now, taking the derivative with respect to a specific logit $o_j$ using the chain rule $\frac{d}{dx}\log(u) = \frac{u'}{u}$:

$$
\frac{\partial l(\mathbf{y}, \hat{\mathbf{y}})}{\partial o_j} = -y_j + \frac{\exp(o_j)}{\sum_{k=1}^{q} \exp(o_k)} = \text{softmax}(\mathbf{o})_j - y_j = \hat{y}_j - y_j
$$

![Handwritten derivation of Softmax + Cross-Entropy gradient](@/assets/images/artificial-intelligent/classification/softmax-crossentropy-demonstration.png)

> [!IMPORTANT]
> **The Beauty of This Result:**
> The gradient $\frac{\partial l}{\partial o_j} = \hat{y}_j - y_j$ is simply **Prediction minus Truth** — the exact same form as Linear Regression! If our model predicts $0.8$ for the true class ($y_j = 1$), the gradient is $0.8 - 1 = -0.2$, gently nudging the weight to increase that score.

---

## 7. Conclusion

* **Regression vs. Classification:** Regression predicts *"How much?"* (1 output); Classification predicts *"Which category?"* ($q$ outputs).
* **One-Hot Encoding:** Represents unordered categories without introducing fake numerical distances.
* **Softmax:** Converts unconstrained linear scores (logits) into positive probabilities that sum to $1$.
* **Cross-Entropy Loss:** Measures the negative log probability of the true class ($-\log \hat{y}_c$), heavily punishing confident wrong predictions.
* **Simple Gradient:** Combining Softmax and Cross-Entropy yields the clean gradient $\hat{\mathbf{y}} - \mathbf{y}$.
