---
author: DangVoHongPhuc
pubDatetime: 2026-11-06T14:15:00+07:00
title: "AIOJ: Building a Smarter, Lightweight AI Code Judge with CoT-Reverse"
slug: aioj-smart-code-judge-cot-reverse
featured: true
draft: false
tags:
  - aioj
  - code-judge
  - llm
  - knowledge-distillation
  - cot-reverse
description: "How we built AIOJ — an automated code evaluation framework using CoT-Reverse distillation to grade code statically without sandboxes or expensive cloud LLMs."
series: "Artificial Intelligent"
seriesOrder: 6
---

Traditional automated code evaluation faces a tough dilemma: sandbox execution is vulnerable and test-dependent, while large cloud LLMs are slow and prohibitively expensive. In this project, we introduce **AIOJ**, a lightweight, static code evaluation framework powered by a compact 1.5B model using a novel **Verdict-Prioritized Chain-of-Thought (CoT-Reverse)** distillation paradigm.

![AIOJ Architecture](/posts/artificial-intelligent/aioj-smart-code-judge-cot-reverse/index.png)

## Table of contents

## The Problem with Traditional Code Judging

Automating code assessment in computer science education and competitive programming traditionally relies on two paradigms, each carrying major bottlenecks:

### 1. The Sandbox Execution Trap
Historically, online judges (like LeetCode or Codeforces) execute untrusted user code inside isolated environments (Docker/sandboxes). While direct, this introduces critical vulnerabilities:
- **Test-Suite Dependency:** If instructors miss edge-case test cases, flawed solutions slip through with false-positive "Accepted" verdicts.
- **Runtime Security Risks:** Malicious submissions can trigger resource exhaustion loops, denial-of-service, or dangerous host breakouts.

### 2. The Cloud-Scale LLM Trade-off
Large Language Models (LLMs) like GPT-4o or Claude-3.5-Sonnet offer static analysis without compiling unverified binaries. However:
- **Prohibitive Costs:** Calling proprietary APIs for thousands of student submissions creates an unsustainable financial burden.
- **High Inference Latency:** Generating long Chain-of-Thought reasoning steps before outputting a verdict causes unacceptable delays during peak contest submissions.
- **Subtle Fault Blindspots:** Generalist LLMs frequently stumble when differentiating nuanced execution faults like Time Limit Exceeded (TLE) vs. complex runtime errors.

---

## Enter AIOJ: Verdict-Prioritized Reasoning (CoT-Reverse)

To combine the diagnostic depth of large models with the speed of lightweight local deployment, **AIOJ** distills knowledge from a large teacher LLM (DeepSeek) into a compact student architecture ($\le 1.5\text{B}$ parameters) using LoRA.

The key innovation is **reversing the reasoning sequence**:

### Standard CoT vs. CoT-Reverse

- **Standard CoT:**  
  $$\text{Input } (P, C) \longrightarrow \text{Rationale } (R) \longrightarrow \mathbf{\text{Verdict } (y)}$$  
  *Flaw:* The system forces the model to generate a long diagnostic essay before it ever produces the final grade, causing high latency.

- **Proposed CoT-Reverse:**  
  $$\text{Input } (P, C) \longrightarrow \mathbf{\text{Verdict } (y)} \longrightarrow \text{Rationale } (R)$$  
  *Advantage:* The model predicts the verdict immediately at test time. The system can return the grade to the student with near-zero latency, generating the in-depth pedagogical rationale only when requested.

```
Standard CoT:   [Input Code] ---> [Generate 500-token explanation] ---> Verdict: WA
CoT-Reverse:    [Input Code] ---> Verdict: WA (Instant!) ---> [Optional explanation]
```

---

## Fine-Grained 9-Class Diagnostic Taxonomy

Rather than a simple binary pass/fail score, AIOJ classifies candidate code into a comprehensive 9-verdict taxonomy adapted from CodeJudge-Eval:

| Label | Verdict | Description |
| :---: | :--- | :--- |
| **A** | Accepted (AC) | Completely correct, optimal implementation |
| **B** | Compilation Error (CE) | Fails syntax parsing or compilation |
| **C** | Wrong Answer (WA) | Runs cleanly but outputs incorrect logic |
| **D** | Time Limit Exceeded (TLE) | Algorithmic complexity is suboptimal |
| **E - I** | Compound Faults | Overlapping failures (e.g., WA + TLE, or WA + Runtime Error) |

By prioritizing the verdict, the student model avoids the "over-optimistic bias" of naive small models (which frequently guess "Accepted" when confused) and accurately flags compound algorithmic issues.

---

## Performance Highlights

Evaluated across easy, medium, and hard competitive programming benchmarks:

1. **Beating Larger Models:** Our compact 1.5B model equipped with CoT-Reverse achieves a **Macro-F1 of 20.60%** on the 9-class Hard benchmark, outperforming much larger open foundation models such as **Llama-3.1-8B-Instruct (7.69%)** and rivaling frontier models like **GPT-4o (13.61%)** and **Gemini-1.5-Pro (15.76%)**.
2. **Eliminating Dead Classes:** Traditional small models score 0.00% F1 on compound error classes (Labels G, H, I). CoT-Reverse reactivates these dead classes, recognizing multi-fault submissions without hallucinations.
3. **Hardware Accessibility:** Can run on standard, cost-effective consumer hardware or university on-premise servers without cloud API dependencies.

---

## Summary & Key Takeaways

- **Static & Safe:** Grades submissions purely by reading logic, completely bypassing runtime sandbox execution risks.
- **Fast Response:** The CoT-Reverse ordering delivers instant verdicts while preserving rich diagnostic explanations.
- **Cost-Efficient:** Delivers state-of-the-art diagnostic accuracy within a compact 1.5B parameter footprint, making automated AI code evaluation genuinely accessible for schools and contest platforms.
