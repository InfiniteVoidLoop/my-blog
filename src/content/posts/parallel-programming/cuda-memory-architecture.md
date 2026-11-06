---
author: DangVoHongPhuc
pubDatetime: 2026-11-06T10:00:00+07
title: "CUDA Memory Architecture: From DRAM Bottlenecks to On-Chip SRAM"
slug: cuda-memory-architecture
featured: false
draft: false
tags:
    - parallel-programming
    - series-of-parallel-programming
    - cuda-memories
    - shared-memory
description: "A developer's guide to GPU memory hierarchy in CUDA: Global, Constant, Register, Local, and Shared Memory, plus Tiled Matrix Multiplication."
series: "Parallel Programming"
seriesOrder: 5
---
Modern GPUs pack thousands of arithmetic cores capable of executing trillions of calculations per second. Yet, in many real-world programs, those powerful cores spend more than 80% of their time idle—stalled and waiting for numbers to arrive from memory.

To build blazingly fast CUDA kernels, writing parallel threads is only half the battle. The other half is mastering **CUDA Memory Architecture**: placing your data in the right memory space at the right time.

![CUDA Memory Architecture](/posts/parallel-programming/cuda-memory-architecture/index.png)

## Table of contents

## The Big Picture: Why Isn't Global Memory Enough? 🧠

In earlier programs, we relied almost exclusively on **Global Memory** (`cudaMalloc`, `cudaMemcpy`). While convenient, Global Memory has two harsh physical constraints:

1. **High Access Latency:** Global Memory resides on **off-chip DRAM**. Reading a variable from DRAM takes **400 to 800 clock cycles**, while an arithmetic instruction takes only **~4 cycles**.
2. **Finite Bus Bandwidth:** On an NVIDIA Tesla T4, peak DRAM bandwidth is **$320\text{ GB/s}$**. While large, dividing that bandwidth among tens of thousands of simultaneous threads quickly saturates the memory bus, creating severe traffic jams.

To solve this "Memory Wall", GPU architects designed a multi-tier memory hierarchy with dedicated **on-chip memory spaces** residing directly inside each Streaming Multiprocessor (SM).

![Hardware View of CUDA Memories](@/assets/images/parallel_programming/cuda-memory-hardware-view.png)
*Figure 1: Hardware view of CUDA memory spaces across SMs and off-chip DRAM.*

---

## Part 1: The Off-Chip Spaces 🐢

These memory spaces physically reside on the external DRAM chips soldered around the GPU processor. They offer large capacity (Gigabytes) but suffer from high latency.

### 1. Global Memory (GMEM)

Global Memory is the central storage of the GPU—what is advertised on the box as VRAM (e.g., 16 GB on a Tesla T4, 24 GB on an RTX 4090).

![Real GPU Board with DRAM](@/assets/images/parallel_programming/gpu-real-board-dram.png)
*Figure 2: The GPU silicon die in the center connected to surrounding off-chip DRAM chips via memory buses.*

#### Key Characteristics
- **Location:** Off-chip DRAM (slowest access: 400–800 cycles).
- **Scope:** Accessible by **all threads across all blocks** in the Grid, as well as the Host CPU.
- **Lifetime:** Lasts for the entire application until freed with `cudaFree`.
- **API:** Allocated via `cudaMalloc` and populated via `cudaMemcpy`.

```cpp
// Host allocates and populates Global Memory
int *d_arr;
cudaMalloc(&d_arr, N * sizeof(int));
cudaMemcpy(d_arr, h_arr, N * sizeof(int), cudaMemcpyHostToDevice);

// Any thread in any block can read and write to d_arr
myKernel<<<grid, block>>>(d_arr);

cudaFree(d_arr);
```

> [!TIP]
> Always ensure memory accesses to Global Memory are **coalesced**: consecutive threads in a warp should read consecutive 4-byte memory words so the GPU can combine them into a single 32-byte cache-line transaction.

---

### 2. Local Memory (LMEM) — The Misleading Name

Don't let the word "Local" fool you! Local Memory is **NOT on-chip**. It physically resides in the exact same **off-chip DRAM** as Global Memory.

