---
author: DangVoHongPhuc
pubDatetime: 2026-11-05T09:30:00+07
title: "CUDA Parallel Execution and Optimization"
slug: cuda-parallel-execution-and-optimization
featured: false
draft: false
tags:
    - parallel-programming
    - series-of-parallel-programming
    - cuda-optimization
    - parallel-reduction
description: "A systematic optimization journey in CUDA: applying the APOD cycle to turn a naive reduction tree into a high-performance warp-shuffle kernel."
series: "Parallel Programming"
seriesOrder: 4
---
In the previous post, we explored how a GPU SM schedules warps, hides memory latency, and manages hardware resources. Now, we take the next step: **how do we systematically make our CUDA kernels fast?**

Rather than randomly tweaking code, professional GPU programming follows a structured engineering workflow: **APOD (Assess $\rightarrow$ Parallelize $\rightarrow$ Optimize $\rightarrow$ Deploy)**. In this post, we apply APOD to optimize a classic GPU workload: **Parallel Reduction**.

## Table of contents

## Quick Warm-up & Review 🧠

Before diving into optimization, let's reinforce the core concepts from the previous lecture:

### Question 1: Warp Division in a Block
> **A thread block has 256 threads. How many warps does the GPU hardware create?**

<details>
<summary><b>Reveal Solution</b></summary>

$$
\text{Number of Warps} = \frac{256}{32} = 8 \text{ warps}
$$

Because hardware always bundles threads into fixed 32-thread units called **Warps**, a block of 256 threads maps to exactly **8 warps** (Warp 0 to Warp 7).
</details>

---

### Question 2: The Warp Divergence Trap
> **In the code below, how many warps of a 256-thread block diverge?**

```cpp
if (threadIdx.x % 2 == 0)
    a();
else
    b();
```

<details>
<summary><b>Reveal Solution</b></summary>

**Answer: All 8 warps (100% of warps) diverge!**

- **Why?** A warp diverges if **at least one thread** within its 32 threads takes a different path.
- The condition `threadIdx.x % 2 == 0` alternates true/false between adjacent threads.
- In **every single warp** (e.g. Warp 0 from index $0 \dots 31$), 16 even threads execute `a()` and 16 odd threads execute `b()`.
- Because every warp contains threads taking both branches, all 8 warps suffer from serialized execution and run at 50% efficiency.

> [!TIP]
> To eliminate divergence completely, make branch granularity a multiple of 32:  
> `if ((threadIdx.x / 32) % 2 == 0)` $\rightarrow$ Warps 0, 2, 4, 6 execute `a()`, while Warps 1, 3, 5, 7 execute `b()`. **0 warps diverge!**
</details>

---

### Question 3: Latency Hiding Mechanism
> **Why can an SM hide latency better when there are many warps resident on it?**

<details>
<summary><b>Reveal Solution</b></summary>

- Global memory (DRAM) accesses take **400–800 clock cycles**, while math instructions (ALU) take only **~4 cycles**.
- When an executing warp requests data from memory, it transitions into the **Stalled** state.
- If the SM holds many resident warps, the Warp Scheduler has a high probability of finding at least one **Eligible (Ready)** warp to issue immediately.
- Because all warp registers are kept on-chip in the Register File, context switching takes **zero clock cycles**, ensuring physical ALUs never sit idle.
</details>

---

## What We Will Cover in This Post 🗺️

This post is structured into two main parts:

### Part 1: The APOD Engineering Process
1. **The Need for a Process:** Why naive optimization fails without systematic profiling.
2. **The APOD Cycle:**
   - **Assess:** Identify bottlenecks and calculate theoretical speedup using **Amdahl's Law**.
   - **Parallelize:** Build the first working, correct GPU implementation.
   - **Optimize:** Iteratively profile and apply hardware-level optimizations.
   - **Deploy:** Integrate and verify production readiness.
3. **Measurement Metrics:** Wall-clock time, kernel execution time, Speedup, and Effective Memory Bandwidth.

### Part 2: Parallel Reduction Optimization Case Study
We will transform a sequential array summation into an ultra-fast CUDA kernel across four iterative rounds:
- **Baseline:** CPU sequential baseline.
- **V1 (Parallelize):** Basic shared-memory tree reduction (correct, but suffers from divergence).
- **V2 (Reduce Divergence):** Strided index layout to eliminate warp divergence.
- **V3 (Thread Coarsening):** Processing multiple elements per thread to improve Instruction-Level Parallelism (ILP).
- **V4 (Warp Shuffle):** Direct register-to-register communication using `__shfl_down_sync` without shared memory overhead.
- **V5 (Multi-Block Atomics):** Grid-wide reduction across blocks using atomic operations.
- **Wrap-up:** Speedup comparison across all rounds and benchmarking against NVIDIA's standard `cub::DeviceReduce`.


---

## 1. Why Do We Need an Optimization Process? 🛠️

Almost every engineer learning CUDA goes through the same painful cycle. You hear about GPUs having thousands of cores, you rewrite your CPU loop in CUDA, and... **it runs slower than the CPU**.

