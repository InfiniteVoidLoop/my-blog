---
author: DangVoHongPhuc
pubDatetime: 2026-10-13T20:09:20+07
title: "GPU Compute Architecture"
slug: gpu-compute-architecture
featured: false
draft: false
tags:
    - parallel-programming
    - series-of-parallel-programming
    - gpu-compute-architecture
description: "A simplified view of computing architecture in GPU, explore many interesting concepts about this"
series: "Parallel Programming"
seriesOrder: 3
---
This blog will give you a general overview of the architecture of **GPU** and given the ideas of optimize you CUDA Program.

![GPU Compute Architecture](/posts/parallel-programming/gpu-compute-architecture/index.png)

## Table of contents

## Overview of GPU Architecture

![Overview of a modern architecture of GPU](@/assets/images/parallel_programming/gpu-compute-architecture.png)
*Figure 1: Architectural overview of a modern GPU hierarchy.*

> [!NOTE]
> - A **GPU** consists of multiple **SMs** (**Streaming Multiprocessors**).
> - Each **SM** consists of multiple **SPs** (**Streaming Processors**, commonly referred to as **CUDA Cores**).

---

### Hardware vs. Software Mapping

![Hardware vs Software](@/assets/images/parallel_programming/hard-soft-gpu-compare.png)
*Figure 2: Correspondence between the software execution model (CUDA) and physical GPU hardware.*

As you can see above, these architectures are quite similar. In fact, **CUDA virtualizes** the underlying GPU hardware architecture to make programming intuitive and scalable:

> [!NOTE]
> - **Block** $\rightarrow$ Virtual **SM** (**Streaming Multiprocessor**)
> - **Thread** $\rightarrow$ Virtual **SP** (**Streaming Processor** / **CUDA Core**)

- When the **Host (CPU)** invokes a **kernel function**, a **Grid of Blocks** is created, and each **Block** is assigned to an available physical **SM** for execution.
- Each **SM** can host and execute **more than one Block** concurrently (depending on hardware resource availability—such as shared memory and registers—and the configured **block size**).

---

### Block Scheduling & Queue

![Block queue](@/assets/images/parallel_programming/block-queue.png)
*Figure 3: Hardware Block scheduler dispatching Blocks from the queue into available SMs.*

- **Blocks** that have not yet been assigned to an **SM** wait in a hardware **Block Queue**.
- When an active **Block** finishes its execution, a pending **Block** from the queue is dynamically assigned to the newly available slot in that **SM**.

> [!IMPORTANT]
> **Blocks can be assigned and executed on SMs in an arbitrary order** (concurrently, sequentially, or interleaved across different SMs).

---

### Blocks Must Be Independent 🛑

To allow hardware scalability across GPUs with varying numbers of SMs, CUDA requires that **blocks execute completely independently**:

- **No inter-block synchronization:** Threads in different blocks **cannot** synchronize or cooperate with each other directly.
- **Why? The Deadlock Trap:** Suppose Thread $a$ in Block $A$ waits on a flag set by Thread $b$ in Block $B$. If the GPU only has enough resources to run Block $A$ first, Block $B$ waits in the queue and never gets scheduled. Block $A$ waits forever for Block $B$ $\rightarrow$ **Deadlock!**

```cpp
// ❌ INCORRECT: Inter-block busy waiting causes deadlocks!
__global__ void bad_interblock(volatile int* flag, int* data) {
    if (blockIdx.x == 0 && threadIdx.x == 0) {
        while (*flag == 0) { } // Block 0 waits for Block 1
        data[0] = data[1];
    }
    if (blockIdx.x == 1 && threadIdx.x == 0) {
        data[1] = 42;
        *flag = 1;             // Block 1 may never be scheduled!
    }
}
```

> [!TIP]
> **How to communicate across blocks correctly:**
> 1. **Kernel boundaries:** Split work into two kernels. The end of a kernel launch acts as a global barrier across all blocks.
> 2. **Atomic operations:** Use atomic functions (`atomicAdd`, etc.) for race-free updates without waiting.

---

### Cooperation Inside a Block 🤝

While different blocks are isolated, threads inside the **same block** can closely cooperate:

1. **Shared Memory (`__shared__`):** High-speed, on-chip SRAM shared by all threads in the block.
2. **Barrier Synchronization (`__syncthreads()`):**
   - Every thread in the block stops and waits at the barrier.
   - No thread proceeds until **all** threads in the block have arrived.
   - Guarantees that memory writes before the barrier are visible to all threads after it.

![Barrier synchronization in time](@/assets/images/parallel_programming/barrier-synchronization.png)
*Figure 4: Barrier synchronization (__syncthreads) coordinating threads over time.*

#### Barrier Pitfalls to Avoid ⚠️

`__syncthreads()` is powerful, but misuse leads to undefined behavior or silent hangs:

##### 1. Divergent Barriers
`__syncthreads()` must be executed by **all threads** in a block. Placing it inside a branch where threads take different paths leaves threads waiting on opposite sides forever:

