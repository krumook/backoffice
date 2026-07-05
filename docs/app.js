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
    API_URL: "https://script.google.com/macros/s/AKfycbwFn7kxKgA-BeZiZQBt8YRWyzxeKNf7j8Q62GQ9RcyKTFgroodPIc-qc60OPJpM6m9b/exec",
  };

  var SS = { secret: "krumook_secret", url: "krumook_url" };

  // ====== state ======
  var state = {
    page: "pending",
    row: null,
    detailReturn: null,
    cache: { products: null },
    counts: { pending: 0, slips: 0 },
    codesCache: {},   // product → { items, filter, page, loading }
    genFlash: null,   // ผลลัพธ์ล่าสุดหลังสร้างรหัส
    codesTab: "browse",
    studentsView: "cards",
    studentsExpanded: {},
    studentsCache: null,
  };

  var CODE_PAGE_SIZE = 50;

  // ====== reason → ข้อความไทย ======
  var REASON = {
    unauthorized: "Invalid secret",
    unknown_action: "Unknown action (unknown_action)",
    notfound: "Not found in the system",
    used: "This code has already been used",
    no_profile: "Not registered yet — register first",
    duplicate: "This product code already exists",
    product_notfound: "Product not found — create it on Products first",
    bad_request: "Incomplete data — please check again",
    server_error: "Server error — try again",
  };
  function reasonText(r) { return REASON[r] || ("Error: " + (r || "unknown")); }

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
  // Phosphor icon helper — ic("house") → <i class="ph ph-house"></i>
  function ic(name, extra) { return '<i class="ph ph-' + name + (extra ? " " + extra : "") + '"></i>'; }

  // ====== เวลา ======
  function timeAgo(ts) {
    if (!ts) return "—";
    var t = new Date(ts).getTime();
    if (isNaN(t)) return String(ts);
    var s = Math.floor((Date.now() - t) / 1000);
    if (s < 45) return "Just now";
    var m = Math.floor(s / 60);
    if (m < 60) return m + (m === 1 ? " minute ago" : " minutes ago");
    var h = Math.floor(m / 60);
    if (h < 24) return h + (h === 1 ? " hour ago" : " hours ago");
    var d = Math.floor(h / 24);
    if (d < 7) return d + (d === 1 ? " day ago" : " days ago");
    var w = Math.floor(d / 7);
    if (w < 5) return w + (w === 1 ? " week ago" : " weeks ago");
    return fmtDateTime(ts);
  }
  function timeDisplayHtml(ts, label) {
    if (!ts) return "";
    return '<div class="time-display">' +
      '<span class="time-display-label">' + esc(label || "Submitted") + "</span>" +
      '<span class="time-ago">' + esc(timeAgo(ts)) + "</span>" +
      '<span class="time-exact">' + esc(fmtDateTime(ts)) + "</span></div>";
  }
  function kvRow(key, valHtml) {
    return '<div class="kv-item"><div class="kv-key">' + esc(key) + '</div><div class="kv-val">' + valHtml + "</div></div>";
  }
  function fmtDateTime(ts) {
    if (!ts) return "—";
    var d = new Date(ts);
    if (isNaN(d.getTime())) return String(ts);
    return d.toLocaleString("en-US", { day: "numeric", month: "short", year: "2-digit", hour: "2-digit", minute: "2-digit" });
  }
  function fmtBaht(n) {
    var v = Number(n);
    if (isNaN(v)) return String(n || "—");
    return v.toLocaleString("th-TH", { maximumFractionDigits: 2 });
  }
  function regStatusChip(status) {
    var s = String(status || "");
    if (s === "approved") return '<span class="chip ok">' + ic("check-circle") + " Approved</span>";
    if (s === "rejected") return '<span class="chip bad">' + ic("x-circle") + " Rejected</span>";
    if (s === "pending") return '<span class="chip warn">' + ic("clock") + " Pending</span>";
    return '<span class="chip mute">' + esc(s || "-") + "</span>";
  }
  function readDateRange(id, fromKey, toKey, payload) {
    var from = $(id + "-from");
    var to = $(id + "-to");
    if (from && from.value) payload[fromKey] = from.value;
    if (to && to.value) payload[toKey] = to.value;
    return payload;
  }

  // ====== date range picker (ช่วงวันที่เดียว + preset) ======
  var dateRangePickers = {};
  var DR_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  var DR_DOW = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  function pad2(n) { return n < 10 ? "0" + n : String(n); }
  function bangkokYmd(d) {
    return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok", year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
  }
  function bangkokToday() { return bangkokYmd(new Date()); }
  function bangkokDaysAgo(n) {
    var d = new Date();
    d.setDate(d.getDate() - n);
    return bangkokYmd(d);
  }
  function bangkokMonthAgo() {
    var d = new Date();
    d.setMonth(d.getMonth() - 1);
    return bangkokYmd(d);
  }
  function fmtDateShort(ymd) {
    if (!ymd) return "";
    var p = ymd.split("-");
    var d = new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]));
    return d.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "2-digit" });
  }
  function fmtDateRangeLabel(from, to) {
    if (!from && !to) return "Any date";
    if (from && to && from === to) return fmtDateShort(from);
    if (from && to) return fmtDateShort(from) + " – " + fmtDateShort(to);
    if (from) return fmtDateShort(from) + " – …";
    return "… – " + fmtDateShort(to);
  }
  function dateRangeFieldHtml(id, label) {
    return '<div class="field dr-field"><label>' + esc(label) + "</label>" +
      '<button type="button" class="dr-trigger" id="' + id + '-trigger">' +
        ic("calendar-blank") + ' <span class="dr-text" id="' + id + '-text">Any date</span>' +
        ic("caret-down", "dr-caret") +
      "</button>" +
      '<input type="hidden" id="' + id + '-from" value="" />' +
      '<input type="hidden" id="' + id + '-to" value="" /></div>';
  }
  function updateDateRangeDisplay(id) {
    var st = dateRangePickers[id];
    if (!st) return;
    var text = $(id + "-text");
    var trigger = $(id + "-trigger");
    if (text) text.textContent = fmtDateRangeLabel(st.from, st.to);
    if (trigger) trigger.classList.toggle("has-value", !!(st.from || st.to));
  }
  function applyDateRange(id, from, to, close) {
    var st = dateRangePickers[id];
    if (!st) return;
    st.from = from || "";
    st.to = to || "";
    var fromEl = $(id + "-from");
    var toEl = $(id + "-to");
    if (fromEl) fromEl.value = st.from;
    if (toEl) toEl.value = st.to;
    updateDateRangeDisplay(id);
    if (close) closeDateRangePopover();
  }
  function closeDateRangePopover() {
    var pop = $("drPopover");
    if (pop) pop.remove();
    document.removeEventListener("click", onDrOutsideClick);
    document.removeEventListener("keydown", onDrEsc);
  }
  function onDrOutsideClick(e) {
    var pop = $("drPopover");
    if (!pop || pop.contains(e.target)) return;
    if (e.target.closest && e.target.closest(".dr-trigger")) return;
    closeDateRangePopover();
  }
  function onDrEsc(e) { if (e.key === "Escape") closeDateRangePopover(); }
  function positionDrPopover(pop, anchor) {
    var r = anchor.getBoundingClientRect();
    var top = r.bottom + 6;
    var left = r.left;
    var w = Math.max(r.width, 280);
    if (left + w > window.innerWidth - 12) left = window.innerWidth - w - 12;
    if (left < 12) left = 12;
    if (top + 360 > window.innerHeight - 12) top = Math.max(12, r.top - 360 - 6);
    pop.style.top = top + "px";
    pop.style.left = left + "px";
    pop.style.width = w + "px";
  }
  function updateDrHint(id) {
    var hint = document.querySelector("#drPopover .dr-hint");
    if (!hint) return;
    var st = dateRangePickers[id];
    if (!st.tempFrom) hint.textContent = "Click start date, then end date";
    else if (!st.tempTo) hint.textContent = "Pick end date (from " + fmtDateShort(st.tempFrom) + ")";
    else hint.textContent = fmtDateShort(st.tempFrom) + " – " + fmtDateShort(st.tempTo);
  }
  function renderDrCalendar(id) {
    var wrap = $(id + "-cal");
    if (!wrap) return;
    var st = dateRangePickers[id];
    var vy = st.viewY;
    var vm = st.viewM;
    var first = new Date(vy, vm, 1);
    var startDow = first.getDay();
    var daysInMonth = new Date(vy, vm + 1, 0).getDate();
    var today = bangkokToday();
    var html = '<div class="dr-cal-head">' +
      '<button type="button" class="dr-nav" data-nav="-1">' + ic("caret-left") + "</button>" +
      "<span>" + DR_MONTHS[vm] + " " + vy + "</span>" +
      '<button type="button" class="dr-nav" data-nav="1">' + ic("caret-right") + "</button></div>" +
      '<div class="dr-dow">' + DR_DOW.map(function (d) { return "<span>" + d + "</span>"; }).join("") + "</div>" +
      '<div class="dr-days">';
    var i;
    for (i = 0; i < startDow; i++) html += '<span class="dr-day empty"></span>';
    for (var day = 1; day <= daysInMonth; day++) {
      var ymd = vy + "-" + pad2(vm + 1) + "-" + pad2(day);
      var cls = "dr-day";
      if (ymd === today) cls += " today";
      if (st.tempFrom && ymd === st.tempFrom) cls += " sel-start";
      if (st.tempTo && ymd === st.tempTo) cls += " sel-end";
      if (st.tempFrom && st.tempTo && ymd > st.tempFrom && ymd < st.tempTo) cls += " in-range";
      html += '<button type="button" class="' + cls + '" data-ymd="' + ymd + '">' + day + "</button>";
    }
    html += "</div>";
    wrap.innerHTML = html;
    wrap.querySelectorAll(".dr-nav").forEach(function (btn) {
      btn.onclick = function (e) {
        e.stopPropagation();
        var n = Number(btn.getAttribute("data-nav"));
        st.viewM += n;
        if (st.viewM < 0) { st.viewM = 11; st.viewY--; }
        if (st.viewM > 11) { st.viewM = 0; st.viewY++; }
        renderDrCalendar(id);
      };
    });
    wrap.querySelectorAll(".dr-day[data-ymd]").forEach(function (btn) {
      btn.onclick = function (e) {
        e.stopPropagation();
        var ymd = btn.getAttribute("data-ymd");
        if (!st.tempFrom || (st.tempFrom && st.tempTo)) {
          st.tempFrom = ymd;
          st.tempTo = "";
        } else if (ymd < st.tempFrom) {
          st.tempTo = st.tempFrom;
          st.tempFrom = ymd;
        } else {
          st.tempTo = ymd;
        }
        updateDrHint(id);
        renderDrCalendar(id);
      };
    });
  }
  function openDateRangePopover(id, anchor) {
    closeDateRangePopover();
    var st = dateRangePickers[id];
    st.tempFrom = st.from || "";
    st.tempTo = st.to || "";
    if (st.tempFrom) {
      var p = st.tempFrom.split("-");
      st.viewY = Number(p[0]);
      st.viewM = Number(p[1]) - 1;
    } else {
      var now = new Date();
      st.viewY = now.getFullYear();
      st.viewM = now.getMonth();
    }
    var pop = el("div", "dr-popover");
    pop.id = "drPopover";
    pop.innerHTML =
      '<div class="dr-presets">' +
        '<button type="button" data-preset="today">Today</button>' +
        '<button type="button" data-preset="week">Last 7 days</button>' +
        '<button type="button" data-preset="month">Last month</button>' +
      "</div>" +
      '<div class="dr-hint">Click start date, then end date</div>' +
      '<div class="dr-cal" id="' + id + '-cal"></div>' +
      '<div class="dr-actions">' +
        '<button type="button" class="btn btn-ghost btn-sm" data-act="clear">Any date</button>' +
        '<button type="button" class="btn btn-primary btn-sm" data-act="apply">Apply</button>' +
      "</div>";
    document.body.appendChild(pop);
    positionDrPopover(pop, anchor);
    updateDrHint(id);
    renderDrCalendar(id);
    pop.querySelectorAll("[data-preset]").forEach(function (btn) {
      btn.onclick = function (e) {
        e.stopPropagation();
        var today = bangkokToday();
        var from = today;
        var to = today;
        if (btn.getAttribute("data-preset") === "week") from = bangkokDaysAgo(6);
        if (btn.getAttribute("data-preset") === "month") from = bangkokMonthAgo();
        applyDateRange(id, from, to, true);
      };
    });
    pop.querySelector('[data-act="clear"]').onclick = function (e) {
      e.stopPropagation();
      applyDateRange(id, "", "", true);
    };
    pop.querySelector('[data-act="apply"]').onclick = function (e) {
      e.stopPropagation();
      if (st.tempFrom && !st.tempTo) applyDateRange(id, st.tempFrom, st.tempFrom, true);
      else if (st.tempFrom && st.tempTo) applyDateRange(id, st.tempFrom, st.tempTo, true);
      else closeDateRangePopover();
    };
    pop.onclick = function (e) { e.stopPropagation(); };
    setTimeout(function () {
      document.addEventListener("click", onDrOutsideClick);
      document.addEventListener("keydown", onDrEsc);
    }, 0);
  }
  function initDateRangePicker(id) {
    var trigger = $(id + "-trigger");
    if (!trigger) return;
    var now = new Date();
    dateRangePickers[id] = { from: "", to: "", viewY: now.getFullYear(), viewM: now.getMonth() };
    var fromEl = $(id + "-from");
    var toEl = $(id + "-to");
    if (fromEl && fromEl.value) dateRangePickers[id].from = fromEl.value;
    if (toEl && toEl.value) dateRangePickers[id].to = toEl.value;
    updateDateRangeDisplay(id);
    trigger.onclick = function (e) {
      e.stopPropagation();
      openDateRangePopover(id, trigger);
    };
  }
  function countNote(d, items) {
    var total = d.count != null ? d.count : items.length;
    if (total > items.length) return " · showing " + items.length + " of " + total;
    return total ? " · " + total + " items" : "";
  }

  // ====== toast ======
  function toast(msg, kind) {
    var wrap = $("toastWrap");
    var t = el("div", "toast" + (kind ? " " + kind : ""));
    var icon = kind === "ok" ? ic("check-circle") : kind === "err" ? ic("warning-circle") : ic("info");
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
        '<button type="button" class="btn btn-ghost" data-act="cancel">' + (opts.cancelLabel || "Cancel") + "</button>" +
        '<button type="button" class="btn ' + (opts.okClass || "btn-primary") + '" data-act="ok">' + (opts.okLabel || "OK") + "</button>" +
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

  function openLoadingModal(msg) {
    closeLoadingModal();
    var overlay = el("div", "modal-overlay modal-loading");
    overlay.id = "loadingModal";
    overlay.innerHTML = '<div class="modal modal-loading-box"><div class="spinner"></div><p>' + esc(msg || "Working...") + "</p></div>";
    $("modalRoot").appendChild(overlay);
  }
  function closeLoadingModal() {
    var m = $("loadingModal");
    if (m) m.remove();
  }

  // ====== API helper กลาง ======
  function apiUrl() { return CONFIG.API_URL || sessionStorage.getItem(SS.url) || ""; }
  function secret() { return sessionStorage.getItem(SS.secret) || ""; }

  function api(action, payload) {
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
        catch (e) { throw { reason: "server_error", message: "Response is not JSON — check Web App deploy (Anyone)" }; }
        if (data && data.ok === false) {
          if (data.reason === "unauthorized") { forceLogout(); }
          throw { reason: data.reason, message: data.message };
        }
        return data;
      })
      .catch(function (err) {
        if (err && err.reason) throw err;
        throw { reason: "server_error", message: (err && err.message) || "Connection failed" };
      });
  }
  function errText(err) {
    if (!err) return "Something went wrong";
    if (err.reason) return reasonText(err.reason) + (err.message ? " (" + err.message + ")" : "");
    return err.message || String(err);
  }

  // ====== auth / session ======
  function isLoggedIn() { return !!secret() && !!apiUrl(); }

  function showLogin() {
    $("loginScreen").classList.remove("hidden");
    $("appShell").classList.add("hidden");
    $("apiUrlField").classList.toggle("hidden", !!CONFIG.API_URL);
  }
  function showApp() {
    $("loginScreen").classList.add("hidden");
    $("appShell").classList.remove("hidden");
  }
  function forceLogout() {
    sessionStorage.removeItem(SS.secret);
    if (!isLoggedIn()) return;
    toast("Session expired — please sign in again", "err");
    doLogout();
  }
  function doLogout() {
    sessionStorage.removeItem(SS.secret);
    var f = $("apiSecret"); if (f) f.value = "";
    showLogin();
  }

  function loginError(msg) { var b = $("loginError"); b.textContent = msg; b.classList.remove("hidden"); }

  function doLogin(e) {
    e.preventDefault();
    $("loginError").classList.add("hidden");
    var url = CONFIG.API_URL || ($("apiUrl").value || "").trim();
    var sec = ($("apiSecret").value || "").trim();
    if (!url) return loginError("Please enter the API URL");
    if (!sec) return loginError("Please enter the teacher secret");
    if (!/^https:\/\/script\.google\.com\//.test(url)) return loginError("API URL should start with https://script.google.com/");

    var btn = $("loginBtn");
    setLoading(btn, true);
    sessionStorage.setItem(SS.url, url);
    sessionStorage.setItem(SS.secret, sec);

    // ตรวจรหัสด้วย listProducts (ผ่าน = รหัสถูกต้อง)
    api("listProducts", {})
      .then(function () { enterApp(); })
      .catch(function (err) {
        sessionStorage.removeItem(SS.secret);
        loginError("Sign in failed: " + errText(err));
      })
      .finally(function () { setLoading(btn, false); });
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
    return { page: q.get("page") || "pending", row: q.get("row"), discord_id: q.get("discord_id") };
  }
  function navigate(page, params, replace) {
    var q = new URLSearchParams();
    if (page && page !== "pending") q.set("page", page);
    if (params) {
      if (params.row != null) q.set("row", params.row);
      if (params.discord_id) q.set("discord_id", params.discord_id);
    }
    var url = location.pathname + (q.toString() ? "?" + q.toString() : "");
    if (replace) history.replaceState({}, "", url); else history.pushState({}, "", url);
    route();
  }
  function route() {
    if (!isLoggedIn()) { showLogin(); return; }
    showApp();
    var loc = parseLoc();
    // ลิงก์จาก Discord: ?row=N → หน้ารายละเอียด registration
    if (loc.row) {
      state.page = "detail";
      state.row = loc.row;
      renderDetail(loc.row);
      highlightNav(state.detailReturn && state.detailReturn.page === "students" ? "students" : "pending");
      return;
    }
    if (loc.discord_id && (loc.page === "students" || loc.page === "search")) {
      state.studentsExpanded[loc.discord_id] = true;
      state.page = "students";
      renderStudents();
      highlightNav("students");
      return;
    }
    state.page = loc.page; state.row = null;
    highlightNav(loc.page);
    switch (loc.page) {
      case "products": renderProducts(); break;
      case "codes":
      case "generate": renderCodes(); break;
      case "students":
      case "search": renderStudents(); break;
      case "slips": renderSlips(); break;
      default: renderPending();
    }
  }
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
  function loadingState(msg) { return '<div class="state"><div class="spinner"></div><p>' + esc(msg || "Loading...") + "</p></div>"; }
  function emptyState(icon, title, msg, actionHtml) {
    return '<div class="state">' + ic(icon, "emoji") + "<h3>" + esc(title) + "</h3><p>" + esc(msg || "") + "</p>" + (actionHtml || "") + "</div>";
  }
  function errorState(msg, retryPage) {
    return '<div class="state error">' + ic("warning-circle", "emoji") + "<h3>Failed to load</h3><p>" + esc(msg) + "</p>" +
      '<button class="btn btn-ghost" onclick="__retry()">Retry</button></div>';
  }
  window.__retry = function () { route(); };

  function listOf(d) { return (d && Array.isArray(d.items)) ? d.items : (Array.isArray(d) ? d : []); }

  // ======================================================================
  //  หน้า 1 — คิวรออนุมัติ
  // ======================================================================
  var autoTimer = null;
  function renderPending() {
    setMainWide(false);
    setView(
      '<div class="page-head"><h2>' + ic("list-checks") + ' Approval queue <span class="count-inline" id="pendCount"></span></h2>' +
      '<div class="spacer"></div></div>' +
      '<div id="pendBody">' + loadingState("Loading queue...") + "</div>"
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
        if (!items.length) { $("pendBody").innerHTML = emptyState("confetti", "All clear", "No pending items"); return; }
        var wrap = el("div", "queue");
        items.forEach(function (it) { wrap.appendChild(pendingCard(it)); });
        var body = $("pendBody"); body.innerHTML = ""; body.appendChild(wrap);
      })
      .catch(function (err) { var b = $("pendBody"); if (b) b.innerHTML = errorState(errText(err)); });
  }
  function pendingCard(it) {
    var a = el("a", "q-card");
    a.href = "?row=" + encodeURIComponent(it.row);
    a.onclick = function (e) { e.preventDefault(); state.detailReturn = null; navigate("pending", { row: it.row }); };
    var av = it.discord_avatar
      ? '<img class="q-avatar" src="' + attr(it.discord_avatar) + '" alt="" />'
      : '<span class="q-avatar q-avatar-ph">' + ic("user") + "</span>";
    a.innerHTML =
      '<div class="q-top">' + av +
      '<span class="q-name">' + esc(it.nickname || it.name || "-") +
      (it.discord_username ? ' <span class="q-discord">@' + esc(it.discord_username) + "</span>" : "") + "</span>" +
      (it.school ? '<span class="q-school">· ' + esc(it.school) + "</span>" : "") + "</div>" +
      '<div class="q-line"><span class="chip book">' + ic("book-bookmark") + " " + esc(it.product || "-") + '</span><span class="q-email">' + esc(it.email || "-") + "</span></div>" +
      '<div class="q-foot"><span class="q-time">' + ic("clock") + " " + esc(timeAgo(it.timestamp)) + '</span><span class="q-go">Review ' + ic("caret-right") + "</span></div>";
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
    setMainWide(true);
    stopAutoRefresh();
    var backLabel = state.detailReturn && state.detailReturn.page === "students" ? "◀ Back to student" : "◀ Back to queue";
    setView('<a class="back-link" onclick="__back()">' + backLabel + '</a><div class="detail-wrap detail-page-wrap" id="detailBody">' + loadingState("Loading...") + "</div>");
    api("getRegistration", { row: Number(row) })
      .then(function (d) { drawDetail(d.item || d); })
      .catch(function (err) { $("detailBody").innerHTML = errorState(errText(err)); });
  }
  window.__back = function () {
    if (state.detailReturn) {
      var r = state.detailReturn;
      state.detailReturn = null;
      navigate(r.page, r.discord_id ? { discord_id: r.discord_id } : null);
    } else {
      navigate("pending");
    }
  };
  window.__backStudent = function () { state.detailReturn = null; navigate("students"); };

  function studentAvatarHtml(s, cls) {
    cls = cls || "student-avatar";
    if (s && s.discord_avatar) {
      return '<img class="' + cls + '" src="' + attr(s.discord_avatar) + '" alt="" loading="lazy" />';
    }
    return '<span class="' + cls + ' ' + cls + '-ph">' + ic("user") + "</span>";
  }

  function drawDetail(it) {
    if (!it) { $("detailBody").innerHTML = errorState("Item not found"); return; }
    var isPending = String(it.status) === "pending";
    var statusMap = {
      pending: '<span class="st-dot" style="color:var(--amber)">' + ic("hourglass-medium") + "</span> Pending approval",
      approved: '<span class="st-dot" style="color:var(--green)">' + ic("check-circle") + "</span> Approved" + (String(it.link_sent) === "yes" ? " · Link sent" : " · Waiting for bot"),
      rejected: '<span class="st-dot" style="color:var(--redpen)">' + ic("x-circle") + "</span> Rejected",
    };
    var hasLink = it.youtube_link && String(it.youtube_link).trim();

    var actions;
    if (isPending) {
      actions =
        '<div class="steps-hint"><b>Before you approve</b>' +
        "<ol><li>Copy the email and invite them in YouTube</li><li>Come back and tap Approve</li></ol></div>" +
        '<div class="detail-actions">' +
          '<button class="btn btn-approve btn-lg" id="btnApprove">' + ic("check-circle") + ' Approve</button>' +
          '<button class="btn btn-reject btn-sm" id="btnReject">' + ic("x-circle") + ' Reject</button>' +
        "</div>";
    } else {
      actions = '<div class="done-note">Already handled (status: ' + esc(it.status) + ") — cannot approve again</div>";
    }

    $("detailBody").innerHTML =
      '<div class="detail-card">' +
        '<div class="detail-status">' + (statusMap[it.status] || esc(it.status)) + "</div>" +
        '<div class="detail-sec detail-sec-profile">' +
          '<div class="detail-profile-hero">' +
            studentAvatarHtml(it, "detail-avatar lg") +
            '<div class="detail-profile-main">' +
              '<div class="detail-person">' + esc(it.nickname || it.name || "—") +
                (it.name && it.nickname ? ' <span class="detail-name-full">(' + esc(it.name) + ")</span>" : "") +
              "</div>" +
              (it.discord_username ? '<div class="detail-discord">@' + esc(it.discord_username) + "</div>" : "") +
            "</div>" +
            timeDisplayHtml(it.timestamp, "Submitted") +
          "</div>" +
          '<div class="detail-kv-grid">' +
            kvRow("Full name", esc(it.name || "—")) +
            kvRow("Nickname", esc(it.nickname || "—")) +
            kvRow("Age", esc(it.age ? it.age + " yrs" : "—")) +
            kvRow("School", esc(it.school || "—")) +
            kvRow("Email", '<span class="mono-val">' + esc(it.email || "—") + "</span>") +
            (it.approved_at
              ? kvRow("Approved", esc(timeAgo(it.approved_at)) + ' <span class="kv-sub">' + esc(fmtDateTime(it.approved_at)) +
                  (it.reviewed_by ? " · " + esc(it.reviewed_by) : "") + "</span>")
              : "") +
          "</div>" +
        "</div>" +
        '<div class="detail-sec">' +
          '<div class="detail-kicker">Book &amp; code</div>' +
          '<div class="detail-kv-grid detail-kv-grid-book">' +
            kvRow("Book", esc(it.product_name || it.product || "—") +
              (it.product_name && it.product ? ' <span class="kv-sub">(' + esc(it.product) + ")</span>" : "")) +
            kvRow("Code", '<span class="detail-code">' + esc(it.code || "—") + "</span>") +
          "</div>" +
        "</div>" +
        '<div class="detail-sec detail-sec-youtube">' +
          '<div class="detail-kicker">YouTube invite</div>' +
          '<div class="detail-kv-grid detail-kv-grid-yt">' +
            kvRow("Email to invite", '<div class="email-row email-row-inline"><span class="em">' + esc(it.email || "—") + '</span>' +
              '<button class="btn btn-primary btn-sm" id="btnCopy">' + ic("copy") + " Copy</button></div>") +
            kvRow("Video", hasLink
              ? '<a class="btn btn-ghost detail-yt-btn" href="' + attr(it.youtube_link) + '" target="_blank" rel="noopener">' + ic("play-circle") + " Open video on YouTube</a>"
              : '<div class="warn-box warn-box-inline">' + ic("warning") + ' No video link — <a onclick="__go(\'products\')">add in Products ' + ic("caret-right") + "</a></div>") +
          "</div>" +
        "</div>" +
        '<div class="detail-sec detail-sec-actions">' + actions + "</div>" +
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
      title: "Added to YouTube?",
      bodyHtml:
        "<p>Have you added this email to the video's private access list in YouTube Studio?</p>" +
        '<div class="email-row" style="margin-top:12px"><span class="em">' + esc(it.email || "-") + "</span></div>",
      okLabel: ic("check-circle") + " Yes, approve", okClass: "btn-approve",
      cancelLabel: "Not yet",
    }).then(function (ok) {
      if (!ok) return;
      var btn = $("btnApprove"); setLoading(btn, true);
      api("approve", { row: Number(it.row) })
        .then(function () {
          toast("Approved — bot will send the link within ~1 min", "ok");
          renderDetail(it.row);
          refreshBadges();
        })
        .catch(function (err) { setLoading(btn, false); toast(errText(err), "err"); });
    });
  }
  function onReject(it) {
    openModal({
      title: "Confirm rejection",
      bodyHtml: '<p>Reason (optional) — the code will be reset for re-registration</p>' +
        '<div class="field"><textarea data-field="reason" placeholder="e.g. wrong email / wrong book"></textarea></div>',
      okLabel: ic("x-circle") + " Reject", okClass: "btn-danger",
    }).then(function (vals) {
      if (!vals) return;
      var btn = $("btnReject"); setLoading(btn, true);
      api("reject", { row: Number(it.row), reason: vals.reason || "" })
        .then(function () {
          toast("Rejected — code reset for re-registration", "");
          renderDetail(it.row);
          refreshBadges();
        })
        .catch(function (err) { setLoading(btn, false); toast(errText(err), "err"); });
    });
  }

  // ====== layout helpers (split page) ======
  function setMainWide(on) {
    var m = $("view");
    if (m) m.classList.toggle("main-wide", !!on);
  }
  function splitPage(mainHtml, asideHtml) {
    return '<div class="page-split"><div class="split-main">' + mainHtml + '</div><div class="split-aside">' + asideHtml + "</div></div>";
  }
  function productFormHtml() {
    return '<div class="form-panel form-panel-accent"><h3>' + ic("plus-circle") + ' Add product</h3>' +
      '<div class="field"><label>Product code</label><input class="mono" id="npProduct" placeholder="MATH1" /></div>' +
      '<div class="field"><label>Book title</label><input id="npName" placeholder="Math answer key Vol.1" /></div>' +
      '<div class="field"><label>YouTube <span style="font-weight:400;color:var(--muted)">(optional)</span></label><input class="mono" id="npLink" placeholder="https://youtu.be/..." /></div>' +
      '<button class="btn btn-primary btn-block" id="btnAddProd">' + ic("floppy-disk") + ' Save</button></div>';
  }
  function genFormHtml(products, opts) {
    opts = opts || {};
    var pOpts = products.map(function (p) {
      return '<option value="' + attr(p.product) + '"' + (opts.selected === p.product ? " selected" : "") + ">" +
        esc(p.product) + (p.product_name ? " · " + esc(p.product_name) : "") + "</option>";
    }).join("");
    var flash = "";
    if (state.genFlash) {
      var g = state.genFlash;
      flash = '<div class="gen-flash">' + ic("check-circle") + " Created " + g.codes.length + " codes (" + esc(g.product) + ")" +
        '<div class="gf-actions">' +
          '<button class="btn btn-ghost btn-sm btn-block" id="btnCopyFlash">' + ic("copy") + ' Copy all</button>' +
        "</div></div>";
    }
    return '<div class="form-panel"><h3>' + ic("dice-five") + ' Generate codes</h3>' +
      '<div class="field"><label>Product</label><select id="genProduct">' + pOpts + "</select></div>" +
      '<div class="field"><label>Amount (1–500)</label><input type="number" id="genAmount" min="1" max="500" value="' + (opts.amount || 100) + '" inputmode="numeric" /></div>' +
      '<button class="btn btn-primary btn-block" id="btnGen">' + ic("dice-five") + ' Generate</button>' +
      flash + "</div>";
  }
  function bindProductForm() {
    var btn = $("btnAddProd");
    if (btn) btn.onclick = addProduct;
  }
  function bindGenForm() {
    var btn = $("btnGen");
    if (btn) btn.onclick = doGenerate;
    if (state.genFlash) {
      var g = state.genFlash;
      var cp = $("btnCopyFlash");
      if (cp) cp.onclick = function () { copyText(g.codes.join("\n"), cp); };
    }
  }

  // ====== code clusters (lazy + paginated) ======
  function clusterKey(product, filter) { return product + "|" + (filter || ""); }

  function loadCluster(product, filter, page, force) {
    filter = filter || "";
    page = page || 1;
    var baseKey = clusterKey(product, "");
    if (!force && state.codesCache[baseKey] && state.codesCache[baseKey].items) {
      state.codesCache[baseKey].filter = filter;
      state.codesCache[baseKey].page = page;
      renderClusterBody(product);
      return Promise.resolve(state.codesCache[baseKey]);
    }
    state.codesCache[baseKey] = { items: null, filter: filter, page: page, loading: true };
    renderClusterBody(product);
    return api("listCodes", { product: product })
      .then(function (d) {
        state.codesCache[baseKey] = {
          items: listOf(d),
          filter: filter,
          page: page,
          loading: false,
          total: d.count != null ? d.count : listOf(d).length,
        };
        renderClusterBody(product);
        return state.codesCache[baseKey];
      })
      .catch(function (err) {
        state.codesCache[baseKey] = { items: [], filter: filter, page: 1, loading: false, error: errText(err) };
        renderClusterBody(product);
      });
  }

  function getFilteredItems(cache) {
    var items = cache.items || [];
    if (cache.filter === "unused") return items.filter(function (i) { return i.status === "unused"; });
    if (cache.filter === "used") return items.filter(function (i) { return i.status === "used"; });
    return items;
  }

  function toggleCluster(product) {
    var el = document.querySelector('.cluster[data-product="' + CSS.escape(product) + '"]');
    if (!el) return;
    var opening = !el.classList.contains("open");
    el.classList.toggle("open", opening);
    if (opening) {
      var key = clusterKey(product, "");
      if (!state.codesCache[key] || !state.codesCache[key].items) loadCluster(product, "", 1);
      else renderClusterBody(product);
    }
  }

  function renderClusterBody(product) {
    var cluster = document.querySelector('.cluster[data-product="' + CSS.escape(product) + '"]');
    if (!cluster) return;
    var body = cluster.querySelector(".cluster-body");
    if (!body) return;

    var key = clusterKey(product, "");
    var cache = state.codesCache[key];

    if (!cache || cache.loading) {
      body.innerHTML = '<div class="cluster-toolbar">' +
        '<select class="cluster-filter" disabled><option>Loading...</option></select></div>' +
        loadingState("Loading codes...");
      return;
    }
    if (cache.error) {
      body.innerHTML = errorState(cache.error);
      return;
    }

    var allItems = cache.items || [];
    var unused = allItems.filter(function (i) { return i.status === "unused"; }).length;
    var used = allItems.length - unused;
    var filter = cache.filter || "";
    var items = getFilteredItems(cache);
    var page = cache.page || 1;
    var totalPages = Math.max(1, Math.ceil(items.length / CODE_PAGE_SIZE));
    if (page > totalPages) page = totalPages;
    cache.page = page;
    var start = (page - 1) * CODE_PAGE_SIZE;
    var slice = items.slice(start, start + CODE_PAGE_SIZE);

    var rows = slice.map(function (i) {
      return '<div class="code-row"><span class="code">' + esc(i.code) + "</span>" +
        (i.status === "used" ? '<span class="chip mute">used</span>' : '<span class="chip ok">unused</span>') +
        '<span class="code-row-end">' +
          '<button type="button" class="btn btn-ghost btn-sm code-copy" data-code="' + attr(i.code) + '" title="Copy">' + ic("copy") + "</button>" +
          (i.created_at ? '<span class="code-meta">' + fmtDateTime(i.created_at) + "</span>" : "") +
        "</span></div>";
    }).join("");

    body.innerHTML =
      '<div class="cluster-toolbar">' +
        '<select class="cluster-filter" data-product="' + attr(product) + '">' +
          '<option value=""' + (filter === "" ? " selected" : "") + ">All (" + allItems.length + ")</option>" +
          '<option value="unused"' + (filter === "unused" ? " selected" : "") + ">unused (" + unused + ")</option>" +
          '<option value="used"' + (filter === "used" ? " selected" : "") + ">used (" + used + ")</option>" +
        "</select>" +
        '<button class="btn btn-ghost btn-sm cluster-export" data-product="' + attr(product) + '">' +
          ic("download-simple") + " CSV</button>" +
      "</div>" +
      '<div class="cluster-codes">' + (rows || '<span style="color:var(--muted)">No codes</span>') + "</div>" +
      (items.length > CODE_PAGE_SIZE
        ? '<div class="cluster-pager">' +
            '<button class="btn btn-ghost btn-sm cluster-prev"' + (page <= 1 ? " disabled" : "") + ">" + ic("caret-left") + " Prev</button>" +
            '<span>Page ' + page + " / " + totalPages + " · " + items.length + " codes</span>" +
            '<button class="btn btn-ghost btn-sm cluster-next"' + (page >= totalPages ? " disabled" : "") + ">Next " + ic("caret-right") + "</button>" +
          "</div>"
        : (items.length ? '<div class="cluster-pager"><span>' + items.length + " codes total</span></div>" : ""));

    body.querySelector(".cluster-filter").onchange = function (e) {
      cache.filter = e.target.value;
      cache.page = 1;
      renderClusterBody(product);
    };
    var exp = body.querySelector(".cluster-export");
    if (exp) exp.onclick = function () { exportCodesCsv(product, getFilteredItems(cache)); };
    var prev = body.querySelector(".cluster-prev");
    var next = body.querySelector(".cluster-next");
    if (prev) prev.onclick = function () { if (cache.page > 1) { cache.page--; renderClusterBody(product); } };
    if (next) next.onclick = function () {
      if (cache.page < totalPages) { cache.page++; renderClusterBody(product); }
    };
    body.querySelectorAll(".code-copy").forEach(function (btn) {
      btn.onclick = function (e) {
        e.stopPropagation();
        copyText(btn.getAttribute("data-code"), btn);
      };
    });

    // อัปเดต badge บนหัว cluster
    var headStats = cluster.querySelector(".c-stats");
    if (headStats) headStats.innerHTML = '<span class="chip ok">unused ' + unused + "</span>" +
      '<span class="chip mute">used ' + used + "</span>";
  }

  function buildClusterList(products) {
    if (!products.length) return emptyState("books", "No products yet", "Add your first book in the sidebar");
    var html = '<div class="cluster-list">';
    products.forEach(function (p) {
      html += '<div class="cluster" data-product="' + attr(p.product) + '">' +
        '<button type="button" class="cluster-head" data-toggle="' + attr(p.product) + '">' +
          ic("caret-right", "c-caret") +
          '<span class="c-product">' + esc(p.product) + "</span>" +
          (p.product_name ? '<span class="c-name">' + esc(p.product_name) + "</span>" : "") +
          '<span class="c-stats"><span class="chip book">' + ic("ticket") + ' codes</span></span>' +
        "</button>" +
        '<div class="cluster-body"></div></div>';
    });
    html += "</div>";
    return html;
  }
  function bindClusters() {
    document.querySelectorAll(".cluster-head[data-toggle]").forEach(function (btn) {
      btn.onclick = function () { toggleCluster(btn.getAttribute("data-toggle")); };
    });
  }
  function invalidateCodeCache(product) {
    delete state.codesCache[clusterKey(product, "")];
  }
  function exportCodesCsv(product, items) {
    var label = product || "all";
    var lines = ['"code","product","status","created_at","created_by","used_at"'].concat(items.map(function (i) {
      return '"' + i.code + '","' + i.product + '","' + i.status + '","' + (i.created_at || "") + '","' + (i.created_by || "") + '","' + (i.used_at || "") + '"';
    }));
    var blob = new Blob(["\uFEFF" + lines.join("\r\n")], { type: "text/csv;charset=utf-8;" });
    var a = el("a");
    a.href = URL.createObjectURL(blob);
    a.download = "codes_" + label + ".csv";
    document.body.appendChild(a); a.click(); a.remove();
  }

  function codesSearchPanelHtml(products) {
    var pOpts = '<option value="">All products</option>' + products.map(function (p) {
      return '<option value="' + attr(p.product) + '">' + esc(p.product) +
        (p.product_name ? " · " + esc(p.product_name) : "") + "</option>";
    }).join("");
    return '<p class="codes-panel-desc">Find a code across all products — partial match works</p>' +
      '<div class="filter-bar">' +
        '<div class="field fb-grow"><label>Code</label><input class="mono" id="codeSearch" placeholder="MATH1-X7K2 or partial code" /></div>' +
        '<div class="field"><label>Product</label><select id="codeProduct">' + pOpts + "</select></div>" +
        '<div class="field"><label>Status</label><select id="codeStatus"><option value="">All</option><option value="unused">unused</option><option value="used">used</option></select></div>' +
        dateRangeFieldHtml("codeDate", "Created date range") +
        '<button type="button" class="btn btn-primary" id="btnCodeSearch">' + ic("magnifying-glass") + " Search</button>" +
      "</div><div id=\"codeSearchBody\">" + emptyState("magnifying-glass", "Search codes", "Enter a code or filter, then press Search") + "</div>";
  }
  function codesPageMainHtml(products) {
    return '<div class="codes-tabs">' +
      '<button type="button" class="codes-tab" data-tab="search">' + ic("magnifying-glass") + " Search</button>" +
      '<button type="button" class="codes-tab" data-tab="browse">' + ic("books") + " By product</button>" +
      "</div>" +
      '<div class="codes-panel" id="codesSearchPanel"><div class="codes-panel-card">' + codesSearchPanelHtml(products) + "</div></div>" +
      '<div class="codes-panel hidden" id="codesBrowsePanel"><div class="codes-panel-card">' +
        '<p class="codes-panel-desc">Open a product to view, copy, or export its codes</p>' +
        buildClusterList(products) +
      "</div></div>";
  }
  function bindCodesTabs() {
    document.querySelectorAll(".codes-tab").forEach(function (btn) {
      btn.onclick = function () { showCodesTab(btn.getAttribute("data-tab")); };
    });
  }
  function showCodesTab(tab) {
    state.codesTab = tab || "browse";
    document.querySelectorAll(".codes-tab").forEach(function (b) {
      b.classList.toggle("active", b.getAttribute("data-tab") === state.codesTab);
    });
    var searchPanel = $("codesSearchPanel");
    var browsePanel = $("codesBrowsePanel");
    if (searchPanel) searchPanel.classList.toggle("hidden", state.codesTab !== "search");
    if (browsePanel) browsePanel.classList.toggle("hidden", state.codesTab !== "browse");
  }
  function getCodeSearchPayload() {
    var p = {};
    var s = ($("codeSearch") && $("codeSearch").value || "").trim();
    if (s) p.search = s;
    if ($("codeProduct") && $("codeProduct").value) p.product = $("codeProduct").value;
    if ($("codeStatus") && $("codeStatus").value) p.status = $("codeStatus").value;
    readDateRange("codeDate", "created_from", "created_to", p);
    return p;
  }
  function bindCodeSearch() {
    var btn = $("btnCodeSearch");
    if (btn) btn.onclick = searchCodesGlobal;
    var inp = $("codeSearch");
    if (inp) inp.addEventListener("keydown", function (e) { if (e.key === "Enter") searchCodesGlobal(); });
    initDateRangePicker("codeDate");
  }
  function searchCodesGlobal() {
    var btn = $("btnCodeSearch");
    setLoading(btn, true);
    $("codeSearchBody").innerHTML = loadingState("Searching...");
    api("listCodes", getCodeSearchPayload())
      .then(function (d) { setLoading(btn, false); drawCodeSearchList(d); })
      .catch(function (err) {
        setLoading(btn, false);
        $("codeSearchBody").innerHTML = errorState(errText(err));
      });
  }
  function drawCodeSearchList(d) {
    var items = listOf(d);
    var product = ($("codeProduct") && $("codeProduct").value) || "";
    var unused = items.filter(function (i) { return String(i.status) === "unused"; }).length;
    var used = items.length - unused;
    var summary = '<div class="summary-bar"><span class="summary-pill">' + (product || "All products") +
      ": <b>" + unused + "</b> unused / <b>" + used + "</b> used" + countNote(d, items) + "</span>" +
      (items.length ? '<button class="btn btn-ghost btn-sm" id="btnCodeExport">' + ic("download-simple") + " Export CSV</button>" : "") +
      "</div>";
    if (!items.length) {
      $("codeSearchBody").innerHTML = summary + emptyState("magnifying-glass", "No codes found", "Try different search or filters");
      return;
    }
    var rows = items.map(function (i) {
      return "<tr><td class=\"code\">" + esc(i.code) + "</td><td>" + esc(i.product) + "</td><td>" +
        (String(i.status) === "used" ? '<span class="chip mute">used</span>' : '<span class="chip ok">unused</span>') + "</td>" +
        '<td class="col-dt col-hide-sm">' + fmtDateTime(i.created_at) + "</td>" +
        '<td class="col-hide-sm">' + esc(i.created_by || "—") + "</td>" +
        '<td class="col-dt col-hide-sm">' + fmtDateTime(i.used_at) + "</td>" +
        '<td><button type="button" class="btn btn-ghost btn-sm code-copy" data-code="' + attr(i.code) + '">' + ic("copy") + "</button></td></tr>";
    }).join("");
    $("codeSearchBody").innerHTML = summary +
      '<div class="table-wrap"><table class="tbl tbl-codes"><thead><tr>' +
      "<th>Code</th><th>Product</th><th>Status</th><th class=\"col-hide-sm\">Created</th><th class=\"col-hide-sm\">Created by</th><th class=\"col-hide-sm\">Used at</th><th></th>" +
      "</tr></thead><tbody>" + rows + "</tbody></table></div>";
    $("codeSearchBody").querySelectorAll(".code-copy").forEach(function (b) {
      b.onclick = function (e) { e.stopPropagation(); copyText(b.getAttribute("data-code"), b); };
    });
    var ex = $("btnCodeExport");
    if (ex) ex.onclick = function () { exportCodesCsv(product, items); };
  }

  // ======================================================================
  //  หน้า 3 — สินค้า
  // ======================================================================
  function productsMainHtml() {
    return '<div class="filter-bar">' +
      '<div class="field fb-grow"><label>Search</label><input id="prodSearch" placeholder="Code or title" /></div>' +
      dateRangeFieldHtml("prodDate", "Created date range") +
      '<button type="button" class="btn btn-primary" id="btnProdFilter">' + ic("magnifying-glass") + " Search</button>" +
      "</div><div id=\"prodTable\">" + loadingState("Loading products...") + "</div>";
  }
  function getProductFilters() {
    var p = {};
    var s = ($("prodSearch") && $("prodSearch").value || "").trim();
    if (s) p.search = s;
    readDateRange("prodDate", "created_from", "created_to", p);
    return p;
  }
  function bindProductFilters() {
    var btn = $("btnProdFilter");
    if (!btn) return;
    btn.onclick = function () {
      $("prodTable").innerHTML = loadingState("Searching...");
      fetchProductsList().catch(function (err) { $("prodTable").innerHTML = errorState(errText(err)); });
    };
    var search = $("prodSearch");
    if (search) search.addEventListener("keydown", function (e) { if (e.key === "Enter") btn.click(); });
    initDateRangePicker("prodDate");
  }
  function renderProducts() {
    setMainWide(true);
    setView(
      '<div class="page-head"><h2>' + ic("books") + ' Products</h2></div>' +
      '<p class="page-sub">Book registry — add a YouTube link for each volume</p>' +
      '<div id="prodBody"><div class="page-split">' +
        '<div class="split-main" id="prodMain">' + productsMainHtml() + "</div>" +
        '<div class="split-aside" id="prodAside">' + productFormHtml() + "</div>" +
      "</div></div>"
    );
    bindProductForm();
    bindProductFilters();
    fetchProductsList()
      .catch(function (err) { $("prodTable").innerHTML = errorState(errText(err)); });
  }
  function fetchProductsList() {
    return api("listProducts", getProductFilters())
      .then(function (d) {
        var items = listOf(d);
        state.cache.products = items;
        drawProductsList(items);
        return items;
      });
  }
  function productsListHtml(items) {
    if (!items.length) return emptyState("books", "No products found", "Try different filters or add a new book in the sidebar");
    var rows = items.map(function (p) {
      var linkChip = (p.youtube_link && String(p.youtube_link).trim())
        ? '<span class="chip ok">' + ic("check-circle") + ' Has link</span>'
        : '<span class="chip bad">' + ic("warning") + ' Missing</span>';
      return "<tr><td class=\"code\">" + esc(p.product) + "</td><td>" + esc(p.product_name || "-") + "</td><td>" + linkChip + "</td>" +
        '<td class="col-dt col-hide-sm">' + fmtDateTime(p.created_at) + "</td>" +
        '<td class="col-dt col-hide-sm">' + fmtDateTime(p.updated_at) + "</td>" +
        '<td><button class="btn btn-ghost btn-sm" data-edit="' + attr(JSON.stringify(p)) + '">Edit</button></td></tr>';
    }).join("");
    return '<div class="table-wrap"><table class="tbl"><thead><tr><th>Code</th><th>Title</th><th>Link</th><th class="col-hide-sm">Created</th><th class="col-hide-sm">Updated</th><th></th></tr></thead><tbody>' + rows + "</tbody></table></div>";
  }
  function drawProductsList(items) {
    var listEl = $("prodTable");
    if (!listEl) return;
    listEl.innerHTML = productsListHtml(items);
    listEl.querySelectorAll("[data-edit]").forEach(function (b) {
      b.onclick = function () { editProduct(JSON.parse(b.getAttribute("data-edit"))); };
    });
  }
  function addProduct() {
    var product = ($("npProduct").value || "").trim().toUpperCase();
    var name = ($("npName").value || "").trim();
    var link = ($("npLink").value || "").trim();
    if (!product) { toast("Enter a product code", "err"); return; }
    openLoadingModal("Saving product...");
    api("addProduct", { product: product, product_name: name, youtube_link: link })
      .then(function () {
        closeLoadingModal();
        toast("Added product " + product, "ok");
        $("npProduct").value = "";
        $("npName").value = "";
        $("npLink").value = "";
        return fetchProductsList();
      })
      .catch(function (err) { closeLoadingModal(); toast(errText(err), "err"); });
  }
  function editProduct(p) {
    openModal({
      title: "Edit " + p.product,
      bodyHtml:
        '<div class="field"><label>Book title</label><input data-field="product_name" value="' + attr(p.product_name || "") + '" /></div>' +
        '<div class="field"><label>YouTube link</label><input class="mono" data-field="youtube_link" value="' + attr(p.youtube_link || "") + '" placeholder="https://youtu.be/..." /></div>',
      okLabel: "Save", okClass: "btn-primary",
    }).then(function (vals) {
      if (!vals) return;
      openLoadingModal("Saving...");
      api("updateProduct", { row: Number(p.row), product_name: vals.product_name, youtube_link: vals.youtube_link })
        .then(function () { closeLoadingModal(); toast("Saved", "ok"); fetchProductsList(); })
        .catch(function (err) { closeLoadingModal(); toast(errText(err), "err"); });
    });
  }

  // ======================================================================
  //  หน้า 4 — Codes (ค้นหา + browse + สร้างรหัส)
  // ======================================================================
  function renderCodes() {
    setMainWide(true);
    setView(
      '<div class="page-head"><h2>' + ic("ticket") + ' Codes</h2></div>' +
      '<p class="page-sub">Search codes or browse by product · generate new ones in the sidebar</p>' +
      '<div id="genBody">' + loadingState("Loading...") + "</div>"
    );
    ensureProducts()
      .then(function (items) {
        if (!items.length) {
          setMainWide(false);
          $("genBody").innerHTML = emptyState("books", "No products yet", "Create a product first", '<button class="btn btn-primary" onclick="__go(\'products\')">Go to Products ' + ic("caret-right") + "</button>");
          return;
        }
        drawCodesPage(items);
      })
      .catch(function (err) { $("genBody").innerHTML = errorState(errText(err)); });
  }
  function drawCodesPage(products) {
    $("genBody").innerHTML = splitPage(codesPageMainHtml(products), genFormHtml(products));
    bindCodeSearch();
    bindClusters();
    bindGenForm();
    bindCodesTabs();
    showCodesTab(state.codesTab || "browse");
  }
  function doGenerate() {
    var product = $("genProduct").value;
    var amount = parseInt($("genAmount").value, 10);
    if (!amount || amount < 1 || amount > 500) { toast("Amount must be between 1–500", "err"); return; }
    openModal({
      title: "Confirm code generation",
      bodyHtml: "<p>Create <b>" + amount + "</b> codes for <b>" + esc(product) + "</b>? They will be saved immediately.</p>",
      okLabel: ic("dice-five") + " Generate", okClass: "btn-primary",
    }).then(function (ok) {
      if (!ok) return;
      var btn = $("btnGen"); setLoading(btn, true);
      api("generateCodes", { product: product, amount: amount })
        .then(function (d) {
          setLoading(btn, false);
          state.genFlash = { product: d.product || product, codes: d.codes || [] };
          invalidateCodeCache(product);
          toast("Created " + (d.amount || amount) + " codes", "ok");
          ensureProducts().then(function (items) {
            state.codesTab = "browse";
            drawCodesPage(items);
            var cluster = document.querySelector('.cluster[data-product="' + CSS.escape(product) + '"]');
            if (cluster) {
              cluster.classList.add("open");
              loadCluster(product, "", 1, true);
            }
          });
        })
        .catch(function (err) { setLoading(btn, false); toast(errText(err), "err"); });
    });
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
  //  หน้า 5 — นักเรียน (listStudents + getStudent)
  // ======================================================================
  function renderStudents() {
    setMainWide(true);
    setView(
      '<div class="page-head"><h2>' + ic("graduation-cap") + ' Students</h2>' +
      '<div class="view-toggle" id="studentsViewToggle">' +
        '<button type="button" class="view-toggle-btn' + (state.studentsView === "cards" ? " active" : "") + '" id="btnViewCards" title="Cards">' + ic("squares-four") + " Cards</button>" +
        '<button type="button" class="view-toggle-btn' + (state.studentsView === "table" ? " active" : "") + '" id="btnViewTable" title="Table">' + ic("table") + " Table</button>" +
      "</div></div>" +
      '<p class="page-sub">Registered students · books on each card (rejected hidden)</p>' +
      '<div class="filter-bar">' +
        '<div class="field fb-grow"><label>Search</label><input id="stSearch" placeholder="Name / email / discord / school" /></div>' +
        '<div class="field"><label>Show</label><select id="stFilter">' +
          '<option value="">All students</option>' +
          '<option value="active">Has approved books</option>' +
          '<option value="pending">Has pending</option>' +
          '<option value="rejected">Has rejected</option>' +
        "</select></div>" +
        '<button type="button" class="btn btn-primary" id="btnStSearch">' + ic("magnifying-glass") + " Search</button>" +
      "</div><div id=\"stBody\">" + loadingState("Loading students...") + "</div>"
    );
    $("btnStSearch").onclick = loadStudents;
    $("stSearch").addEventListener("keydown", function (e) { if (e.key === "Enter") loadStudents(); });
    $("stFilter").addEventListener("change", loadStudents);
    $("btnViewCards").onclick = function () { setStudentsView("cards"); };
    $("btnViewTable").onclick = function () { setStudentsView("table"); };
    loadStudents();
  }
  function setStudentsView(v) {
    state.studentsView = v;
    var c = $("btnViewCards");
    var t = $("btnViewTable");
    if (c) c.classList.toggle("active", v === "cards");
    if (t) t.classList.toggle("active", v === "table");
    if (state.studentsCache) drawStudents(state.studentsCache.d, state.studentsCache.productMap);
  }
  function getStudentListSearch() {
    return ($("stSearch") && $("stSearch").value || "").trim();
  }
  function loadStudents() {
    var btn = $("btnStSearch");
    if (btn) setLoading(btn, true);
    if ($("stBody")) $("stBody").innerHTML = loadingState("Loading students...");
    var search = getStudentListSearch();
    var payload = search ? { search: search } : {};
    Promise.all([
      api("listStudents", payload),
      api("listRegistrations", payload),
    ])
      .then(function (res) {
        if (btn) setLoading(btn, false);
        state.studentsCache = { d: res[0], productMap: buildStudentProductsMap(res[1]) };
        drawStudents(res[0], state.studentsCache.productMap);
      })
      .catch(function (err) {
        if (btn) setLoading(btn, false);
        $("stBody").innerHTML = errorState(errText(err));
      });
  }
  function buildStudentProductsMap(regsData) {
    var map = {};
    listOf(regsData).forEach(function (r) {
      var st = String(r.status);
      if (st === "rejected" || !r.discord_id || !r.product) return;
      if (!map[r.discord_id]) map[r.discord_id] = [];
      var list = map[r.discord_id];
      var found = null;
      for (var i = 0; i < list.length; i++) {
        if (list[i].product === r.product) { found = list[i]; break; }
      }
      var item = {
        product: r.product,
        product_name: r.product_name || "",
        status: st,
        code: r.code || "",
        row: r.row,
        link_sent: r.link_sent,
      };
      if (found) {
        if (st === "pending") Object.assign(found, item);
      } else {
        list.push(item);
      }
    });
    Object.keys(map).forEach(function (id) {
      map[id].sort(function (a, b) {
        if (a.status === "pending" && b.status !== "pending") return -1;
        if (b.status === "pending" && a.status !== "pending") return 1;
        return String(a.product).localeCompare(String(b.product));
      });
    });
    return map;
  }
  function filterStudentItems(items) {
    var f = $("stFilter") && $("stFilter").value;
    if (!f) return items;
    return items.filter(function (s) {
      if (f === "active") return (s.approved || 0) > 0;
      if (f === "pending") return (s.pending || 0) > 0;
      if (f === "rejected") return (s.rejected || 0) > 0;
      return true;
    });
  }
  function studentDisplayName(s) {
    if (s.nickname && s.name) return esc(s.nickname) + ' <span class="detail-name-full">(' + esc(s.name) + ")</span>";
    return esc(s.nickname || s.name || s.email || "—");
  }
  function studentProductItemHtml(p) {
    var isPending = p.status === "pending";
    var tip = p.product_name ? p.product + " · " + p.product_name : p.product;
    return '<div class="student-prod-item' + (isPending ? " is-pending" : "") + '" title="' + attr(tip) + '">' +
      '<div class="student-prod-item-top">' +
        (isPending ? '<span class="student-prod-pending" title="Pending approval">' + ic("hourglass-medium") + "</span>" : "") +
        '<div class="student-prod-item-text">' +
          '<span class="student-prod-code">' + esc(p.product) + "</span>" +
          (p.product_name ? '<span class="student-prod-name">' + esc(p.product_name) + "</span>" : "") +
          (p.code ? '<span class="student-prod-code-val">' + esc(p.code) + "</span>" : "") +
        "</div>" +
        (isPending && p.row
          ? '<button type="button" class="btn btn-ghost btn-sm student-prod-review" data-row="' + Number(p.row) + '">' + ic("list-checks") + " Review</button>"
          : "") +
      "</div></div>";
  }
  function studentProductsBlockHtml(discordId, products) {
    products = products || [];
    if (!products.length) return '<div class="student-card-books empty">No books yet</div>';
    var expanded = !!state.studentsExpanded[discordId];
    var visible = expanded ? products : products.slice(0, 2);
    var html = '<div class="student-card-books">' + visible.map(studentProductItemHtml).join("") + "</div>";
    if (products.length > 2) {
      html += '<button type="button" class="btn btn-ghost btn-sm student-expand-btn" data-discord="' + attr(discordId) + '">' +
        (expanded ? ic("caret-up") + " Show less" : ic("caret-down") + " Show all " + products.length + " books") +
        "</button>";
    }
    return html;
  }
  function studentCardHtml(s, productMap) {
    var prods = productMap[s.discord_id] || [];
    var pendingCount = prods.filter(function (p) { return p.status === "pending"; }).length;
    var approvedCount = prods.filter(function (p) { return p.status === "approved"; }).length;
    return '<article class="student-card">' +
      '<div class="student-card-head">' +
        studentAvatarHtml(s, "student-avatar lg") +
        '<div class="student-card-info">' +
          '<div class="student-card-name">' + studentDisplayName(s) + "</div>" +
          (s.discord_username ? '<div class="student-card-discord">@' + esc(s.discord_username) + "</div>" : "") +
          '<div class="student-card-meta">' + ic("graduation-cap") + " " + esc(s.school || "—") + "</div>" +
          '<div class="student-card-meta">' + ic("envelope-simple") + " " + esc(s.email || "—") + "</div>" +
          '<div class="student-card-meta subtle">' + ic("clock") + " Last active " + esc(timeAgo(s.last_activity || s.first_registered)) +
            " · " + esc(fmtDateTime(s.last_activity || s.first_registered)) + "</div>" +
          '<div class="student-card-meta subtle">' + ic("calendar-blank") + " Member since " + esc(fmtDateTime(s.first_registered)) + "</div>" +
        "</div>" +
      "</div>" +
      '<div class="student-card-books-sec">' +
        '<div class="student-card-kicker">Books</div>' +
        studentProductsBlockHtml(s.discord_id, prods) +
        '<div class="student-card-stats">' +
          (approvedCount ? '<span class="chip ok sm">' + approvedCount + " approved</span>" : "") +
          (pendingCount ? '<span class="chip warn sm">' + pendingCount + " pending</span>" : "") +
        "</div>" +
      "</div></article>";
  }
  function studentTableProductsHtml(products) {
    products = products || [];
    if (!products.length) return '<span class="muted-text">—</span>';
    return '<div class="product-chips compact">' + products.slice(0, 4).map(function (p) {
      var tip = p.product_name ? p.product + " · " + p.product_name : p.product;
      var pending = p.status === "pending";
      return '<span class="chip book' + (pending ? " warn" : "") + ' student-prod-sm" title="' + attr(tip) + '">' +
        (pending ? ic("hourglass-medium") + " " : "") + esc(p.product) + "</span>";
    }).join("") + (products.length > 4 ? '<span class="chip mute sm">+' + (products.length - 4) + "</span>" : "") + "</div>";
  }
  function bindStudentInteractions() {
    if (!$("stBody")) return;
    $("stBody").querySelectorAll(".student-expand-btn").forEach(function (btn) {
      btn.onclick = function () {
        var id = btn.getAttribute("data-discord");
        state.studentsExpanded[id] = !state.studentsExpanded[id];
        if (state.studentsCache) drawStudents(state.studentsCache.d, state.studentsCache.productMap);
      };
    });
    $("stBody").querySelectorAll(".student-prod-review").forEach(function (btn) {
      btn.onclick = function (e) {
        e.stopPropagation();
        navigate("pending", { row: Number(btn.getAttribute("data-row")) });
      };
    });
  }
  function drawStudents(d, productMap) {
    var items = filterStudentItems(listOf(d));
    productMap = productMap || {};
    var summary = items.length
      ? '<div class="summary-bar"><span class="summary-pill"><b>' + items.length + "</b> students" + countNote(d, items) + "</span></div>"
      : "";
    if (!items.length) {
      $("stBody").innerHTML = summary + emptyState("graduation-cap", "No students found", "Try different search or filters");
      return;
    }
    if (state.studentsView === "table") {
      var rows = items.map(function (s) {
        var prods = productMap[s.discord_id] || [];
        return "<tr><td><div class=\"student-cell\">" + studentAvatarHtml(s, "student-avatar") +
          "<div>" + studentDisplayName(s) +
          (s.discord_username ? '<div class="student-card-discord">@' + esc(s.discord_username) + "</div>" : "") +
          "</div></div></td>" +
          '<td class="col-hide-sm">' + esc(s.school || "—") + "</td>" +
          '<td class="col-hide-sm">' + esc(s.email || "—") + "</td>" +
          "<td>" + studentTableProductsHtml(prods) + "</td>" +
          '<td class="col-dt col-hide-sm">' + esc(timeAgo(s.last_activity || s.first_registered)) + "</td></tr>";
      }).join("");
      $("stBody").innerHTML = summary +
        '<div class="table-wrap"><table class="tbl tbl-students"><thead><tr>' +
        "<th>Student</th><th class=\"col-hide-sm\">School</th><th class=\"col-hide-sm\">Email</th><th>Books</th><th class=\"col-hide-sm\">Last active</th>" +
        "</tr></thead><tbody>" + rows + "</tbody></table></div>";
    } else {
      $("stBody").innerHTML = summary +
        '<div class="student-cards">' + items.map(function (s) {
          return studentCardHtml(s, productMap);
        }).join("") + "</div>";
    }
    bindStudentInteractions();
  }

  // ======================================================================
  //  หน้า 6 — สลิป (เฟส C)
  // ======================================================================
  function renderSlips() {
    setMainWide(false);
    setView('<div class="page-head"><h2>' + ic("credit-card") + ' Slip review</h2></div><p class="page-sub">Premium Q&A payment slips awaiting approval</p><div id="slipBody">' + loadingState("Loading slips...") + "</div>");
    api("listSlips", {})
      .then(function (d) {
        var items = listOf(d);
        setBadge("slips", items.length);
        if (!items.length) { $("slipBody").innerHTML = emptyState("credit-card", "No slips pending", "New payment slips will appear here"); return; }
        var grid = el("div", "slips");
        items.forEach(function (it) { grid.appendChild(slipCard(it)); });
        var b = $("slipBody"); b.innerHTML = ""; b.appendChild(grid);
      })
      .catch(function (err) { $("slipBody").innerHTML = errorState(errText(err)); });
  }
  function slipCard(it) {
    var card = el("div", "slip-card"); card.dataset.row = it.row;
    var img = it.slip_url
      ? '<img src="' + attr(it.slip_url) + '" alt="Slip" loading="lazy" onerror="this.parentNode.innerHTML=\'<div class=&quot;noimg&quot;>Cannot load image</div>\'" /><a class="zoom" href="' + attr(it.slip_url) + '" target="_blank" rel="noopener">' + ic("magnifying-glass-plus") + ' Full size</a>'
      : '<div class="noimg">No slip image</div>';
    card.innerHTML =
      '<div class="slip-img">' + img + "</div>" +
      '<div class="slip-body"><div class="slip-amount">฿' + fmtBaht(it.amount) + ' <small>THB</small></div>' +
      '<div class="slip-meta">' + ic("user") + " " + esc(it.discord_id || "-") + "<br>" + ic("clock") + " " + esc(fmtDateTime(it.timestamp)) + "</div>" +
      '<div class="slip-actions"><button class="btn btn-approve" data-ok>' + ic("check-circle") + ' Approve</button></div></div>';
    card.querySelector("[data-ok]").onclick = function () { onApproveSlip(it, card); };
    return card;
  }
  function onApproveSlip(it, card) {
    openModal({
      title: "Confirm slip approval",
      bodyHtml: "<p>Approve slip for <b>฿" + fmtBaht(it.amount) + "</b> from " + esc(it.discord_id) + "? Premium Q&A will be enabled until end of month.</p>",
      okLabel: ic("check-circle") + " Approve", okClass: "btn-approve",
    }).then(function (ok) {
      if (!ok) return;
      card.classList.add("busy");
      api("approveSlip", { row: Number(it.row) })
        .then(function () { toast("Premium Q&A enabled until end of month", "ok"); renderSlips(); refreshBadges(); })
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
      toast("Copied", "ok");
      if (btn) { var o = btn.innerHTML; btn.innerHTML = "✓ Copied"; setTimeout(function () { btn.innerHTML = o; }, 1400); }
    }).catch(function () { toast("Copy failed", "err"); });
  }

  // ====== init ======
  function initSidebar() {
    var shell = $("appShell");
    var btn = $("sidebarToggle");
    if (!shell || !btn) return;
    var SS_SIDEBAR = "krumook_sidebar_collapsed";
    if (localStorage.getItem(SS_SIDEBAR) === "1") shell.classList.add("sidebar-collapsed");
    function syncToggle() {
      var collapsed = shell.classList.contains("sidebar-collapsed");
      btn.innerHTML = collapsed ? ic("caret-right") : ic("caret-left");
      btn.setAttribute("aria-label", collapsed ? "Expand menu" : "Collapse menu");
    }
    btn.onclick = function () {
      shell.classList.toggle("sidebar-collapsed");
      localStorage.setItem(SS_SIDEBAR, shell.classList.contains("sidebar-collapsed") ? "1" : "0");
      syncToggle();
    };
    syncToggle();
  }
  function init() {
    $("loginForm").addEventListener("submit", doLogin);
    var infoBtn = $("secretInfoBtn");
    if (infoBtn) infoBtn.addEventListener("click", function () {
      var pop = $("secretInfo");
      var open = pop.classList.toggle("hidden") === false;
      infoBtn.setAttribute("aria-expanded", open ? "true" : "false");
    });
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
    initSidebar();

    // กู้ session
    if (secret() && apiUrl()) { enterApp(); return; }
    showLogin();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
