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

![Parallel Reduction Tree Implementation](@/assets/images/parallel_programming/reduction-tree.png)
*Figure 2: Parallel reduction tree pairwise summation across time steps.*

#### The Numbers Behind the Tree
- **Total Work:** $\frac{N}{2} + \frac{N}{4} + \dots + 1 = \mathbf{N - 1\text{ additions}}$ (Work-efficient).
- **Execution Steps:** $\mathbf{\log_2(N)\text{ steps}}$ (For $N = 1,000,000$, only 20 steps vs 1,000,000 on CPU).
- **Peak Resource Demand:** $\frac{N}{2} = \mathbf{500,000\text{ threads}}$ at Step 1.
- **Average Parallelism:**

$$
\text{Average Parallelism} = \frac{N - 1}{\log_2(N)} \approx \frac{1,000,000}{20} = \mathbf{50,000\text{ threads}}
$$

#### When is the Tree Allowed?
The parallel tree changes the evaluation order:
- **Sequential:** $(((a \oplus b) \oplus c) \oplus d)$
- **Parallel:** $((a \oplus b) \oplus (c \oplus d))$

The operation must satisfy:
- **Associative:** $(a \oplus b) \oplus c = a \oplus (b \oplus c)$
- **Commutative:** $a \oplus b = b \oplus a$ (required when reordering operands across threads)

- **Allowed:** Integer $+$, $\times$, $\min$, $\max$, AND, OR, XOR.
- **Disallowed:** Subtraction, division (non-associative).
- **Note on Floats:** Floating-point addition is not strictly associative due to rounding, so GPU and CPU sums can differ slightly.

#### Parallel Reduction in Real Life
- **Sports & Tournaments:** Single-elimination brackets to find a tournament winner ($\max$ reduction).
- **Big Data & MapReduce:** Google and Hadoop partition massive datasets into chunks and use reduction trees to compute global sums, word counts, and aggregate logs.
- **Machine Learning & Vision:** Batch normalization, loss reduction (MSE, cross-entropy), dot products, vector norms, and image histograms.

> [!WARNING]
> **The Resource Inefficiency Bottleneck:**
> While Step 1 needs 500,000 threads, subsequent steps cut active threads in half each time. In later steps, **over 90% of threads sit idle** while still reserving registers and SM slots.

---

### 4. A Simple Single-Block Reduction Kernel (`reduceBlksKernel0`)
Before scaling up to millions of elements across multiple blocks, let's examine the baseline implementation for a single block (Slide 34–35).

![Simple Reduction Kernel Execution Flow](@/assets/images/parallel_programming/simple-reduction-kernel.png)
*Figure 3: Thread-to-data mapping in a single-block reduction kernel across stride doubling steps.*

#### Implementation
```cpp
__global__ void reduceBlksKernel0(int* in, int* out, int n) {
    int i = 2 * threadIdx.x;

    for (int stride = 1; stride <= blockDim.x; stride *= 2) {
        if (threadIdx.x % stride == 0)
            in[i] += in[i + stride];
        __syncthreads();
    }

    if (threadIdx.x == 0)
        *out = in[0];
}
```

#### Step-by-Step Breakdown
1. **Thread-to-Data Mapping (`i = 2 * threadIdx.x`):**
   - Each thread initially manages two contiguous elements.
   - Thread 0 starts at index 0, Thread 1 at index 2, Thread 2 at index 4, etc.
2. **Iterative Stride Doubling (`stride *= 2`):**
   - At `stride = 1`: all threads are active (`tid % 1 == 0`), pairing indices $(0, 1), (2, 3), (4, 5), \dots$.
   - At `stride = 2`: only even threads participate (`tid % 2 == 0`), pairing $(0, 2), (4, 6), \dots$.
   - At `stride = 4`: only threads divisible by 4 participate, pairing $(0, 4), (8, 12), \dots$.
   - After $\log_2(\text{blockDim.x})$ steps, the block's sum accumulates at `in[0]`.
3. **Barrier Synchronization (`__syncthreads()`):**
   - Forces all threads in the block to finish reading and writing their pair before advancing to the next stride.
   - Prevents **data races** where a fast thread in step $k+1$ reads an index before a slower thread in step $k$ writes to it.
4. **Final Output (`threadIdx.x == 0`):**
   - Thread 0 writes the reduced block result `in[0]` to `*out`.

