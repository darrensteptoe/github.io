# Testing

## Local

### Prerequisites
- Ruby + Bundler
- Node.js

### Install Ruby deps
```bash
bundle install
```

### Run self-test
```bash
npm test
```

Pass output:
`Self-Test: PASS — contracts ok; build ok; search ok; links ok; jsonld ok; assets ok`

## What the self-test checks
- Front matter contracts for posts, papers, and nav ordering
- Jekyll builds successfully
- Search index JSON is valid and excludes non-content pages
- Internal links resolve to generated files
- JSON-LD scripts parse as valid JSON
- Referenced paper PDFs exist
- Asset size guardrails for performance
