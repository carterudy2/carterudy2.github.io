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
          // A way back: a fixed button on the advisor's page, and the browser's Back button.
          const back = `
<div id="wv-back-wrap" style="position:fixed;left:16px;bottom:16px;z-index:2147483647;">
  <button id="wv-back" type="button" style="all:unset;cursor:pointer;display:inline-flex;align-items:center;gap:6px;padding:9px 14px;border-radius:999px;background:#00274C;color:#fff;font:600 13px/1 system-ui,-apple-system,'Segoe UI',sans-serif;box-shadow:0 8px 24px -10px rgba(0,0,0,.5);border:1px solid rgba(255,255,255,.18);">&larr; Back to Wolverine Ventures</button>
</div>
<script>
  (function () {
    var leave = function () { location.reload(); };
    document.getElementById('wv-back').addEventListener('click', leave);
    window.addEventListener('popstate', leave);
  })();
</script>`;
          html = /<body[^>]*>/i.test(html) ? html.replace(/<body[^>]*>/i, (m) => m + back) : back + html;
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
