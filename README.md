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

## Releases and the release notice

gascoigne reads `latest.json` from this site once a day (the background server, never a hook) and,
when it names a release newer than the one installed, opens that release's page once at the next
agent session. The file is `{"id": "X.Y.Z", "released": "YYYY-MM-DD", "page": "releases/X.Y.Z/"}`; `page`
must stay on this site.

To publish a release:

1. Add `releases/X.Y.Z/index.html` (copy the last one: what's new, upgrade steps, the release notice
   note) and a changelog entry in `index.html`.
2. Deploy and check the page is live.
3. **Only then** change `latest.json` to the new id (a later commit): the id is what sends users to the
   page, so it must not point at a page that does not exist yet.

The screenshots of the setup page are real output of `gascoigne setup` (`assets/setup-*.png`).

Colors follow the gascoigne dashboard theme (burgundy night, moonlight).

Licensed under the [Apache License 2.0](LICENSE).
