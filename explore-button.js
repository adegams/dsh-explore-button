/**
 * DSH Web Profile Plugin — Floating Directory Explorer Button (v2)
 *
 * Injects a floating quick-access bar at the same vertical level as the
 * Chat/Trajectory header tabs (~52px from top), plus a modal file browser
 * that lists directory contents via a registered /api/fs/list route.
 *
 * Uses the webserver/index-inject event to splice CSS, HTML, and JS rows
 * into index.html on every render, and ctx.webServer.register() for the
 * file-listing API endpoint.
 */
import { readdir, stat } from "node:fs/promises";
import { basename, dirname, join, resolve } from "node:path";
import { homedir } from "node:os";

const name = "explore-button";
const inject = ["webServer"];

/** Quick-access directory shortcuts shown in the floating bar. */
const QUICK_PATHS = [
  { label: "🏠 /var/www",      path: "/var/www" },
  { label: "🔧 sieasset4all",  path: "/var/www/sieasset4all" },
  { label: "🔐 apipki",        path: "/var/www/apipki" },
  { label: "⚙️  core",          path: "/var/www/core" },
  { label: "🌐 main",          path: "/var/www/main" },
  { label: "🔔 notifications", path: "/var/www/notifications" },
  { label: "📲 mobileedr",     path: "/var/www/mobileedr" },
  { label: "🔍 recherche",     path: "SEARCH" },
];

// ── API route handler: list directory contents ─────────────────────────────

/**
 * Handle GET /api/fs/list?path=<abs-path>
 * Returns JSON: { path, home, entries: [{name,path,isDirectory,isFile,isHidden,size}], truncated }
 */
async function handleListDir(req, res) {
  const url = new URL(req.url ?? "/", "http://x");
  const reqPath = url.searchParams.get("path") || homedir();
  const fsPath = resolve(reqPath);
  try {
    const dirents = await readdir(fsPath, { withFileTypes: true });
    const capped = dirents.length > 1000;
    const entries = capped ? dirents.slice(0, 1000) : dirents;
    const result = {
      path: fsPath,
      home: homedir(),
      entries: await Promise.all(entries.map(async (d) => {
        let size = null;
        if (d.isFile()) {
          try { size = (await stat(join(fsPath, d.name))).size; } catch {}
        }
        return {
          name: d.name,
          path: join(fsPath, d.name),
          isDirectory: d.isDirectory(),
          isFile: d.isFile(),
          isHidden: d.name.startsWith("."),
          size,
        };
      })),
      truncated: capped,
    };
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify(result));
  } catch (e) {
    res.writeHead(500, { "content-type": "application/json" });
    res.end(JSON.stringify({ error: e.message, code: e.code || "UNKNOWN" }));
  }
}

/**
 * Handle GET /api/fs/read?path=<abs-path>
 * Returns JSON: { path, content, totalLines, truncated }
 */
async function handleReadFile(req, res) {
  const url = new URL(req.url ?? "/", "http://x");
  const reqPath = url.searchParams.get("path");
  if (!reqPath) { res.writeHead(400); res.end("missing path"); return; }
  try {
    const { readFile } = await import("node:fs/promises");
    const content = await readFile(reqPath, "utf8");
    const lines = content.split(/\r?\n/u);
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({
      path: reqPath,
      content,
      totalLines: lines.length,
      truncated: lines.length > 500,
    }));
  } catch (e) {
    res.writeHead(500, { "content-type": "application/json" });
    res.end(JSON.stringify({ error: e.message, code: e.code || "UNKNOWN" }));
  }
}

// ── CSS for floating bar + modal file browser ────────────────────────────────