- **Scope:** Private to a single thread.
- **Latency:** **400 to 800 clock cycles** (same speed penalty as Global Memory!).
- **How it is created:** You never allocate Local Memory explicitly. The compiler automatically spills variables from registers into Local Memory when it has no other choice.

#### When Does Register Spilling Happen?
1. **Register Pressure:** When a kernel uses more variables than the SM's physical registers can accommodate.
2. **Large Arrays Declared in Kernel:**
   ```cpp
   __global__ void spillExample() {
       float array[100]; // TOO LARGE! Automatically spills to Local Memory!
       // ...
   }
   ```
3. **Dynamic Array Indexing (The Hidden Trap):**
   Registers do not have hardware memory addresses (there is no `R[i]` assembly instruction). If you access an array using a runtime variable index, the compiler cannot map it to registers and must push the array to Local Memory:
   ```cpp
   __global__ void dynamicIndexTrap() {
       float arr[4];
       int idx = threadIdx.x % 4;
       float val = arr[idx]; // Runtime index! Spills to slow Local Memory!
   }
   ```

#### How to Prevent Spills
- **Compile-time Constants:** If an index is known at compile time, the compiler maps it directly to registers (`arr[0] -> R0`, `arr[1] -> R1`).
- **Loop Unrolling:** Use `#pragma unroll` on small loops so variable indices expand into compile-time constants.
- **Use Shared Memory:** If you need a small temporary array, declare it as `__shared__` so it resides in fast on-chip SRAM instead of spilling to DRAM!

```shell
# Check whether your kernel spills to local memory
nvcc -Xptxas=-v my_kernel.cu
# Output shows: ptxas info : Used X registers, Y bytes smem, Z bytes lmem [spill]
```


---

## Part 2: The Fast On-Chip Spaces 🚀

On-chip memory spaces reside directly inside the SM silicon. They are hundreds of times faster than DRAM and form the secret weapon of GPU performance.

### 3. Register Memory (RMEM)

Registers are the fastest storage on the entire GPU, operating at **~1 clock cycle**.

- **Scope:** Strictly private to each individual thread.
- **Lifetime:** Exists only while the thread executes.
- **Allocation:** Automatic! Any scalar variable declared inside a kernel (`int i`, `float sum`) is stored in a register.

#### Register Pressure vs. Occupancy
Every SM has a shared pool of physical registers (typically **65,536 registers = 64K**). While CUDA allows a single thread to use up to **255 registers**, doing so kills parallel throughput:

- If each thread uses **32 registers**:
  $$
  \text{Active Threads per SM} = \frac{65,536}{32} = \mathbf{2048\text{ threads}} \quad (\mathbf{100\%\text{ Occupancy}})
  $$
- If each thread consumes **120 registers**:
  $$
  \text{Active Threads per SM} = \frac{65,536}{120} \approx \mathbf{546\text{ threads}} \quad (\approx \mathbf{26\%\text{ Occupancy}})
  $$

When thread count drops, the SM no longer has enough resident warps to switch between when waiting on DRAM, destroying latency hiding.

---

### 4. Constant Memory (CMEM)

Constant Memory is designed for data that **does not change** during kernel execution and is read simultaneously by multiple threads.

- **Total Capacity:** 64 KB total (stored in DRAM).
- **On-Chip Cache:** Each SM has a dedicated **Constant Cache (typically 8 KB)**.
- **Scope:** Read-only for all GPU threads; written by the Host CPU.

#### Low Latency, But Low Bandwidth!
Constant Cache has a unique hardware profile:
- **Low Latency (~1 cycle):** On a cache hit, data arrives almost instantly.
- **Low Bandwidth (4 Bytes / cycle / SM):** The hardware bus can only emit **one 4-byte float/int per clock cycle**!

This narrow bus creates two opposite performance extremes depending on how threads in a warp access it:

- **Broadcast (Ideal — 1 cycle):** When all 32 threads in a warp request the **exact same memory address** (e.g., all threads reading the filter coefficient `d_flt[0]`), the hardware fetches the 4-byte value once and broadcasts it simultaneously to all 32 threads in a single clock cycle.
- **Serialization (Worst Case — 32 cycles):** When the 32 threads request **different memory addresses** (e.g., thread $k$ reading `table[k]`), the single 4-byte bus cannot serve them simultaneously. The requests must be serialized one after another, taking up to 32 separate clock cycles.