#### Critical Limitations
> [!CAUTION]
> **Why this kernel cannot scale directly to arbitrary input sizes:**
> 1. **Block Boundary Constraint:** `__syncthreads()` synchronizes threads **within the same block only**. Because a CUDA block has a hardware ceiling of 1024 threads, this kernel can reduce at most $2 \times 1024 = 2048$ elements.
> 2. **Severe Warp Divergence:** The condition `threadIdx.x % stride == 0` causes thread divergence within warps. Even if only 1 thread in a warp of 32 is active, the entire warp must still be scheduled.
> 
> To handle arbitrary array lengths ($n > 2048$), we must extend this into **Hierarchical Multi-Block Reduction**.


---

### 5. Hierarchical Reduction for Arbitrary Input Lengths 🌐

In real-world applications, arrays contain millions of elements ($n \gg 2048$). Because `__syncthreads()` cannot synchronize across different blocks, we solve this with **Hierarchical Reduction**:

1. **Partition:** Divide the array into independent chunks, assigning one chunk of $2 \times \text{blockSize}$ elements to each block.
2. **Local Block Reduction:** Each block computes its own **partial sum** using tree reduction.
3. **Global Accumulation:** Combine the partial sums into the final result.

![Hierarchical Reduction for Bigger Inputs](@/assets/images/parallel_programming/hierarchical-reduction.png)
*Figure 2: Hierarchical reduction partitioning input into blocks to produce partial sums.*

#### Kernel Implementation (`V1_naive`)

```cpp
__global__ void reduceV1_naive(int *in, int *partial, int n) {
    // Starting index of this block (each block handles 2 * blockDim.x elements)
    int start = blockIdx.x * 2 * blockDim.x;
    int i = start + 2 * threadIdx.x;

    // Tree reduction inside the block
    for (int stride = 1; stride <= blockDim.x; stride *= 2) {
        if (threadIdx.x % stride == 0) {
            // Guard boundary for arbitrary array sizes
            if (i + stride < n) {
                in[i] += in[i + stride];
            }
        }
        __syncthreads();
    }

    // Thread 0 writes the block's partial sum
    if (threadIdx.x == 0) {
        partial[blockIdx.x] = in[start];
    }
}
```

#### Host-Side Launch Configuration
To cover arbitrary array lengths $n$, calculate `gridSize` using ceiling division:

$$
\text{gridSize} = \left\lceil \frac{n}{2 \times \text{blockSize}} \right\rceil = \frac{n + 2 \times \text{blockSize} - 1}{2 \times \text{blockSize}}
$$

```cpp
dim3 blockSize(512);
dim3 gridSize((n + 2 * blockSize.x - 1) / (2 * blockSize.x));

// Launch kernel to compute partial sums per block
reduceV1_naive<<<gridSize, blockSize>>>(d_in, d_partial, n);

// Copy partial sums back to Host and accumulate sequentially on CPU
cudaMemcpy(h_partial, d_partial, gridSize.x * sizeof(int), cudaMemcpyDeviceToHost);
int total_sum = 0;
for (int b = 0; b < gridSize.x; b++) {
    total_sum += h_partial[b];
}
```

> [!WARNING]
> **Pitfall: In-Place Reduction Destroys Input Data!**  
> `in[i] += in[i + stride]` modifies the input array in-place. If benchmarking execution time across multiple iterations, you must restore the original input array (`cudaMemcpy`) **before each timed run**, otherwise subsequent runs will sum already-reduced values!


---

### 6. Optimize Round 1: Reducing Warp Divergence ($V_1 \rightarrow V_2$) ⚡

#### Why is $V_1$ Slow? The Warp Divergence Limiter
In $V_1$, the condition `if (threadIdx.x % stride == 0)` causes severe warp divergence.
Consider a block of 256 threads (8 warps):
- **`stride = 1`:** All 256 threads are active $\rightarrow$ **0 diverged warps**.
- **`stride = 2`:** Threads with `tid % 2 == 0` run (128 threads). Every warp has 16 active and 16 idle threads $\rightarrow$ **All 8 warps diverge!**
- **`stride = 64`:** Only 4 threads run (`tid = 0, 64, 128, 192`). They land in Warps 0, 2, 4, 6 $\rightarrow$ **4 warps diverge** (each warp runs for only 1 active thread, wasting 31 slots).
- Across all iterations, $V_1$ triggers **47 diverged warp instances**. Moreover, the modulo operator (`%`) is an expensive division instruction on GPU.

