---
author: DangVoHongPhuc
pubDatetime: 2026-11-06T10:00:00+07:00
modDatetime: 2026-11-15T14:20:00+07:00
title: "CUDA Memory Architecture: Hierarchy, Coalescing & Bank Conflicts"
slug: cuda-memory-architecture
featured: false
draft: false
tags:
  - parallel-programming
  - series-of-parallel-programming
  - cuda-memories
  - shared-memory
  - global-memory-coalescing
  - bank-conflicts
description: "A comprehensive guide to GPU memory hierarchy in CUDA: Global, Local, Register, Constant, and Shared Memory, plus 32-byte sector coalescing, AoS vs SoA, and bank conflict padding."
series: "Parallel Programming"
seriesOrder: 5
---

Modern GPUs pack thousands of arithmetic cores capable of executing trillions of calculations per second. Yet, in many real-world programs, those powerful cores spend more than 80% of their time idle—stalled and waiting for numbers to arrive from memory.

To build fast CUDA kernels, writing parallel threads is only half the battle. The other half is mastering **CUDA Memory Architecture**: placing your data in the fastest memory space possible and organizing access patterns to saturate hardware bandwidth.

![CUDA Memory Architecture](/posts/parallel-programming/cuda-memory-architecture/index.png)

## Table of contents

## The Big Picture: Why Isn't Global Memory Enough? 🧠

In basic CUDA programs, we rely almost exclusively on **Global Memory** (`cudaMalloc`, `cudaMemcpy`). While convenient, Global Memory has two physical constraints:

1. **High Access Latency:** Global Memory resides on **off-chip DRAM**. Reading a variable from DRAM takes **400 to 800 clock cycles**, while an arithmetic instruction takes only **~4 cycles**.
2. **Finite Bus Bandwidth:** On an NVIDIA Tesla T4, peak DRAM bandwidth is **$320\text{ GB/s}$**. Dividing that bandwidth among tens of thousands of simultaneous threads quickly saturates the bus, creating severe traffic jams.

To overcome this "Memory Wall", GPU architectures provide a multi-tier memory hierarchy with dedicated **on-chip memory spaces** residing directly inside each Streaming Multiprocessor (SM).

![Hardware View of CUDA Memories](@/assets/images/parallel_programming/cuda-memory-hardware-view.png)
*Figure 1: Hardware view of CUDA memory spaces across SMs and off-chip DRAM.*

---

## Part 1: The Off-Chip Spaces 🐢

These memory spaces physically reside on external DRAM chips outside the GPU processor. They offer large capacity (Gigabytes) but suffer from high latency.

### 1. Global Memory (GMEM)

Global Memory is the central storage of the GPU—what is advertised as VRAM (e.g., 16 GB on a Tesla T4, 24 GB on an RTX 4090).

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
> Always ensure Global Memory accesses are **coalesced**: consecutive threads in a warp should read consecutive memory addresses so the GPU can combine them into minimal 32-byte sector transactions.

---

### 2. Local Memory (LMEM) — The Misleading Name

Don't let the word "Local" fool you! Local Memory is **NOT on-chip**. It physically resides in the exact same **off-chip DRAM** as Global Memory.

- **Scope:** Private to a single thread.
- **Latency:** **400 to 800 clock cycles** (same speed penalty as Global Memory!).
- **How it is created:** You never allocate Local Memory explicitly. The compiler automatically spills variables from registers into Local Memory when register limits are exceeded.

#### When Does Register Spilling Happen?
1. **Register Pressure:** When a kernel uses more variables than the physical registers per SM can accommodate.
2. **Large Arrays Declared in Kernel:**
   ```cpp
   __global__ void spillExample() {
       float array[100]; // Too large! Automatically spills to Local Memory!
   }
   ```
3. **Dynamic Array Indexing (The Hidden Trap):**
   Registers do not have hardware memory addresses. If you access a local array with a runtime variable index, the compiler cannot map it to registers and must spill the array to Local Memory:
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
- **Use Shared Memory:** Declare small temporary arrays with `__shared__` so they reside in fast on-chip SRAM instead of spilling to DRAM!

---

## Part 2: The Fast On-Chip Spaces 🚀

On-chip memory spaces reside directly inside each SM. They run at hardware clock speeds and form the foundation for high-performance CUDA kernels.

### 3. Register Memory (RMEM)

Registers are the fastest storage on the GPU, operating at **~1 clock cycle**.

- **Scope:** Strictly private to each individual thread.
- **Lifetime:** Exists only while the thread executes.
- **Allocation:** Automatic! Any scalar variable declared inside a kernel (`int i`, `float sum`) is stored in a register.

