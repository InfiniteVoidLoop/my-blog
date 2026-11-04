---
name: write-blog
description: Automated workflow for drafting, formatting, and verifying clean, well-structured English blog posts for AstroPaper.
---

# Write Blog Workflow

Use this workflow whenever drafting, writing, or updating articles in `my-blog`.

---

## Step 1: Gather Inputs & Context
1. Identify the **topic**, target **category** (e.g., `artificial-intelligent`), and **slug** (in kebab-case).
2. Check if the article belongs to an existing series (e.g., `series: "Artificial Intelligent"` and its `seriesOrder`).
3. Set the target file path: `src/content/posts/<category>/<slug>.md`.

---

## Step 2: Draft the Post (Follow `GEMINI.md`)
Adhere strictly to the rules in `GEMINI.md`:
- **Language:** English.
- **Tone:** Professional, accessible, using simple terms and analogies.
- **Length:** Concise and punchy — avoid bloated or overly complicated explanations.
- **Frontmatter:** Fill in `author: DangVoHongPhuc`, current timestamp with `+07:00` offset, relevant tags, and a 1–2 sentence description.
- **Logical Flow:**
  1. Quick Hook / Problem statement.
  2. Hero banner image reference.
  3. `## Table of contents`.
  4. Intuition & real-world analogy.
  5. The mechanics (math/code with plain-English explanation).
  6. Key Takeaways (3–5 bullet points).

---

## Step 3: Verify & Validate
1. Inspect the markdown file to ensure headings, LaTeX formulas (`$$`), and code fences are properly closed.
2. If requested or before finishing, run a dry check (e.g., `pnpm build` or Astro content check) to ensure no schema violations occur.
