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
description: "A systematic optimization guide in CUDA: applying the APOD cycle to turn a naive reduction tree into a high-performance warp-shuffle kernel."
series: "Parallel Programming"
seriesOrder: 4
---
Writing CUDA code is easy, but making it run faster than a CPU is hard. Without a structured workflow, developers often optimize the wrong code or introduce subtle bugs.

This post covers **APOD (Assess $\rightarrow$ Parallelize $\rightarrow$ Optimize $\rightarrow$ Deploy)**, NVIDIA's standard optimization cycle, and applies it step-by-step to **Parallel Reduction**.

## Table of contents

## Quick Warm-up 🧠

Let's review key concepts from the previous lecture:

### Question 1: Block to Warps
> A block has 256 threads. How many warps does the GPU hardware create?

<details>
<summary><b>Answer</b></summary>

$$
\text{Warps} = \frac{256}{32} = 8 \text{ warps}
$$

Hardware groups threads into fixed 32-thread units called **Warps**.
</details>

---

### Question 2: The Divergence Trap
> How many warps diverge in a 256-thread block with this branch?

```cpp
if (threadIdx.x % 2 == 0)
    a();
else
    b();
```

<details>
<summary><b>Answer</b></summary>

**All 8 warps diverge (100%).**

- A warp diverges if **at least one thread** takes a different path.
- In every warp (32 threads), 16 even threads run `a()` and 16 odd threads run `b()`.
- To fix it, group conditions in chunks of 32: `if ((threadIdx.x / 32) % 2 == 0)` $\rightarrow$ **0 warps diverge**.
</details>

---

### Question 3: Latency Hiding
> Why does an SM need many resident warps?

<details>
<summary><b>Answer</b></summary>

- Global DRAM access takes **400–800 cycles**, while math takes **~4 cycles**.
- When an active warp waits on DRAM (Stalled), the SM instantly swaps to another ready warp (Eligible) in **0 cycles** using on-chip registers.
</details>

---

## Part 1: The APOD Engineering Process 🔄

Professional GPU optimization is not guesswork—it is a repeatable engineering loop.

### 1. Why Do We Need a Process?
Developers rewriting CPU loops in CUDA often hit common traps:
- The GPU version runs **slower than single-threaded CPU code**.
- Days are spent optimizing a kernel that takes only **2% of total runtime**.
- Fast code produces **wrong results** on edge-case inputs.

These stem from four mistakes:
1. **Guessing instead of measuring.**
2. **Optimizing the wrong bottleneck.**
3. **Changing too many variables at once.**
4. **Skipping correctness checks.**

---

### 2. The 4 Stages of the APOD Cycle

![The APOD Cycle](@/assets/images/parallel_programming/apod-cycle.png)
*Figure 1: The cyclic APOD optimization workflow.*

- **Assess:** Profile code, identify hotspots, and estimate possible gains.
- **Parallelize:** Build the simplest working GPU kernel (1 thread per output). Correctness first.
- **Optimize:** Measure $\rightarrow$ identify limiter $\rightarrow$ change **one thing** $\rightarrow$ verify speedup.
- **Deploy:** Validate on production data and ship gains early ($3\times$ shipped beats $30\times$ unfinished).

---

### 3. Assess & Amdahl's Law
Before writing CUDA, evaluate the theoretical ceiling. Amdahl's Law states that program speedup is strictly limited by its **serial (unparallelized) fraction**:

$$
S(N) = \frac{1}{(1 - P) + \frac{P}{N}} \qquad S_{\max} = \frac{1}{1 - P}
$$

- $P$: Parallelizable fraction of execution time.
- $1 - P$: Serial fraction (file I/O, sequential CPU work).
- $N$: Speedup of the parallelized portion.

| Parallel Fraction ($P$) | Speedup ($N = 10\times$) | Speedup ($N = 100\times$) | Infinite Cores ($N = \infty$) |
| :---: | :---: | :---: | :---: |
| **50%** | $1.8\times$ | $1.98\times$ | **$2.0\times$** |
| **90%** | $5.3\times$ | $9.2\times$ | **$10.0\times$** |
| **99%** | $9.2\times$ | $50.3\times$ | **$100.0\times$** |

> [!WARNING]
> **The 40× Trap:** If an image pipeline spends 80s in `filter()` and 20s in file I/O (total 100s), speeding up `filter()` by **$40\times$** on GPU reduces its time to 2s. The new total time is $20\text{s} + 2\text{s} = 22\text{s}$, giving only a **$4.5\times$ application speedup**.

---

### 4. Profiling Cheatsheet & Key Metrics 💻

Never guess—use standard profiling tools to answer specific questions:

#### Measuring Accurate Time (`cudaEvent`)
```cpp
cudaEvent_t start, stop;
cudaEventCreate(&start); cudaEventCreate(&stop);

// Warm-up launch (driver setup overhead)
kernel<<<grid, block>>>(d_in, d_out, n);

cudaEventRecord(start);
kernel<<<grid, block>>>(d_in, d_out, n);
cudaEventRecord(stop);
cudaEventSynchronize(stop);

float ms = 0.0f;
cudaEventElapsedTime(&ms, start, stop);
```

#### Application vs Kernel Profiling CLI
```shell
# 1. Nsight Systems: Whole-program timeline (CPU, PCIe copies, GPU kernels)
nsys profile --stats=true -o app_report ./my_app
nsys stats app_report.nsys-rep

# 2. Nsight Compute: Single-kernel hardware diagnostics
ncu --section SpeedOfLight --section Occupancy --section WarpStateStats -k regex:myKernel -c 1 ./my_app
```

