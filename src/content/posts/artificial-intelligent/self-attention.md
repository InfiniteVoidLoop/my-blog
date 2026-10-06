---
author: DangVoHongPhuc
pubDatetime: 2026-10-06T00:58:00+07
title: "Self-Attention Mechanism"
slug: self-attention-mechanism
featured: false
draft: false
tags:
  - series-of-ai
  - neural-network
  - self-attention
description: "A simple explanation of Self-Attention Mechanism in Transformer architecture."
series: "Artificial Intelligent"
seriesOrder: 3
---

This post covers the idea behind **Self-Attention Mechanism**, explaining step-by-step how it works in the Transformer architecture.

![Self-Attention Mechanism](/posts/artificial-intelligent/self-attention-mechanism/index.png)

## Table of contents

## Motivation Example of Self-Attention

Consider these sentences:

* *America shrew mole.*
* *One mole of CO2 weighs 44 grams.*

![The word "mole" having different meanings based on sentence context](@/assets/images/artificial-intelligent/mole-expression.png)
*Figure 1: The word "mole" carries completely different semantic meanings depending on the surrounding context.*

You can see that the word **"mole"** has different meanings in these two sentences, based on the sentence context.

However, in a traditional **RNN**, after the first step—the **embedding step**—each token is associated with a vector representation. So in this case, the word **"mole"** will have the same vector representation in both cases, with no reference to any surrounding context.