#### Register Pressure vs. Occupancy
Every SM has a shared pool of physical registers (typically **65,536 registers = 64K**). Using too many registers per thread limits how many warps can reside on an SM simultaneously:

- If each thread uses **32 registers**:
  $$
  \text{Active Threads per SM} = \frac{65,536}{32} = \mathbf{2048\text{ threads}} \quad (\mathbf{100\%\text{ Occupancy}})
  $$
- If each thread consumes **120 registers**:
  $$
  \text{Active Threads per SM} = \frac{65,536}{120} \approx \mathbf{546\text{ threads}} \quad (\approx \mathbf{26\%\text{ Occupancy}})
  $$

When active thread counts drop, the SM cannot hide memory latency by switching to ready warps when one warp stalls waiting for DRAM.

---

### 4. Constant Memory (CMEM)

Constant Memory stores data that **does not change** during kernel execution and is read simultaneously by multiple threads.

- **Total Capacity:** 64 KB total (stored in DRAM).
- **On-Chip Cache:** Each SM has a dedicated **Constant Cache (typically 8 KB)**.
- **Scope:** Read-only for all GPU threads; written by the Host CPU.

#### Low Latency, But Low Bandwidth!
Constant Cache has a unique hardware profile:
- **Low Latency (~1 cycle):** On a cache hit, data arrives in 1 cycle.
- **Low Bandwidth (4 Bytes / cycle / SM):** The bus can only deliver **one 4-byte value per clock cycle**!

This narrow bus creates two performance extremes:
- **Broadcast (Ideal — 1 cycle):** When all 32 threads in a warp read the **exact same memory address**, the hardware fetches the 4-byte value once and broadcasts it simultaneously to all 32 threads in a single cycle.
- **Serialization (Worst Case — 32 cycles):** When 32 threads request **different memory addresses**, the single 4-byte bus must serialize the requests, taking up to 32 separate clock cycles.

#### Real-World Example: 1D Convolution
In a 1D convolution, every thread calculates an output by multiplying input values with a shared filter kernel `d_flt`.

![1D Convolution with Constant Filter](@/assets/images/parallel_programming/1d-convolution-constant-memory.png)
*Figure 3: 1D convolution where every thread shares the same filter weights across iterations.*

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

Shared Memory is on-chip SRAM allocated per thread block. Unlike hardware-managed L1 cache, you explicitly control what enters and leaves Shared Memory.

- **Location:** On-chip SRAM (**1 to 2 clock cycles**).
- **Size:** 48 KB to 96 KB per SM (configurable).
- **Scope:** Shared by **all threads within the same Block**.
- **Host Accessibility:** None (Host CPU cannot read/write SMEM directly).

![Shared Memory Workflow](@/assets/images/parallel_programming/shared-memory-workflow.png)
*Figure 4: The shared memory collaborative workflow.*

#### The 5-Step Shared Memory Workflow
1. **Load:** Threads cooperatively load data chunks from slow Global Memory into fast Shared Memory.
2. **Synchronize (`__syncthreads()`):** Ensure all threads finish writing before any thread reads.
3. **Compute:** Threads read and compute from Shared Memory at on-chip speeds.
4. **Synchronize (`__syncthreads()`):** Ensure all threads finish computing before loading the next chunk.
5. **Store:** Write the final result back to Global Memory.

#### Why is `__syncthreads()` Mandatory?
Threads inside a block execute asynchronously. If Thread 0 finishes loading early and reads `s_data[5]` before Thread 5 finishes writing, Thread 0 reads uninitialized data (a **Read-After-Write Race Condition**). `__syncthreads()` acts as a hardware barrier: no thread proceeds until all threads in the block arrive.

---

## Part 3: Global Memory Access: Coalescing & Sectors ⚡

Even without Shared Memory, you can maximize memory performance by aligning how warps access Global Memory.

### Sectors and Cache Lines
1. **Sector (32 Bytes):** The basic hardware transfer unit between DRAM, L2, and L1.
2. **Cache Line (128 Bytes):** The cache management unit (4 sectors = 1 cache line).

![Cache Line and Sectors](@/assets/images/parallel_programming/cache-line-and-sectors.png)
*Figure 5: Memory transactions move data in 32-byte sectors grouped within 128-byte cache lines.*

### Read & Write Pipelines
- **Reads:** Checked in L1 $\to$ L2 $\to$ DRAM. Data travels across the bus in **32-byte sectors**. Even for a 4-byte request, a full 32-byte sector is fetched.
- **Writes:** L1 is **write-through** (writes update L1 and pass to L2). L2 is **write-back** (flushes to DRAM only when evicted).
- **Write Collisions:** If threads in a warp write to the same address without atomic operations, **one thread wins**, but which one wins is non-deterministic.

