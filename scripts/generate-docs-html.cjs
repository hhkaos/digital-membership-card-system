#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const root = process.cwd();
const isCheckMode = process.argv.includes('--check');

const manualSources = {
  issuer: {
    en: path.join(root, 'docs/manuals/end-user/issuer/en/README.md'),
    es: path.join(root, 'docs/manuals/end-user/issuer/es/README.md')
  },
  verifier: {
    en: path.join(root, 'docs/manuals/end-user/verifier/en/README.md'),
    es: path.join(root, 'docs/manuals/end-user/verifier/es/README.md')
  }
};

const outputs = [
  {
    app: 'issuer',
    html: path.join(root, 'issuer/public/docs/index.html'),
    assetsDir: path.join(root, 'issuer/public/docs/assets')
  },
  {
    app: 'issuer',
    html: path.join(root, 'issuer/public/issuer/docs/index.html'),
    assetsDir: path.join(root, 'issuer/public/issuer/docs/assets')
  },
  {
    app: 'verifier',
    html: path.join(root, 'verification/public/docs/index.html'),
    assetsDir: path.join(root, 'verification/public/docs/assets')
  }
];

function escapeHtml(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderInline(value) {
  let out = escapeHtml(value);
  out = out.replace(/`([^`]+)`/g, '<code>$1</code>');
  out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  out = out.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
  return out;
}

function renderMarkdown(markdownText, markdownFilePath) {
  const lines = markdownText.replace(/\r\n/g, '\n').split('\n');
  const html = [];
  const referencedImages = [];

  let paragraph = [];
  let listType = null;

  function flushParagraph() {
    if (paragraph.length === 0) return;
    html.push('<p>' + renderInline(paragraph.join(' ').trim()) + '</p>');
    paragraph = [];
  }

  function closeList() {
    if (!listType) return;
    html.push(listType === 'ul' ? '</ul>' : '</ol>');
    listType = null;
  }

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line) {
      flushParagraph();
      closeList();
      continue;
    }

    const imageMatch = line.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
    if (imageMatch) {
      flushParagraph();
      closeList();

      const alt = imageMatch[1];
      const source = imageMatch[2];
      const resolvedSource = path.resolve(path.dirname(markdownFilePath), source);
      const outputName = path.basename(source);

      referencedImages.push({ source: resolvedSource, outputName });
      html.push('<figure><img src="./assets/' + escapeHtml(outputName) + '" alt="' + escapeHtml(alt) + '" class="img-ph"></figure>');
      continue;
    }

    const h3 = line.match(/^###\s+(.+)$/);
    if (h3) {
      flushParagraph();
      closeList();
      html.push('<h3>' + renderInline(h3[1]) + '</h3>');
      continue;
    }

    const h2 = line.match(/^##\s+(.+)$/);
    if (h2) {
      flushParagraph();
      closeList();
      html.push('<h2>' + renderInline(h2[1]) + '</h2>');
      continue;
    }

    const h1 = line.match(/^#\s+(.+)$/);
    if (h1) {
      flushParagraph();
      closeList();
      html.push('<h1>' + renderInline(h1[1]) + '</h1>');
      continue;
    }

    const listItemUl = line.match(/^- (.+)$/);
    if (listItemUl) {
      flushParagraph();
      if (listType !== 'ul') {
        closeList();
        html.push('<ul>');
        listType = 'ul';
      }
      html.push('<li>' + renderInline(listItemUl[1]) + '</li>');
      continue;
    }

    const listItemOl = line.match(/^\d+\.\s+(.+)$/);
    if (listItemOl) {
      flushParagraph();
      if (listType !== 'ol') {
        closeList();
        html.push('<ol>');
        listType = 'ol';
      }
      html.push('<li>' + renderInline(listItemOl[1]) + '</li>');
      continue;
    }

    const emphasisLine = line.match(/^_(.+)_$/);
    if (emphasisLine) {
      flushParagraph();
      closeList();
      html.push('<p class="caption">' + renderInline(emphasisLine[1]) + '</p>');
      continue;
    }

    paragraph.push(line);
  }

  flushParagraph();
  closeList();

  return { html: html.join('\n'), referencedImages };
}

function buildPage(pageTitle, enHtml, esHtml, sourceLabel) {
  return '<!doctype html>\n'
    + '<html lang="en">\n'
    + '  <head>\n'
    + '    <meta charset="UTF-8" />\n'
    + '    <meta name="viewport" content="width=device-width, initial-scale=1" />\n'
    + '    <title>' + escapeHtml(pageTitle) + '</title>\n'
    + '    <style>\n'
    + '      :root {\n'
    + '        --bg: #f5f7f8;\n'
    + '        --card: #ffffff;\n'
    + '        --text: #1f2f36;\n'
    + '        --muted: #526770;\n'
    + '        --line: #d8e1e6;\n'
    + '        --brand: #30414b;\n'
    + '      }\n'
    + '      * { box-sizing: border-box; }\n'
    + '      body {\n'
    + '        margin: 0;\n'
    + '        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;\n'
    + '        background: var(--bg);\n'
    + '        color: var(--text);\n'
    + '      }\n'
    + '      .wrap {\n'
    + '        max-width: 760px;\n'
    + '        margin: 0 auto;\n'
    + '        padding: 16px;\n'
    + '      }\n'
    + '      .card {\n'
    + '        background: var(--card);\n'
    + '        border: 1px solid var(--line);\n'
    + '        border-radius: 12px;\n'
    + '        padding: 16px;\n'
    + '      }\n'
    + '      h1, h2, h3 { margin: 0 0 10px; color: var(--brand); }\n'
    + '      p, li { line-height: 1.45; }\n'
    + '      section { margin-top: 20px; }\n'
    + '      .lang-section { display: none; }\n'
    + '      .lang-section.active { display: block; }\n'
    + '      ul, ol { margin: 0 0 12px; padding-left: 20px; }\n'
    + '      code {\n'
    + '        background: #eef3f6;\n'
    + '        border: 1px solid #d9e4ea;\n'
    + '        border-radius: 6px;\n'
    + '        padding: 1px 6px;\n'
    + '        font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;\n'
    + '        font-size: 0.95em;\n'
    + '      }\n'
    + '      .top {\n'
    + '        display: flex;\n'
    + '        justify-content: space-between;\n'
    + '        align-items: center;\n'
    + '        gap: 12px;\n'
    + '        margin-bottom: 12px;\n'
    + '      }\n'
    + '      .lang {\n'
    + '        display: flex;\n'
    + '        gap: 8px;\n'
    + '      }\n'
    + '      .lang a {\n'
    + '        font-size: 12px;\n'
    + '        color: var(--brand);\n'
    + '        text-decoration: none;\n'
    + '        border: 1px solid var(--line);\n'
    + '        border-radius: 999px;\n'
    + '        padding: 4px 8px;\n'
    + '        background: #fff;\n'
    + '      }\n'
    + '      .lang a.active {\n'
    + '        background: var(--brand);\n'
    + '        color: #fff;\n'
    + '        border-color: var(--brand);\n'
    + '      }\n'
    + '      .img-ph {\n'
    + '        width: 100%;\n'
    + '        border: 1px solid var(--line);\n'
    + '        border-radius: 10px;\n'
    + '      }\n'
    + '      .caption {\n'
    + '        margin-top: 6px;\n'
    + '        font-size: 13px;\n'
    + '        color: var(--muted);\n'
    + '      }\n'
    + '      .back {\n'
    + '        position: fixed;\n'
    + '        right: 12px;\n'
    + '        bottom: 12px;\n'
    + '        display: inline-block;\n'
    + '        font-size: 13px;\n'
    + '        color: #fff;\n'
    + '        background: var(--brand);\n'
    + '        border: 1px solid var(--brand);\n'
    + '        border-radius: 999px;\n'
    + '        padding: 8px 12px;\n'
    + '        text-decoration: none;\n'
    + '        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.18);\n'
    + '        z-index: 50;\n'
    + '      }\n'
    + '      .back:focus, .back:hover {\n'
    + '        background: #223039;\n'
    + '        border-color: #223039;\n'
    + '      }\n'
    + '      .meta {\n'
    + '        margin-top: 20px;\n'
    + '        font-size: 12px;\n'
    + '        color: var(--muted);\n'
    + '      }\n'
    + '    </style>\n'
    + '  </head>\n'
    + '  <body>\n'
    + '    <main class="wrap">\n'
    + '      <div class="card">\n'
    + '        <div class="top">\n'
    + '          <h1>' + escapeHtml(pageTitle) + '</h1>\n'
    + '          <nav class="lang" aria-label="Language">\n'
    + '            <a href="#en">EN</a>\n'
    + '            <a href="#es">ES</a>\n'
    + '          </nav>\n'
    + '        </div>\n'
    + '\n'
    + '        <section id="en" class="lang-section">\n'
    + enHtml + '\n'
    + '        </section>\n'
    + '\n'
    + '        <section id="es" class="lang-section">\n'
    + esHtml + '\n'
    + '        </section>\n'
    + '\n'
    + '        <a class="back" href="../" aria-label="Back to app">Back to app</a>\n'
    + '        <p class="meta">Generated from ' + escapeHtml(sourceLabel) + '. Do not edit this file directly.</p>\n'
    + '      </div>\n'
    + '    </main>\n'
    + '    <script>\n'
    + '      (function () {\n'
    + '        function getQueryParam(name) {\n'
    + '          var params = new URLSearchParams(window.location.search);\n'
    + '          return params.get(name);\n'
    + '        }\n'
    + '        function resolveLanguage() {\n'
    + '          var fromQuery = getQueryParam("lang");\n'
    + '          if (fromQuery === "es" || fromQuery === "en") return fromQuery;\n'
    + '          try {\n'
    + '            var issuerLang = localStorage.getItem("ampa.issuer.language");\n'
    + '            if (issuerLang === "es" || issuerLang === "en") return issuerLang;\n'
    + '            var verificationLang = localStorage.getItem("ampa.verification.language");\n'
    + '            if (verificationLang === "es" || verificationLang === "en") return verificationLang;\n'
    + '          } catch (e) {}\n'
    + '          var browser = (navigator.language || "es").toLowerCase().split("-")[0];\n'
    + '          return browser === "en" ? "en" : "es";\n'
    + '        }\n'
    + '        function setActiveLanguage(lang) {\n'
    + '          var en = document.getElementById("en");\n'
    + '          var es = document.getElementById("es");\n'
    + '          if (!en || !es) return;\n'
    + '          en.classList.toggle("active", lang === "en");\n'
    + '          es.classList.toggle("active", lang === "es");\n'
    + '          var links = document.querySelectorAll(".lang a");\n'
    + '          for (var i = 0; i < links.length; i += 1) {\n'
    + '            var href = links[i].getAttribute("href") || "";\n'
    + '            links[i].classList.toggle("active", href === "#" + lang);\n'
    + '          }\n'
    + '          var back = document.querySelector(".back");\n'
    + '          if (back) {\n'
    + '            var backLabel = lang === "es" ? "Volver a la app" : "Back to app";\n'
    + '            back.textContent = backLabel;\n'
    + '            back.setAttribute("aria-label", backLabel);\n'
    + '            back.setAttribute("title", backLabel);\n'
    + '          }\n'
    + '        }\n'
    + '        var activeLang = resolveLanguage();\n'
    + '        setActiveLanguage(activeLang);\n'
    + '        var links = document.querySelectorAll(".lang a");\n'
    + '        for (var i = 0; i < links.length; i += 1) {\n'
    + '          links[i].addEventListener("click", function (event) {\n'
    + '            var href = event.currentTarget.getAttribute("href") || "";\n'
    + '            var lang = href.replace("#", "");\n'
    + '            if (lang !== "en" && lang !== "es") return;\n'
    + '            event.preventDefault();\n'
    + '            setActiveLanguage(lang);\n'
    + '            history.replaceState(null, "", "?lang=" + lang + "#" + lang);\n'
    + '          });\n'
    + '        }\n'
    + '      })();\n'
    + '    </script>\n'
    + '  </body>\n'
    + '</html>\n';
}

function ensureDirectory(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function writeFileIfChanged(filePath, content) {
  const existing = fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : null;
  if (existing === content) return false;
  fs.writeFileSync(filePath, content, 'utf8');
  return true;
}

function copyAssetIfChanged(source, destination) {
  const sourceBuffer = fs.readFileSync(source);
  if (fs.existsSync(destination)) {
    const currentBuffer = fs.readFileSync(destination);
    if (Buffer.compare(sourceBuffer, currentBuffer) === 0) return false;
  }
  fs.writeFileSync(destination, sourceBuffer);
  return true;
}

const renderedByApp = {};
for (const appName of Object.keys(manualSources)) {
  const enPath = manualSources[appName].en;
  const esPath = manualSources[appName].es;
  const enMarkdown = fs.readFileSync(enPath, 'utf8');
  const esMarkdown = fs.readFileSync(esPath, 'utf8');
  const renderedEn = renderMarkdown(enMarkdown, enPath);
  const renderedEs = renderMarkdown(esMarkdown, esPath);

  const pageTitle = appName === 'issuer' ? 'Issuer End User Manual' : 'Verifier End User Manual';
  const sourceLabel = appName === 'issuer'
    ? 'docs/manuals/end-user/issuer/{en,es}/README.md'
    : 'docs/manuals/end-user/verifier/{en,es}/README.md';

  renderedByApp[appName] = {
    page: buildPage(pageTitle, renderedEn.html, renderedEs.html, sourceLabel),
    assets: renderedEn.referencedImages.concat(renderedEs.referencedImages)
  };
}

let changed = false;

for (const output of outputs) {
  ensureDirectory(path.dirname(output.html));
  ensureDirectory(output.assetsDir);

  const content = renderedByApp[output.app].page;
  const htmlChanged = writeFileIfChanged(output.html, content);
  changed = changed || htmlChanged;

  const assetMap = new Map();
  for (const img of renderedByApp[output.app].assets) {
    assetMap.set(img.outputName, img.source);
  }

  for (const [outputName, sourcePath] of assetMap.entries()) {
    if (!fs.existsSync(sourcePath)) {
      throw new Error('Referenced image not found: ' + sourcePath);
    }
    const assetPath = path.join(output.assetsDir, outputName);
    const assetChanged = copyAssetIfChanged(sourcePath, assetPath);
    changed = changed || assetChanged;
  }
}

if (isCheckMode && changed) {
  console.error('Docs HTML is out of date. Run: npm run docs:generate');
  process.exit(1);
}

if (!isCheckMode) {
  console.log(changed ? 'Docs HTML regenerated.' : 'Docs HTML already up to date.');
}
