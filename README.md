# gascoigne website

Static landing page for [gascoigne](https://github.com/gascoigne-ai/gascoigne-cli), served by GitHub Pages.
No build step: `index.html`, `assets/style.css`, `assets/site.js` and the dashboard screenshots.

Preview locally:

```sh
python3 -m http.server 8000   # then open http://localhost:8000
```

Publish: push this directory to `github.com/gascoigne-ai` as the `main` branch, then set
Settings → Pages → Source to "GitHub Actions". `.github/workflows/pages.yml` deploys every push
to `main` (or a manual run).

The raw goroutine dump in the hero is `testdata/eval/go/test-timeout-goroutines.txt` from the
gascoigne repo, inlined and HTML-escaped; the agent view is its eval output. Savings figures
come from the gascoigne README (`make eval`).

Colors follow the gascoigne dashboard theme (burgundy night, moonlight).

Licensed under the [Apache License 2.0](LICENSE).
