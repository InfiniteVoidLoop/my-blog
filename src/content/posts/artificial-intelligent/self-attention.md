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

To predict what word comes next after a prompt sequence (for example, *"Therefore, the murderer was..."*):

> *It will have to have somehow encoded all of the information from the full context window that's relevant to predicting the next word into the vector representation of the final word.*

![The last word ingesting context from preceding tokens](@/assets/images/artificial-intelligent/last-word-ingest.png)
*Figure 2: The final vector embedding (e.g., for "was") ingests and encodes all relevant context from preceding tokens across the full context window to predict the next word.*

![Context Aggregation into the Final Token for Next-Token Prediction](@/assets/images/artificial-intelligent/last-token-context-aggregation.png)
*Figure 3: Information flow diagram in a Transformer context window. Self-attention passes information from preceding token vectors into the final token vector ($\vec{E}_4 \to \vec{E}_4'$) to enable next-token prediction.*

1. **Initial Embeddings ($\vec{E}_i$):** Each token in the context window begins as a static vector lookup ($\vec{E}_1, \vec{E}_2, \vec{E}_3, \vec{E}_4$).
2. **Context Aggregation via Attention:** The model does not generate predictions from every position. Instead, the **final token vector** (at position $N$, here `"was"`) must ingest, filter, and aggregate key clues from all preceding tokens.
3. **Vector Transformation ($\vec{E}_4 \to \vec{E}_4'$):** Through multiple layers of Self-Attention, information from previous token vectors is moved into the final token's vector representation.
4. **Final Prediction:** The enriched vector $\vec{E}_4'$ is passed through the model's final output projection layer (Unembedding / Softmax) to compute probability scores for the next token (e.g., `"Colonel"` or `"Mustard"`).

## The Attention Pattern

We'll begin by describing a **single head of attention**, and later we will see how attention with multiple heads run in parallel.

![Structure of a Single-Head Attention Block](@/assets/images/artificial-intelligent/attention-block.png)
*Figure 4: The structure of a Single-Head Self-Attention block. Each token embedding is projected into Queries, Keys, and Values to calculate attention scores and update token representations.*

### The QKV Mechanism: Queries, Keys, and Values

To allow token vectors to exchange context, Self-Attention transforms each initial embedding vector into three specialized role vectors:

- **Query ($Q$):** *"What am I looking for?"*
- **Key ($K$):** *"What information do I contain?"*
- **Value ($V$):** *"What content do I transfer if matched?"*

---

### Deep Dive: Query Vectors ($Q$)

A **Query vector** ($\vec{Q}_i$) represents the questions or requirements a specific token $i$ broadcasts to other tokens in the context window.

#### 1. Calculation via Linear Projection
For each token embedding $\vec{E}_i$, its Query vector $\vec{Q}_i$ is computed by multiplying with a learned linear projection matrix $W_Q$:

$$\vec{Q}_i = W_Q \vec{E}_i$$

![Computing the Query vector for a token](@/assets/images/artificial-intelligent/query-matrix-1.png)
*Figure 5: Computing the Query vector $\vec{Q}_4$ for the token "creature" by multiplying its embedding $\vec{E}_4$ by the learned weight matrix $W_Q$. The resulting vector asks: "Any adjectives in front of me?"*

#### 2. Parallel Computation Across All Tokens
Every token embedding in the sequence is multiplied by the same weight matrix $W_Q$ simultaneously:

![Computing Query vectors for all tokens in parallel](@/assets/images/artificial-intelligent/query-matrix-2.png)
*Figure 6: Each token's initial embedding $\vec{E}_i$ is projected by $W_Q$ into its corresponding Query vector $\vec{Q}_i$ in parallel.*

#### 3. What Does a Query Do?
In high-dimensional space, the Query vector encodes specific semantic questions:
- For a noun like **"creature"**: Its Query asks, *"Are there adjectives preceding me that describe my appearance?"*
- For an ambiguous noun like **"mole"**: Its Query asks, *"Is there context showing whether I am an animal or a chemistry unit?"*
- For a verb like **"was"**: Its Query asks, *"Who or what is the subject of this clause?"*

---

### Deep Dive: Key Vectors ($K$)

While a **Query vector** asks a question, a **Key vector** ($\vec{K}_j$) advertises what information a token holds to answer potential queries.

#### 1. Calculation via Linear Projection
Just like Queries, Key vectors are computed by multiplying each token embedding by a separate learned weight matrix $W_K$:

$$\vec{K}_j = W_K \vec{E}_j$$

![Computing Key vectors to match queries](@/assets/images/artificial-intelligent/key-matrix-1.png)
*Figure 7: Token embeddings are projected by $W_K$ into Key vectors $\vec{K}_j$. When $\vec{Q}_4$ ("creature") asks for adjectives, the keys for "fluffy" ($\vec{K}_2$) and "blue" ($\vec{K}_3$) respond: "I'm an adjective! I'm there!".*

#### 2. Matching Queries and Keys (Dot Product)
To determine how relevant token $j$ is to token $i$, the model computes the dot product between Query $\vec{Q}_i$ and Key $\vec{K}_j$:

$$\text{Score}_{ij} = \vec{Q}_i \cdot \vec{K}_j$$

- **High Positive Score:** The Key matches the Query (e.g., `"creature"` $\cdot$ `"fluffy"`). High affinity means contextual information should transfer.
- **Low or Negative Score:** The Key is irrelevant to the Query (e.g., `"creature"` $\cdot$ `"roamed"`). Little to no information will transfer.



