// Moon phases: the shaded share of the disk is the share of tokens saved.
document.documentElement.classList.add("js");
const NS = "http://www.w3.org/2000/svg";
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
const fmt = n => Math.round(n).toLocaleString("en-US");

// shadePath covers fraction f of a disk from the left: the left half, plus or
// minus a half-ellipse whose width makes the area come out to f.
function shadePath(f, c, r) {
  const rx = Math.abs(1 - 2 * f) * r;
  const sweep = f > 0.5 ? 0 : 1;
  return `M${c} ${c - r}A${r} ${r} 0 0 0 ${c} ${c + r}A${rx} ${r} 0 0 ${sweep} ${c} ${c - r}Z`;
}

function drawMoon(svg, f) {
  const size = Number(svg.getAttribute("width"));
  const c = size / 2, r = c - 1.5;
  svg.setAttribute("viewBox", `0 0 ${size} ${size}`);
  svg.replaceChildren();
  const el = (tag, attrs) => {
    const e = document.createElementNS(NS, tag);
    for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
    svg.append(e);
    return e;
  };
  el("circle", { class: "lit", cx: c, cy: c, r });
  el("path", { class: "shade", d: shadePath(f, c, r) });
  el("circle", { class: "edge", cx: c, cy: c, r });
}

document.querySelectorAll("svg.moon").forEach(svg => drawMoon(svg, Number(svg.dataset.saved)));

