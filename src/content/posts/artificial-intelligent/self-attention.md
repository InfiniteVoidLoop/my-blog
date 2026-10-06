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

However, in a traditional **RNN** or static embedding model, after the initial embedding step, each token is associated with a fixed vector representation. So in this case, the word **"mole"** would start with the exact same initial vector representation regardless of surrounding context.

## How Transformers Predict the Next Word: Context Aggregation

In an autoregressive Transformer (such as GPT), the model generates text token-by-token by predicting the **next word** given a sequence of prompt tokens.

![Context Aggregation into the Final Token for Next-Token Prediction](@/assets/images/artificial-intelligent/last-token-context-aggregation.png)
*Figure 2: Information flow in a Transformer context window. Self-attention passes information from preceding token vectors into the final token vector ($\vec{E}_4 \to \vec{E}_4'$) to enable next-token prediction.*

To predict what word comes next after a prompt sequence (for example, *"Therefore the murderer was..."*):

1. **Initial Embeddings ($\vec{E}_i$):** Each token in the context window begins as a static vector lookup ($\vec{E}_1, \vec{E}_2, \vec{E}_3, \vec{E}_4$).
2. **Context Aggregation via Attention:** The model does not generate predictions from every position. Instead, the **final token vector** (at position $N$, here `"was"`) must ingest, filter, and aggregate key clues from all preceding tokens.
3. **Vector Transformation ($\vec{E}_4 \to \vec{E}_4'$):** Through multiple layers of Self-Attention, information from previous token vectors is moved into the final token's vector representation.
4. **Final Prediction:** The enriched vector $\vec{E}_4'$ is passed through the model's final output projection layer (Unembedding / Softmax) to compute probability scores for the next token (e.g., `"Colonel"` or `"Mustard"`).