#### Essential Metrics & Formulas
| Question | Hardware Metric | Target |
| :--- | :--- | :--- |
| **Are threads diverging?** | `smsp__thread_inst_executed_per_inst_executed.ratio` | **32.0** (no divergence) |
| **Are branches uniform?** | `smsp__sass_average_branch_targets_threads_uniform.pct` | **100%** |
| **Is the SM occupied?** | `sm__warps_active.avg.pct_of_peak_sustained_active` | **75–100%** |
| **DRAM bandwidth achieved?** | `dram__bytes_read.sum.per_second` | Compare to GPU peak (320 GB/s on T4) |

$$
\text{Speedup} = \frac{T_{\text{baseline}}}{T_{\text{new}}} \qquad \text{Effective Bandwidth (GB/s)} = \frac{\text{Bytes Read} + \text{Bytes Written}}{\text{Time (seconds)} \times 10^9}
$$

---

### 5. The APOD Optimization Log 📝
Track every optimization round with **one hypothesis and one change at a time**:

| Version | Change (Only One!) | Hypothesis | Time (ms) | Speedup vs CPU | Effective Bandwidth | Decision |
| :---: | :--- | :--- | :---: | :---: | :---: | :---: |
| **$V_0$** | CPU Baseline | Single-threaded reference | 47.2 ms | $1.0\times$ | 1.4 GB/s | Ground Truth |
| **$V_1$** | Basic Tree Reduction | First parallel version | 1.81 ms | $26.1\times$ | 37.1 GB/s | Keep |
| **$V_2$** | Interleaved Addressing | Reduce warp divergence | 1.67 ms | $28.2\times$ | 40.1 GB/s | Keep |
| **$V_3$** | Sequential Addressing | Eliminate bank conflicts | 0.89 ms | $52.8\times$ | 75.4 GB/s | Keep |
| **$V_4$** | Thread Coarsening | Process multiple elements per thread | ? ms | ? $\times$ | ? GB/s | Keep / Revert |
| **$V_5$** | Warp Shuffle | Register-to-register reduction | ? ms | ? $\times$ | ? GB/s | Keep / Revert |

---

## Part 2: Parallel Reduction Through APOD 🧩

Now we apply APOD to optimize array summation across multiple rounds.

### 1. The Reduction Task & General Form
A **Reduction** combines an array of $n$ elements into a single scalar value using an associative binary operator:

$$
\text{acc} = \text{IDENTITY} \qquad \text{for } i \in [0, n - 1]: \quad \text{acc} = \text{Operator}(\text{acc}, \text{input}[i])
$$

- **Sum:** $\sum x_i$ (identity: $0$, operator: $+$)
- **Product:** $\prod x_i$ (identity: $1$, operator: $\times$)
- **Min / Max:** $\min x_i$ or $\max x_i$ (identity: $\pm\infty$)

> [!IMPORTANT]
> A reduction can only run in parallel if the operator is **associative**: $(a + b) + c = a + (b + c)$.

---

### 2. Assess: Sequential CPU Baseline ($V_0$)
```cpp
int reduceOnHost(int *in, int n) {
    int s = in[0];
    for (int i = 1; i < n; i++) {
        s += in[i];
    }
    return s;
}
```

- **Complexity:** $n - 1$ steps $\rightarrow \mathcal{O}(n)$ time, $n - 1$ additions $\rightarrow \mathcal{O}(n)$ work.
- **Dataset:** $n = 16,777,217$ ints ($2^{24} + 1 \approx 67.1\text{ MB}$).
- **CPU time ($V_0$):** $\approx 47.2\text{ ms}$.
- **Hardware Speed-of-Light target (Tesla T4 peak 320 GB/s):**

$$
T_{\text{ideal}} \approx \frac{67.1\text{ MB}}{320\text{ GB/s}} \approx \mathbf{0.21\text{ ms}}
$$

Our optimization goal is to push kernel execution toward this $0.21\text{ ms}$ ceiling.

---

### 3. Parallelize: The Reduction Tree Concept
Instead of adding numbers sequentially, threads pair up elements in a binary tree:

```
Step 1:  [1 + 9]    [5 + 1]    [6 + 4]    [7 + 2]   -> 4 additions (half threads active)
           10          6          10         9
Step 2:       [10 + 6]               [10 + 9]       -> 2 additions
                 16                     19
Step 3:                 [16 + 19]                   -> 1 addition
                           35
```

#### The Numbers Behind the Tree
- **Total Work:** $\frac{N}{2} + \frac{N}{4} + \dots + 1 = \mathbf{N - 1\text{ additions}}$ (Work-efficient).
- **Execution Steps:** $\mathbf{\log_2(N)\text{ steps}}$ (For $N = 1,000,000$, only 20 steps vs 1,000,000 on CPU).
- **Peak Resource Demand:** $\frac{N}{2} = \mathbf{500,000\text{ threads}}$ at Step 1.
- **Average Parallelism:**

$$
\text{Average Parallelism} = \frac{N - 1}{\log_2(N)} \approx \frac{1,000,000}{20} = \mathbf{50,000\text{ threads}}
$$

> [!WARNING]
> **The Resource Inefficiency Bottleneck:**
> While Step 1 needs 500,000 threads, subsequent steps cut active threads in half each time. In later steps, **over 90% of threads sit idle** while still reserving registers and SM slots.
> 
> In the next section, we will implement the first CUDA kernel ($V_1$) and use **Thread Coarsening** and **Warp Shuffle** to resolve this imbalance.