// Syntax colours. index.html already carries the colours for every code block
// (marked data-hl), so they show without JS; this tokenizer only colours blocks
// that are not pre-coloured. Each rule is [prefix, body, class]: the prefix is
// matched but left plain, so no lookbehind is needed. A rule set that fails to
// compile, or a block that fails, is skipped on its own.
const STR = String.raw`"(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'`;
const NUM = ["", String.raw`\b\d[\d_.]*\b`, "num"];
const FN = ["", String.raw`\b[A-Za-z_]\w*(?=\()`, "fn"];
const r = (body, cls, pre) => [pre || "", body, cls];
const LANGS = {
  py: [r("#.*", "com"), r(String.raw`"""[^\n]*`, "str"), r(STR, "str"),
    r(String.raw`\b(?:import|from|def|class|return|or|and|not|async|await|lambda|None|True|False|if|else|for|in|with|as)\b`, "kw"), FN, NUM],
  ts: [r(String.raw`\/\/.*`, "com"), r(STR + "|`[^`]*`", "str"),
    r(String.raw`\b(?:import|from|const|let|await|async|return|export|function|new|null|undefined|true|false)\b`, "kw"), FN, NUM],
  go: [r(String.raw`\/\/.*`, "com"), r(STR + "|`[^`]*`", "str"),
    r(String.raw`\b(?:import|func|return|var|if|nil|package|type|struct|err)\b`, "kw"), FN, NUM],
  java: [r(String.raw`\/\/.*`, "com"), r(STR, "str"), r(String.raw`@\w+`, "kw"),
    r(String.raw`\b(?:public|private|final|class|static|void|String|return|new)\b`, "kw"), FN, NUM],
  cs: [r(String.raw`\/\/.*`, "com"), r(STR, "str"), r(String.raw`\b(?:using|var|new|string|await|async|return)\b`, "kw"), FN, NUM],
  rust: [r(String.raw`\/\/.*`, "com"), r(STR, "str"), r(String.raw`\b(?:let|fn|use|mut|pub|return)\b`, "kw"), FN, NUM],
  sh: [r("#.*", "com", String.raw`^|\s`), r(STR, "str"),
    r(String.raw`(?:https?:\/\/|~\/|\.\/|\$\(|%)[^\s'";|&)]*|\b[\w-]+\.(?:txt|ya?ml|md|go|json|tar\.gz|zip|exe|whl|tgz|nupkg)\b`, "path"),
    r(String.raw`--?[A-Za-z][\w-]*`, "flag", String.raw`\s`),
    r(String.raw`[A-Za-z][\w.-]*`, "cmd", String.raw`^|&&\s|\|\s|;\s|\{\s`),
    r(String.raw`\$\{?[\w:]+\}?`, "num")],
  godump: [r(String.raw`^(?:panic:.*|FAIL\b.*|--- FAIL.*)$`, "err"), r(String.raw`^goroutine \d+ \[[^\]]*\]:`, "kw"),
    r(String.raw`^\[paths:[^\]]*\]|… \d+ .*omitted|\+0x[0-9a-f]+|^created by|^=== RUN.*`, "com"),
    r(String.raw`\+\d+ more on this stack`, "num"), r(String.raw`(?:§\d|\/)[\w.\/§-]*\.go:\d+`, "path"), r(String.raw`\w+(?=\()`, "fn")],
  gotest: [r(String.raw`--- FAIL.*|^FAIL\b.*`, "err"), r(String.raw`\b\w+_test\.go:\d+`, "path"), r(STR, "str")],
  aria: [r(String.raw`\w+`, "kw", "- "), r(STR, "str"), r(String.raw`ref=e\d+`, "num")],
  npm: [r(String.raw`\(cache (?:hit|miss)\)`, "com"), r(String.raw`https?:\/\/[^\s)]+`, "path"),
    r(String.raw`\b\d+ vulnerabilities.*`, "err"), r(String.raw`\badded \d+ packages\b`, "ok"),
    r(String.raw`\bnpm\b`, "cmd"), r(String.raw`\b(?:warn|WARN|ERR!|error)\b`, "err"),
    r(String.raw`\b(?:http|info|verb|timing|notice|fetch|cache|deprecated)\b`, "kw"),
    r(String.raw`[\w.-]+@\d[\w.-]*`, "fn"), r(String.raw`\b\d+ms\b`, "num"), NUM],
  nginx: [r(String.raw`\[[^\]]*\]`, "com"), r(String.raw`"(?:GET|POST|PUT|DELETE|PATCH|HEAD) [^"]*"`, "str"),
    r(String.raw`^(?:routes|clients|server errors):`, "kw"), r(String.raw`\b(?:GET|POST|PUT|DELETE|PATCH)\b`, "kw"),
    r(String.raw`\b\d{1,3}(?:\.\d{1,3}){3}\b`, "path"), r(String.raw`(?:\/[\w.:-]+)+`, "path"),
    r(String.raw`5\d\d\b|5xx\b`, "err", String.raw`[\s(]`), r(String.raw`4\d\d\b|4xx\b`, "num", String.raw`[\s(]`),
    r(String.raw`2\d\d\b|2xx\b`, "ok", String.raw`[\s(]`), r(String.raw`×\d+`, "num")],
  tf: [r(String.raw`^\s*#.*`, "fn"), r(STR, "str"), r(String.raw`forces replacement|must be replaced`, "err"),
    r(String.raw`-\/\+|-(?=\s)`, "err", String.raw`^\s*`), r(String.raw`~(?=\s)`, "num", String.raw`^\s*`),
    r(String.raw`\+(?=\s)`, "ok", String.raw`^\s*`), r(String.raw`->`, "com"), r(String.raw`\(known after apply[^)]*\)`, "com"),
    r(String.raw`^(?:Plan|Changes to Outputs):.*`, "kw"), r(String.raw`^Warning:.*`, "num"), r(String.raw`^Error:.*`, "err"),
    r(String.raw`\b(?:resource|module)\b`, "kw"), r(String.raw`Refreshing state\.\.\.|\[id=[^\]]*\]`, "com")],
};
const compiled = {};
function compile(lang) {
  if (!(lang in compiled)) {
    try {
      const rules = LANGS[lang];
      compiled[lang] = rules ? new RegExp(rules.map(x => `(${x[0]})(${x[1]})`).join("|"), "gm") : null;
    } catch (e) { compiled[lang] = null; }
  }
  return compiled[lang];
}
function tokenize(el, lang) {
  const re = compile(lang);
  if (!re) return;
  const rules = LANGS[lang];
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  const nodes = [];
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    if (!n.parentElement.closest(".h, .hint, .k, .p, [class^='tk-']")) nodes.push(n);
  }
  nodes.forEach(node => {
    const text = node.nodeValue;
    let last = 0, m, frag = null;
    re.lastIndex = 0;
    while ((m = re.exec(text))) {
      if (!m[0]) { re.lastIndex++; continue; }
      let i = 0;
      while (m[1 + 2 * i] === undefined) i++;
      const pre = m[1 + 2 * i], body = m[2 + 2 * i];
      if (!frag) frag = document.createDocumentFragment();
      const start = m.index + pre.length;
      if (start > last) frag.append(text.slice(last, start));
      const span = document.createElement("span");
      span.className = "tk-" + rules[i][2];
      span.textContent = body;
      frag.append(span);
      last = start + body.length;
    }
    if (!frag) return;
    if (last < text.length) frag.append(text.slice(last));
    node.replaceWith(frag);
  });
}
document.querySelectorAll("pre[data-lang]:not([data-hl]), code[data-lang]:not([data-hl])").forEach(el => {
  try { tokenize(el, el.dataset.lang); } catch (e) { /* this block stays plain */ }
});

