/* Advisor access: tries the code against each encrypted build in a/index.json.
   Builds are AES-256-GCM, key from PBKDF2-SHA256 (see tools/lock.py). */
(function () {
  "use strict";
  const form = document.getElementById("access-form");
  if (!form) return;
  const input = document.getElementById("access-code");
  const btn = document.getElementById("access-go");
  const status = document.getElementById("access-status");
  const b64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
  // Clear the red error state as soon as the visitor starts fixing the code.
  input.addEventListener("input", () => { input.classList.remove("wv-shake"); status.textContent = ""; });

  async function tryOpen(code, item) {
    const enc = await fetch("a/" + item, { cache: "no-cache" }).then((r) => r.json());
    const base = await crypto.subtle.importKey("raw", new TextEncoder().encode(code), "PBKDF2", false, ["deriveKey"]);
    const key = await crypto.subtle.deriveKey(
      { name: "PBKDF2", hash: "SHA-256", salt: b64(enc.salt), iterations: enc.iter },
      base, { name: "AES-GCM", length: 256 }, false, ["decrypt"]);
    let plain;
    try {
      plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv: b64(enc.iv) }, key, b64(enc.ct));
    } catch (e) { return null; } // wrong code for this build
    const stream = new Blob([plain]).stream().pipeThrough(new DecompressionStream("gzip"));
    return await new Response(stream).text();
  }

  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    const code = input.value.replace(/\s+/g, '').toLowerCase();
    if (!code) return;
    btn.disabled = true;
    status.textContent = "Checking…";
    try {
      const { items } = await fetch("a/index.json", { cache: "no-cache" }).then((r) => r.json());
      for (const item of items) {
        let html = await tryOpen(code, item);
        if (html) {
          status.textContent = "Opening…";
          // The browser's Back button returns to the Ventures page.
          const onBack = `<script>window.addEventListener('popstate', function () { location.reload(); });<\/script>`;
          // Way home, first item in the build's navy top bar, using the build's own fonts and colors
          // (top-left = home, per Jakob's law). The label only fits next to the bar's buttons on wide
          // screens; narrower ones get the arrow alone (44px tap area, tooltip + aria-label).
          const home = `<style>
.wv-home{display:inline-flex;align-items:center;gap:6px;flex:none;height:44px;padding:0 14px 0 2px;margin-right:14px;border-right:1px solid rgba(255,255,255,.18);color:#AEB9C8;font:500 13px/1 var(--font-body,system-ui,sans-serif);text-decoration:none;white-space:nowrap;transition:color .15s ease}
.wv-home:hover,.wv-home:focus-visible{color:#fff}
.wv-home:focus-visible{outline:2px solid var(--maize,#FFCB05);outline-offset:2px;border-radius:6px}
.wv-home svg{flex:none;transition:transform .2s cubic-bezier(.34,1.56,.64,1)}
.wv-home:hover svg,.wv-home:focus-visible svg{transform:translateX(-3px)}
@media (max-width:1400px){.wv-home span{display:none}.wv-home{min-width:44px;justify-content:center;padding:0 8px 0 0;margin-right:10px}}
@media (prefers-reduced-motion:reduce){.wv-home svg{transition:none}.wv-home:hover svg,.wv-home:focus-visible svg{transform:none}}
@media print{.wv-home{display:none}}
</style><a class="wv-home" href="/" aria-label="Back to carterudy.com" title="Back to carterudy.com"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 12H5M12 19l-7-7 7-7"/></svg><span>carterudy.com</span></a>`;
          // Builds without that top bar get a floating button instead.
          const pill = `<a href="/" style="position:fixed;left:16px;bottom:16px;z-index:2147483647;display:inline-flex;align-items:center;gap:6px;padding:9px 14px;border-radius:999px;background:#00274C;color:#fff;font:600 13px/1 system-ui,-apple-system,'Segoe UI',sans-serif;text-decoration:none;box-shadow:0 8px 24px -10px rgba(0,0,0,.5);border:1px solid rgba(255,255,255,.18);">&larr; Back to carterudy.com</a>`;
          const bar = /<header class="topbar"[^>]*>/i;
          if (bar.test(html)) html = html.replace(bar, (m) => m + home);
          else html = /<body[^>]*>/i.test(html) ? html.replace(/<body[^>]*>/i, (m) => m + pill) : pill + html;
          html += onBack; // appended, not matched: the build's own JS strings contain "</body>"
          try { history.pushState({ wvAdvisor: true }, "", location.href); } catch (e) { /* no history in this frame */ }
          document.open(); document.write(html); document.close();
          return;
        }
      }
      status.textContent = "That passcode didn't match. Check it and try again.";
      input.classList.remove("wv-shake");
      void input.offsetWidth; // restart the animation on repeat misses
      input.classList.add("wv-shake");
    } catch (err) {
      status.textContent = "Couldn't load the advisor files. Refresh the page and try again.";
    }
    btn.disabled = false;
  });
})();