### Measuring Efficiency: Bus Utilization

$$
\text{Bus Utilization} = \frac{\text{Useful Bytes Requested by Warp}}{\text{Total Bytes Transferred by Hardware}} \times 100\%
$$

Where:
- $\text{Useful Bytes}$ is data needed by active threads ($32 \times 4\text{ B} = 128\text{ B}$ for 32 integers).
- $\text{Total Bytes Transferred}$ is the number of 32-byte sectors fetched $\times 32\text{ bytes}$.

### The 6 Global Memory Load Patterns

| Pattern | Code Example | Sectors | Bus Efficiency | Behavior |
| :--- | :--- | :---: | :---: | :--- |
| **Aligned Consecutive 4B** | `int c = a[idx];` | 4 | **100%** | Perfect coalescing: 32 ints fit into 4 sectors. |
| **Consecutive 8B** | `double c = a[idx];` | 8 | **100%** | 32 doubles (256B) span 8 sectors cleanly. |
| **Permuted / Shuffled** | `int c = a[shuffled_idx];` | 4 | **100%** | Coalesced by address; thread order does not matter. |
| **Misaligned Offset** | `int c = a[idx + 2];` | 5 | **80%** (theory) / **~93%** (cache) | Spills into a 5th sector; adjacent warps hit L1/L2 cache. |
| **Uniform Broadcast** | `int c = a[40];` | 1 | **12.5%** | Loads 32 bytes for 4 useful bytes. Use Constant Memory. |
| **Scattered Access** | `int c = a[rand()];` | Up to 32 | **12.5%** | Worst case: 32 separate sector transfers across memory. |

![Coalesced Load](@/assets/images/parallel_programming/coalesced-load-aligned.png)
*Figure 6: Aligned consecutive access achieves 100% bus utilization across 4 sectors.*

![Misaligned Load](@/assets/images/parallel_programming/misaligned-load-offset.png)
*Figure 7: Misaligned access spills into an extra sector, requiring 5 sectors instead of 4.*

![Broadcast Load Pattern](@/assets/images/parallel_programming/broadcast-load-pattern.png)
*Figure 8: Broadcast access: 1 sector is loaded to serve a single 4-byte value.*

![Scattered Load Pattern](@/assets/images/parallel_programming/scattered-load-pattern.png)
*Figure 9: Scattered access: 32 threads land in 32 separate sectors, causing memory divergence.*

---

### Case Study: Parallel Reduction (Kernel 2 vs. Kernel 3)

In reduction trees, earlier kernels compacted threads to avoid branch divergence:

```cpp
// Kernel 2: Strided memory indexing
int i = start + threadIdx.x * 2 * stride;
if (threadIdx.x < blockDim.x / stride) {
    in[i] += in[i + stride];
}
```

Although warp divergence was eliminated, the multiplier `threadIdx.x * 2 * stride` pushed adjacent threads apart in memory. At stride 16, thread 0 and thread 1 read elements 32 integers apart, scattering accesses across multiple sectors.

![Kernel 2 vs Kernel 3](@/assets/images/parallel_programming/reduction-kernel2-vs-kernel3.png)
*Figure 10: Strided addressing in Kernel 2 (left) versus contiguous sequential addressing in Kernel 3 (right).*

Switching to **sequential addressing** (halving the stride: $N/2, N/4, \dots$):

```cpp
// Kernel 3: Sequential addressing
for (int stride = blockDim.x / 2; stride > 0; stride /= 2) {
    if (threadIdx.x < stride) {
        s_data[threadIdx.x] += s_data[threadIdx.x + stride];
    }
    __syncthreads();
}
```

Neighbor threads `threadIdx.x = 0, 1, 2, 3` consistently access contiguous elements `s_data[0], s_data[1], s_data[2], s_data[3]`.
- **Kernel 2:** 1,046,535 sectors fetched.
- **Kernel 3:** 272,391 sectors fetched (**$3.8\times$ fewer sectors**).
- **Result:** Kernel 3 runs **$2\times$ faster** solely from coalesced memory traffic!

---

## Part 4: Data Layout: Array of Structs (AoS) vs. Struct of Arrays (SoA) 📦

Data layout in host memory directly dictates whether GPU threads can coalesce memory loads.

- **Array of Structs (AoS):** `[x0, y0, z0][x1, y1, z1]...`
  When thread $i$ loads `data[i].x`, neighboring threads are separated by 12 bytes. This creates a **strided memory access** that pulls unused $y$ and $z$ values into cache, wasting bandwidth.
