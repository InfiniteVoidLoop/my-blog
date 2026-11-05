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
