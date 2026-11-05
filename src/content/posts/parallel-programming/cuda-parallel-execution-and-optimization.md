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

This post covers **APOD (Assess $\rightarrow$ Parallelize $\rightarrow$ Optimize $\rightarrow$ Deploy)**, NVIDIA's standard optimization cycle, and applies it to **Parallel Reduction**.

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

## 1. Why Do We Need a Process? 🛠️

Many developers rewrite a CPU loop in CUDA only to find:
- The GPU version runs **slower than single-threaded CPU code**.
- Days are spent optimizing a kernel that takes only **2% of total runtime**.
- Code runs fast but produces **wrong results** on certain input sizes.

These issues happen due to:
1. **Guessing instead of measuring.**
2. **Optimizing the wrong bottleneck.**
3. **Changing too many variables at once.**
4. **Skipping correctness checks.**

To solve this, we use the **APOD Cycle**.

---

## 2. The APOD Cycle 🔄

APOD is a repeating cycle for performance engineering:

![The APOD Cycle](@/assets/images/parallel_programming/apod-cycle.png)
*Figure 1: The APOD optimization cycle.*

- **Assess:** Profile code, identify bottlenecks, and calculate potential gains.
- **Parallelize:** Write the simplest correct GPU kernel (1 thread per output).
- **Optimize:** Measure $\rightarrow$ find the limiter $\rightarrow$ change **one thing** $\rightarrow$ verify speedup.
- **Deploy:** Validate with real-world data and ship early. A $3\times$ speedup shipped today is better than an unfinished $30\times$ optimization.

---

## 3. Assess & Amdahl's Law ⏱️

Before writing CUDA code, ask:
1. **Where is the hotspot?**
2. **Can it run in parallel?** (independent iterations, associative math).
3. **Is the dataset large enough?** (PCIe transfer overhead will dominate small data).

### Amdahl's Law

Overall speedup is strictly limited by the **serial (CPU-only) portion**:

$$
S(N) = \frac{1}{(1 - P) + \frac{P}{N}}
$$

$$
S_{\max} = \frac{1}{1 - P}
$$

- $P$: Fraction of execution time that can be parallelized.
- $1 - P$: Serial fraction (file I/O, CPU prep).
- $N$: Speedup of the parallelized portion.

| Parallel Fraction ($P$) | Speedup ($N = 10\times$) | Speedup ($N = 100\times$) | Infinite Cores ($N = \infty$) |
| :---: | :---: | :---: | :---: |
| **50%** | $1.8\times$ | $1.98\times$ | **$2.0\times$** |
| **90%** | $5.3\times$ | $9.2\times$ | **$10.0\times$** |
| **99%** | $9.2\times$ | $50.3\times$ | **$100.0\times$** |

> [!WARNING]
> If $50\%$ of your program is serial, the entire application can **never exceed a $2\times$ speedup**, even on an infinite GPU.

#### The 40× Trap Example
A program takes 100 seconds: 80s in `filter()`, 20s in file I/O. If CUDA makes `filter()` **$40\times$ faster**:
- New time: $20\text{s} + \frac{80\text{s}}{40} = 22\text{s}$.
- Overall speedup: $\frac{100\text{s}}{22\text{s}} \approx \mathbf{4.5\times}$.
- Maximum possible speedup ($N = \infty$): $\frac{100\text{s}}{20\text{s}} = \mathbf{5.0\times}$.

A $40\times$ kernel only gives a $4.5\times$ application speedup. Always measure end-to-end time.

---

## 4. Assessing a GPU Kernel (Cycle 2+) 🔍

In later cycles, **Assess means profiling your GPU kernel**:

### The 4 Diagnostic Questions
1. **Kernel or Copies?** If `cudaMemcpy` takes 90% of the runtime, optimizing the kernel will not help. Keep data on the GPU.
2. **Which Kernel?** Find the kernel consuming the most execution time.
3. **Why is it Slow?**
   - **Warp Divergence:** Threads in a warp take different branches, forcing serial execution.
   - **Idle Threads:** Threads sit inactive during computation.
   - **Barrier Stalls:** Threads wait too long at `__syncthreads()`.
   - **Low Memory Bandwidth:** Uncoalesced global memory access wastes bus throughput.
4. **Is it Close to Peak Bandwidth?** If effective bandwidth hits 70–80% of hardware peak, the kernel is already memory-bound and near optimal.

---

## 5. Profiling Tools Cheatsheet 💻

### 1. Timing (`cudaEvent`)
CPU timers (`std::chrono`) only measure kernel launch overhead unless synchronized. Always use `cudaEvent` with a warm-up launch:

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

### 2. Nsight Systems (`nsys`): Application Timeline
Answers: *Where does the program spend its time across CPU, PCIe copies, and GPU kernels?*

```shell
nsys profile --stats=true -o app_report ./my_app
nsys stats app_report.nsys-rep
```

### 3. Nsight Compute (`ncu`): Kernel Analysis
Answers: *Why is a specific kernel slow?*

```shell
# Profile 1 launch of a specific kernel with key sections
ncu --section SpeedOfLight --section Occupancy --section WarpStateStats -k regex:myKernel -c 1 ./my_app

# Query key metrics directly in the terminal
ncu --metrics gpu__time_duration.sum,\
smsp__thread_inst_executed_per_inst_executed.ratio,\
smsp__sass_average_branch_targets_threads_uniform.pct,\
sm__warps_active.avg.pct_of_peak_sustained_active,\
dram__bytes_read.sum.per_second \
-k regex:myKernel -c 1 ./my_app
```

