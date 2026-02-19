# DarrenSteptoe.com (Jekyll + GitHub Pages)

This repo is a **static Jekyll site** designed to stay lightweight while supporting a real blog + research library.

## Local preview
1) Install Ruby + Bundler
2) Run:
```bash
bundle install
bundle exec jekyll serve
```

## Content
### Blog
- Posts live in `_posts/` as Markdown (`YYYY-MM-DD-title.md`)
- Blog index lives at `/blog/` (`blog/index.md`)

### Research
- Papers live in `_papers/` as Markdown items (a Jekyll collection)
- PDFs live in `assets/papers/`
- Research index lives at `/research/` (`research/index.md`)

## ## Navigation + Search
- The “Pages” navigation panel is populated from `/search-index.json`
- Site search also uses `/search-index.json`
- No manual index updates required — Jekyll generates it automatically
