/*!
 * Paginación numérica personalizada para Blogger
 * Autor: Jorge Andrés Amaya
 * Blog: Descubre con Jorge Andrés Amaya
 * URL: https://jorgeandresamaya.blogspot.com
 * Versión: 1.0
 * Descripción: Inserta paginación numérica real en el contenedor #numeracion-paginacion,
 *              oculta en la primera página, sin reemplazar #blog-pager ni duplicar elementos.
 */

// Parámetros globales (estas variables se definirán en la plantilla)
/*!
 * Paginación Blogger - versión mínima y ligera
 * Jorge Andrés Amaya ©2025
 */
(function (global) {
  "use strict";

  const CONFIG = {
    pagerSelector: "#blog-pager",
    numberSelector: "#numeracion-paginacion",
    totalVisible: 5,
    maxResultsDefault: 10
  };

  function qs(sel) { return document.querySelector(sel); }
  function parseIntSafe(v, fb = null) {
    const n = Number(v); return Number.isFinite(n) ? n : fb;
  }

  function findMaxResults() {
    const anchors = Array.from(document.querySelectorAll("a[href*='max-results']"));
    for (const a of anchors) {
      try {
        const u = new URL(a.href, location.origin);
        const mr = u.searchParams.get("max-results");
        const val = parseIntSafe(mr);
        if (val) return val;
      } catch (e) {}
    }
    return CONFIG.maxResultsDefault;
  }

  function parseStartFromUrl(urlStr) {
    try {
      const u = new URL(urlStr, location.origin);
      const s = u.searchParams.get("start") || u.searchParams.get("start-index");
      return s ? parseIntSafe(s, null) : null;
    } catch { return null; }
  }

  function computeVisible(current, total, visible) {
    const half = Math.floor(visible / 2);
    let start = Math.max(1, current - half);
    let end = Math.min(total, start + visible - 1);
    if (end - start + 1 < visible) start = Math.max(1, end - visible + 1);

    const out = [];
    if (start > 1) {
      out.push(1);
      if (start > 2) out.push("…");
    }
    for (let i = start; i <= end; i++) out.push(i);
    if (end < total) {
      if (end < total - 1) out.push("…");
      out.push(total);
    }
    return out;
  }

  function buildUrl(origin, page, max) {
    if (page === 1) return origin;
    return `${origin}/search?max-results=${max}&start=${(page - 1) * max + 1}`;
  }

  function BloggerPager() {}

  BloggerPager.prototype.init = function () {
    const pager = qs(CONFIG.pagerSelector);
    const container = qs(CONFIG.numberSelector);
    if (!pager || !container) return;

    const max = findMaxResults();
    let totalPages = null;
    let currentPage = 1;

    const uNow = new URL(window.location.href);
    const sNow = uNow.searchParams.get("start") || uNow.searchParams.get("start-index");
    if (sNow) currentPage = Math.floor((parseIntSafe(sNow) - 1) / max) + 1;

    // Estimar totalPages si no hay feed (buscando último enlace con start)
    const anchors = Array.from(document.querySelectorAll("a[href*='start']"));
    let maxStart = 0;
    anchors.forEach(a => {
      const s = parseStartFromUrl(a.href);
      if (s && s > maxStart) maxStart = s;
    });
    if (maxStart > 0) totalPages = Math.floor((maxStart - 1) / max) + 1;

    if (!totalPages) return; // no hay suficientes datos
    if (currentPage <= 1) { container.innerHTML = ""; return; } // solo desde página 2

    const range = computeVisible(currentPage, totalPages, CONFIG.totalVisible);
    container.innerHTML = "";

    range.forEach(n => {
      if (n === "…") {
        const span = document.createElement("span");
        span.textContent = "…";
        container.appendChild(span);
      } else {
        const a = document.createElement("a");
        a.textContent = n;
        a.href = buildUrl(location.origin, n, max);
        if (n === currentPage) a.className = "is-active";
        container.appendChild(a);
      }
    });
  };

  global.BloggerPager = BloggerPager;

})(this);
