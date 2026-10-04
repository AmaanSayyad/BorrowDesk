/**
 * Render BorrowDesk-Litepaper.md → PDF with KaTeX math + embedded SVG figures.
 * Usage: node docs/render-litepaper.mjs
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createRequire } from "node:module";

const __dirname = dirname(fileURLToPath(import.meta.url));
const docsDir = __dirname;
const mdPath = join(docsDir, "BorrowDesk-Litepaper.md");
const outHtml = join(docsDir, "BorrowDesk-Litepaper.html");
const outPdf = join(docsDir, "BorrowDesk-Litepaper.pdf");

const require = createRequire(import.meta.url);

async function ensureDeps() {
  const need = ["marked", "puppeteer"];
  for (const pkg of need) {
    try {
      require.resolve(pkg);
    } catch {
      console.log(`Installing ${pkg}…`);
      const { execSync } = await import("node:child_process");
      execSync(`npm install --no-save ${pkg}`, {
        cwd: join(docsDir, ".."),
        stdio: "inherit",
      });
    }
  }
}

function escapeHtml(s) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/** Protect math & code before markdown, restore after */
function extractMath(md) {
  const bins = [];
  const push = (type, raw) => {
    const key = `@@MATH${bins.length}@@`;
    bins.push({ key, type, raw });
    return key;
  };
  let s = md;
  s = s.replace(/```[\s\S]*?```/g, (m) => push("code", m));
  s = s.replace(/\$\$([\s\S]+?)\$\$/g, (_, body) => push("display", body.trim()));
  s = s.replace(/\\\[([\s\S]+?)\\\]/g, (_, body) => push("display", body.trim()));
  s = s.replace(/(?<!\$)\$(?!\$)([^$\n]+?)\$(?!\$)/g, (_, body) =>
    push("inline", body.trim())
  );
  s = s.replace(/\\\(([\s\S]+?)\\\)/g, (_, body) => push("inline", body.trim()));
  return { s, bins };
}

function restoreMath(html, bins) {
  let out = html;
  for (const b of bins) {
    if (b.type === "code") {
      out = out.replace(b.key, () => {
        // re-parse code block simply
        const m = b.raw.match(/^```(\w*)\n?([\s\S]*?)```$/);
        const lang = m?.[1] || "";
        const body = escapeHtml(m?.[2] ?? b.raw);
        return `<pre><code class="language-${lang}">${body}</code></pre>`;
      });
    } else if (b.type === "display") {
      out = out.replace(
        b.key,
        `<div class="math-display">\\[${b.raw}\\]</div>`
      );
    } else {
      out = out.replace(b.key, `<span class="math-inline">\\(${b.raw}\\)</span>`);
    }
  }
  return out;
}

function fixImages(html) {
  // Inline local figures as base64 so PDF never depends on file:// image loads.
  return html.replace(
    /src="(figures\/[^"]+)"/g,
    (_m, rel) => {
      const abs = join(docsDir, rel);
      if (!existsSync(abs)) {
        console.warn("Missing figure:", abs);
        return `src="${rel}"`;
      }
      const buf = readFileSync(abs);
      const ext = abs.split(".").pop()?.toLowerCase();
      const mime =
        ext === "png"
          ? "image/png"
          : ext === "jpg" || ext === "jpeg"
            ? "image/jpeg"
            : ext === "svg"
              ? "image/svg+xml"
              : "application/octet-stream";
      const b64 = buf.toString("base64");
      return `src="data:${mime};base64,${b64}"`;
    }
  );
}

async function main() {
  await ensureDeps();
  const { marked } = await import("marked");
  const puppeteer = await import("puppeteer");

  const md = readFileSync(mdPath, "utf8");
  const { s, bins } = extractMath(md);
  marked.setOptions({ gfm: true, breaks: false });
  let body = marked.parse(s);
  body = restoreMath(body, bins);
  body = fixImages(body);

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<title>BorrowDesk Technical Litepaper v1.2</title>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css"/>
<script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.js"></script>
<script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/contrib/auto-render.min.js"
  onload="renderMathInElement(document.body,{
    delimiters:[
      {left:'\\\\[',right:'\\\\]',display:true},
      {left:'\\\\(',right:'\\\\)',display:false}
    ],
    throwOnError:false
  })"></script>
