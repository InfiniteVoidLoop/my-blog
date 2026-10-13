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

We will discuss and provide concrete examples about this later.

### What is a Warp? ⚡

In software, program pretends every thread runs on its own. But down in hardware, the GPU doesn't bother managing single threads—it bundles **32 threads together into a single unit called a Warp**.

> [!TIP]
> In simple terms, a **Warp** is just a group of **32 threads**

![Warp Hardware Execution Model](@/assets/images/parallel_programming/warp.png)
*Figure 4: Logical Thread Blocks partitioned into 32-thread hardware Warps executed by an SM.*

Here is how this works:

1. **Software View (SIMT — Single Instruction, Multiple Threads):**  
   Every thread believes it's the main character. It has its own program counter, its own registers, and executes the entire kernel from top to bottom.
2. **Hardware Reality (Lockstep Execution):**  
   A GPU doesn't give every thread its own expensive instruction decoder. Instead, **one single instruction unit** issues **one instruction at a time** (like `FADD` or `FMUL`) to all 32 threads in the warp, which then execute simultaneously in ALUs.