- **Struct of Arrays (SoA):** `xArr[N], yArr[N], zArr[N]`
  When thread $i$ loads `xArr[i]`, all 32 threads read consecutive 4-byte floats. The access is **100% coalesced** into 4 sectors.

![AoS Strided Access](@/assets/images/parallel_programming/aos-strided-access.png)
*Figure 11: AoS access: threads are separated by 12-byte strides, fragmenting memory sectors.*

![SoA Coalesced Access](@/assets/images/parallel_programming/soa-coalesced-access.png)
*Figure 12: Struct of Arrays (SoA) ensures adjacent threads read contiguous addresses with zero gap.*

![AoS vs SoA Profiler Comparison](@/assets/images/parallel_programming/aos-vs-soa-profiler.png)
*Figure 13: NCU profiler comparison showing 4.67x more memory traffic for AoS compared to SoA.*

- **`update_AoS`:** 117,440,512 sectors fetched.
- **`update_SoA`:** 25,165,824 sectors fetched (**$4.67\times$ less memory traffic**).

---

## Part 5: Shared Memory Access: Banks, Conflicts, and Padding 🏦

While Shared Memory has low latency (~1–2 cycles), poor access patterns can create internal serialization called **Bank Conflicts**.

### The Motivation: Matrix Transpose ($O[r][c] = I[c][r]$)
In naive matrix transposition, writing to `oMatrix` is coalesced, but reading from `iMatrix` is uncoalesced because adjacent threads read down columns separated by entire rows.

Using Shared Memory as a staging buffer solves this:
1. Warp reads a tile horizontally from Global Memory into Shared Memory $\to$ **GMEM read is 100% coalesced**.
2. Synchronize threads: `__syncthreads()`.
3. Warp reads transposed values from Shared Memory and writes horizontally to Global Memory $\to$ **GMEM write is 100% coalesced**.

![Matrix Transpose with Shared Memory](@/assets/images/parallel_programming/matrix-transpose-smem.png)
*Figure 14: Matrix transpose using Shared Memory as an on-chip staging tile to ensure coalesced DRAM transfers.*

```cpp
// Kernel 2: Tiled transpose using Shared Memory
__global__ void transpose2(int *iMatrix, int *oMatrix, int w) {
    __shared__ int s_blkData[32][32];

    // Coalesced GMEM read -> write into SMEM
    int iR = blockIdx.x * blockDim.x + threadIdx.y;
    int iC = blockIdx.y * blockDim.y + threadIdx.x;
    s_blkData[threadIdx.y][threadIdx.x] = iMatrix[iR * w + iC];
    __syncthreads();

    // Read from SMEM -> coalesced GMEM write
    int oR = blockIdx.y * blockDim.y + threadIdx.y;
    int oC = blockIdx.x * blockDim.x + threadIdx.x;
    oMatrix[oR * w + oC] = s_blkData[threadIdx.x][threadIdx.y];
}
```

---

### Hardware Architecture: 32 Memory Banks
Shared Memory is split into **32 independent banks** (0 to 31):
- Each bank serves **4 bytes per clock cycle**.
- Address mapping: $\text{Bank ID} = \text{word\_index} \pmod{32}$.
- **Parallel Access (1 Cycle):** 32 threads access 32 distinct banks.
- **Bank Conflict ($N$ Cycles):** $N$ threads in a warp access *different* words in the *same* bank. Requests serialize into $N$ cycles.
- **Broadcast (1 Cycle):** Multiple threads read the *identical* word in a bank.

![SMEM Bank Conflict Concept](@/assets/images/parallel_programming/smem-bank-conflict-concept.png)
*Figure 15: Shared Memory banks service 1 request per cycle. Concurrent accesses to different addresses in the same bank serialize.*

---

### The 32-Way Conflict in Kernel 2 💥

In Kernel 2, the shared tile is declared as `s_blkData[32][32]`:
- In a $32 \times 32$ 2D array, $\text{Bank ID} = (\text{row} \times 32 + \text{col}) \pmod{32} = \mathbf{col \pmod{32}}$.
- **All elements in the same column reside in the EXACT same bank!**
  - Column 0 is entirely in Bank 0.
  - Column 1 is entirely in Bank 1.

![Bank Conflict in Kernel 2](@/assets/images/parallel_programming/smem-kernel2-bank-conflict.png)
*Figure 16: In a 32x32 layout, reading down a column causes all 32 threads to hit the exact same bank.*