// Hero demo: an example picker. Each example plays once the first time it is
// shown: the raw excerpt rolls in while the count climbs to the full output,
// then the agent's view wipes in and the count drops.
const demo = document.getElementById("demo");
if (demo) {
  const term = demo.querySelector(".term");
  const count = document.getElementById("count");
  const note = document.getElementById("count-note");
  const moon = demo.querySelector(".demo-moon");
  const more = document.getElementById("more");
  const replay = document.getElementById("replay");
  const segs = Array.from(demo.querySelectorAll(".seg button"));
  const segRaw = document.getElementById("seg-raw");
  const segAgent = document.getElementById("seg-agent");
  const pct = document.getElementById("pct");
  const tabs = Array.from(demo.querySelectorAll(".ex-picker [role=tab]"));
  const exs = Array.from(demo.querySelectorAll(".ex"));
  const caps = Array.from(demo.querySelectorAll(".ex-cap"));
  const played = {};
  let ex = exs[0], view = "raw", playing = false, frame = 0, timers = [], shown = 0;
  const RAW = () => Number(ex.dataset.raw), AGENT = () => Number(ex.dataset.agent), LINES = () => Number(ex.dataset.lines);
  const percent = () => {
    const p = 100 * (1 - AGENT() / RAW());
    return (p >= 99 ? Math.floor(p * 10) / 10 : Math.round(p)) + "%";
  };

  const show = n => {
    shown = n;
    count.textContent = fmt(n);
    note.textContent = view === "agent" ? `tokens the agent reads, ${percent()} fewer`
      : `tokens · ${fmt(LINES())} lines the model would read`;
    drawMoon(moon, view === "agent" ? 1 - n / RAW() : 0);
  };
  const updateMore = () => {
    more.classList.toggle("off", view === "raw" || term.scrollHeight - term.clientHeight - term.scrollTop < 4);
  };
  const tween = (from, to, ms, done) => {
    cancelAnimationFrame(frame);
    if (reduced) { show(to); if (done) done(); return; }
    const start = performance.now();
    const step = now => {
      const t = Math.min(1, Math.max(0, (now - start) / ms));
      show(from + (to - from) * (1 - Math.pow(1 - t, 3)));
      if (t < 1) frame = requestAnimationFrame(step);
      else if (done) done();
    };
    frame = requestAnimationFrame(step);
  };
  const setView = (v, wipe) => {
    view = v;
    demo.dataset.view = v;
    segs.forEach(b => b.setAttribute("aria-pressed", String(b.dataset.show === v)));
    term.scrollTop = 0;
    term.classList.remove("wipe");
    if (wipe && !reduced) { void term.offsetWidth; term.classList.add("wipe"); }
    updateMore();
  };
  const clear = () => {
    playing = false;
    cancelAnimationFrame(frame);
    timers.forEach(clearTimeout);
    timers = [];
    demo.classList.remove("revealing");
  };
  const stop = () => {
    if (!playing) return;
    clear();
    show(view === "agent" ? AGENT() : RAW());
    replay.classList.remove("off");
  };
  const play = () => {
    clear();
    played[ex.dataset.ex] = true;
    replay.classList.add("off");
    if (reduced) { setView("agent"); show(AGENT()); replay.classList.remove("off"); return; }
    playing = true;
    setView("raw");
    void demo.offsetWidth;
    demo.classList.add("revealing");
    tween(0, RAW(), 1800, () => {
      timers.push(setTimeout(() => {
        if (!playing) return;
        demo.classList.remove("revealing");
        setView("agent", true);
        tween(RAW(), AGENT(), 1100, () => { playing = false; replay.classList.remove("off"); });
      }, 1100));
    });
  };
  const select = (tab, autoplay) => {
    clear();
    ex = exs.find(e => e.dataset.ex === tab.dataset.ex) || exs[0];
    exs.forEach(e => e.classList.toggle("cur", e === ex));
    caps.forEach(c => c.classList.toggle("cur", c.dataset.ex === ex.dataset.ex));
    tabs.forEach(t => {
      const on = t === tab;
      t.setAttribute("aria-selected", String(on));
      t.tabIndex = on ? 0 : -1;
    });
    segRaw.textContent = fmt(RAW());
    segAgent.textContent = fmt(AGENT());
    pct.textContent = percent();
    if (autoplay && !played[ex.dataset.ex]) play();
    else { setView("agent"); show(AGENT()); replay.classList.remove("off"); }
  };

  ["pointerdown", "wheel", "touchstart", "keydown", "mouseenter"].forEach(ev =>
    term.addEventListener(ev, stop, { passive: true }));
  term.addEventListener("scroll", updateMore, { passive: true });
  segs.forEach(b => b.addEventListener("click", () => {
    stop();
    const v = b.dataset.show;
    if (v === view) return;
    const from = shown;
    setView(v, v === "agent");
    tween(from, v === "agent" ? AGENT() : RAW(), 900);
    replay.classList.remove("off");
  }));
  replay.addEventListener("click", play);
  tabs.forEach(t => t.addEventListener("click", () => select(t, true)));
  tabKeys(tabs, t => select(t, true));

  // First example: shown raw until it scrolls into view, then it plays.
  exs.forEach(e => e.classList.toggle("cur", e === ex));
  caps.forEach(c => c.classList.toggle("cur", c.dataset.ex === ex.dataset.ex));
  setView("raw");
  show(RAW());
  if (reduced) select(tabs[0], false);
  else if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(entries => {
      if (entries.some(e => e.isIntersecting)) { io.disconnect(); if (!played[ex.dataset.ex] && ex === exs[0]) play(); }
    }, { threshold: 0.35 });
    io.observe(demo);
  } else play();
}