#### Real-World Example: 1D Convolution
In a 1D convolution, every thread calculates an output by sliding a filter `d_flt` across an input array.

![1D Convolution with Constant Filter](@/assets/images/parallel_programming/1d-convolution-constant-memory.png)
*Figure 3: 1D convolution where every thread multiplies its input with the shared filter kernel.*

Because every thread accesses `d_flt[j]` at the exact same loop iteration $j$, the filter is a prime candidate for Constant Memory:

```cpp
#define NF 100
__constant__ float d_flt[NF]; // Declared outside functions in global scope

// Host populates constant memory before launch
cudaMemcpyToSymbol(d_flt, h_flt, NF * sizeof(float));

__global__ void conv1D(float *d_in, float *d_out, int n) {
    int i = blockIdx.x * blockDim.x + threadIdx.x;
    if (i < n - NF + 1) {
        float sum = 0.0f;
        // In loop step j, all 32 threads read the exact same d_flt[j] -> 100% Broadcast!
        for (int j = 0; j < NF; j++) {
            sum += d_in[i + j] * d_flt[j];
        }
        d_out[i] = sum;
    }
}
```

---

### 5. Shared Memory (SMEM) — The Programmer-Managed Cache

Shared Memory is on-chip SRAM allocated per thread block. It is often described as a **"software-managed cache"**: unlike L1 cache (managed by hardware), you explicitly control what enters and leaves Shared Memory.

