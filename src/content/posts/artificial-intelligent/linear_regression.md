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
description: "A comprehensive guide to Linear Regression from scratch with PyTorch — data handling (Z-score normalization, One-Hot Encoding, Log Transformation), Forward Pass, MSE Loss, Mini-batch SGD, and Modular OOP Design."
series: "Artificial Intelligent"
seriesOrder: 3
---

**Linear Regression** is the foundational starting point in Machine Learning. In this guide, we break down the entire pipeline from scratch using **PyTorch**—from thorough data preprocessing (normalization, encoding, handling missing values) to forward computation, loss evaluation, and mini-batch stochastic gradient descent.

## Table of contents

---

## 1. Mathematical Formulation

Linear Regression models the relationship between an input feature vector $\mathbf{x} \in \mathbb{R}^d$ and a continuous scalar output $y \in \mathbb{R}$ via an affine transformation:

$$
\hat{y} = \mathbf{x} \mathbf{w} + b
$$

Where:
* $\mathbf{w} \in \mathbb{R}^{d \times 1}$ is the **weight parameter vector**.
* $b \in \mathbb{R}$ is the **bias parameter scalar**.
* $\hat{y}$ is the predicted scalar.

When extended to a mini-batch of $n$ instances, represented as a design matrix $\mathbf{X} \in \mathbb{R}^{n \times d}$:

$$
\hat{\mathbf{y}} = \mathbf{X}\mathbf{w} + b
$$

---

## 2. Loss Function & Optimization

### Mean Squared Error (MSE)
We quantify model error by measuring the squared Euclidean distance between predictions $\hat{\mathbf{y}}$ and ground-truth targets $\mathbf{y}$:

$$
\mathcal{L}(\mathbf{w}, b) = \frac{1}{2n} \sum_{i=1}^{n} (\hat{y}^{(i)} - y^{(i)})^2
$$

The factor $\frac{1}{2}$ simplifies the analytical gradient:

$$
\frac{\partial \mathcal{L}}{\partial \hat{y}^{(i)}} = \hat{y}^{(i)} - y^{(i)}
$$

### Stochastic Gradient Descent (SGD)
Parameters update iteratively against the gradient vector with learning rate $\eta > 0$:

$$
\begin{aligned}
\mathbf{w} &\leftarrow \mathbf{w} - \eta \cdot \frac{\partial \mathcal{L}}{\partial \mathbf{w}} \\[0.8em]
b &\leftarrow b - \eta \cdot \frac{\partial \mathcal{L}}{\partial b}
\end{aligned}
$$

---

## 3. Data Preprocessing

Before feeding raw tabular data into our model, we apply three standard preprocessing steps:

### 1. Standardization (Z-score Normalization)
Features often exist on vastly different scales. To ensure balanced gradient descent updates across all dimensions, we rescale numerical features to zero mean ($\mu = 0$) and unit variance ($\sigma^2 = 1$):

$$
x' = \frac{x - \mu}{\sigma}
$$

Any missing values (`NaN`) in numeric columns are then replaced with $0$, which naturally represents the mean value after standardization.

### 2. One-Hot Encoding
Discrete categorical features (e.g., neighborhood, roof style) cannot be used directly in matrix operations. We convert them into binary indicator columns (one-hot vectors), while treating missing entries (`NaN`) as a distinct valid category.

### 3. Log-Transforming Targets
When predicting continuous quantities with wide dynamic ranges (such as housing prices), targets are often skewed. Transforming labels with the natural logarithm:

$$
y_{\text{log}} = \log(y)
$$

stabilizes variance and converts absolute errors into relative percentage errors, making training substantially more stable.

---

## 4. Implementation from Scratch