Here are some real, classic scenarios we encounter all the time:

> [!CAUTION]
> **Real Stories from the Trenches:**
> - *"I rewrote my nested loop in CUDA... and it's actually $3\times$ slower than my single-threaded C++ code!"*
> - *"I spent three entire days micro-optimizing a kernel down to assembly, only to realize that kernel accounted for just 2% of the total application runtime."*
> - *"My optimized kernel is blazing fast, but it occasionally produces wrong answers depending on the input size."*

Why does this happen so frequently? When analyzing these failures, they almost always boil down to four common mistakes:

1. **Guessing instead of measuring:** Modifying code based on intuition rather than profiling data.
2. **Optimizing the wrong bottleneck:** Wasting hours speeding up a part of the program that barely affects total runtime.
3. **Changing too many variables at once:** Tweaking block sizes, shared memory, and unrolling loops all in a single commit—making it impossible to tell which change actually helped or hurt.
4. **Skipping correctness validation:** Assuming that because code compiles and runs fast, the computed result is mathematically correct for arbitrary input sizes.

To avoid these traps, NVIDIA established a structured, repeatable engineering loop: **The APOD Cycle**.

---

## 2. The APOD Cycle: A Systematic Workflow 🔄

APOD stands for **Assess $\rightarrow$ Parallelize $\rightarrow$ Optimize $\rightarrow$ Deploy**:

![The APOD Cycle](@/assets/images/parallel_programming/apod-cycle.png)
*Figure 1: The cyclic APOD optimization workflow recommended by NVIDIA.*

Rather than trying to write the perfect, hyper-optimized kernel on day one, APOD advocates an **iterative engineering loop**:

```
 ┌─────────────────────────────────────────────────────────┐
 │                                                         │
 │    ┌─────────┐       ┌─────────────┐       ┌──────────┐ │
 └───►│ Assess  ├──────►│ Parallelize ├──────►│ Optimize │─┘
      └─────────┘       └─────────────┘       └────┬─────┘
                                                   │
                                                   ▼
                                              ┌──────────┐
                                              │  Deploy  │
                                              └──────────┘
```

1. **Assess:** Find where your application actually spends time. Identify whether the bottleneck is parallelizable and calculate the realistic theoretical gain.
2. **Parallelize:** Write the simplest possible CUDA kernel that produces **100% correct results**. At this stage, focus on correctness, not performance.
3. **Optimize:** Profile with tools (such as `ncu` and `nsys`), identify the primary hardware limiter, formulate a hypothesis, change **one thing at a time**, and measure the delta.
4. **Deploy:** Validate with real-world inputs, verify production readiness, and ship the speedup early. A $3\times$ speedup delivered to users beats an unfinished $30\times$ optimization stuck on a development branch.

---

## 3. Assess: Identifying Bottlenecks & Amdahl's Law ⏱️

Before writing a single line of CUDA code, the **Assess** phase answers three fundamental questions:

1. **Where is the hotspot?** Which function consumes 70–90% of total execution time?
2. **Is it parallelizable?** Are loop iterations independent? Are operations associative (like addition or minimum)?
3. **How large is the data?** If you are processing only 1,000 numbers, GPU kernel launch latency and PCIe data transfer overhead will dwarf any computational benefit.

### The Mathematics of Real-World Speedup: Amdahl's Law

One of the most sobering lessons in high-performance computing is **Amdahl's Law**. It states that the maximum speedup of any program is strictly limited by its **serial (unparallelizable) portion**:

$$
S(N) = \frac{1}{(1 - P) + \frac{P}{N}}
$$

And if we assume an infinitely powerful GPU with infinite cores ($N \to \infty$):

$$
S_{\max} = \frac{1}{1 - P}
$$

Where:
- $P$ is the fraction of total runtime that can be parallelized ($0 \le P \le 1$).
- $1 - P$ is the serial fraction that **must run sequentially on the CPU**.
- $N$ is the speedup factor of the parallelized portion.
- $S(N)$ is the overall speedup of the entire application.

Let's look at how the serial bottleneck limits your gains:

| Parallel Fraction ($P$) | Speedup of Parallel Part ($N = 10\times$) | Speedup of Parallel Part ($N = 100\times$) | Infinitely Fast GPU ($N = \infty$) |
| :---: | :---: | :---: | :---: |
| **50%** | $1.8\times$ | $1.98\times$ | **$2.0\times$** |
| **90%** | $5.3\times$ | $9.2\times$ | **$10.0\times$** |
| **99%** | $9.2\times$ | $50.3\times$ | **$100.0\times$** |

> [!WARNING]
> If half of your program ($P = 50\%$) is serial (file I/O, parsing, sequential setup), **no matter how fast your GPU is**, your whole application can **never exceed a $2\times$ speedup**!

---

### Concrete Example: The 40× Trap 💡

Suppose you have an image processing pipeline that takes **100 seconds** sequentially:
- **80 seconds** are spent in a heavy image filtering function `filter()`.
- **20 seconds** are spent reading files from disk and preparing metadata.

You work tirelessly and optimize `filter()` using CUDA so that it runs **40 times faster** ($N = 40$):