- **Writing to SMEM (`s_blkData[threadIdx.y][threadIdx.x]`):** `threadIdx.x` increments across columns (0 to 31) $\to$ 32 distinct banks $\to$ **Zero bank conflict**.
- **Reading from SMEM (`s_blkData[threadIdx.x][threadIdx.y]`):**
  - All 32 threads in the warp read from the same column `threadIdx.y`.
  - All 32 words map to **Bank `threadIdx.y`**!
  - **Result:** A catastrophic **32-way bank conflict**, serializing execution into 32 clock cycles.

---

### Kernel 3: The Padding Solution 🛠️

To eliminate this conflict, add **one extra dummy column** (padding) to the shared memory tile:

```cpp
// Kernel 3: Eliminating bank conflicts with padding
__global__ void transpose3(int *iMatrix, int *oMatrix, int w) {
    // Add 1 column of padding: [32][33] instead of [32][32]
    __shared__ int s_blkData[32][33];

    int iR = blockIdx.x * blockDim.x + threadIdx.y;
    int iC = blockIdx.y * blockDim.y + threadIdx.x;
    s_blkData[threadIdx.y][threadIdx.x] = iMatrix[iR * w + iC];
    __syncthreads();

    int oR = blockIdx.y * blockDim.y + threadIdx.y;
    int oC = blockIdx.x * blockDim.x + threadIdx.x;
    oMatrix[oR * w + oC] = s_blkData[threadIdx.x][threadIdx.y];
}
```

#### Why Padding Works:
With 33 elements per row:
- Row 0 starts at Bank 0.
- Row 1 starts at index 33 $\implies 33 \pmod{32} = \mathbf{\text{Bank } 1}$ (shifted by 1).
- Row 2 starts at index 66 $\implies 66 \pmod{32} = \mathbf{\text{Bank } 2}$ (shifted by 2).
- Element $[r][c]$ maps to $\text{Bank ID} = (r \times 33 + c) \pmod{32} = \mathbf{(r + c) \pmod{32}}$.

![Kernel 3 Padding Solution](@/assets/images/parallel_programming/smem-kernel3-padding-solution.png)
*Figure 17: Adding 1 padding element shifts bank assignments diagonally, ensuring column reads hit 32 unique banks.*

When reading along a column, thread $r$ accesses Bank $(r + c) \pmod{32}$. All 32 threads access **32 distinct banks** in parallel! Bank conflicts drop from 32-way straight down to **zero**.

> [!TIP]
> 📥 **Download Handwritten Lecture Notes:** [lecture-05-cuda-memories.rnote](/notes/lecture-05-cuda-memories.rnote) *(Open with the free, open-source [Rnote](https://rnote.flathub.org/) app to review the step-by-step whiteboard derivations).*

```bash
# Verify bank conflict elimination with NCU
ncu --metrics l1tex__data_bank_conflicts_pipe_lsu_mem_shared_op_ld.sum ./transpose
# Kernel 2: Millions of conflicts -> Kernel 3: 0 conflicts!
```

---

## Part 6: Summary & Key Takeaways 📋

### Memory Hierarchy Quick Reference

| Memory Space | Location | Scope | Speed (Latency) | Best Use Case |
| :--- | :--- | :--- | :---: | :--- |
| **Register (RMEM)** | On-chip | Single thread | **~1 cycle** | Temporary scalar variables & counters |
| **Shared (SMEM)** | On-chip SRAM | Thread block | **~1–2 cycles** | Sharing and reusing data within a block |
| **Constant (CMEM)** | DRAM + On-chip Cache | All threads (Read-only) | **~1 cycle** (hit) | Constants & filter coefficients |
| **Global (GMEM)** | Off-chip DRAM | All threads + CPU | **400–800 cycles** | Large input and output datasets |
| **Local (LMEM)** | Off-chip DRAM | Single thread | **400–800 cycles** | Overflow when registers run out |

### Key Takeaways
- **DRAM Moves in 32-Byte Sectors:** Even if a thread requests 4 bytes, the GPU transfers an entire 32-byte sector over the bus. Pack threads to use every fetched byte.
- **Strive for 100% Coalescing:** Ensure consecutive threads in a warp (`threadIdx.x`) read consecutive memory addresses to minimize sector loads.
- **Prefer Struct of Arrays (SoA):** Group identical attributes into contiguous arrays to eliminate strided gaps that waste memory bandwidth.
- **Shared Memory has 32 Banks:** Each 4-byte bank serves one request per cycle. Concurrent accesses to different addresses in the same bank serialize into $N$ cycles.
- **Eliminate Bank Conflicts with Padding:** Adding a single padding column (`[32][33]`) shifts bank addresses diagonally, turning a 32-way bank conflict into zero-conflict parallel access.
