// Moon phases: the shaded share of the disk is the share of tokens saved.
const NS = "http://www.w3.org/2000/svg";

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

// Demo: switch between the raw dump and what the agent reads.
const demo = document.getElementById("demo");
const toggle = document.getElementById("toggle");
const count = document.getElementById("count");
const note = document.getElementById("count-note");
const moon = demo.querySelector(".demo-moon");
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
const RAW = 7478, AGENT = 388;
let frame;

function animate(from, to) {
  cancelAnimationFrame(frame);
  const show = n => {
    count.textContent = Math.round(n).toLocaleString("en-US");
    drawMoon(moon, 1 - n / RAW);
  };
  if (reduced) return show(to);
  const start = performance.now(), ms = 900;
  const step = now => {
    const t = Math.min(1, (now - start) / ms);
    show(from + (to - from) * (1 - Math.pow(1 - t, 3)));
    if (t < 1) frame = requestAnimationFrame(step);
  };
  frame = requestAnimationFrame(step);
}

toggle.addEventListener("click", () => {
  const agent = demo.dataset.view !== "agent";
  demo.dataset.view = agent ? "agent" : "raw";
  document.getElementById("raw-out").hidden = agent;
  document.getElementById("agent-out").hidden = !agent;
  demo.querySelector(".term").scrollTop = 0;
  toggle.setAttribute("aria-pressed", String(agent));
  toggle.textContent = agent ? "Show the raw output" : "Show what the agent reads";
  note.textContent = agent ? "the agent reads, 95% fewer" : "the model would read";
  animate(agent ? RAW : AGENT, agent ? AGENT : RAW);
});

// Copy buttons.
document.querySelectorAll("button.copy").forEach(btn => {
  btn.addEventListener("click", async () => {
    const text = document.getElementById(btn.dataset.copy).textContent;
    try {
      await navigator.clipboard.writeText(text);
      btn.textContent = "Copied";
    } catch {
      btn.textContent = "Select it";
    }
    setTimeout(() => { btn.textContent = "Copy"; }, 1600);
  });
});
