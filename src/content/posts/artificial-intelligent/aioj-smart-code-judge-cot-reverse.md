---
author: DangVoHongPhuc
pubDatetime: 2026-11-06T14:15:00+07:00
title: "AIOJ: Making Code Grading Smarter and Faster with AI"
slug: aioj-smart-code-judge-cot-reverse
featured: true
draft: false
tags:
  - aioj
  - code-judge
  - ai
  - llm
description: "How we built AIOJ — a fast, secure, and lightweight AI system that grades code without running risky servers or paying expensive cloud bills."
series: "Artificial Intelligent"
seriesOrder: 6
---

Grading programming assignments automatically is hard. Running student code directly on a server is risky, while asking giant AI models like GPT-4 to grade every submission is far too slow and expensive. In this project, we built **AIOJ**, a lightweight AI tool that reads code, catches errors, and delivers instant results safely on ordinary hardware.

![AIOJ Architecture](/posts/artificial-intelligent/aioj-smart-code-judge-cot-reverse/index.png)

## Table of contents

## Why Old Ways of Grading Code Fail

Most online platforms (like LeetCode or university portals) use one of two methods to grade student code, but both have real problems:

### 1. The Sandbox Way (Running Code on a Server)
The server runs the student's code against a list of test questions:
- **Missed Bugs:** If the teacher forgets a tricky test case (like negative numbers or zero), broken code can still pass with a perfect score.
- **Security Risks:** Running stranger's code directly on your server is dangerous. Malicious code can crash the machine, waste resources, or try to hack the system.

### 2. The Big Cloud AI Way (Using Models like GPT-4)
Instead of running the code, you ask a huge AI model to read it:
- **Too Expensive:** Paying API fees for tens of thousands of submissions adds up very fast.
- **Too Slow:** Large models take 5 to 15 seconds to "think" and write long essays before giving a score. If 500 students submit at once, the system freezes.
- **Wrong Labels:** Giant general AI models often confuse why code failed — like mixing up a slow algorithm with a crash.

---

## What Makes AIOJ Different?

AIOJ uses a small, fast AI model (only 1.5 billion parameters) trained using a simple trick we call **CoT-Reverse (Result First, Explanation Second)**.

### Regular AI vs. AIOJ

- **Regular AI (Explanation First):**  
  The AI must write out a long, detailed paragraph explaining what it thinks before it tells you if you passed.  
  *Problem:* You have to wait a long time just to see your grade.

- **AIOJ (Result First):**  
  AIOJ gives you the grade immediately, then explains why only if you ask.

```
Regular AI:   [Reads Code] ---> [Writes long 500-word essay...] ---> Verdict: Failed! (Slow)
AIOJ:         [Reads Code] ---> Verdict: Failed! (Instant) ---> [Explains why]
```

This simple change gives students instant feedback during busy exams.

---

## 9 Clear Error Labels

Instead of just saying "Pass" or "Fail", AIOJ tells students exactly what went wrong:

| Label | Verdict | What it means in plain English |
| :---: | :--- | :--- |
| **A** | Accepted (AC) | The code is correct, clean, and optimal. |
| **B** | Compilation Error (CE) | The code has typo or syntax errors and won't build. |
| **C** | Wrong Answer (WA) | The code runs fine, but gives the wrong answer. |
| **D** | Time Limit Exceeded (TLE) | The code works, but the algorithm is too slow. |
| **E - I** | Mixed Errors | Combinations of multiple mistakes (e.g., slow AND wrong answer). |

---

## How Well Does It Work?

We tested AIOJ against real competitive programming problems:

1. **Beats Much Bigger Models:** Our tiny 1.5B model scored higher on hard error detection (**20.6% F1 score**) than much bigger models like **Llama-3.1-8B (7.6%)**, and competed closely with top commercial tools like **GPT-4o (13.6%)**.
2. **Catches Tricky Bugs:** Standard small models often give up and guess "Accepted" on hard code. AIOJ reliably spots tricky overlapping bugs.
3. **Runs on Normal Computers:** You don't need a million-dollar cloud server. Schools can run AIOJ on standard, low-cost computers.

---

## Key Takeaways

- **Safe:** Grades code by reading it, so malicious code can never harm the server.
- **Instant:** Tells students their result right away by putting the verdict first.
- **Affordable:** Tiny 1.5B model runs locally, cutting cloud API bills to zero.