<style>
  @page { size: A4; margin: 18mm 16mm 18mm 16mm; }
  :root {
    --ink: #14120e;
    --muted: #5a554c;
    --rule: #d8d2c6;
    --paper: #fbfaf7;
    --accent: #1a1710;
  }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    font-family: "IBM Plex Serif", "Palatino Linotype", Palatino, "Times New Roman", serif;
    font-size: 10.5pt;
    line-height: 1.55;
    color: var(--ink);
    background: var(--paper);
  }
  article { max-width: 780px; margin: 0 auto; padding: 8px 12px 48px; }
  h1 {
    font-family: "IBM Plex Sans", "Helvetica Neue", Arial, sans-serif;
    font-size: 20pt;
    line-height: 1.25;
    margin: 0 0 12px;
    letter-spacing: -0.02em;
  }
  h2 {
    font-family: "IBM Plex Sans", Helvetica, Arial, sans-serif;
    font-size: 13.5pt;
    margin: 28px 0 10px;
    padding-top: 8px;
    border-top: 1px solid var(--rule);
    page-break-after: avoid;
  }
  h3 {
    font-family: "IBM Plex Sans", Helvetica, Arial, sans-serif;
    font-size: 11.5pt;
    margin: 18px 0 8px;
    page-break-after: avoid;
  }
  p { margin: 0 0 10px; hyphens: auto; }
  strong { font-weight: 650; }
  a { color: var(--ink); text-decoration: underline; text-underline-offset: 2px; }
  hr { border: none; border-top: 1px solid var(--rule); margin: 22px 0; }
  blockquote {
    margin: 12px 0;
    padding: 8px 14px;
    border-left: 3px solid var(--accent);
    background: #f3f0e8;
    color: var(--muted);
    font-style: italic;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 9.5pt;
    margin: 12px 0 16px;
    page-break-inside: avoid;
  }
  th, td {
    border: 1px solid var(--rule);
    padding: 6px 8px;
    text-align: left;
    vertical-align: top;
  }
  th { background: #f0ebe3; font-family: "IBM Plex Sans", Helvetica, Arial, sans-serif; }
  code, pre {
    font-family: "IBM Plex Mono", "SF Mono", Menlo, Consolas, monospace;
    font-size: 8.8pt;
  }
  code {
    background: #f0ebe3;
    padding: 1px 4px;
    border-radius: 3px;
  }
  pre {
    background: #f0ebe3;
    padding: 12px 14px;
    border-radius: 4px;
    overflow-x: auto;
    line-height: 1.4;
    page-break-inside: avoid;
  }
  pre code { background: none; padding: 0; }
  img {
    max-width: 100%;
    height: auto;
    display: block;
    margin: 14px auto;
    page-break-inside: avoid;
  }
  .math-display {
    margin: 14px 0;
    overflow-x: auto;
    page-break-inside: avoid;
    text-align: center;
  }
  .katex-display { margin: 0.6em 0; }
  .meta {
    font-family: "IBM Plex Sans", Helvetica, Arial, sans-serif;
    font-size: 9pt;
    color: var(--muted);
    margin-bottom: 18px;
    line-height: 1.45;
  }
  ul, ol { margin: 0 0 12px; padding-left: 22px; }
  li { margin-bottom: 4px; }
</style>
</head>
<body>
<article>
${body}
</article>
</body>
</html>`;

  writeFileSync(outHtml, html, "utf8");
  console.log("Wrote", outHtml);

  const browser = await puppeteer.default.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage();
  await page.goto(pathToFileURL(outHtml).href, {
    waitUntil: "networkidle0",
    timeout: 120000,
  });
  // Wait for KaTeX
  await page.waitForFunction(
    () =>
      typeof window.renderMathInElement === "undefined" ||
      document.querySelectorAll(".katex").length > 0 ||
      document.querySelectorAll(".math-display").length === 0,
    { timeout: 30000 }
  ).catch(() => {});
  await new Promise((r) => setTimeout(r, 1500));

  await page.pdf({
    path: outPdf,
    format: "A4",
    printBackground: true,
    margin: { top: "16mm", bottom: "16mm", left: "14mm", right: "14mm" },
    displayHeaderFooter: true,
    headerTemplate: `<div style="font-size:8px;color:#888;width:100%;padding:0 16mm;font-family:Helvetica,Arial,sans-serif;">BorrowDesk Technical Litepaper v1.2</div>`,
    footerTemplate: `<div style="font-size:8px;color:#888;width:100%;padding:0 16mm;font-family:Helvetica,Arial,sans-serif;display:flex;justify-content:space-between;"><span>borrowdesk.fun · MIT</span><span>Page <span class="pageNumber"></span> / <span class="totalPages"></span></span></div>`,
  });
  await browser.close();
  console.log("Wrote", outPdf);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