1. **New time spent in `filter()`:**

$$
T_{\text{parallel\_new}} = \frac{80\text{ s}}{40} = 2\text{ seconds}
$$

2. **New total program execution time:**

$$
T_{\text{total\_new}} = 20\text{ s (serial)} + 2\text{ s (parallel)} = 22\text{ seconds}
$$

3. **Overall program speedup:**

$$
S_{\text{overall}} = \frac{100\text{ s}}{22\text{ s}} \approx 4.5\times
$$

4. **Theoretical maximum speedup (even with a supercomputer):**

$$
S_{\max} = \frac{100\text{ s}}{20\text{ s}} = 5.0\times
$$

> [!IMPORTANT]
> **Takeaway:** Even though your CUDA kernel is **$40\times$ faster**, your users will only experience a **$4.5\times$ speedup**. Always measure and report both numbers: the kernel speedup and the end-to-end application speedup!


---

## 4. Parallelize, Optimize & Deploy in Practice ⚙️

Now that we know our hotspot from the **Assess** step, let's look at the remaining three pillars of APOD.

### P: Parallelize (Correctness First, Not Speed)

The sole goal here is **functional correctness**:

- **Simplest Mapping:** Assign one thread per output element. Keep the logic simple and readable.
- **Rules of Thumb:**
  - **CPU as Ground Truth:** Always compare GPU results against the CPU reference after every run.
  - **Edge-Case Testing:** Test awkward sizes early (e.g. $n = 1$, odd sizes, $n$ not a power of 2, $n$ smaller than a block).
  - **Error Checking:** Always check CUDA errors after API calls and kernel launches (`cudaGetLastError()`).

> [!TIP]
> Do not attempt micro-optimizations yet. A fast kernel that produces wrong numbers is useless.

---

### O: Optimize (The Scientific Loop)

Optimization is not guessing—it is a strict scientific loop:

$$
\text{Measure} \longrightarrow \text{Find Bottleneck} \longrightarrow \text{Hypothesis} \longrightarrow \text{Change 1 Thing} \longrightarrow \text{Verify}
$$

- **Evidence-Based:** Use profiling tools (`ncu`, `nsys`) to identify the real bottleneck (e.g. memory bandwidth vs warp divergence).
- **One Change at a Time:** If you change multiple variables at once, you will never know which one helped.
- **Revert Ruthlessly:** If a code change does not improve speed, **revert it**. Never keep complexity without performance gains.
- **When to Stop Optimizing?**
  - You hit hardware limits (e.g. achieving 75–80% of peak memory bandwidth).
  - The kernel is no longer the main application hotspot.
  - The remaining speedup is too small to justify extra code complexity.

---

### D: Deploy (Ship Gains Early)

- **End-to-End Validation:** Test with real production input data and full dataset sizes.
- **Measure Real Speedup:** Measure overall application time, including PCIe memory copies and setup.
- **Document Decisions (APOD Log):** Keep notes on what worked, what failed, and why.
- **Ship Early:** A **$3\times$ speedup delivered to users** is infinitely more valuable than an unfinished $30\times$ optimization that never ships.

---

## 5. How to Measure Performance Correctly 📊

Never guess performance—measure it accurately using proper GPU timers and metrics:

### 1. Accurate GPU Timing (`cudaEvent`)

Kernel launches on the CPU are **asynchronous**—the CPU function returns immediately while the GPU is still executing. CPU timers (`std::chrono`) will only measure the launch overhead unless explicitly synchronized.

Always use native CUDA events with a warm-up launch:

```cpp
cudaEvent_t start, stop;
cudaEventCreate(&start);
cudaEventCreate(&stop);

// 1. Warm-up launch (pays one-time driver / allocation overhead)
kernel<<<grid, block>>>(d_in, d_out, n);

// 2. Measure actual execution
cudaEventRecord(start);
kernel<<<grid, block>>>(d_in, d_out, n);
cudaEventRecord(stop);

// 3. Wait for GPU to finish and read time
cudaEventSynchronize(stop);
float milliseconds = 0.0f;
cudaEventElapsedTime(&milliseconds, start, stop);
```

### 2. Core Metrics: Speedup & Bandwidth

To evaluate your kernel, track two primary metrics:

1. **Speedup:**

$$
\text{Speedup} = \frac{T_{\text{baseline}}}{T_{\text{new}}}
$$

Always clearly specify your baseline (e.g. single-threaded CPU vs previous GPU iteration).

2. **Effective Memory Bandwidth:**

$$
\text{Effective Bandwidth (GB/s)} = \frac{\text{Bytes Read} + \text{Bytes Written}}{\text{Time (seconds)} \times 10^9}
$$

- For example, reading $n = 2^{24}$ 32-bit integers ($16.7\text{ M elements}$) consumes $4n = 64\text{ MB}$.
- Compare your achieved bandwidth against the GPU's theoretical limit (e.g. Tesla T4 peak is $\approx 320\text{ GB/s}$).
- If your kernel hits **70–80% of peak bandwidth**, it is purely memory-bound and already near hardware perfection.