| Metric | What It Measures | Target |
| :--- | :--- | :--- |
| `gpu__time_duration.sum` | Kernel execution time | Lower is better |
| `smsp__thread_inst_executed_per_inst_executed.ratio` | Active threads per warp instruction | **32.0** (no divergence) |
| `smsp__sass_average_branch_targets_threads_uniform.pct` | Branches where all threads take the same path | **100%** |
| `sm__warps_active.avg.pct_of_peak_sustained_active` | Achieved occupancy | **75–100%** for memory-bound kernels |
| `dram__bytes_read.sum.per_second` | DRAM read bandwidth | Compare to GPU peak (e.g. 320 GB/s on T4) |

### 4. Speedup & Effective Bandwidth Formulas

$$
\text{Speedup} = \frac{T_{\text{baseline}}}{T_{\text{new}}}
$$

$$
\text{Effective Bandwidth (GB/s)} = \frac{\text{Bytes Read} + \text{Bytes Written}}{\text{Time (seconds)} \times 10^9}
$$

---

## 6. The APOD Optimization Log 📝

Keep an optimization log for every change. Only change **one variable at a time**:

| Version | Change (Only One!) | Hypothesis | Time (ms) | Speedup vs CPU | Effective Bandwidth | Correct? | Decision |
| :---: | :--- | :--- | :---: | :---: | :---: | :---: | :---: |
| **$V_0$** | CPU Baseline | Single-threaded reference | 47.2 ms | $1.0\times$ | 1.4 GB/s | Reference | Keep |
| **$V_1$** | Basic Tree Reduction | First parallel version | 1.81 ms | $26.1\times$ | 37.1 GB/s | Pass | Keep |
| **$V_2$** | Interleaved Addressing | Reduce warp divergence | 1.67 ms | $28.2\times$ | 40.1 GB/s | Pass | Keep |
| **$V_3$** | Sequential Addressing | Eliminate bank conflicts | 0.89 ms | $52.8\times$ | 75.4 GB/s | Pass | Keep |
| **$V_4$** | Thread Coarsening | Process multiple elements per thread | ? ms | ? $\times$ | ? GB/s | ? | Keep / Revert |
| **$V_5$** | Warp Shuffle | Register-to-register reduction | ? ms | ? $\times$ | ? GB/s | ? | Keep / Revert |

---

## 7. Parallel Reduction: The Task 🧩

A **Reduction** condenses an array of $n$ elements into a single scalar value:
- **Sum:** $\sum x_i$ (identity: $0$)
- **Product:** $\prod x_i$ (identity: $1$)
- **Min / Max:** $\min x_i$ or $\max x_i$ (identity: $+\infty$ / $-\infty$)

$$
\text{acc} = \text{IDENTITY}
$$

$$
\text{for } i \in [0, n - 1]: \quad \text{acc} = \text{Operator}(\text{acc}, \text{input}[i])
$$

> [!IMPORTANT]
> A reduction can only be parallelized if its operator is **associative**:  
> $(a + b) + c = a + (b + c)$.

---

## 8. Assess Baseline: Sequential CPU Reduction ($V_0$) ⏱️

### CPU Code
```cpp
int reduceOnHost(int *in, int n) {
    int s = in[0];
    for (int i = 1; i < n; i++) {
        s += in[i];
    }
    return s;
}
```

- **Time:** $n - 1$ steps $\rightarrow \mathcal{O}(n)$.
- **Work:** $n - 1$ additions $\rightarrow \mathcal{O}(n)$.

### Hardware Baseline & Target Limit
- **Dataset:** $n = 16,777,217$ ints ($2^{24} + 1 \approx 67.1\text{ MB}$).
- **CPU time:** $\approx 47.2\text{ ms}$.
- **Workload nature:** Memory-bound (only 1 addition per 4 bytes loaded).
- **GPU Speed-of-Light target (Tesla T4 peak 320 GB/s):**

$$
T_{\text{ideal}} \approx \frac{67.1\text{ MB}}{320\text{ GB/s}} \approx \mathbf{0.21\text{ ms}}
$$

Our optimization goal is to get as close to $0.21\text{ ms}$ as possible.

---

## 9. Parallel Reduction Tree: The Numbers 📊

Instead of adding numbers one by one, a parallel reduction uses a **tree structure** (similar to a tournament bracket):

```
Step 1:  [1 + 9]    [5 + 1]    [6 + 4]    [7 + 2]   -> 4 additions
           10          6          10         9
Step 2:       [10 + 6]               [10 + 9]       -> 2 additions
                 16                     19
Step 3:                 [16 + 19]                   -> 1 addition
                           35
```

For $N$ elements:
1. **Total Work:** $\frac{N}{2} + \frac{N}{4} + \dots + 1 = \mathbf{N - 1\text{ additions}}$.
   - Matches the CPU work $\rightarrow$ **Work-efficient**.
2. **Execution Steps:** $\mathbf{\log_2(N)\text{ steps}}$.
   - For $N = 1,000,000$, it takes only **20 steps** (compared to 1,000,000 on CPU).
3. **Peak Resource Demand:** $\frac{N}{2} = \mathbf{500,000\text{ threads}}$ at Step 1.
4. **Average Parallelism:**

$$
\text{Average Parallelism} = \frac{N - 1}{\log_2(N)} \approx \frac{1,000,000}{20} = \mathbf{50,000\text{ threads}}
$$

> [!WARNING]
> **Why the Naive Tree is Inefficient:**
> Step 1 needs 500,000 threads, but Step 2 only needs 250,000, and the final step needs only 1 thread. Up to **90% of threads sit idle in later stages**.
> 
> In upcoming sections, we will use **Thread Coarsening** and **Warp Shuffle** to solve this hardware utilization bottleneck.
