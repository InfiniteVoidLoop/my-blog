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