// Copy buttons.
async function copyText(btn, text) {
  try {
    await navigator.clipboard.writeText(text);
    btn.textContent = "Copied";
  } catch (e) {
    btn.textContent = "Select it";
  }
  setTimeout(() => { btn.textContent = "Copy"; }, 1600);
}
document.querySelectorAll("button.copy[data-copy]").forEach(btn => {
  btn.addEventListener("click", () => copyText(btn, document.getElementById(btn.dataset.copy).textContent));
});

// Tab keyboard handling shared by every tablist: arrows, Home and End.
function tabKeys(tabs, select) {
  tabs.forEach((t, i) => t.addEventListener("keydown", e => {
    const n = tabs.length;
    const j = { ArrowRight: i + 1, ArrowLeft: i - 1 + n, Home: 0, End: n - 1 }[e.key];
    if (j === undefined) return;
    e.preventDefault();
    const next = tabs[j % n];
    select(next);
    next.focus();
  }));
}

// Generic tabs: without JS every panel stays visible and stacked.
document.querySelectorAll("[data-tabs]").forEach(box => {
  const tabs = [...box.querySelectorAll('[role="tab"]')];
  const select = tab => tabs.forEach(t => {
    const on = t === tab;
    t.setAttribute("aria-selected", String(on));
    t.tabIndex = on ? 0 : -1;
    const panel = document.getElementById(t.getAttribute("aria-controls"));
    if (panel) panel.hidden = !on;
  });
  tabs.forEach(t => t.addEventListener("click", () => select(t)));
  tabKeys(tabs, select);
  if (tabs.length) select(tabs[0]);
});