```cpp
// ❌ WRONG: Neither barrier sees all threads -> undefined behavior / hang
if (threadIdx.x % 2 == 0) {
    __syncthreads();
} else {
    __syncthreads();
}

// ✔️ CORRECT: Condition is uniform for the entire block
if (blockIdx.x % 2 == 0) {
    __syncthreads(); // Safe: all threads in the block take this branch together
}
```

##### 2. Early Return
Calling `return` early before a barrier means some threads exit, stranding the remaining threads waiting at `__syncthreads()`:

```cpp
// ❌ WRONG: Out-of-bounds threads return early, trapping others at the barrier
if (t >= count) return;
float v = a[start + count - 1 - t];
__syncthreads();
a[start + t] = v;

// ✔️ CORRECT: Guard the work, not the barrier
float v = 0.0f;
if (t < count) v = a[start + count - 1 - t]; // Only valid threads read
__syncthreads();                             // ALL threads reach the barrier
if (t < count) a[start + t] = v;             // Only valid threads write
```

---

### What is a Warp? ⚡

In software, program pretends every thread runs on its own. But down in hardware, the GPU doesn't bother managing single threads—it bundles **32 threads together into a single unit called a Warp**.

> [!TIP]
> In simple terms, a **Warp** is just a group of **32 threads**

![Warp Hardware Execution Model](@/assets/images/parallel_programming/warp.png)
*Figure 5: Logical Thread Blocks partitioned into 32-thread hardware Warps executed by an SM.*

Here is how this works:

1. **Software View (SIMT — Single Instruction, Multiple Threads):**  
   Every thread believes it's the main character. It has its own program counter, its own registers, and executes the entire kernel from top to bottom.
2. **Hardware Reality (Lockstep Execution):**  
   A GPU doesn't give every thread its own expensive instruction decoder. Instead, **one single instruction unit** issues **one instruction at a time** (like `FADD` or `FMUL`) to all 32 threads in the warp, which then execute simultaneously in ALUs.

---

### How is a Block Divided into Warps? 🧩

Regardless of whether your thread block is 1D, 2D, or 3D in software, the hardware always flattens it into a 1D sequence of threads and partitions them into **32 consecutive threads per warp**:

- **1D Blocks:** Direct consecutive grouping:
  - $\text{Warp 0} \rightarrow \text{Threads } [0 \dots 31]$
  - $\text{Warp 1} \rightarrow \text{Threads } [32 \dots 63]$
  - $\text{Warp } m \rightarrow \text{Threads } [32m \dots 32m + 31]$

- **Warp Padding (Hardware Inefficiency):**  
  If the block size is **not a multiple of 32** (e.g., 50 threads), the hardware allocates $\lceil 50 / 32 \rceil = 2$ warps (64 thread slots). The remaining 14 lanes in Warp 1 are padded with **inactive threads**—they perform no work but still consume registers and hardware resources!

- **2D Blocks:** Flattened row-major into 1D, then sliced into warps:
  $$\text{Index} = \text{threadIdx.y} \times \text{blockDim.x} + \text{threadIdx.x}$$

- **3D Blocks:** Flattened into 1D, then sliced into warps:
  $$\text{Index} = \text{threadIdx.z} \times (\text{blockDim.x} \times \text{blockDim.y}) + \text{threadIdx.y} \times \text{blockDim.x} + \text{threadIdx.x}$$

---

### Practice Quiz: Warp Thread Mapping 🧠

Test your understanding of how multi-dimensional blocks map into hardware warps:

#### Question 1: Block `(16, 16)`
> **Which $(x, y)$ threads form Warp 3?**

<details>
<summary><b>Reveal Solution</b></summary>

* Total threads: $16 \times 16 = 256$ threads ($256 / 32 = 8$ warps).
* Warp 3 covers linear indices **$96$ to $127$**.
* Each row has $\text{blockDim.x} = 16$ threads:
  * Index $96 \dots 111$: row $y = 96 / 16 = 6$ ($x \in [0, 15]$).
  * Index $112 \dots 127$: row $y = 112 / 16 = 7$ ($x \in [0, 15]$).
* **Answer:** Warp 3 contains all threads from **rows 6 and 7** ($\text{threadIdx.y} \in \{6, 7\}$ for all $\text{threadIdx.x} \in [0, 15]$).
</details>

#### Question 2: Block `(8, 8)`
> **Which threads form Warp 1?**

<details>
<summary><b>Reveal Solution</b></summary>

* Total threads: $8 \times 8 = 64$ threads ($64 / 32 = 2$ warps).
* Warp 1 covers linear indices **$32$ to $63$**.
* With $\text{blockDim.x} = 8$:
  * $32 / 8 = 4$ and $63 / 8 = 7$.
* **Answer:** Warp 1 contains the bottom half of the block: **rows 4, 5, 6, and 7** ($\text{threadIdx.y} \in [4, 7]$ for all $\text{threadIdx.x} \in [0, 7]$).
</details>