const BUTTON_CSS = `
/* === Floating Directory Explorer Bar === */
.dsh-explore-bar {
  position: fixed;
  top: 52px;
  right: 16px;
  z-index: 2147483000;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
  padding: 4px 8px;
  border-radius: 8px;
  background: rgba(25, 26, 32, 0.92);
  border: 1px solid rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.35);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  font-size: 12.5px;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}
.dsh-explore-bar:hover {
  transform: scale(1.02);
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.45);
}
.dsh-explore-bar .dsh-explore-item {
  padding: 4px 10px;
  border-radius: 6px;
  cursor: pointer;
  color: #e4e6eb;
  white-space: nowrap;
  transition: all 0.2s ease;
  user-select: none;
  border: 1px solid transparent;
  display: flex;
  align-items: center;
  gap: 4px;
}
.dsh-explore-bar .dsh-explore-item:hover {
  background: rgba(255, 255, 255, 0.12);
  color: #ffffff;
  border-color: rgba(255, 255, 255, 0.2);
}
.dsh-explore-bar .dsh-explore-item.search {
  background: rgba(0, 123, 255, 0.15);
  border-color: rgba(0, 123, 255, 0.3);
}
.dsh-explore-bar .dsh-explore-item.search:hover {
  background: rgba(0, 123, 255, 0.3);
}
.dsh-explore-bar .dsh-explore-separator {
  width: 1px;
  background: rgba(255, 255, 255, 0.2);
  height: 20px;
  align-self: center;
  border-radius: 1px;
}

/* === Modal File Browser === */
.dsh-fs-modal-backdrop {
  position: fixed;
  top: 0; right: 0; bottom: 0; left: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  z-index: 2147483001;
  display: none;
  align-items: flex-start;
  padding-top: 52px;
  overflow: auto;
}
.dsh-fs-modal-backdrop.show {
  display: flex;
}
.dsh-fs-modal {
  position: relative;
  background: var(--dsw-alias-bg-base, #fff);
  border-radius: 12px;
  margin: 0 auto 40px;
  width: min(94vw, 1180px);
  max-height: calc(100vh - 70px);
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
  border: 1px solid var(--dsw-alias-border-l1, #e0e0e0);
}
.dsh-fs-modal-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--dsw-alias-border-l1, #e0e0e0);
  font-size: 14px;
  font-weight: 500;
}
.dsh-fs-modal-header .dsh-fs-path {
  flex: 1;
  font-family: "SF Mono", "JetBrains Mono", Consolas, monospace;
  font-size: 12px;
  color: var(--dsw-alias-label-secondary, #61666b);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.dsh-fs-modal-header .dsh-fs-close {
  cursor: pointer;
  width: 24px;
  height: 24px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  color: var(--dsw-alias-label-secondary, #61666b);
  border: none;
  background: transparent;
  font-size: 14px;
}
.dsh-fs-modal-header .dsh-fs-close:hover {
  background: var(--dsw-alias-interactive-bg-hover, rgba(0,0,0,0.05));
}
.dsh-fs-modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 4px;
}
.dsh-fs-entry {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.15s ease;
}
.dsh-fs-entry:hover {
  background: var(--dsw-alias-interactive-bg-hover, rgba(0,0,0,0.05));
}
.dsh-fs-entry.dir {
  font-weight: 500;
}
.dsh-fs-entry .dsh-fs-icon {
  font-size: 14px;
  flex-shrink: 0;
}
.dsh-fs-entry .dsh-fs-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.dsh-fs-entry .dsh-fs-meta {
  font-size: 11px;
  color: var(--dsw-alias-label-tertiary, #81858c);
  white-space: nowrap;
}
.dsh-fs-breadcrumb {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 12px;
  border-bottom: 1px solid var(--dsw-alias-border-l1, #e0e0e0);
  font-size: 12px;
  overflow: hidden;
}
.dsh-fs-breadcrumb a {
  cursor: pointer;
  color: var(--dsw-alias-state-business-primary, #0066cc);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.dsh-fs-breadcrumb .dsh-fs-crumb-separator {
  color: var(--dsw-alias-label-tertiary, #81858c);
  flex-shrink: 0;
}
.dsh-fs-loading {
  padding: 24px;
  text-align: center;
  color: var(--dsw-alias-label-tertiary, #81858c);
  font-size: 13px;
}
.dsh-fs-error {
  padding: 16px;
  color: var(--dsw-alias-state-error-primary, #e53935);
  font-size: 12px;
}
.dsh-fs-file-actions {
  display: flex;
  gap: 8px;
  padding: 8px 12px;
  border-bottom: 1px solid var(--dsw-alias-border-l1, #e0e0e0);
  align-items: center;
}
.dsh-fs-file-actions button {
  padding: 4px 12px;
  border-radius: 6px;
  border: 1px solid var(--dsw-alias-border-l1, #e0e0e0);
  background: transparent;
  color: var(--dsw-alias-label-primary, #0f1115);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.15s ease;
}
.dsh-fs-file-actions button:hover {
  background: var(--dsw-alias-interactive-bg-hover, rgba(0,0,0,0.05));
}
.dsh-fs-file-actions .dsh-fs-file-meta {
  margin-left: auto;
  font-size: 11px;
  color: var(--dsw-alias-label-tertiary, #81858c);
}
.dsh-fs-file-content {
  flex: 1;
  overflow: auto;
  padding: 12px;
  font-family: "SF Mono", "JetBrains Mono", "Fira Code", Consolas, monospace;
  font-size: 12px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
  background: #ffffff;
  margin: 0;
  color: #1e1e1e;
  border: none;
  outline: none;
  tab-size: 2;
}
/* Also force action-bar and meta colors so nothing is white-on-white in dark themes */
.dsh-fs-file-actions button {
  color: #1e1e1e;
  border-color: #c0c4c8;
  background: #ffffff;
}
.dsh-fs-file-actions .dsh-fs-file-meta {
  color: #61666b;
}
.dsh-explore-toast {
  position: fixed;
  bottom: 30px;
  right: 24px;
  padding: 10px 18px;
  border-radius: 8px;
  background: rgba(34, 197, 94, 0.9);
  color: #ffffff;
  font-size: 12.5px;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1px solid rgba(34, 197, 94, 0.5);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
  z-index: 2147483000;
  opacity: 0;
  transform: translateY(10px);
  transition: all 0.3s ease;
  pointer-events: none;
}
.dsh-explore-toast.show {
  opacity: 1;
  transform: translateY(0);
}
.dsh-explore-toast.error {
  background: rgba(239, 68, 68, 0.9);
  border-color: rgba(239, 68, 68, 0.5);
}
`;

