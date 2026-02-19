# Publishing Guide
## Blog + Research Workflow
### Jekyll Architecture Reference Manual

---

# Table of Contents

1. Introduction  
2. Blog Publishing System  
3. Research Publishing System  
4. Navigation System  
5. Search System  
6. Adding Static Pages  
7. Content Standards  
8. Tag & Category Governance  
9. SEO + Structured Data  
10. Deployment Workflow  
11. Teaching Architecture Overview  
12. Advanced Expansion Roadmap  

---

# 1. Introduction

This site runs on:

- GitHub Pages
- Jekyll
- Static generation
- Auto-generated navigation
- Auto-generated search index
- Auto-generated structured data
- Deterministic layouts

No manual index editing is required.

All expansion is controlled through front matter and collections.

---

# 2. Blog Publishing System

## Location

`_posts/`

## File Naming Format

`YYYY-MM-DD-title-slug.md`

Example:

`2026-03-01-field-architecture-and-trust.md`

Rules:
- Must begin with full ISO date
- Lowercase only
- Hyphen-separated
- .md extension

## Required Front Matter

---
layout: post
title: "Post Title"
date: 2026-03-01
description: "Short description"
tags: [tag1, tag2]
categories: [analysis]
image: /assets/img/default-og.png
---

Write content below in Markdown.

Publishing automatically updates:
- /blog/
- /blog/tags/
- /blog/categories/
- Search index

---

# 3. Research Publishing System

## Location

`_papers/`

## File Naming

`paper-title.md`

## Required Front Matter

---
layout: paper
title: "Paper Title"
date: 2026-02-14
description: "Short description"
tags: [tag1]
category: theory
pdf: /assets/papers/file.pdf
image: /assets/img/default-og.png
---

Publishing automatically updates:
- /research/
- /research/tags/
- /research/categories/
- Search index

---

# 4. Navigation System

Navigation is controlled by front matter:

Include in nav:
nav_order: 3
nav_label: "Writing"

Exclude:
nav_exclude: true

---

# 5. Search System

Auto-generated from:
- Pages
- Posts
- Papers

Exclude from search:
search_exclude: true

Endpoint:
/assets/data/search-index.json

---

# 6. Adding Static Pages

Create a file like:

about.md

With front matter:

---
layout: site
title: "About"
description: "About page"
nav_order: 2
---

---

# 7. Content Standards

- Lowercase filenames
- Hyphen-separated
- Required title + description

---

# 8. Tag & Category Governance

Use consistent lowercase tags.
Use broad categories.

---

# 9. SEO + Structured Data

Automatically includes:
- Canonical URLs
- OpenGraph
- Twitter Cards
- JSON-LD

---

# 10. Deployment Workflow

1. Add Markdown file
2. Commit
3. Push
4. GitHub Pages builds automatically

---

# 11. Teaching Architecture Overview

Demonstrates:
- Separation of content and layout
- Metadata-driven navigation
- Metadata-driven indexing
- Structured data compliance
- Expandable collections

---

# 12. Advanced Expansion Roadmap

Future upgrades:
- Draft workflow
- RSS feed
- Tag landing pages
- Content validation
- Pre-commit linting
- Knowledge graphing

---

End of Guide
