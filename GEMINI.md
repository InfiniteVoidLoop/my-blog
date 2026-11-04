# Blog Writing Guidelines (AstroPaper)

Always follow these guidelines whenever writing, drafting, or updating blog posts in this project.

---

## 1. Core Principles
- **Language:** English.
- **Tone:** Professional, engaging, and clear. Avoid academic jargon when plain words work better.
- **Simplicity:** Explain concepts in simple, intuitive terms. Break hard ideas down into everyday analogies before showing math or code.
- **Length & Focus:** Keep posts concise and focused. Do not make articles needlessly long or overly complicated.
- **Clarity over Cleverness:** Organize content logically with clean transitions so readers never feel lost or overwhelmed.

---

## 2. Standard Frontmatter Template
Every post in `src/content/posts/<category>/<slug>.md` must include this exact frontmatter structure:

```yaml
---
author: DangVoHongPhuc
pubDatetime: YYYY-MM-DDTHH:mm:ss+07:00
title: "Clear, Engaging Title"
slug: kebab-case-slug
featured: false
draft: false
tags:
  - relevant-tag-1
  - relevant-tag-2
description: "A concise 1-2 sentence summary explaining what this post covers and why it matters."
# Optional series fields (include if part of an ongoing track)
# series: "Artificial Intelligent"
# seriesOrder: 1
---
```

---

## 3. Article Structure & Flow
Every article should follow a logical, reader-friendly hierarchy:

1. **The Hook (1 short paragraph):** State the problem immediately. Why does this topic matter? What will the reader learn?
2. **Hero Image (if applicable):**
   ```markdown
   ![Alt text](/posts/<category>/<slug>/index.png)
   ```
3. **Table of Contents:**
   ```markdown
   ## Table of contents
   ```
4. **The Intuition (Why & What):**
   - Start with an intuitive real-world scenario or analogy.
   - Explain the core concept in plain words first.
5. **The Mechanics (How):**
   - Use clean LaTeX for formulas: `$inline$` or `$$block$$`.
   - Keep code snippets practical, well-commented, and minimal.
   - Use bullet points, bold text, or comparison tables to make key points easy to scan.
6. **Summary / Key Takeaways:**
   - 3 to 5 clear bullet points recapping the core lessons.

---

## 4. Writing Style Checklist
- [ ] Are sentences short and active rather than passive and rambling?
- [ ] Is every formula explained in plain words right below it?
- [ ] Are headings descriptive and sequential (H2 $\to$ H3 $\to$ H4)?
- [ ] Did you avoid repetitive filler paragraphs?