---

#### The $V_2$ Solution: Pack Active Threads Together
Instead of scattering active threads across all warps, $V_2$ compacts all working threads into the **first contiguous threads** (`threadIdx.x < threshold`).

This ensures:
- Active warps run at **100% capacity** (no divergence inside).
- Inactive warps have **0 active threads** $\rightarrow$ the hardware warp scheduler skips them entirely with zero cost!

```
V1 (Scattered):  [X . X . X . X .]   -> Warp suffers 50% divergence
V2 (Compacted):  [X X X X . . . .]   -> Warp 0 runs at 100%, Warp 1 disabled
```

---

#### Demystifying the Index Formula
To let adjacent threads process numbers spread across the block, $V_2$ uses:

$$
i = \text{start} + \text{threadIdx.x} \times 2 \times \text{stride}
$$

Why $2 \times \text{stride}$? It acts as a **stride multiplier** so that lower-index threads jump to the correct data pairs:
- **`stride = 1`:** Step is $2 \times 1 = 2$. Thread 0 pairs $(0, 1)$, Thread 1 pairs $(2, 3)$, Thread 2 pairs $(4, 5)$.
- **`stride = 2`:** Step is $2 \times 2 = 4$. Thread 0 pairs $(0, 2)$, Thread 1 pairs $(4, 6)$.
- **`stride = 4`:** Step is $2 \times 4 = 8$. Thread 0 pairs $(0, 4)$.

Threads $0, 1, 2, \dots$ do all the work, while warps with higher thread IDs stay completely asleep.

---

#### Kernel Implementation (`V2_compact`)

```cpp
__global__ void reduceV2_compact(int *in, int *partial, int n) {
    int start = blockIdx.x * 2 * blockDim.x;

    for (int stride = 1; stride <= blockDim.x; stride *= 2) {
        // Stride multiplier lets contiguous threads reach distant elements
        int i = start + threadIdx.x * 2 * stride;

        // Condition packs all active threads into the front
        if (threadIdx.x < blockDim.x / stride) {
            if (i + stride < n) {
                in[i] += in[i + stride];
            }
        }
        __syncthreads();
    }

    if (threadIdx.x == 0) {
        partial[blockIdx.x] = in[start];
    }
}
```

---

#### Profiler Comparison: $V_1$ vs $V_2$
Using Nsight Compute (`ncu`) to measure active threads per warp instruction:

| Kernel Version | Active Threads / Warp Inst | Warp Efficiency | Wasted Slots |
| :--- | :---: | :---: | :---: |
| **$V_1$ (Naive)** | 28.75 / 32 | $\approx 90.0\%$ | $\approx 10.0\%$ |
| **$V_2$ (Compacted)** | **31.20 / 32** | **$\approx 97.5\%$** | **$\approx 2.5\%$** |

> [!NOTE]
> **Why is $V_2$ only slightly faster?**  
> In our benchmark, execution time improves from **1.81 ms** ($V_1$) to **1.67 ms** ($V_2$). While warp efficiency jumped to 97.5%, the speedup is modest. Calculating `i` adds arithmetic overhead, but more critically, adjacent active threads access data spaced far apart (`2 * stride`), causing **non-coalesced memory loads** (and shared memory bank conflicts). This brings us to **$V_3$**!

---

#### The $V_3$ Breakthrough: Sequential Addressing
To eliminate strided accesses, $V_3$ reverses the reduction tree:
- Start with `stride = blockDim.x` and halve the stride at each step (`stride /= 2`) down to 1.
- Each thread simply accesses its own contiguous index:

$$
i = \text{start} + \text{threadIdx.x}
$$

![Sequential Addressing Reduction Tree](@/assets/images/parallel_programming/sequential-addressing-tree.png)

Because adjacent threads (`threadIdx.x = 0, 1, 2, ...`) read adjacent memory words (`i, i + 1, i + 2, ...`), memory requests are **fully coalesced** into single 32-byte cache line transactions!

---

#### Kernel Implementation (`V3_sequential`)