// SDK: mode x language. A combination without a real example shows the
// language's wrap example and says so.
const sdk = document.querySelector("[data-sdk]");
if (sdk) {
  const modeTabs = [...sdk.querySelectorAll(".seg-tabs [role=tab]")];
  const langTabs = [...sdk.querySelectorAll(".lang-tabs [role=tab]")];
  const codes = [...sdk.querySelectorAll(".sdk-code")];
  const descs = [...sdk.querySelectorAll(".sdk-desc")];
  const metas = [...sdk.querySelectorAll(".sdk-meta")];
  const note = sdk.querySelector(".sdk-note");
  const file = sdk.querySelector(".sdk-file");
  const copy = sdk.querySelector("[data-copy-code]");
  const AUTO = "Python, Java (Spring AI) and .NET (Microsoft.Extensions.AI)";
  let mode = "wrap", lang = "python", current = null;

  const render = () => {
    const name = langTabs.find(t => t.dataset.lang === lang).textContent;
    let el = codes.find(c => c.dataset.lang === lang && c.dataset.mode === mode), msg = "";
    if (!el) {
      el = codes.find(c => c.dataset.lang === lang && c.dataset.mode === "wrap");
      msg = mode === "auto"
        ? `Auto mode is not available for ${name}; it exists for ${AUTO}. Showing the wrap example.`
        : `There is no proxy demo for ${name} yet, though every SDK has proxy_base_url. Showing the wrap example.`;
    }
    current = el;
    codes.forEach(c => { c.hidden = c !== el; });
    descs.forEach(d => { d.hidden = d.dataset.mode !== mode; });
    metas.forEach(m => { m.hidden = m.dataset.lang !== lang; });
    note.hidden = !msg;
    note.textContent = msg;
    file.textContent = el.dataset.src;
    const mark = (tabs, key, val) => tabs.forEach(t => {
      const on = t.dataset[key] === val;
      t.setAttribute("aria-selected", String(on));
      t.tabIndex = on ? 0 : -1;
    });
    mark(modeTabs, "mode", mode);
    mark(langTabs, "lang", lang);
  };
  const pickMode = t => { mode = t.dataset.mode; render(); };
  const pickLang = t => { lang = t.dataset.lang; render(); };
  modeTabs.forEach(t => t.addEventListener("click", () => pickMode(t)));
  langTabs.forEach(t => t.addEventListener("click", () => pickLang(t)));
  tabKeys(modeTabs, pickMode);
  tabKeys(langTabs, pickLang);
  copy.addEventListener("click", () => copyText(copy, current.querySelector("pre").textContent));
  render();
}

// Animations play only while on screen; without JS (or the observer) they just run.
const anims = document.querySelectorAll(".anim");
if ("IntersectionObserver" in window) {
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => e.target.classList.toggle("on", e.isIntersecting));
  }, { threshold: 0.25 });
  anims.forEach(a => io.observe(a));
} else {
  anims.forEach(a => a.classList.add("on"));
}
