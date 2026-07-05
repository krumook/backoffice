/* ==========================================================================
   krumook-backoffice — app.js  (SPA)
   เว็บหลังบ้านของครู · mobile-first · เรียก Apps Script API เส้นเดียว
   ⚠️ repo นี้ public — ห้ามมีค่าลับในโค้ด
      API_URL ใส่ในโค้ดได้ (ไม่ลับ) · API_SECRET ครูกรอกเองที่หน้า Login เก็บใน sessionStorage
   ========================================================================== */

(function () {
  "use strict";

  // ====== CONFIG ======
  // ใส่ URL ของ Apps Script Web App (ลงท้าย /exec) ตรงนี้ได้เลย (ไม่ลับ)
  // ถ้าเว้นว่าง หน้า Login จะมีช่องให้กรอก URL เอง
  var CONFIG = {
    API_URL: "https://script.google.com/macros/s/AKfycbxpRGCmMBEx6_e_Ra6IZ8qI3wGBIOWYMWlIe2Nu06YpTpg5XJfOc1x5C4cyZDehR8fF/exec",
  };

  var SS = { secret: "krumook_secret", url: "krumook_url", demo: "krumook_demo" };

  // ====== state ======
  var state = {
    demo: false,
    page: "pending",
    row: null,
    cache: { products: null },
    counts: { pending: 0, slips: 0 },
  };

  // ====== reason → ข้อความไทย ======
  var REASON = {
    unauthorized: "รหัสลับไม่ถูกต้อง",
    unknown_action: "คำสั่งไม่ถูกต้อง (unknown_action)",
    notfound: "ไม่พบข้อมูลนี้ในระบบ",
    used: "รหัสนี้ถูกใช้ไปแล้ว",
    no_profile: "ยังไม่เคยลงทะเบียน — ให้ลงทะเบียนก่อน",
    duplicate: "มีรหัสสินค้านี้อยู่แล้ว",
    product_notfound: "ยังไม่มีสินค้านี้ — สร้างที่หน้าสินค้าก่อน",
    bad_request: "ข้อมูลไม่ครบ ลองตรวจอีกครั้ง",
    server_error: "ระบบขัดข้อง ลองใหม่อีกครั้ง",
  };
  function reasonText(r) { return REASON[r] || ("เกิดข้อผิดพลาด: " + (r || "ไม่ทราบสาเหตุ")); }

  // ====== DOM helpers ======
  function $(id) { return document.getElementById(id); }
  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function attr(s) { return esc(s).replace(/`/g, "&#96;"); }

  // ====== เวลา ======
  function timeAgo(ts) {
    if (!ts) return "—";
    var t = new Date(ts).getTime();
    if (isNaN(t)) return String(ts);
    var s = Math.floor((Date.now() - t) / 1000);
    if (s < 60) return "เมื่อสักครู่";
    var m = Math.floor(s / 60);
    if (m < 60) return m + " นาทีที่แล้ว";
    var h = Math.floor(m / 60);
    if (h < 24) return h + " ชั่วโมงที่แล้ว";
    var d = Math.floor(h / 24);
    if (d < 7) return d + " วันที่แล้ว";
    return new Date(t).toLocaleDateString("th-TH", { day: "numeric", month: "short" });
  }
  function fmtDateTime(ts) {
    if (!ts) return "—";
    var d = new Date(ts);
    if (isNaN(d.getTime())) return String(ts);
    return d.toLocaleString("th-TH", { day: "numeric", month: "short", year: "2-digit", hour: "2-digit", minute: "2-digit" });
  }
  function fmtBaht(n) {
    var v = Number(n);
    if (isNaN(v)) return String(n || "—");
    return v.toLocaleString("th-TH", { maximumFractionDigits: 2 });
  }

  // ====== toast ======
  function toast(msg, kind) {
    var wrap = $("toastWrap");
    var t = el("div", "toast" + (kind ? " " + kind : ""));
    var icon = kind === "ok" ? "✅" : kind === "err" ? "⚠️" : "ℹ️";
    t.innerHTML = "<span>" + icon + "</span><span>" + esc(msg) + "</span>";
    wrap.appendChild(t);
    setTimeout(function () {
      t.style.transition = "opacity .3s, transform .3s";
      t.style.opacity = "0";
      t.style.transform = "translateY(8px)";
      setTimeout(function () { t.remove(); }, 300);
    }, kind === "err" ? 4200 : 2400);
  }

  // ====== modal (confirm / form) ======
  // opts: {title, bodyHtml, okLabel, okClass, cancelLabel}
  // คืน Promise: resolve(formValues) เมื่อกดตกลง, resolve(null) เมื่อยกเลิก
  function openModal(opts) {
    return new Promise(function (resolve) {
      var root = $("modalRoot");
      var overlay = el("div", "modal-overlay");
      var modal = el("div", "modal");
      modal.innerHTML =
        "<h3>" + esc(opts.title) + "</h3>" +
        (opts.bodyHtml || "") +
        '<div class="modal-actions">' +
        '<button type="button" class="btn btn-ghost" data-act="cancel">' + esc(opts.cancelLabel || "ยกเลิก") + "</button>" +
        '<button type="button" class="btn ' + (opts.okClass || "btn-primary") + '" data-act="ok">' + esc(opts.okLabel || "ตกลง") + "</button>" +
        "</div>";
      overlay.appendChild(modal);
      root.appendChild(overlay);

      function close(val) { overlay.remove(); resolve(val); }
      overlay.addEventListener("click", function (e) { if (e.target === overlay) close(null); });
      modal.querySelector('[data-act="cancel"]').onclick = function () { close(null); };
      modal.querySelector('[data-act="ok"]').onclick = function () {
        var values = {};
        modal.querySelectorAll("[data-field]").forEach(function (inp) {
          values[inp.getAttribute("data-field")] = inp.value;
        });
        close(values);
      };
      var focusEl = modal.querySelector("[data-field]");
      if (focusEl) focusEl.focus();
    });
  }

  // ====== API helper กลาง ======
  function apiUrl() { return CONFIG.API_URL || sessionStorage.getItem(SS.url) || ""; }
  function secret() { return sessionStorage.getItem(SS.secret) || ""; }

  function api(action, payload) {
    if (state.demo) return demoApi(action, payload || {});
    var body = Object.assign({ key: secret(), action: action }, payload || {});
    return fetch(apiUrl(), {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" }, // กัน CORS preflight ของ Apps Script
      body: JSON.stringify(body),
      redirect: "follow",
    })
      .then(function (res) { return res.text(); })
      .then(function (text) {
        var data;
        try { data = JSON.parse(text); }
        catch (e) { throw { reason: "server_error", message: "ตอบกลับไม่ใช่ JSON — ตรวจการ Deploy Web App (Anyone)" }; }
        if (data && data.ok === false) {
          if (data.reason === "unauthorized") { forceLogout(); }
          throw { reason: data.reason, message: data.message };
        }
        return data;
      })
      .catch(function (err) {
        if (err && err.reason) throw err;
        throw { reason: "server_error", message: (err && err.message) || "เชื่อมต่อไม่สำเร็จ" };
      });
  }
  function errText(err) {
    if (!err) return "เกิดข้อผิดพลาด";
    if (err.reason) return reasonText(err.reason) + (err.message ? " (" + err.message + ")" : "");
    return err.message || String(err);
  }

  // ====== auth / session ======
  function isLoggedIn() { return state.demo || (!!secret() && !!apiUrl()); }

  function showLogin() {
    $("loginScreen").classList.remove("hidden");
    $("appShell").classList.add("hidden");
    $("apiUrlField").classList.toggle("hidden", !!CONFIG.API_URL);
  }
  function showApp() {
    $("loginScreen").classList.add("hidden");
    $("appShell").classList.remove("hidden");
    var label = state.demo ? "โหมดตัวอย่าง" : "เชื่อมต่อแล้ว";
    [$("modePill"), $("modePillDesk")].forEach(function (p) {
      if (!p) return;
      p.textContent = label;
      p.classList.toggle("demo", state.demo);
    });
  }
  function forceLogout() {
    sessionStorage.removeItem(SS.secret);
    if (!isLoggedIn()) return;
    toast("เซสชันหมดอายุ กรุณาเข้าใช้งานใหม่", "err");
    doLogout();
  }
  function doLogout() {
    sessionStorage.removeItem(SS.secret);
    sessionStorage.removeItem(SS.demo);
    state.demo = false;
    var f = $("apiSecret"); if (f) f.value = "";
    showLogin();
  }

  function loginError(msg) { var b = $("loginError"); b.textContent = msg; b.classList.remove("hidden"); }

  function doLogin(e) {
    e.preventDefault();
    $("loginError").classList.add("hidden");
    var url = CONFIG.API_URL || ($("apiUrl").value || "").trim();
    var sec = ($("apiSecret").value || "").trim();
    if (!url) return loginError("กรุณากรอกลิงก์ API");
    if (!sec) return loginError("กรุณากรอกรหัสลับของครู");
    if (!/^https:\/\/script\.google\.com\//.test(url)) return loginError("ลิงก์ API ควรขึ้นต้นด้วย https://script.google.com/");

    var btn = $("loginBtn");
    setLoading(btn, true);
    state.demo = false;
    sessionStorage.setItem(SS.url, url);
    sessionStorage.setItem(SS.secret, sec);

    // ทดสอบรหัสด้วย listProducts (ตามบรีฟ)
    api("listProducts", {})
      .then(function () { enterApp(); })
      .catch(function (err) {
        sessionStorage.removeItem(SS.secret);
        loginError("เข้าใช้งานไม่สำเร็จ: " + errText(err));
      })
      .finally(function () { setLoading(btn, false); });
  }

  function doDemo() {
    state.demo = true;
    sessionStorage.setItem(SS.demo, "1");
    enterApp();
    toast("โหมดตัวอย่าง — ปุ่มใช้ได้ แต่ไม่เขียนข้อมูลจริง", "");
  }

  function enterApp() {
    showApp();
    route();
    refreshBadges();
  }

  function setLoading(btn, on) {
    if (!btn) return;
    if (on) { btn._t = btn.innerHTML; btn.classList.add("is-loading"); btn.disabled = true; }
    else { btn.classList.remove("is-loading"); btn.disabled = false; if (btn._t) btn.innerHTML = btn._t; }
  }

  // ====== ROUTING (query-based: ?page=..&row=..) ======
  function parseLoc() {
    var q = new URLSearchParams(location.search);
    return { page: q.get("page") || "pending", row: q.get("row") };
  }
  function navigate(page, params, replace) {
    var q = new URLSearchParams();
    if (page && page !== "pending") q.set("page", page);
    if (params && params.row != null) q.set("row", params.row);
    var url = location.pathname + (q.toString() ? "?" + q.toString() : "");
    if (replace) history.replaceState({}, "", url); else history.pushState({}, "", url);
    route();
  }
  function route() {
    if (!isLoggedIn()) { showLogin(); return; }
    showApp();
    var loc = parseLoc();
    // ลิงก์จาก Discord: ?row=N → หน้ารายละเอียด
    if (loc.row) { state.page = "detail"; state.row = loc.row; renderDetail(loc.row); highlightNav("pending"); setTopTitle("รายละเอียด"); return; }
    state.page = loc.page; state.row = null;
    highlightNav(loc.page);
    var titles = { pending: "คิวรออนุมัติ", products: "สินค้า", generate: "สร้างรหัส", search: "ค้นหารหัส", slips: "สลิปรอตรวจ" };
    setTopTitle(titles[loc.page] || "หลังบ้าน");
    switch (loc.page) {
      case "products": renderProducts(); break;
      case "generate": renderGenerate(); break;
      case "search": renderSearch(); break;
      case "slips": renderSlips(); break;
      default: renderPending();
    }
  }
  function setTopTitle(t) { var e = $("topTitle"); if (e) e.textContent = t; }
  function highlightNav(page) {
    document.querySelectorAll(".nav-item").forEach(function (n) {
      n.classList.toggle("active", n.getAttribute("data-nav") === page);
    });
  }

  // ====== badges (คิว + สลิป) ======
  function refreshBadges() {
    api("listPending", {}).then(function (d) { setBadge("pending", listOf(d).length); }).catch(function () {});
    api("listSlips", {}).then(function (d) { setBadge("slips", listOf(d).length); }).catch(function () {});
  }
  function setBadge(name, n) {
    state.counts[name] = n;
    document.querySelectorAll('[data-badge="' + name + '"]').forEach(function (b) {
      b.textContent = n; b.classList.toggle("hidden", !n);
    });
  }

  // ====== state renders ======
  function view() { return $("view"); }
  function setView(html) { view().innerHTML = html; }
  function loadingState(msg) { return '<div class="state"><div class="spinner"></div><p>' + esc(msg || "กำลังโหลด...") + "</p></div>"; }
  function emptyState(emoji, title, msg, actionHtml) {
    return '<div class="state"><span class="emoji">' + emoji + '</span><h3>' + esc(title) + "</h3><p>" + esc(msg || "") + "</p>" + (actionHtml || "") + "</div>";
  }
  function errorState(msg, retryPage) {
    return '<div class="state error"><span class="emoji">⚠️</span><h3>โหลดข้อมูลไม่สำเร็จ</h3><p>' + esc(msg) + "</p>" +
      '<button class="btn btn-ghost" onclick="__retry()">ลองใหม่</button></div>';
  }
  window.__retry = function () { route(); };

  function listOf(d) { return (d && Array.isArray(d.items)) ? d.items : (Array.isArray(d) ? d : []); }

  // ======================================================================
  //  หน้า 1 — คิวรออนุมัติ
  // ======================================================================
  var autoTimer = null;
  function renderPending() {
    setView(
      '<div class="page-head"><h2>🏠 คิวรออนุมัติ <span class="count-inline" id="pendCount"></span></h2>' +
      '<div class="spacer"></div></div>' +
      '<div id="pendBody">' + loadingState("กำลังโหลดคิว...") + "</div>"
    );
    loadPending();
    startAutoRefresh();
  }
  function loadPending() {
    api("listPending", {})
      .then(function (d) {
        var items = listOf(d);
        setBadge("pending", items.length);
        var c = $("pendCount"); if (c) c.textContent = "(" + items.length + ")";
        if (!items.length) { $("pendBody").innerHTML = emptyState("🎉", "ไม่มีรายการค้าง", "อนุมัติครบทุกรายการแล้ว"); return; }
        var wrap = el("div", "queue");
        items.forEach(function (it) { wrap.appendChild(pendingCard(it)); });
        var body = $("pendBody"); body.innerHTML = ""; body.appendChild(wrap);
      })
      .catch(function (err) { var b = $("pendBody"); if (b) b.innerHTML = errorState(errText(err)); });
  }
  function pendingCard(it) {
    var a = el("a", "q-card");
    a.href = "?row=" + encodeURIComponent(it.row);
    a.onclick = function (e) { e.preventDefault(); navigate("detail", { row: it.row }); };
    a.innerHTML =
      '<div class="q-top"><span class="q-name">🧑 ' + esc(it.nickname || it.name || "-") + "</span>" +
      (it.school ? '<span class="q-school">· ' + esc(it.school) + "</span>" : "") + "</div>" +
      '<div class="q-line"><span class="chip book">📕 ' + esc(it.product || "-") + '</span><span class="q-email">' + esc(it.email || "-") + "</span></div>" +
      '<div class="q-foot"><span class="q-time">🕐 ' + esc(timeAgo(it.timestamp)) + '</span><span class="q-go">จัดการ ▸</span></div>';
    return a;
  }
  function startAutoRefresh() {
    stopAutoRefresh();
    autoTimer = setInterval(function () {
      if (state.page === "pending" && !document.hidden) loadPending();
    }, 60000);
  }
  function stopAutoRefresh() { if (autoTimer) { clearInterval(autoTimer); autoTimer = null; } }

  // ======================================================================
  //  หน้า 2 — รายละเอียดรายการ (สำคัญสุด)
  // ======================================================================
  function renderDetail(row) {
    stopAutoRefresh();
    setView('<a class="back-link" onclick="__back()">◀ กลับไปคิว</a><div class="detail-wrap" id="detailBody">' + loadingState("กำลังโหลดรายการ...") + "</div>");
    api("getRegistration", { row: Number(row) })
      .then(function (d) { drawDetail(d.item || d); })
      .catch(function (err) { $("detailBody").innerHTML = errorState(errText(err)); });
  }
  window.__back = function () { navigate("pending"); };

  function drawDetail(it) {
    if (!it) { $("detailBody").innerHTML = errorState("ไม่พบรายการนี้"); return; }
    var isPending = String(it.status) === "pending";
    var statusMap = {
      pending: '<span class="st-dot">🟡</span> รออนุมัติ',
      approved: '<span class="st-dot">🟢</span> อนุมัติแล้ว' + (String(it.link_sent) === "yes" ? " · ส่งลิงก์แล้ว ✅" : " · รอบอทส่งลิงก์"),
      rejected: '<span class="st-dot">🔴</span> ปฏิเสธแล้ว',
    };
    var hasLink = it.youtube_link && String(it.youtube_link).trim();

    var actions;
    if (isPending) {
      actions =
        '<div class="steps-hint"><b>ทำ 2 ขั้นให้ครบก่อนกดอนุมัติ</b>' +
        "<ol><li>คัดลอกอีเมล → เชิญเข้าวิดีโอใน YouTube</li><li>กลับมากดปุ่มด้านล่าง</li></ol></div>" +
        '<div class="detail-actions"><button class="btn btn-approve btn-lg" id="btnApprove">✅ อนุมัติ</button>' +
        '<button class="btn btn-reject" id="btnReject">❌ ปฏิเสธ</button></div>';
    } else {
      actions = '<div class="done-note">รายการนี้จัดการแล้ว (สถานะ: ' + esc(it.status) + ") — กดอนุมัติซ้ำไม่ได้</div>";
    }

    $("detailBody").innerHTML =
      '<div class="detail-card">' +
        '<div class="detail-status">สถานะ: ' + (statusMap[it.status] || esc(it.status)) + "</div>" +
        '<div class="detail-sec">' +
          '<div class="detail-person">' + esc(it.nickname || it.name || "-") +
            (it.name && it.nickname ? " <span style=\"font-weight:400;font-size:15px;color:var(--muted)\">(" + esc(it.name) + ")</span>" : "") + "</div>" +
          '<div class="detail-meta">' + (it.age ? esc(it.age) + " ปี · " : "") + esc(it.school || "-") + "</div>" +
          '<div class="detail-prod">' +
            '<span class="chip book lg">📕 ' + esc(it.product_name || it.product || "-") + (it.product_name ? " (" + esc(it.product) + ")" : "") + "</span>" +
            '<span class="detail-code">🎟️ ' + esc(it.code || "-") + "</span>" +
          "</div>" +
        "</div>" +
        '<div class="detail-sec">' +
          '<div class="email-label">✉️ อีเมลที่ต้องเชิญใน YouTube</div>' +
          '<div class="email-row"><span class="em">' + esc(it.email || "-") + '</span>' +
            '<button class="btn btn-primary btn-sm" id="btnCopy">📋 คัดลอก</button></div>' +
          (hasLink
            ? '<a class="btn btn-block" style="margin-top:12px" href="' + attr(it.youtube_link) + '" target="_blank" rel="noopener">▶ เปิดวิดีโอเล่มนี้ใน YouTube</a>'
            : '<div class="warn-box">⚠️ เล่มนี้ยังไม่ใส่ลิงก์วิดีโอ <a onclick="__go(\'products\')">ไปที่หน้าสินค้าก่อน ▸</a></div>') +
        "</div>" +
        '<div class="detail-sec">' + actions + "</div>" +
      "</div>";

    var copyBtn = $("btnCopy");
    if (copyBtn) copyBtn.onclick = function () { copyText(it.email, copyBtn); };
    if (isPending) {
      $("btnApprove").onclick = function () { onApprove(it); };
      $("btnReject").onclick = function () { onReject(it); };
    }
  }
  window.__go = function (p) { navigate(p); };

  function onApprove(it) {
    openModal({
      title: "ยืนยันการอนุมัติ",
      bodyHtml: "<p>เพิ่มอีเมล <b>" + esc(it.email) + "</b> เข้าวิดีโอใน YouTube เรียบร้อยแล้วใช่ไหม?</p>",
      okLabel: "✅ อนุมัติเลย", okClass: "btn-approve",
    }).then(function (ok) {
      if (!ok) return;
      var btn = $("btnApprove"); setLoading(btn, true);
      api("approve", { row: Number(it.row) })
        .then(function () {
          toast("อนุมัติแล้ว — บอทจะส่งลิงก์ให้นักเรียนภายใน ~1 นาที", "ok");
          renderDetail(it.row);
          refreshBadges();
        })
        .catch(function (err) { setLoading(btn, false); toast(errText(err), "err"); });
    });
  }
  function onReject(it) {
    openModal({
      title: "ยืนยันการปฏิเสธ",
      bodyHtml: '<p>ระบุเหตุผล (ไม่บังคับ) — รหัสจะถูกคืนสถานะให้ลงทะเบียนใหม่ได้</p>' +
        '<div class="field"><textarea data-field="reason" placeholder="เช่น อีเมลผิด / รหัสไม่ตรงเล่ม"></textarea></div>',
      okLabel: "❌ ปฏิเสธ", okClass: "btn-danger",
    }).then(function (vals) {
      if (!vals) return;
      var btn = $("btnReject"); setLoading(btn, true);
      api("reject", { row: Number(it.row), reason: vals.reason || "" })
        .then(function () {
          toast("ปฏิเสธแล้ว — รหัสถูกคืนสถานะ ใช้ลงทะเบียนใหม่ได้", "");
          renderDetail(it.row);
          refreshBadges();
        })
        .catch(function (err) { setLoading(btn, false); toast(errText(err), "err"); });
    });
  }

  // ======================================================================
  //  หน้า 3 — สินค้า
  // ======================================================================
  function renderProducts() {
    setView('<div class="page-head"><h2>📚 สินค้า</h2></div><p class="page-sub">สร้าง/แก้ทะเบียนหนังสือ — ที่เดียวที่ใส่ลิงก์ YouTube ของแต่ละเล่ม</p><div id="prodBody">' + loadingState("กำลังโหลดสินค้า...") + "</div>");
    api("listProducts", {})
      .then(function (d) {
        var items = listOf(d);
        state.cache.products = items;
        drawProducts(items);
      })
      .catch(function (err) { $("prodBody").innerHTML = errorState(errText(err)); });
  }
  function drawProducts(items) {
    var rows = items.map(function (p) {
      var linkChip = (p.youtube_link && String(p.youtube_link).trim())
        ? '<span class="chip ok">✅ มีลิงก์</span>'
        : '<span class="chip warn">⚠️ ยังไม่ใส่</span>';
      return "<tr><td class=\"code\">" + esc(p.product) + "</td><td>" + esc(p.product_name || "-") + "</td><td>" + linkChip + "</td>" +
        '<td><button class="btn btn-ghost btn-sm" data-edit="' + attr(JSON.stringify(p)) + '">แก้ไข</button></td></tr>';
    }).join("");

    var tableHtml = items.length
      ? '<div class="table-wrap"><table class="tbl"><thead><tr><th>รหัสสินค้า</th><th>ชื่อเล่ม</th><th>ลิงก์</th><th></th></tr></thead><tbody>' + rows + "</tbody></table></div>"
      : emptyState("📚", "ยังไม่มีสินค้า", "เพิ่มเล่มแรกด้านล่างก่อนสร้างรหัส");

    $("prodBody").innerHTML =
      tableHtml +
      '<div class="card-block" style="margin-top:16px"><h3>➕ เพิ่มสินค้าใหม่</h3>' +
        '<div class="field"><label>รหัสสินค้า (product)</label><input class="mono" id="npProduct" placeholder="MATH1" /><span class="hint">ตัวเดียวกับที่ใช้ gen รหัส · ระบบแปลงเป็นพิมพ์ใหญ่ให้</span></div>' +
        '<div class="field"><label>ชื่อเล่ม</label><input id="npName" placeholder="เฉลยคณิต ม.4 เล่ม 1" /></div>' +
        '<div class="field"><label>ลิงก์ YouTube (ไม่บังคับ)</label><input class="mono" id="npLink" placeholder="https://youtu.be/..." /></div>' +
        '<button class="btn btn-primary btn-block" id="btnAddProd">บันทึกสินค้า</button>' +
      "</div>";

    $("prodBody").querySelectorAll("[data-edit]").forEach(function (b) {
      b.onclick = function () { editProduct(JSON.parse(b.getAttribute("data-edit"))); };
    });
    $("btnAddProd").onclick = addProduct;
  }
  function addProduct() {
    var product = ($("npProduct").value || "").trim().toUpperCase();
    var name = ($("npName").value || "").trim();
    var link = ($("npLink").value || "").trim();
    if (!product) { toast("กรุณากรอกรหัสสินค้า", "err"); return; }
    var btn = $("btnAddProd"); setLoading(btn, true);
    api("addProduct", { product: product, product_name: name, youtube_link: link })
      .then(function () { toast("เพิ่มสินค้า " + product + " แล้ว", "ok"); renderProducts(); })
      .catch(function (err) { setLoading(btn, false); toast(errText(err), "err"); });
  }
  function editProduct(p) {
    openModal({
      title: "แก้ไข " + p.product,
      bodyHtml:
        '<div class="field"><label>ชื่อเล่ม</label><input data-field="product_name" value="' + attr(p.product_name || "") + '" /></div>' +
        '<div class="field"><label>ลิงก์ YouTube</label><input class="mono" data-field="youtube_link" value="' + attr(p.youtube_link || "") + '" placeholder="https://youtu.be/..." /></div>',
      okLabel: "บันทึก", okClass: "btn-primary",
    }).then(function (vals) {
      if (!vals) return;
      api("updateProduct", { row: Number(p.row), product_name: vals.product_name, youtube_link: vals.youtube_link })
        .then(function () { toast("บันทึกแล้ว", "ok"); renderProducts(); })
        .catch(function (err) { toast(errText(err), "err"); });
    });
  }

  // ======================================================================
  //  หน้า 4 — สร้างรหัส
  // ======================================================================
  function renderGenerate() {
    setView('<div class="page-head"><h2>🎟️ สร้างรหัส</h2></div><p class="page-sub">เลือกเล่ม + จำนวน → ได้รหัสไปทำการ์ด</p><div id="genBody">' + loadingState("กำลังเตรียม...") + "</div>");
    ensureProducts()
      .then(function (items) {
        if (!items.length) {
          $("genBody").innerHTML = emptyState("📚", "ยังไม่มีสินค้า", "ต้องสร้างสินค้าก่อนถึงจะ gen รหัสได้", '<button class="btn btn-primary" onclick="__go(\'products\')">ไปสร้างสินค้า ▸</button>');
          return;
        }
        var opts = items.map(function (p) { return '<option value="' + attr(p.product) + '">' + esc(p.product) + (p.product_name ? " · " + esc(p.product_name) : "") + "</option>"; }).join("");
        $("genBody").innerHTML =
          '<div class="card-block">' +
            '<div class="field"><label>เลือกสินค้า</label><select id="genProduct">' + opts + "</select></div>" +
            '<div class="field"><label>จำนวน (1–500)</label><input type="number" id="genAmount" min="1" max="500" value="100" inputmode="numeric" /></div>' +
            '<button class="btn btn-primary btn-block btn-lg" id="btnGen">🎲 สร้างรหัส</button>' +
          '</div><div id="genResult"></div>';
        $("btnGen").onclick = doGenerate;
      })
      .catch(function (err) { $("genBody").innerHTML = errorState(errText(err)); });
  }
  function doGenerate() {
    var product = $("genProduct").value;
    var amount = parseInt($("genAmount").value, 10);
    if (!amount || amount < 1 || amount > 500) { toast("จำนวนต้องอยู่ระหว่าง 1–500", "err"); return; }
    openModal({
      title: "ยืนยันการสร้างรหัส",
      bodyHtml: "<p>สร้าง <b>" + amount + "</b> รหัสของ <b>" + esc(product) + "</b> ใช่ไหม? รหัสจะถูกบันทึกเข้าระบบทันที</p>",
      okLabel: "🎲 สร้างเลย", okClass: "btn-primary",
    }).then(function (ok) {
      if (!ok) return;
      var btn = $("btnGen"); setLoading(btn, true);
      api("generateCodes", { product: product, amount: amount })
        .then(function (d) { setLoading(btn, false); drawGenResult(d); toast("สร้าง " + (d.amount || amount) + " รหัสสำเร็จ", "ok"); })
        .catch(function (err) { setLoading(btn, false); toast(errText(err), "err"); });
    });
  }
  function drawGenResult(d) {
    var codes = d.codes || [];
    $("genResult").innerHTML =
      '<div class="code-result">' +
        '<div class="cr-head"><span class="cr-title grow">✅ สร้างสำเร็จ ' + codes.length + " รหัส (" + esc(d.product) + ")</span>" +
          '<button class="btn btn-sm" id="btnCsv">⬇️ ดาวน์โหลด CSV</button>' +
          '<button class="btn btn-ghost btn-sm" id="btnCopyAll">📋 คัดลอกทั้งหมด</button></div>' +
        '<div class="code-list">' + esc(codes.join("\n")) + "</div>" +
        '<div class="cr-warn">💡 ดาวน์โหลดเก็บไว้เลย — ถ้าหาย ดึงซ้ำได้ที่หน้า "ค้นหารหัส"</div>' +
      "</div>";
    $("btnCsv").onclick = function () { downloadCsv(d.product, codes); };
    $("btnCopyAll").onclick = function () { copyText(codes.join("\n"), $("btnCopyAll")); };
  }
  function downloadCsv(product, codes) {
    // ครอบด้วย " เพื่อกันรหัสเพี้ยนใน Excel/Sheets
    var lines = ['"code","product"'].concat(codes.map(function (c) { return '"' + c + '","' + product + '"'; }));
    var blob = new Blob(["\uFEFF" + lines.join("\r\n")], { type: "text/csv;charset=utf-8;" });
    var a = el("a");
    a.href = URL.createObjectURL(blob);
    a.download = "codes_" + product + "_" + codes.length + ".csv";
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
  }

  // ======================================================================
  //  หน้า 5 — ค้นหารหัส
  // ======================================================================
  function renderSearch() {
    setView(
      '<div class="page-head"><h2>🔍 ค้นหารหัส</h2></div>' +
      '<div class="card-block"><h3>ค้นหารหัสเดี่ยว</h3>' +
        '<div class="field-row"><div class="field" style="margin-bottom:0"><input class="mono" id="scCode" placeholder="MATH1-X7K2-9PQR" /></div>' +
        '<button class="btn btn-primary" id="btnFind">ค้นหา</button></div>' +
        '<div id="scResult"></div>' +
      "</div>" +
      '<div class="card-block"><h3>รายการรหัส (กรอง)</h3>' +
        '<div class="field-row">' +
          '<div class="field" style="margin-bottom:0"><label>สินค้า</label><select id="flProduct"><option value="">ทั้งหมด</option></select></div>' +
          '<div class="field" style="margin-bottom:0"><label>สถานะ</label><select id="flStatus"><option value="">ทั้งหมด</option><option value="unused">unused</option><option value="used">used</option></select></div>' +
        "</div><button class=\"btn btn-block\" style=\"margin-top:12px\" id=\"btnList\">แสดงรายการ</button>" +
        '<div id="lcResult" style="margin-top:14px"></div>' +
      "</div>"
    );
    ensureProducts().then(function (items) {
      var sel = $("flProduct");
      items.forEach(function (p) { var o = el("option"); o.value = p.product; o.textContent = p.product; sel.appendChild(o); });
    }).catch(function () {});
    $("btnFind").onclick = findCode;
    $("scCode").addEventListener("keydown", function (e) { if (e.key === "Enter") findCode(); });
    $("btnList").onclick = listCodes;
  }
  function findCode() {
    var code = ($("scCode").value || "").trim().toUpperCase();
    if (!code) { toast("กรอกรหัสก่อน", "err"); return; }
    var btn = $("btnFind"); setLoading(btn, true);
    $("scResult").innerHTML = "";
    api("getCodeInfo", { code: code })
      .then(function (d) { setLoading(btn, false); drawCodeInfo(d.item || d); })
      .catch(function (err) { setLoading(btn, false); $("scResult").innerHTML = '<div class="warn-box" style="margin-top:12px">' + esc(errText(err)) + "</div>"; });
  }
  function drawCodeInfo(item) {
    if (!item) { $("scResult").innerHTML = ""; return; }
    var used = String(item.status) === "used";
    var html = '<div class="card-block" style="margin-top:14px;box-shadow:none;border-color:' + (used ? "var(--ink)" : "var(--green)") + '">' +
      '<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:8px">' +
      '<span class="detail-code">' + esc(item.code) + "</span>" +
      (used ? '<span class="chip mute">used</span>' : '<span class="chip ok">unused</span>') +
      '<span class="chip book">' + esc(item.product) + "</span></div>";
    if (used && item.user) {
      html += '<div style="font-size:14px">👤 ' + esc(item.user.nickname || item.user.name || "-") +
        (item.user.school ? " · " + esc(item.user.school) : "") + "<br>✉️ " + esc(item.email || "-") +
        "<br>สถานะลงทะเบียน: <b>" + esc(item.user.registration_status || "-") + "</b> · ส่งลิงก์: " + esc(item.user.link_sent || "-") +
        '<br><a onclick="__go2(' + Number(item.user.row) + ')">เปิดรายการนี้ ▸</a></div>';
    } else if (used) {
      html += '<div style="font-size:14px;color:var(--muted)">ใช้แล้วโดย ' + esc(item.used_by_discord || "-") + " · " + esc(item.email || "") + "</div>";
    } else {
      html += '<div style="font-size:14px;color:var(--muted)">รหัสนี้ยังไม่ถูกใช้</div>';
    }
    html += "</div>";
    $("scResult").innerHTML = html;
  }
  window.__go2 = function (row) { navigate("detail", { row: row }); };
  function listCodes() {
    var product = $("flProduct").value;
    var status = $("flStatus").value;
    var btn = $("btnList"); setLoading(btn, true);
    var payload = {};
    if (product) payload.product = product;
    if (status) payload.status = status;
    api("listCodes", payload)
      .then(function (d) { setLoading(btn, false); drawCodeList(d, product); })
      .catch(function (err) { setLoading(btn, false); $("lcResult").innerHTML = errorState(errText(err)); });
  }
  function drawCodeList(d, product) {
    var items = listOf(d);
    var unused = items.filter(function (i) { return String(i.status) === "unused"; }).length;
    var used = items.length - unused;
    var summary = '<div class="summary-bar"><span class="summary-pill">' + (product || "ทั้งหมด") + ": เหลือ <b>" + unused + "</b> / ใช้ไป <b>" + used + "</b></span>" +
      (items.length ? '<button class="btn btn-ghost btn-sm" id="btnExport">⬇️ Export CSV</button>' : "") + "</div>";
    if (!items.length) { $("lcResult").innerHTML = summary + emptyState("🔍", "ไม่พบรหัสตามเงื่อนไข", ""); return; }
    var rows = items.map(function (i) {
      return "<tr><td class=\"code\">" + esc(i.code) + "</td><td>" + esc(i.product) + "</td><td>" +
        (String(i.status) === "used" ? '<span class="chip mute">used</span>' : '<span class="chip ok">unused</span>') + "</td>" +
        '<td class="muted">' + esc(i.used_at ? fmtDateTime(i.used_at) : "-") + "</td></tr>";
    }).join("");
    $("lcResult").innerHTML = summary +
      '<div class="table-wrap"><table class="tbl"><thead><tr><th>รหัส</th><th>เล่ม</th><th>สถานะ</th><th>ใช้เมื่อ</th></tr></thead><tbody>' + rows + "</tbody></table></div>";
    var ex = $("btnExport");
    if (ex) ex.onclick = function () {
      var lines = ['"code","product","status","used_at"'].concat(items.map(function (i) {
        return '"' + i.code + '","' + i.product + '","' + i.status + '","' + (i.used_at || "") + '"';
      }));
      var blob = new Blob(["\uFEFF" + lines.join("\r\n")], { type: "text/csv;charset=utf-8;" });
      var a = el("a"); a.href = URL.createObjectURL(blob); a.download = "codes_export.csv";
      document.body.appendChild(a); a.click(); a.remove();
    };
  }

  // ======================================================================
  //  หน้า 6 — สลิป (เฟส C)
  // ======================================================================
  function renderSlips() {
    setView('<div class="page-head"><h2>💳 สลิปรอตรวจ</h2></div><p class="page-sub">นักเรียนที่โอนค่าถามเพิ่ม รอครูตรวจสลิปแล้วอนุมัติ</p><div id="slipBody">' + loadingState("กำลังโหลดสลิป...") + "</div>");
    api("listSlips", {})
      .then(function (d) {
        var items = listOf(d);
        setBadge("slips", items.length);
        if (!items.length) { $("slipBody").innerHTML = emptyState("💳", "ไม่มีสลิปรอตรวจ", "เมื่อมีนักเรียนโอนค่าถามเพิ่ม รายการจะขึ้นที่นี่"); return; }
        var grid = el("div", "slips");
        items.forEach(function (it) { grid.appendChild(slipCard(it)); });
        var b = $("slipBody"); b.innerHTML = ""; b.appendChild(grid);
      })
      .catch(function (err) { $("slipBody").innerHTML = errorState(errText(err)); });
  }
  function slipCard(it) {
    var card = el("div", "slip-card"); card.dataset.row = it.row;
    var img = it.slip_url
      ? '<img src="' + attr(it.slip_url) + '" alt="สลิป" loading="lazy" onerror="this.parentNode.innerHTML=\'<div class=&quot;noimg&quot;>เปิดรูปไม่ได้</div>\'" /><a class="zoom" href="' + attr(it.slip_url) + '" target="_blank" rel="noopener">🔍 ดูเต็ม</a>'
      : '<div class="noimg">ไม่มีรูปสลิป</div>';
    card.innerHTML =
      '<div class="slip-img">' + img + "</div>" +
      '<div class="slip-body"><div class="slip-amount">฿' + fmtBaht(it.amount) + ' <small>บาท</small></div>' +
      '<div class="slip-meta">👤 ' + esc(it.discord_id || "-") + "<br>🕑 " + esc(fmtDateTime(it.timestamp)) + "</div>" +
      '<div class="slip-actions"><button class="btn btn-approve" data-ok>✅ อนุมัติ</button></div></div>';
    card.querySelector("[data-ok]").onclick = function () { onApproveSlip(it, card); };
    return card;
  }
  function onApproveSlip(it, card) {
    openModal({
      title: "ยืนยันอนุมัติสลิป",
      bodyHtml: "<p>อนุมัติสลิปยอด <b>฿" + fmtBaht(it.amount) + "</b> ของ " + esc(it.discord_id) + "? ระบบจะเปิดสิทธิ์ถามเพิ่มถึงสิ้นเดือนให้ทันที</p>",
      okLabel: "✅ อนุมัติ", okClass: "btn-approve",
    }).then(function (ok) {
      if (!ok) return;
      card.classList.add("busy");
      api("approveSlip", { row: Number(it.row) })
        .then(function () { toast("เปิดสิทธิ์ถามเพิ่มถึงสิ้นเดือนแล้ว", "ok"); renderSlips(); refreshBadges(); })
        .catch(function (err) { card.classList.remove("busy"); toast(errText(err), "err"); });
    });
  }

  // ====== utils ======
  function ensureProducts() {
    if (state.cache.products) return Promise.resolve(state.cache.products);
    return api("listProducts", {}).then(function (d) { var items = listOf(d); state.cache.products = items; return items; });
  }
  function copyText(txt, btn) {
    if (!txt) return;
    navigator.clipboard.writeText(txt).then(function () {
      toast("คัดลอกแล้ว", "ok");
      if (btn) { var o = btn.innerHTML; btn.innerHTML = "✓ คัดลอกแล้ว"; setTimeout(function () { btn.innerHTML = o; }, 1400); }
    }).catch(function () { toast("คัดลอกไม่สำเร็จ", "err"); });
  }

  // ====== DEMO ======
  function demoApi(action, payload) {
    return new Promise(function (resolve, reject) {
      setTimeout(function () {
        try { resolve(demoHandle(action, payload)); }
        catch (e) { reject({ reason: "server_error", message: String(e) }); }
      }, 240);
    });
  }
  var demoProducts = [
    { row: 2, product: "MATH1", product_name: "เฉลยคณิต ม.4 เล่ม 1", youtube_link: "https://youtu.be/AbCdEf" },
    { row: 3, product: "MATH2", product_name: "เฉลยคณิต ม.4 เล่ม 2", youtube_link: "" },
    { row: 4, product: "PHYS2", product_name: "เฉลยฟิสิกส์ ม.5 เล่ม 2", youtube_link: "https://youtu.be/XyZ123" },
  ];
  var demoPending = [
    { row: 7, timestamp: Date.now() - 5 * 60e3, discord_id: "112233445566778899", name: "สมหญิง ใจดี", nickname: "มุก", age: "16", school: "สาธิตปทุมวัน", email: "mook@gmail.com", code: "MATH1-X7K2-9PQR", product: "MATH1", product_name: "เฉลยคณิต ม.4 เล่ม 1", youtube_link: "https://youtu.be/AbCdEf", status: "pending", link_sent: "no" },
    { row: 8, timestamp: Date.now() - 42 * 60e3, discord_id: "998877665544332211", name: "ภูมิ รักเรียน", nickname: "ภูมิ", age: "15", school: "เซนต์คาเบรียล", email: "poom.study@gmail.com", code: "MATH2-A3BC-7XYZ", product: "MATH2", product_name: "เฉลยคณิต ม.4 เล่ม 2", youtube_link: "", status: "pending", link_sent: "no" },
    { row: 9, timestamp: Date.now() - 2 * 3600e3, discord_id: "555566667777888899", name: "กานต์ ตั้งใจ", nickname: "เบล", age: "16", school: "เตรียมอุดมฯ", email: "bell.k29@gmail.com", code: "PHYS2-Q1W8-2ABC", product: "PHYS2", product_name: "เฉลยฟิสิกส์ ม.5 เล่ม 2", youtube_link: "https://youtu.be/XyZ123", status: "pending", link_sent: "no" },
  ];
  var demoSlips = [
    { row: 3, timestamp: Date.now() - 90 * 60e3, discord_id: "112233445566778899", amount: 99, slip_url: "https://placehold.co/600x450/eef2fb/24468f?text=Slip+99" },
    { row: 4, timestamp: Date.now() - 150 * 60e3, discord_id: "998877665544332211", amount: 199, slip_url: "https://placehold.co/600x450/eaf6ef/1f8a5b?text=Slip+199" },
  ];
  function randCode(p) {
    var s = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    function blk() { return Array.from({ length: 4 }, function () { return s[Math.floor(Math.random() * s.length)]; }).join(""); }
    return p + "-" + blk() + "-" + blk();
  }
  function demoHandle(action, p) {
    switch (action) {
      case "listProducts": return { ok: true, items: demoProducts };
      case "listPending": return { ok: true, items: demoPending };
      case "getRegistration": {
        var it = demoPending.filter(function (x) { return String(x.row) === String(p.row); })[0];
        return it ? { ok: true, item: it } : { ok: false, reason: "notfound" };
      }
      case "approve": {
        demoPending.forEach(function (x) { if (String(x.row) === String(p.row)) { x.status = "approved"; x.link_sent = "no"; } });
        return { ok: true, status: "approved", approved_at: new Date().toISOString() };
      }
      case "reject": {
        demoPending.forEach(function (x) { if (String(x.row) === String(p.row)) x.status = "rejected"; });
        return { ok: true };
      }
      case "addProduct": {
        if (demoProducts.some(function (x) { return x.product === p.product; })) return { ok: false, reason: "duplicate" };
        demoProducts.push({ row: demoProducts.length + 2, product: p.product, product_name: p.product_name || "", youtube_link: p.youtube_link || "" });
        return { ok: true, product: p.product };
      }
      case "updateProduct": {
        demoProducts.forEach(function (x) { if (String(x.row) === String(p.row)) { if (p.product_name != null) x.product_name = p.product_name; if (p.youtube_link != null) x.youtube_link = p.youtube_link; } });
        return { ok: true };
      }
      case "generateCodes": {
        if (!demoProducts.some(function (x) { return x.product === p.product; })) return { ok: false, reason: "product_notfound" };
        var codes = Array.from({ length: p.amount }, function () { return randCode(p.product); });
        return { ok: true, product: p.product, amount: p.amount, codes: codes };
      }
      case "listCodes": {
        var all = [];
        demoProducts.forEach(function (pr) {
          for (var i = 0; i < 12; i++) all.push({ code: randCode(pr.product), product: pr.product, status: i < 4 ? "used" : "unused", used_by_discord: i < 4 ? "1122..." : "", used_at: i < 4 ? new Date(Date.now() - i * 86400e3).toISOString() : "" });
        });
        if (p.product) all = all.filter(function (x) { return x.product === p.product; });
        if (p.status) all = all.filter(function (x) { return x.status === p.status; });
        return { ok: true, count: all.length, items: all };
      }
      case "getCodeInfo": {
        if (/9PQR$/.test(p.code)) return { ok: true, item: { code: p.code, product: "MATH1", status: "used", used_by_discord: "112233445566778899", email: "mook@gmail.com", used_at: new Date().toISOString(), user: { row: 7, name: "สมหญิง ใจดี", nickname: "มุก", school: "สาธิตปทุมวัน", registration_status: "approved", link_sent: "yes" } } };
        return { ok: true, item: { code: p.code, product: (p.code.split("-")[0] || "MATH1"), status: "unused", used_by_discord: "", email: "", used_at: "", user: null } };
      }
      case "listSlips": return { ok: true, items: demoSlips };
      case "approveSlip": { demoSlips = demoSlips.filter(function (x) { return String(x.row) !== String(p.row); }); return { ok: true }; }
      default: return { ok: true };
    }
  }

  // ====== init ======
  function init() {
    $("loginForm").addEventListener("submit", doLogin);
    $("demoBtn").addEventListener("click", doDemo);
    $("logoutBtn").addEventListener("click", doLogout);
    var ld = $("logoutBtnDesk"); if (ld) ld.addEventListener("click", doLogout);
    $("refreshBtn").addEventListener("click", function () {
      $("refreshBtn").classList.add("spin-once");
      setTimeout(function () { $("refreshBtn").classList.remove("spin-once"); }, 600);
      route(); refreshBadges();
    });
    document.querySelectorAll(".nav-item").forEach(function (n) {
      n.addEventListener("click", function () { navigate(n.getAttribute("data-nav")); });
    });
    window.addEventListener("popstate", route);

    // กู้ session
    if (sessionStorage.getItem(SS.demo) === "1") { state.demo = true; enterApp(); return; }
    if (secret() && apiUrl()) { enterApp(); return; }
    showLogin();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