```cpp
__global__ void reduceBlksKernel3(int *in, int *out, int n) {
    int start = blockIdx.x * 2 * blockDim.x;
    int i = start + threadIdx.x;

    // Reverse stride from half-block down to 1
    for (int stride = blockDim.x; stride > 0; stride /= 2) {
        if (threadIdx.x < stride) {
            if (i + stride < n) {
                in[i] += in[i + stride];
            }
        }
        __syncthreads();
    }

    if (threadIdx.x == 0) {
        atomicAdd(out, in[start]);
    }
}
```

---

#### Profiler Evidence: Memory Coalescing in Action
Comparing the hardware memory transactions in Nsight Compute:

```shell
ncu --metrics l1tex__t_requests_pipe_lsu_mem_global_op_ld.sum,\
l1tex__t_sectors_pipe_lsu_mem_global_op_ld.sum \
-k regex:"reduce.*" ./reduce 256
```

| Kernel Version | Load Requests | Sectors Fetched (32B) | Global Memory Traffic | Execution Time |
| :--- | :---: | :---: | :---: | :---: |
| **$V_1$ (Naive)** | 227,335 | 1,046,535 | High | 1.81 ms |
| **$V_2$ (Compacted)** | 83,975 | 1,046,535 | High (identical to $V_1$) | 1.67 ms |
| **$V_3$ (Sequential)** | **83,975** | **272,391** | **3.8× Less Traffic!** | **0.85 ms (2× faster!)** |

> [!TIP]
> **Key Insight:**  
> $V_2$ fixed warp divergence but fetched the exact same memory sectors as $V_1$ because adjacent threads were reading far-apart addresses. $V_3$ fixed the memory layout: consecutive threads read consecutive bytes, cutting bus traffic by **$3.8\times$** and doubling execution speed!

---

### 7. Optimize Round 2: Thread Coarsening & Grid-Stride Loops ($V_4$) ⚙️

#### Assessing $V_3$: Too Many Threads Doing Too Little
While $V_3$ achieved an impressive $51.5\times$ speedup over CPU, a critical resource inefficiency remains:
- **Massive thread count:** 1 thread per 2 elements means launching **8 million threads** (32,768 blocks) for $n = 16.7\text{M}$.
- **Idle threads:** After step 1, 50% of threads are idle. After step 3, **87.5% of threads are idle**.
- **High barrier overhead:** Each block executes 9 synchronization barriers (`__syncthreads()`) just to reduce 512 elements.
- **Host burden:** The GPU produces 32,768 partial sums that must be transferred and summed.

#### The Coarsening Concept: Do More Work in Registers
Instead of creating millions of threads that die after one step, **Thread Coarsening** gives each thread multiple elements to sum locally before entering the tree:

1. **Step 1 (Sequential Accumulation):** Each thread loops over multiple elements spaced by the grid stride and accumulates the sum in a **private register variable**.
2. **Step 2 (Block Tree Reduction):** Once the data is condensed, threads run the tree reduction on just **one value per thread**.

![Thread Coarsening Concept](@/assets/images/parallel_programming/thread-coarsening-concept.png)

> [!NOTE]
> Accumulating in private registers requires **zero synchronization barriers** and **zero global memory writes**.

---

#### The Grid-Stride Loop Pattern
Rather than launching 32,768 blocks, we launch just enough blocks to saturate all Streaming Multiprocessors (SMs) on the GPU (e.g., $160$ blocks of 256 threads on Tesla T4):

```cpp
int gid = blockIdx.x * blockDim.x + threadIdx.x;
int totalThreads = gridDim.x * blockDim.x;

int sum = 0;
// Each thread sums elements spaced by the entire grid width
for (int k = gid; k < n; k += totalThreads) {
    sum += in[k];
}
```

- **Scalable:** Runs safely for arbitrary array sizes $n$ with any grid configuration.
- **Coalesced:** In every iteration, thread $k$ and thread $k+1$ access contiguous memory addresses.
- **Hardware-friendly:** Replaces 32,768 blocks with 160 persistent blocks.

---

#### Kernel Implementation (`V4_coarsened`)