// ── HTML ─────────────────────────────────────────────────────────────────────

function buildButtonBarHtml() {
  const items = QUICK_PATHS.map((p) =>
    `<span class="dsh-explore-item${p.path === "SEARCH" ? " search" : ""}" ` +
    `data-path="${p.path}" title="${p.path === "SEARCH" ? "Rechercher un fichier" : "Explorer ce dossier"}">` +
    `${p.label}</span>`
  ).join("");
  return `<div class="dsh-explore-bar" id="dsh-explore-bar">
  ${items}
  <span class="dsh-explore-separator"></span>
  <span class="dsh-explore-item" id="dsh-explore-toggle" title="Masquer la barre">&#9396;</span>
</div>
<div class="dsh-fs-modal-backdrop" id="dsh-fs-modal-backdrop">
  <div class="dsh-fs-modal" id="dsh-fs-modal">
    <div class="dsh-fs-modal-header">
      <span class="dsh-fs-path" id="dsh-fs-path">Chargement…</span>
      <button class="dsh-fs-close" id="dsh-fs-close" title="Fermer">&#10005;</button>
    </div>
    <div class="dsh-fs-breadcrumb" id="dsh-fs-breadcrumb"></div>
    <div class="dsh-fs-modal-body" id="dsh-fs-modal-body">
      <div class="dsh-fs-loading">Chargement…</div>
    </div>
  </div>
</div>
<div class="dsh-explore-toast" id="dsh-explore-toast"></div>`;
}

// ── JavaScript (browser) ─────────────────────────────────────────────────────

