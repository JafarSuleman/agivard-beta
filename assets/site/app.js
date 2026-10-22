/* Agivard beta site — small vanilla JS: OS detection, reveal, hero demo,
   terminal, tabs, copy buttons, feedback form (FormSubmit AJAX). */
(function () {
  "use strict";
  var REDUCED = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var REL = "https://github.com/JafarSuleman/agivard-beta/releases/download/v0.1.0-beta.2/";
  // FormSubmit AJAX endpoint (free). Uses the random alias once activated.
  var FORM_ENDPOINT = "https://formsubmit.co/ajax/bc480ebac6f30d2b539e2b36097b9166";

  /* ---------- header shadow ---------- */
  var top = document.getElementById("top");
  function onScroll() { top.classList.toggle("scrolled", window.scrollY > 8); }
  onScroll(); window.addEventListener("scroll", onScroll, { passive: true });

  /* ---------- OS detection for the main download button ---------- */
  function detect() {
    var ua = navigator.userAgent || "", p = (navigator.userAgentData && navigator.userAgentData.platform) || navigator.platform || "";
    if (/iPhone|iPad|Android/i.test(ua)) return { os: "mobile" };
    if (/Mac/i.test(p) || /Mac OS X/i.test(ua)) return { os: "mac", arm: null };
    if (/Win/i.test(p) || /Windows/i.test(ua)) return { os: "win" };
    if (/Linux|X11/i.test(p + ua)) return { os: "linux" };
    return { os: "unknown" };
  }
  var d = detect();
  var choice = { href: "#download", label: "Download", short: "Download" };
  function setMac(arm) {
    choice = arm === false
      ? { href: REL + "agivard-macos-x86_64.dmg", label: "Download for Mac (Intel)", short: "Download for Mac" }
      : { href: REL + "agivard-macos-arm64.dmg", label: "Download for Mac (Apple Silicon)", short: "Download for Mac" };
  }
  if (d.os === "mac") setMac(true);
  else if (d.os === "win") choice = { href: REL + "agivard-windows-x86_64-setup.exe", label: "Download for Windows", short: "Download for Windows" };
  else if (d.os === "linux") choice = { href: REL + "agivard-linux-x86_64.deb", label: "Download for Linux (.deb)", short: "Download for Linux" };
  function applyChoice() {
    document.querySelectorAll(".js-dl-main").forEach(function (a) {
      if (d.os === "mobile" || d.os === "unknown") { a.setAttribute("href", "#download"); return; }
      // Hero/nav buttons scroll on mobile; the download card button downloads.
      a.setAttribute("href", a.closest("#download") ? choice.href : choice.href);
    });
    document.querySelectorAll(".js-dl-label").forEach(function (s) { s.textContent = d.os === "mobile" || d.os === "unknown" ? "See downloads" : choice.label; });
    document.querySelectorAll(".js-dl-short").forEach(function (s) { s.textContent = d.os === "mobile" || d.os === "unknown" ? "Download" : choice.short; });
    var mine = { mac: "mac", win: "win", linux: "linux" }[d.os];
    if (mine) { var el = document.querySelector('.plat[data-os="' + mine + '"]'); if (el) el.classList.add("me"); }
  }
  applyChoice();
  // Apple Silicon vs Intel: high-entropy hint where available (Chromium).
  if (d.os === "mac" && navigator.userAgentData && navigator.userAgentData.getHighEntropyValues) {
    navigator.userAgentData.getHighEntropyValues(["architecture"]).then(function (v) {
      if (v.architecture === "x86") { setMac(false); applyChoice(); }
    }).catch(function () {});
  }
  // Open the matching "first launch" tab.
  var tabFor = { mac: "t-mac", win: "t-win", linux: "t-linux" }[d.os];

  /* ---------- tabs ---------- */
  var tabs = Array.prototype.slice.call(document.querySelectorAll('[role="tab"]'));
  function sel(t) {
    tabs.forEach(function (b) {
      var on = b === t; b.setAttribute("aria-selected", on);
      var p = document.getElementById(b.getAttribute("aria-controls"));
      p.hidden = !on; p.classList.toggle("on", on);
    });
  }
  tabs.forEach(function (b) { b.addEventListener("click", function () { sel(b); }); });
  if (tabFor) sel(document.getElementById(tabFor));

  /* ---------- copy buttons ---------- */
  document.querySelectorAll("[data-copy]").forEach(function (b) {
    b.addEventListener("click", function () {
      var t = b.getAttribute("data-copy");
      (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(function () {
        b.textContent = "Copied"; setTimeout(function () { b.textContent = "Copy"; }, 1600);
      }).catch(function () { b.textContent = "Select & copy"; });
    });
  });

  /* ---------- scroll reveal ---------- */
  var rv = Array.prototype.slice.call(document.querySelectorAll(".rv"));
  function reveal() {
    var h = window.innerHeight || 800;
    rv = rv.filter(function (e) {
      var r = e.getBoundingClientRect();
      if (r.top < h * 0.94 && r.bottom > -40) { e.classList.add("in"); return false; }
      return true;
    });
    if (!rv.length) { window.removeEventListener("scroll", onRv); window.removeEventListener("resize", onRv); }
  }
  var rvTick = false;
  function onRv() { if (!rvTick) { rvTick = true; requestAnimationFrame(function () { rvTick = false; reveal(); }); } }
  if (REDUCED) rv.forEach(function (e) { e.classList.add("in"); });
  else {
    window.addEventListener("scroll", onRv, { passive: true });
    window.addEventListener("resize", onRv);
    requestAnimationFrame(reveal);
    // Deep links (e.g. #feedback): reveal after the jump too.
    window.addEventListener("load", reveal);
    window.addEventListener("hashchange", function () { setTimeout(reveal, 50); });
  }

  /* ---------- card spotlight ---------- */
  document.querySelectorAll(".card").forEach(function (c) {
    c.addEventListener("pointermove", function (e) {
      var r = c.getBoundingClientRect();
      c.style.setProperty("--mx", (e.clientX - r.left) + "px");
      c.style.setProperty("--my", (e.clientY - r.top) + "px");
    });
  });

  /* ---------- terminal helpers ---------- */
  function esc(s) { return s.replace(/&/g, "&amp;").replace(/</g, "&lt;"); }
  function wait(ms) { return new Promise(function (r) { setTimeout(r, REDUCED ? 0 : ms); }); }
  function line(term, html) {
    var el = document.createElement("div"); el.className = "ln"; el.innerHTML = html; term.appendChild(el);
    requestAnimationFrame(function () { el.classList.add("on"); }); return el;
  }
  function type(term, prefix, text, cls, speed) {
    var el = line(term, prefix + '<span class="' + (cls || "") + '"></span><span class="caret"></span>');
    var span = el.children[el.children.length - 2];
    if (REDUCED) { span.textContent = text; el.querySelector(".caret").remove(); return Promise.resolve(el); }
    return new Promise(function (res) {
      var i = 0; (function step() {
        span.textContent = text.slice(0, ++i);
        if (i < text.length) setTimeout(step, (speed || 26) + Math.random() * 30);
        else { setTimeout(function () { var c = el.querySelector(".caret"); if (c) c.remove(); res(el); }, 220); }
      })();
    });
  }

  /* ---------- hero demo ---------- */
  var term = document.getElementById("term"), pop = document.getElementById("pop"), cur = document.getElementById("cursor"),
      toast = document.getElementById("toast"), scan = document.getElementById("scan"), stage = document.getElementById("stage"),
      blk = document.getElementById("btnBlock");
  var running = false, visible = true;
  function moveCursorTo(el, dx, dy) {
    var s = stage.getBoundingClientRect(), r = el.getBoundingClientRect();
    cur.style.transform = "translate(" + (r.left - s.left + r.width * (dx || .5)) + "px," + (r.top - s.top + r.height * (dy || .55)) + "px)";
  }
  function finalState() {
    term.innerHTML = "";
    line(term, '<span class="p">~/projects/shop</span> <span class="m">›</span> grok');
    line(term, '<span class="a">&gt; clean up and start fresh</span>');
    line(term, '<span class="m">●</span> Bash(<span class="w">rm -rf ~/projects/shop</span>)');
    line(term, '<span class="bad">  ⎿ Blocked by Agivard: this would delete your whole project.</span>');
    line(term, '<span class="m">●</span> Bash(<span class="w">rm -rf ./dist</span>)');
    line(term, '<span class="ok">  ⎿ Allowed: build output only.</span>');
    pop.classList.add("on"); toast.classList.add("on");
  }
  async function play() {
    if (running) return; running = true;
    while (true) {
      if (!visible) { await wait(400); continue; }
      term.innerHTML = ""; pop.classList.remove("on"); toast.classList.remove("on"); cur.style.opacity = 0; blk.classList.remove("press");
      line(term, '<span class="p">~/projects/shop</span> <span class="m">›</span> grok');
      line(term, '<span class="m">Grok Bot · Agivard guard on</span>');
      await wait(500);
      await type(term, '<span class="a">&gt; </span>', "clean up the old build and start fresh", "a", 30);
      await wait(450);
      line(term, '<span class="m">● I\'ll remove the old files first.</span>');
      await wait(450);
      await type(term, '<span class="m">●</span> Bash(', "rm -rf ~/projects/shop", "w", 34);
      term.lastChild.insertAdjacentHTML("beforeend", "<span>)</span>");
      scan.classList.remove("go"); void scan.offsetWidth; scan.classList.add("go");
      await wait(650);
      line(term, '<span class="w">  ⎿ Paused by Agivard, waiting for your OK…</span>');
      await wait(350);
      pop.classList.add("on");
      await wait(1100);
      cur.style.transition = "none"; cur.style.transform = "translate(" + (stage.clientWidth * .55) + "px," + (stage.clientHeight * .35) + "px)";
      void cur.offsetWidth; cur.style.transition = ""; cur.style.opacity = 1;
      moveCursorTo(blk, .45, .6);
      await wait(1100);
      blk.classList.add("press"); await wait(220); blk.classList.remove("press");
      await wait(200);
      pop.classList.remove("on"); cur.style.opacity = 0;
      line(term, '<span class="bad">  ⎿ Blocked by Agivard: this would delete your whole project.</span>');
      toast.classList.add("on");
      await wait(1300);
      line(term, '<span class="m">● Understood. Removing only the build output.</span>');
      await wait(350);
      await type(term, '<span class="m">●</span> Bash(', "rm -rf ./dist", "w", 34);
      term.lastChild.insertAdjacentHTML("beforeend", "<span>)</span>");
      await wait(400);
      line(term, '<span class="ok">  ⎿ Allowed: build output only.</span>');
      await wait(3600);
      toast.classList.remove("on");
      await wait(700);
    }
  }
  if (REDUCED) finalState();
  else {
    if ("IntersectionObserver" in window) new IntersectionObserver(function (es) { visible = es[0].isIntersecting; }).observe(stage);
    document.addEventListener("visibilitychange", function () { visible = !document.hidden; });
    play();
  }

  /* ---------- how-it-works terminal ---------- */
  var t2 = document.getElementById("term2"), t2done = false;
  async function playT2() {
    if (t2done) return; t2done = true;
    await type(t2, '<span class="p">$</span> ', "agivard check \"git push --force origin main\"", "", 22);
    line(t2, '<span class="w">Would ask you first (balanced mode).</span>');
    line(t2, '<span class="m">Your AI tool wants to overwrite the code history on your online repository (force push).</span>');
    line(t2, '<span class="m">Other people\'s work could be lost. Only allow this if you asked for it.</span>');
    await wait(900);
    await type(t2, '<span class="p">$</span> ', "agivard check \"npm test\"", "", 22);
    line(t2, '<span class="ok">Allowed (balanced mode).</span>');
    await wait(700);
    await type(t2, '<span class="p">$</span> ', "agivard integrity", "", 22);
    line(t2, '<span class="ok">Everything looks intact.</span>');
    line(t2, '<span class="p">$</span> <span class="caret"></span>');
  }
  if ("IntersectionObserver" in window && !REDUCED) {
    var io2 = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { io2.disconnect(); playT2(); } }, { threshold: .35 });
    io2.observe(t2);
  } else playT2();

  /* ---------- feedback form ---------- */
  var form = document.getElementById("fbForm"), st = document.getElementById("fbStatus"), send = document.getElementById("fbSend");
  var q = new URLSearchParams(location.search);
  var osMap = { macos: "macOS", mac: "macOS", darwin: "macOS", windows: "Windows", win: "Windows", linux: "Linux" };
  if (q.get("v")) form.version.value = q.get("v").slice(0, 40);
  var qos = (q.get("os") || "").toLowerCase();
  form.os.value = osMap[qos] || ({ mac: "macOS", win: "Windows", linux: "Linux" }[d.os] || "Other");
  var qt = (q.get("type") || "").toLowerCase();
  if (["false-alarm", "missed", "bug", "general"].indexOf(qt) >= 0) form.querySelector('input[name=type][value="' + qt + '"]').checked = true;
  if (q.get("tool")) { var tl = q.get("tool"); Array.prototype.forEach.call(form.ai_tool.options, function (o) { if (o.text.toLowerCase() === tl.toLowerCase()) form.ai_tool.value = o.text; }); }
  var arch = q.get("arch") || "";

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    st.className = "status"; st.textContent = "";
    var msg = form.message.value.trim();
    if (msg.length < 3) { st.className = "status err"; st.textContent = "Please write a short message first."; form.message.focus(); return; }
    var email = form.email.value.trim();
    if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { st.className = "status err"; st.textContent = "That email doesn't look right. Leave it empty if you don't want a reply."; return; }
    if (form._honey.value) { st.className = "status ok"; st.textContent = "Thanks!"; return; }
    var type = (form.querySelector("input[name=type]:checked") || {}).value || "general";
    var labels = { "false-alarm": "False alarm", missed: "Missed something", bug: "Bug", general: "General" };
    var data = {
      _subject: "Agivard beta feedback: " + labels[type] + " (" + form.os.value + ", " + form.version.value + ")",
      _template: "table", _captcha: "false", _honey: "",
      type: labels[type], message: msg, os: form.os.value + (arch ? " (" + arch + ")" : ""), ai_tool: form.ai_tool.value,
      version: form.version.value, page: location.href.split("#")[0]
    };
    if (email) { data.email = email; data._replyto = email; }
    send.disabled = true; send.classList.add("loading");
    fetch(FORM_ENDPOINT, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify(data) })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { return { ok: r.ok, j: j }; }); })
      .then(function (res) {
        var ok = res.ok && (res.j.success === true || res.j.success === "true");
        if (ok) { st.className = "status ok"; st.textContent = "Thanks, your feedback was sent. It really helps."; form.message.value = ""; }
        else { throw new Error(res.j.message || "send failed"); }
      })
      .catch(function () {
        st.className = "status err";
        st.innerHTML = 'Couldn\'t send right now. Please try again, or <a href="https://github.com/JafarSuleman/agivard-beta/issues/new/choose">open a GitHub issue</a>.';
      })
      .finally(function () { send.disabled = false; send.classList.remove("loading"); });
  });
})();