```cpp
__global__ void reduceV4_coarsened(int *in, int *out, int n) {
    extern __shared__ int sdata[];

    int gid = blockIdx.x * blockDim.x + threadIdx.x;
    int totalThreads = gridDim.x * blockDim.x;

    // 1. Thread coarsening: accumulate multiple elements into a register
    int sum = 0;
    for (int k = gid; k < n; k += totalThreads) {
        sum += in[k];
    }

    sdata[threadIdx.x] = sum;
    __syncthreads();

    // 2. Sequential addressing tree within shared memory
    for (int stride = blockDim.x / 2; stride > 0; stride /= 2) {
        if (threadIdx.x < stride) {
            sdata[threadIdx.x] += sdata[threadIdx.x + stride];
        }
        __syncthreads();
    }

    // 3. Block leader writes result
    if (threadIdx.x == 0) {
        atomicAdd(out, sdata[0]);
    }
}
```

**Benchmark Result:** Execution time plunges from $0.85\text{ ms}$ down to **$0.325\text{ ms}$**! Throughput skyrockets to **$206.7\text{ GB/s}$** ($134.8\times$ speedup over CPU).

---

### 8. Optimize Round 3: Warp Shuffle & Eliminating Barriers ($V_5$) 🚀

#### The Final Barrier Bottleneck
In the final 5 steps of the block tree reduction (when `stride < 32`), all active threads reside inside **Warp 0** (threads $0$ through $31$).

Yet, standard shared memory code still executes:
- Multiple reads and writes to shared memory.
- `__syncthreads()` barrier instructions at every single step!

Because threads in a warp execute synchronously in lockstep, barriers within a single warp are completely redundant.

---

#### The Solution: Warp Shuffle (`__shfl_down_sync`)
CUDA provides warp shuffle instructions that allow threads inside the same warp to read each other's register values directly across the SM crossbar network:

$$
\text{T } \_\_\text{shfl\_down\_sync}(\text{unsigned mask}, \text{T var}, \text{unsigned delta})
$$

![Warp Shuffle Operation](@/assets/images/parallel_programming/warp-shuffle-operation.png)

- **Zero Memory Overhead:** Values travel directly from register to register without touching shared or global memory.
- **Zero Barrier Stalls:** No `__syncthreads()` needed!

```cpp
inline __device__ int warpReduceSum(int val) {
    for (int offset = 16; offset > 0; offset /= 2) {
        val += __shfl_down_sync(0xffffffff, val, offset);
    }
    return val;
}
```

Replacing shared memory reduction in Warp 0 with `warpReduceSum()` shaves off remaining latency, achieving **$0.324\text{ ms}$** and **$206.8\text{ GB/s}$**.

---

### 9. Optimize Round 4: Combining Block Results via Atomics ($V_6$) 🎯

#### How Should We Combine Block Partials?
Once each block finishes reducing its portion, how do we aggregate the final scalar result?

| Option | Approach | Trade-off / Cost |
| :--- | :--- | :--- |
| **Option A: Host Finish** | Copy partials back to CPU and sum in a loop | High PCIe latency, slow serial CPU loop ($V_1$–$V_3$) |
| **Option B: Second Kernel** | Launch another reduction kernel on the partial array | Kernel launch overhead |
| **Option C: GPU Atomic Add** | Block leader threads add directly into single global memory address | Hardware-serialized atomic contention |

![Atomics across Blocks](@/assets/images/parallel_programming/atomics-across-blocks.png)

#### Why Atomics Win With Coarsening
When we had 32,768 blocks in $V_1$, having 32,768 blocks write to one address caused heavy memory serialization.

However, with **Thread Coarsening ($V_4$)**, we only launch **160 blocks**! Serializing 160 atomic additions takes less than $1\ \mu\text{s}$, completely obliterating the milliseconds spent copying partial arrays to the host:

```cpp
if (threadIdx.x == 0) {
    atomicAdd(out, sdata[0]); // Only 160 atomic updates across the whole GPU!
}
```

> [!CAUTION]
> **Data Race Warning:**  
> Never permit multiple threads inside the same block to write to the global accumulator simultaneously. Only designated leader threads (`threadIdx.x == 0`) should invoke `atomicAdd`.

---

### 10. Wrap-up: APOD Journey & The PCIe Reality Check 🏁

#### Comprehensive Optimization Scorecard (Tesla T4)
Benchmark results for reducing $n = 16,777,217$ integers ($67.11\text{ MB}$ of data) on NVIDIA Tesla T4 ($320\text{ GB/s}$ peak bandwidth):