```python
import pandas as pd
import torch
import random

class DataModule:
    def __init__(self, train_path: str, test_path: str, batch_size: int = 64, train_ratio: float = 0.8):
        self.train_path = train_path
        self.test_path = test_path
        self.batch_size = batch_size
        self.train_ratio = train_ratio

        self.X_train = None
        self.y_train = None
        self.X_val = None
        self.y_val = None
        self.X_test = None
        self.X_test_id = None

    def preprocess(self):
        raw_train_data = pd.read_csv(self.train_path)
        raw_test_data = pd.read_csv(self.test_path)
        self.X_test_id = raw_test_data["Id"]

        # 1. Feature Alignment
        features = pd.concat(
            [
                raw_train_data.drop(columns=["Id", "SalePrice"]),
                raw_test_data.drop(columns=["Id"]),
            ],
            ignore_index=True,
        )

        # 2. Standardization & Imputation
        numerical_cols = features.select_dtypes(include=["number"]).columns
        features[numerical_cols] = features[numerical_cols].apply(
            lambda x: (x - x.mean()) / x.std()
        )
        features[numerical_cols] = features[numerical_cols].fillna(0)

        # 3. One-Hot Encoding
        features = pd.get_dummies(features, dummy_na=True, dtype=float)

        # 4. Partition and Convert to Tensors
        num_train_data = raw_train_data.shape[0]
        num_test_data = raw_test_data.shape[0]
        train_size = int(num_train_data * self.train_ratio)

        all_X_train = torch.tensor(
            features[:num_train_data].to_numpy(), dtype=torch.float32
        )
        all_y_train = torch.log(
            torch.tensor(raw_train_data["SalePrice"].to_numpy(), dtype=torch.float32)
        ).reshape(-1, 1)

        self.X_train = all_X_train[:train_size]
        self.y_train = all_y_train[:train_size]
        self.X_val = all_X_train[train_size:]
        self.y_val = all_y_train[train_size:]

        self.X_test = torch.tensor(
            features[num_train_data:].to_numpy(), dtype=torch.float32
        )

    def get_batch(self, train: bool = True):
        X = self.X_train if train else self.X_val
        y = self.y_train if train else self.y_val
        assert X is not None and y is not None, "DataModule must be preprocessed first."

        data_size = X.shape[0]
        indices = list(range(data_size))
        if train:
            random.shuffle(indices)

        for i in range(0, data_size, self.batch_size):
            batch_idx = indices[i : min(data_size, i + self.batch_size)]
            yield (X[batch_idx], y[batch_idx])
```

---

## 4. Model Architecture & Custom Optimizer

### Model Class

```python
class LinearRegression:
    def __init__(self, num_features: int, learning_rate: float, sigma: float = 0.01):
        self.learning_rate = learning_rate
        self.W = torch.normal(0, sigma, (num_features, 1), requires_grad=True)
        self.b = torch.zeros(1, requires_grad=True)

    def forward(self, X: torch.Tensor) -> torch.Tensor:
        return torch.matmul(X, self.W) + self.b

    def loss(self, y_hat: torch.Tensor, y: torch.Tensor) -> torch.Tensor:
        return (((y_hat.reshape(y.shape) - y) ** 2) / 2).mean()

    def training_step(self, batch):
        X, y = batch[0], batch[1]
        return self.loss(self.forward(X), y)

    def validation_step(self, batch):
        X, y = batch[0], batch[1]
        return self.loss(self.forward(X), y)

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

---

## 5. Training Loop & Convergence Analysis

The training coordinator manages the forward-backward cycle across mini-batches while detaching scalar metrics via `.item()` to prevent graph accumulation:

```python
class Trainer:
    def __init__(self, num_epochs: int):
        self.num_epochs = num_epochs
        self.train_loss_history = []
        self.val_loss_history = []

    def fit(self, model: LinearRegression, data_module: DataModule):
        optim = model.configure_optimizer()
        for epoch in range(self.num_epochs):
            total_train_loss = 0.0
            num_train_batch = 0
            for batch in data_module.get_batch(train=True):
                train_loss = model.training_step(batch)
                total_train_loss += train_loss.item()
                num_train_batch += 1

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

### Visualizing Loss Progression

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

By decoupling data processing, parameter optimization, and visual evaluation, we obtain a transparent and robust pipeline that is mathematically faithful to the core principles of deep learning.