- **Location:** On-chip SRAM (**1 to 2 clock cycles**).
- **Size:** 48 KB to 96 KB per SM (configurable).
- **Scope:** Shared by **all threads within the same Block**. (Threads in Block A cannot see Block B's shared memory).
- **Host Accessibility:** **Zero!** The Host CPU cannot read or write Shared Memory directly.

![Shared Memory Workflow](@/assets/images/parallel_programming/shared-memory-workflow.png)
*Figure 4: The 5-step shared memory collaborative workflow.*

#### The 5-Step Shared Memory Workflow
1. **Load:** Threads cooperatively read chunks of data from slow Global Memory into fast Shared Memory.
2. **Synchronize (`__syncthreads()`):** Ensure all threads have finished writing before any thread reads.
3. **Compute:** Threads read and compute from Shared Memory at on-chip speeds.
4. **Synchronize (`__syncthreads()`):** Ensure all threads have finished computing before loading the next chunk.
5. **Store:** Write the final accumulated result back to Global Memory.

#### Why is `__syncthreads()` Mandatory?
Threads inside a block run asynchronously at varying speeds. If Thread 0 finishes loading early and immediately reads `s_Data[5]` before Thread 5 has finished loading from DRAM, Thread 0 reads **corrupt garbage data** (a **Read-After-Write Race Condition**).

`__syncthreads()` acts as a hardware barrier: **no thread proceeds until 100% of threads in the block reach the barrier.**

#### Static vs. Dynamic Shared Memory

```cpp
// 1. Static Allocation (Size known at compile time)
__global__ void staticSmemKernel(int *in, int *out) {
    __shared__ int s_data[256];
    s_data[threadIdx.x] = in[blockIdx.x * blockDim.x + threadIdx.x];
    __syncthreads();
    // compute...
}

// 2. Dynamic Allocation (Size determined at runtime via kernel launch)
__global__ void dynamicSmemKernel(int *in, int *out) {
    extern __shared__ int s_data[]; // extern keyword with unsized array
    s_data[threadIdx.x] = in[blockIdx.x * blockDim.x + threadIdx.x];
    __syncthreads();
    // compute...
}

// Host launch passing shared memory bytes as 3rd parameter:
size_t smemBytes = blockSize * sizeof(int);
dynamicSmemKernel<<<gridSize, blockSize, smemBytes>>>(d_in, d_out);
```

#### When NOT to Use Shared Memory
Do **NOT** use Shared Memory if data is read only once and not shared among threads (such as in vector addition $C[i] = A[i] + B[i]$). Copying unshared data to Shared Memory introduces extra read/write instructions and unnecessary barrier stalls. In such cases, reading directly from **Global Memory into Registers** is much faster!


---

### 6. Case Study: Tiled Matrix Multiplication 🧮

To see the dramatic impact of Shared Memory, look at **Matrix Multiplication**:

$$
C[\text{row}][\text{col}] = \sum_{k=0}^{N-1} A[\text{row}][k] \times B[k][\text{col}]
$$

#### The Naive Dilemma: Redundant DRAM Loads
In a naive matrix multiplication kernel, each thread calculates one element of $C$. To compute the dot product:
- Thread $(0, 0)$ reads Row 0 of $A$ from DRAM.
- Thread $(0, 1)$ also reads Row 0 of $A$ from DRAM.
- In fact, every single element in $A$ and $B$ is repeatedly loaded from high-latency DRAM **$N$ times**!

#### The Tiled Solution: Load Once, Reuse 32 Times!
Instead of streaming directly from DRAM, we partition matrices into small square chunks called **Tiles** (e.g., $32 \times 32$ elements) that fit entirely inside Shared Memory.

![Tiled Matrix Multiplication](@/assets/images/parallel_programming/tiled-matrix-multiplication.png)
*Figure 5: Tiled matrix multiplication partitioning computation into phased on-chip tiles.*

1. **Phase by Phase:** For each tile phase $m \in [0, \frac{N}{\text{TILE\_WIDTH}} - 1]$:
   - Each thread cooperatively loads **one element** of $A$ and **one element** of $B$ into Shared Memory tiles `ds_A` and `ds_B`.
   - Call `__syncthreads()` to ensure the entire tile is loaded.
   - Threads multiply elements strictly from fast Shared Memory, accumulating into a private register.
   - Call `__syncthreads()` to prevent overwriting the tile before all threads finish.
2. **The Payoff:** Global Memory traffic drops by a factor of $\text{TILE\_WIDTH}$. With $32 \times 32$ tiles, the GPU makes **$32\times$ fewer trips to DRAM**, unlocking massive speedups!

---

## Part 3: Summary & The Developer's Memory Matrix 📋

### Master Memory Comparison Matrix

| Memory Space | Variable Syntax | Physical Location | Scope | Lifetime | Typical Latency | Best Use Case |
| :--- | :--- | :--- | :--- | :--- | :---: | :--- |
| **Register** | `float a;` | On-chip Register File | Single Thread | Thread execution | **~1 cycle** | Local scalar variables & loop counters |
| **Shared** | `__shared__ float s[];` | On-chip SRAM | Thread Block | Block execution | **~1–2 cycles** | Inter-thread communication & tiled data reuse |
| **Constant** | `__constant__ float c[];` | Off-chip DRAM + On-chip Cache | Global (All threads) | Application | **~1 cycle (hit)** / 400+ (miss) | Small read-only filters broadcast to all threads |
| **Global** | `cudaMalloc(&d_g, ...);` | Off-chip DRAM | Global (All threads + Host) | Application (`cudaFree`) | **400–800 cycles** | Large input/output datasets |
| **Local** | Automatic (compiler) | Off-chip DRAM | Single Thread | Thread execution | **400–800 cycles** | Register spillover & dynamically indexed arrays |

---

### The 3 Golden Rules of CUDA Memory Optimization

1. **Maximize Register Usage, but Guard Against Spills:**  
   Keep local variables in registers. Avoid declaring large arrays inside kernels. Use `#pragma unroll` on loops with constant bounds so indices become compile-time constants rather than spilling to slow Local Memory.

2. **Leverage Constant Memory for Broadcasts:**  
   If your kernel uses small parameters, coefficients, or convolution masks ($< 64\text{ KB}$) that remain unchanged, place them in `__constant__`. The on-chip Constant Cache will broadcast values to all 32 threads in a single clock cycle.

3. **Stage Data in Shared Memory When Reused:**  
   If multiple threads in a block read the same input elements—or if a single thread reads an element repeatedly—collaboratively load it into `__shared__` memory once. Protect every load-compute phase with `__syncthreads()` to eliminate redundant DRAM traffic!