| Kernel Version | Optimization Strategy | Bottleneck Removed | Time (ms) | Effective BW | Speedup |
| :--- | :--- | :--- | :---: | :---: | :---: |
| **$V_0$ Host CPU** | Single-core C++ sequential loop | — | 43.76 ms | 1.5 GB/s | $1.0\times$ (ref) |
| **$V_1$ Naive GPU** | Basic parallel reduction tree | Serial CPU loop | 1.635 ms | 41.0 GB/s | $26.8\times$ |
| **$V_2$ Compact Threads** | Contiguous active thread indexing | Warp divergence | 1.621 ms | 41.4 GB/s | $27.0\times$ |
| **$V_3$ Sequential Addr** | Reversed stride + contiguous layout | Strided uncoalesced memory | 0.849 ms | 79.0 GB/s | $51.5\times$ |
| **$V_4$ Coarsened** | Grid-stride loop + registers | Idle threads & barrier stalls | 0.325 ms | 206.7 GB/s | $134.8\times$ |
| **$V_5$ Warp Shuffle** | `__shfl_down_sync` register exchange | Shared memory & warp barriers | **0.324 ms** | **206.8 GB/s** | **$134.8\times$** |
| **$V_6$ Atomics** | Block-level `atomicAdd` | Host partial collection | 0.330 ms | 203.6 GB/s | $132.8\times$ |
| **NVIDIA CUB** | `cub::DeviceReduce::Sum` | Industrial reference | 0.394 ms | 170.4 GB/s | $111.1\times$ |

---

#### Approaching the Speed-of-Light (SOL)
With $V_5$, our custom CUDA kernel achieved:

$$
\text{Effective Bandwidth} = \frac{16.78\text{M} \times 4\text{ bytes}}{0.324\text{ ms}} = 206.8\text{ GB/s}
$$

This represents **$64.6\%$** of the theoretical physical ceiling ($320\text{ GB/s}$) and comfortably outpaces NVIDIA's heavily tuned CUB library ($170.4\text{ GB/s}$) for this workload size.

---

#### The PCIe Reality Check: Amdahl's Law Strikes Back!
Before celebrating a $135\times$ speedup, examine the end-to-end wall clock time:

```
[ CPU Sequential Sum ] ======================================> 43.7 ms

[ GPU Execution Flow ]
|-- PCIe H2D Copy (14.8 ms) --|-- Kernel (0.32 ms) --|-- D2H Copy (0.01 ms) --|
Total GPU Wall-Clock = 15.1 ms
```

| Component | Time (ms) | Percentage of Total Time |
| :--- | :---: | :---: |
| **PCIe Transfer (Host $\rightarrow$ Device)** | 14.8 ms | **97.9%** |
| **Optimized GPU Kernel ($V_5$)** | 0.32 ms | **2.1%** |
| **Total GPU End-to-End** | **15.1 ms** | **100.0%** |

> [!WARNING]
> **The Real-World Lesson:**  
> While the kernel itself is **$135\times$ faster** than the CPU, the overall application is only **$\approx 3\times$ faster** ($15.1\text{ ms}$ vs $43.7\text{ ms}$) because PCIe transfer consumes $98\%$ of the total runtime!  
> To unlock the full power of GPUs:
> 1. **Keep data on device:** Chain multiple GPU operations together so data stays in VRAM.
> 2. **Overlap transfers:** Use CUDA Streams and Pinned (`cudaHostAlloc`) memory to overlap compute with PCIe copies.

---

#### Summary Checklist: The APOD Engineering Takeaway
1. **Never guess—profile first:** Use `nsys` for system-level timelines and `ncu` for warp-level micro-architecture bottlenecks.
2. **Eliminate Warp Divergence:** Ensure warps are either 100% active or 100% idle.
3. **Coalesce Memory Accesses:** Ensure adjacent threads access adjacent 4-byte words to utilize all 32 bytes of every memory sector.
4. **Coarsen Threads:** Don't launch millions of short-lived threads; use grid-stride loops to accumulate values locally in registers with zero synchronization cost.
5. **Leverage Warp-Level Primitives:** Replace intra-warp shared memory and `__syncthreads()` with fast register shuffles (`__shfl_down_sync`).
6. **Aggregate with Atomics:** When thread count is kept compact, GPU `atomicAdd` is far faster than offloading aggregation to the CPU.