const BUTTON_JS = `
(function() {
  "use strict";
  const bar = document.getElementById('dsh-explore-bar');
  if (!bar) return;

  const modal = document.getElementById('dsh-fs-modal-backdrop');
  const modalBody = document.getElementById('dsh-fs-modal-body');
  const modalPath = document.getElementById('dsh-fs-path');
  const modalBreadcrumb = document.getElementById('dsh-fs-breadcrumb');
  const closeModal = document.getElementById('dsh-fs-close');
  const toastEl = document.getElementById('dsh-explore-toast');

  // Track current directory for back navigation from file viewer
  var currentDir = null;

  // Click handler for quick-access items
  bar.addEventListener('click', function(e) {
    var item = e.target;
    if (!item.classList.contains('dsh-explore-item')) return;

    if (item.id === 'dsh-explore-toggle') {
      bar.style.display = 'none';
      showToast("Barre masquée — recharger pour réafficher", false);
      return;
    }

    var path = item.dataset.path;
    if (!path) return;
    openModal(path);
  });

  // Close modal
  closeModal.addEventListener('click', closeModalHandler);
  modal.addEventListener('click', function(e) {
    if (e.target === modal) closeModalHandler();
  });
  function closeModalHandler() {
    modal.classList.remove('show');
  }

  // Close modal and reset file viewer state
  function resetModal() {
    modal.classList.remove('show');
    modalBreadcrumb.style.display = '';
    currentDir = null;
  }

  // Open modal and load directory
  async function openModal(path) {
    modal.classList.add('show');
    modalBreadcrumb.style.display = '';
    modalPath.textContent = 'Chargement…';
    modalBody.innerHTML = '<div class="dsh-fs-loading">Chargement…</div>';
    await loadDirectory(path);
  }

  // Load and render directory contents
  async function loadDirectory(path) {
    try {
      const resp = await fetch('/api/fs/list?path=' + encodeURIComponent(path), {
        credentials: 'include'
      });
      const data = await resp.json();
      if (!resp.ok || data.error) {
        throw new Error(data.error || 'Erreur ' + resp.status);
      }

      modalPath.textContent = data.path;

      // Build breadcrumb
      const crumbs = data.path.split('/').filter(Boolean);
      let crumbHtml = '<span class="dsh-fs-crumb-separator">/</span>';
      let acc = '';
      for (let i = 0; i < crumbs.length; i++) {
        acc += '/' + crumbs[i];
        const isLast = i === crumbs.length - 1;
        crumbHtml += '<span class="dsh-fs-crumb-separator">/</span>' +
          '<span class="dsh-fs-crumb" data-path="' + acc + '"' +
          (isLast ? ' style="color:var(--dsw-alias-label-primary,#0f1115);font-weight:500"' : '') +
          '>' + crumbs[i] + '</span>';
      }
      modalBreadcrumb.innerHTML = crumbHtml;

      // Build entry list — directories first, then files
      const dirs = data.entries.filter(e => e.isDirectory);
      const files = data.entries.filter(e => e.isFile);
      const sorted = [...dirs, ...files].sort((a, b) => a.name.localeCompare(b.name));

      if (sorted.length === 0) {
        modalBody.innerHTML = '<div class="dsh-fs-loading">📁 Dossier vide</div>';
      } else {
        modalBody.innerHTML = sorted.map(entry => {
          const isDir = entry.isDirectory;
          const icon = isDir ? '📁' : (entry.name.match(/\\.(js|ts|jsx|tsx|html|css|md|json|yml|yaml|php)$/i) ? '📄' : '📄');
          const sizeStr = entry.size ? formatSize(entry.size) : '';
          const title = isDir ? 'Ouvrir le dossier' : 'Copier le chemin du fichier';
          return '<div class="dsh-fs-entry ' + (isDir ? 'dir' : 'file') +
            '" data-path="' + entry.path + '" title="' + title + '">' +
            '<span class="dsh-fs-icon">' + icon + '</span>' +
            '<span class="dsh-fs-name" title="' + entry.name + '">' + entry.name + '</span>' +
            (sizeStr ? '<span class="dsh-fs-meta">' + sizeStr + '</span>' : '') +
            '</div>';
        }).join('');
      }

      // Add click handlers to entries
      modalBody.querySelectorAll('.dsh-fs-entry').forEach(el => {
        el.addEventListener('click', function() {
          const p = this.dataset.path;
          if (this.classList.contains('dir')) {
            loadDirectory(p);
          } else {
            openFile(p);
          }
        });
      });

      // Add click handlers to breadcrumb crumbs
      modalBreadcrumb.querySelectorAll('.dsh-fs-crumb').forEach(el => {
        el.style.cursor = 'pointer';
        el.addEventListener('click', function() {
          loadDirectory(this.dataset.path);
        });
      });

    } catch (err) {
      modalBody.innerHTML = '<div class="dsh-fs-error">Erreur : ' + err.message + '</div>';
    }
  }

  // Open a file in the viewer (fetches content via /api/fs/read)
  async function openFile(path) {
    currentDir = dirnameBrowser(path);
    modalBreadcrumb.style.display = 'none';
    modalPath.textContent = path;
    modalBody.innerHTML = '<div class="dsh-fs-loading">Chargement du fichier…</div>';

    try {
      const resp = await fetch('/api/fs/read?path=' + encodeURIComponent(path), {
        credentials: 'include'
      });
      const data = await resp.json();
      if (!resp.ok || data.error) {
        throw new Error(data.error || 'Erreur ' + resp.status);
      }

      // Determine if file is binary (non-printable content)
      var isBinary = false;
      var sample = data.content.substring(0, 1000);
      for (var i = 0; i < sample.length; i++) {
        var code = sample.charCodeAt(i);
        if (code < 9 || (code > 13 && code < 32) || code === 127) {
          isBinary = true;
          break;
        }
      }

      var contentDisplay;
      if (isBinary) {
        contentDisplay = '<div class="dsh-fs-error">📎 Fichier binaire — utilisez "Copier le chemin" pour le lire dans le chat.</div>';
      } else {
        contentDisplay = '<pre class="dsh-fs-file-content">' +
          escapeHtml(data.content) + '</pre>';
      }

      var lineInfo = data.totalLines ? ' — ' + data.totalLines + ' lignes' + (data.truncated ? ' (tronqué)' : '') : '';
      modalBody.innerHTML =
        '<div class="dsh-fs-file-actions">' +
        '  <button class="dsh-fs-back-btn" title="↩ Retour au dossier">↩ Retour</button>' +
        '  <button class="dsh-fs-copy-btn" title="📋 Copier le chemin du fichier">📋 Copier le chemin</button>' +
        '  <button class="dsh-fs-open-btn" title="💬 Envoyer dans le chat">💬 Envoyer dans le chat</button>' +
        '  <span class="dsh-fs-file-meta">' + (path.indexOf('/') >= 0 ? path.substring(path.lastIndexOf('/') + 1) : path) + lineInfo + '</span>' +
        '</div>' +
        contentDisplay;

      // Wire up action buttons
      modalBody.querySelector('.dsh-fs-back-btn').addEventListener('click', backToDirectory);
      modalBody.querySelector('.dsh-fs-copy-btn').addEventListener('click', function() {
        copyPath(path);
      });
      modalBody.querySelector('.dsh-fs-open-btn').addEventListener('click', function() {
        copyPath(path);
        showToast("Chemin envoyé — collez dans le chat pour lire le fichier", true);
      });

    } catch (err) {
      modalBody.innerHTML =
        '<div class="dsh-fs-file-actions">' +
        '  <button class="dsh-fs-back-btn" title="↩ Retour">↩ Retour</button>' +
        '  <span class="dsh-fs-file-meta">Erreur</span>' +
        '</div>' +
        '<div class="dsh-fs-error">Erreur : ' + err.message + '</div>';
      modalBody.querySelector('.dsh-fs-back-btn').addEventListener('click', backToDirectory);
    }
  }

  // Go back to directory listing
  async function backToDirectory() {
    if (currentDir) {
      modalBreadcrumb.style.display = '';
      modalBody.innerHTML = '<div class="dsh-fs-loading">Chargement…</div>';
      await loadDirectory(currentDir);
    }
  }

  function formatSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  }

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // Browser-safe dirname (no Node path module available in browser JS)
  function dirnameBrowser(p) {
    var lastSlash = p.lastIndexOf('/');
    if (lastSlash === -1) return '.';
    if (lastSlash === 0) return '/';
    return p.substring(0, lastSlash);
  }

  function copyPath(path) {
    navigator.clipboard.writeText(path).then(function() {
      showToast(path + " copié — collez dans le chat pour lire", true);
    }).catch(function() {
      showToast("Chemin : " + path, false);
    });
  }

  function showToast(msg, isSuccess) {
    toastEl.textContent = msg;
    toastEl.className = 'dsh-explore-toast show' + (isSuccess ? '' : ' error');
    setTimeout(function() { toastEl.classList.remove('show'); }, 3000);
  }
})();
`;

// ── Plugin entry ─────────────────────────────────────────────────────────────

function apply(ctx) {
  // Register filesystem API routes on the web server
  ctx.webServer.register({
    kind: "exact",
    path: "/api/fs/list",
    handler: handleListDir
  });
  ctx.webServer.register({
    kind: "exact",
    path: "/api/fs/read",
    handler: handleReadFile
  });

  // Inject CSS, HTML, JS into index.html on every render
  ctx.on("webserver/index-inject", (rows) => {
    rows.push({ kind: "style", text: BUTTON_CSS });
    rows.push({ kind: "html", placement: "body", html: buildButtonBarHtml() });
    rows.push({ kind: "script", placement: "body", text: BUTTON_JS });
  });
}

export { name, apply, inject };
export default { name, apply, inject };