#### Question 3: Block `(4, 4, 4)`
> **How many warps are created, and which $z$ values are in Warp 0?**

<details>
<summary><b>Reveal Solution</b></summary>

* Total threads: $4 \times 4 \times 4 = 64$ threads $\rightarrow$ **$2$ warps**.
* Each $z$-slice has $\text{blockDim.x} \times \text{blockDim.y} = 4 \times 4 = 16$ threads:
  * $z = 0$ covers threads $0 \dots 15$.
  * $z = 1$ covers threads $16 \dots 31$.
* **Answer:** **$2$ warps**. Warp 0 covers all threads in slices **$z = 0$ and $z = 1$**.
</details>

#### Question 4: Block `(30, 2)`
> **How many warps are created, and which threads are in Warp 1?**

<details>
<summary><b>Reveal Solution</b></summary>

* Total threads: $30 \times 2 = 60$ threads.
* Warps: $\lceil 60 / 32 \rceil =$ **$2$ warps** (Warp 1 has 4 padded inactive threads).
* Warp 1 covers linear indices **$32$ to $59$** (threads $60 \dots 63$ are padded/inactive):
  * Linear 32: $y = 32 / 30 = 1$, $x = 32 \pmod{30} = 2$.
  * Linear 59: $y = 59 / 30 = 1$, $x = 59 \pmod{30} = 29$.
* **Answer:** **$2$ warps**. Warp 1 contains threads with **$\text{threadIdx.y} = 1$ and $\text{threadIdx.x} \in [2, 29]$** (plus 4 inactive padding threads).
</details>

---

### What is Warp Divergence? ⚠️

Since all 32 threads in a warp share **one single instruction unit**, what happens when they encounter an `if / else` branch where some threads evaluate to `true` and others to `false`?

This is called **Warp Divergence** (or Branch Divergence).

![Warp Divergence Example](@/assets/images/parallel_programming/warp-divergence.png)
*Figure 6: Warp Divergence executing branching paths serially with inactive threads masked out.*

#### Hardware Reality: Predicated Execution
The GPU cannot split a warp into two to run different branches in parallel. Instead:
1. **Serial Execution:** The warp executes **each taken branch path one after another**.
2. **Masking:** When executing the `if` branch, threads that took `else` are disabled (idle). When executing the `else` branch, threads that took `if` are disabled.

> [!WARNING]
> While your program will still produce correct results, **execution speed drops significantly** because execution becomes serialized.

#### How to Avoid Warp Divergence

The golden rule is to make branch conditions **a multiple of the warp size (32)** so all 32 threads take the same path together:

```cpp
// ❌ WRONG (High Divergence): Adjacent threads (0, 1, 2...) take different branches
if (i % 2 == 0) {
    C[i] = A[i] * B[i];
} else {
    C[i] = A[i] / B[i];
}

// ✔️ CORRECT (No Divergence): Grouped in blocks of 32 threads
// Warp 0 (i = 0..31):   (i / 32) is 0 (even) -> ALL 32 threads execute the multiply
// Warp 1 (i = 32..63):  (i / 32) is 1 (odd)  -> ALL 32 threads execute the divide
if ((i / 32) % 2 == 0) {
    C[i] = A[i] * B[i];
} else {
    C[i] = A[i] / B[i];
}
```

> [!TIP]
> Branching on `blockIdx` instead of `threadIdx` is always safe from divergence because **all threads in the same block share the same `blockIdx`**.

---

### Warp Scheduler: Latency Hiding in Action 🔄

What happens when a Warp has to wait 200–400 clock cycles to fetch data from memory (DRAM)? Does the GPU stall and take a coffee break? **Never.**

This is where the **Warp Scheduler** shines:

![Warp Scheduler Hardware Execution Timeline](@/assets/images/parallel_programming/warp-scheduler.png)
*Figure 7: Warp Scheduler and Instruction Dispatch Units cycling through active Warps across time.*

#### How the Scheduling Flow Works (Zero-Overhead Context Switching):

In each SM, the **Warp Scheduler** continuously scans all assigned warps to see which ones are ready to calculate. Switching between warps costs **zero clock cycles** because every warp's state (registers) stays resident on chip:

```
[Cycle 1] ──► Warp 8 is ready  ──► Dispatch Instruction 11 (e.g. Memory Load)
[Cycle 2] ──► Warp 8 is WAITING for memory!
              Warp Scheduler immediately swaps:
              ──► Warp 2 is ready  ──► Dispatch Instruction 42 (e.g. Math FADD)
[Cycle 3] ──► Warp 14 is ready ──► Dispatch Instruction 95
  ...
[Cycle N] ──► Warp 8's data arrived!
              ──► Warp 8 is back in action ──► Dispatch Instruction 12
```

> [!TIP]
> **Latency Hiding:** While one Warp waits for slow memory data, other Warps keep the CUDA cores 100% busy doing calculations. 


