---
author: DangVoHongPhuc
pubDatetime: 2026-11-02T13:50:00+07
title: "Linear Regression from Scratch with PyTorch"
slug: linear-regression-from-scratch
featured: true
draft: false
tags:
  - series-of-ai
  - machine-learning
  - linear-regression
  - pytorch
description: "A clean, concise guide to building Linear Regression from scratch using PyTorch — understanding Forward Pass, MSE Loss, Mini-batch SGD, and Modular OOP Design."
series: "Artificial Intelligent"
seriesOrder: 3
---

**Linear Regression** is the most fundamental building block in Machine Learning. In this post, we build a clean and extensible Linear Regression pipeline from scratch using **PyTorch**, without relying on high-level wrappers like `torch.nn.Linear` or external training frameworks.

## Table of contents

---

## 1. Mathematical Formulation

Linear Regression assumes the relationship between input features $\mathbf{x} \in \mathbb{R}^d$ and the target label $y \in \mathbb{R}$ is linear:

$$\hat{y} = \mathbf{x} \mathbf{w} + b$$

Where:
* $\mathbf{w} \in \mathbb{R}^{d \times 1}$ is the **weight vector**.
* $b \in \mathbb{R}$ is the **bias scalar**.
* $\hat{y}$ is the model's prediction.

For a mini-batch of $n$ samples, represented as a design matrix $\mathbf{X} \in \mathbb{R}^{n \times d}$:

$$\hat{\mathbf{y}} = \mathbf{X}\mathbf{w} + b$$

---

## 2. Loss Function (Mean Squared Error)

To measure how well the parameters fit the training data, we minimize the **Mean Squared Error (MSE)** loss:

$$\mathcal{L}(\mathbf{w}, b) = \frac{1}{2n} \sum_{i=1}^{n} (\hat{y}^{(i)} - y^{(i)})^2$$

The factor $\frac{1}{2}$ is introduced so that when taking the derivative, the power of $2$ cancels out cleanly:

$$\frac{\partial \mathcal{L}}{\partial \hat{y}^{(i)}} = \hat{y}^{(i)} - y^{(i)}$$

---

## 3. Optimization: Stochastic Gradient Descent (SGD)

We update parameters iteratively in the opposite direction of the gradient:

$$\mathbf{w} \leftarrow \mathbf{w} - \eta \cdot \frac{\partial \mathcal{L}}{\partial \mathbf{w}}$$
$$b \leftarrow b - \eta \cdot \frac{\partial \mathcal{L}}{\partial b}$$

Where $\eta > 0$ denotes the **learning rate**.

---

## 4. Implementation from Scratch

We structure the pipeline using four modular components:
1. `LinearRegression`: Handles parameter initialization, forward pass, and loss computation.
2. `Stochastic_Gradient_Descent`: Manages parameter updates and zeroing gradients.
3. `DataModule`: Normalization, one-hot encoding, and mini-batch generation.
4. `Trainer` & `LossPlotter`: Training loop orchestration and loss visualization.

### Model Class

```python
import torch

class LinearRegression:
    def __init__(self, num_features: int, learning_rate: float, sigma: float = 0.01):
        self.learning_rate = learning_rate
        # Initialize weights with Gaussian noise and bias with zero
        self.W = torch.normal(0, sigma, (num_features, 1), requires_grad=True)
        self.b = torch.zeros(1, requires_grad=True)

    def forward(self, X: torch.Tensor) -> torch.Tensor:
        return torch.matmul(X, self.W) + self.b

    def loss(self, y_hat: torch.Tensor, y: torch.Tensor) -> torch.Tensor:
        return (((y_hat.reshape(y.shape) - y) ** 2) / 2).mean()

    def training_step(self, batch):
        X, y = batch[0], batch[1]
        y_hat = self.forward(X)
        return self.loss(y_hat, y)

    def validation_step(self, batch):
        X, y = batch[0], batch[1]
        y_hat = self.forward(X)
        return self.loss(y_hat, y)

    def configure_optimizer(self):
        return Stochastic_Gradient_Descent([self.W, self.b], self.learning_rate)
```

### Custom SGD Optimizer

```python
class Stochastic_Gradient_Descent:
    def __init__(self, params, learning_rate: float):
        self.params = params
        self.learning_rate = learning_rate

    def step(self):
        with torch.no_grad():
            for param in self.params:
                if param.grad is not None:
                    param -= self.learning_rate * param.grad

    def grad_zero(self):
        for param in self.params:
            if param.grad is not None:
                param.grad.zero_()
```

### Training & Validation Loop

```python
class Trainer:
    def __init__(self, num_epochs: int):
        self.num_epochs = num_epochs
        self.train_loss_history = []
        self.val_loss_history = []

    def fit(self, model, data_module):
        optim = model.configure_optimizer()
        for epoch in range(self.num_epochs):
            total_train_loss = 0.0
            num_train_batch = 0
            for batch in data_module.get_batch(train=True):
                train_loss = model.training_step(batch)
                total_train_loss += train_loss.item()
                num_train_batch += 1

                # Gradient descent step
                optim.grad_zero()
                train_loss.backward()
                optim.step()

            total_val_loss = 0.0
            num_val_batch = 0
            with torch.no_grad():
                for batch in data_module.get_batch(train=False):
                    val_loss = model.validation_step(batch)
                    total_val_loss += val_loss.item()
                    num_val_batch += 1

            self.train_loss_history.append(total_train_loss / max(num_train_batch, 1))
            self.val_loss_history.append(total_val_loss / max(num_val_batch, 1))
```

---

## 5. Visualizing Learning Dynamics

Using a dedicated `LossPlotter`, we monitor convergence over epochs:

```python
import matplotlib.pyplot as plt

class LossPlotter:
    def __init__(self, train_loss_history, val_loss_history):
        self.train_loss_history = train_loss_history
        self.val_loss_history = val_loss_history

    def plot(self, save_path=None):
        epochs = range(1, len(self.train_loss_history) + 1)
        plt.figure(figsize=(7, 4))
        plt.plot(epochs, self.train_loss_history, label="Train Loss", color="blue")
        plt.plot(epochs, self.val_loss_history, label="Val Loss", color="red", linestyle="--")
        plt.xlabel("Epoch")
        plt.ylabel("MSE Loss")
        plt.title("Training and Validation Loss")
        plt.legend()
        plt.grid(True)
        if save_path:
            plt.savefig(save_path)
        plt.close()
```

Both training and validation loss steadily decrease and plateau without divergence, proving that the model generalizes well without overfitting.
