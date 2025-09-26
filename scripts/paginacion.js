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
 * Paginación Blogger — Versión robusta (producción)
 * - Muestra numeración sólo desde página 2
 * - Máximo 5 números (incluye activo y último)
 * - Intenta fetch JSON; si falla usa JSONP como fallback
 * - Compatible con /search?max-results=...&start=...
 */
(function () {
  "use strict";

  const SEL = {
    pager: "#blog-pager",
    numbers: "#numeracion-paginacion"
  };
  const CONF = {
    visibleCount: 5,
    maxResultsFallback: 10,
    feedPath: "/feeds/posts/summary",
    jsonAlt: "json", // intenta alt=json con fetch primero
    jsonpAlt: "json-in-script", // fallback JSONP
    jsonpTimeout: 6000
  };

  function $(sel) { return document.querySelector(sel); }
  function toInt(v, fb = null) { const n = Number(v); return Number.isFinite(n) ? n : fb; }
  function findMaxResultsOnPage() {
    // busca enlaces con max-results localmente
    const anchors = Array.from(document.querySelectorAll("a[href*='max-results'], a[href*='maxresults']"));
    for (const a of anchors) {
      try {
        const u = new URL(a.href, location.href);
        const mr = u.searchParams.get("max-results") || u.searchParams.get("maxresults");
        const n = toInt(mr);
        if (n) return n;
      } catch (e) { /* ignore */ }
    }
    // Si no encuentra, retorna fallback
    return CONF.maxResultsFallback;
  }

  function parseStartFromUrl(urlStr) {
    try {
      const u = new URL(urlStr, location.href);
      const s = u.searchParams.get("start") || u.searchParams.get("start-index");
      return s ? toInt(s, null) : null;
    } catch (e) { return null; }
  }

  function detectCurrentPage(maxResults, pagerEl) {
    // 1) Buscar start en la URL
    const now = new URL(location.href);
    const sNow = now.searchParams.get("start") || now.searchParams.get("start-index");
    if (sNow) {
      const sVal = toInt(sNow, null);
      if (sVal !== null) return Math.max(1, Math.floor((sVal - 1) / maxResults) + 1);
    }
    // 2) Intentar deducir por link 'older' en el pager
    if (pagerEl) {
      const older = pagerEl.querySelector("a.blog-pager-older-link, a[href*='start'], a[href*='start-index']");
      if (older && older.href) {
        const s = parseStartFromUrl(older.href);
        if (s !== null) {
          const cp = Math.floor((s - 1) / maxResults);
          return Math.max(1, cp);
        }
      }
    }
    // 3) default página 1
    return 1;
  }

  // obtiene totalPosts usando fetch; si falla usa JSONP fallback; resuelve Number o null
  function getTotalPosts(origin) {
    const feedUrl = `${origin}${CONF.feedPath}?alt=${CONF.jsonAlt}&max-results=0`;
    return new Promise((resolve) => {
      // intento fetch
      try {
        fetch(feedUrl, { credentials: "omit" }).then(resp => {
          if (!resp.ok) throw new Error("no-ok");
          return resp.json();
        }).then(json => {
          const t = json?.feed?.["openSearch$totalResults"]?.["$t"];
          const n = toInt(t, null);
          resolve(n);
        }).catch(() => {
          // fetch falló: intenta JSONP
          const callbackName = "__BloggerPagerCB_" + Math.random().toString(36).slice(2);
          let done = false;
          window[callbackName] = function (data) {
            if (done) return;
            done = true;
            try {
              const t = data?.feed?.["openSearch$totalResults"]?.["$t"];
              const n = toInt(t, null);
              resolve(n);
            } catch (e) {
              resolve(null);
            } finally {
              try { delete window[callbackName]; } catch (e) { window[callbackName] = null; }
            }
          };
          const script = document.createElement("script");
          script.async = true;
          script.src = `${origin}${CONF.feedPath}?alt=${CONF.jsonpAlt}&max-results=0&callback=${callbackName}`;
          script.onerror = function () {
            if (done) return;
            done = true;
            resolve(null);
            try { delete window[callbackName]; } catch (e) { window[callbackName] = null; }
          };
          document.head.appendChild(script);
          // timeout
          setTimeout(function () {
            if (done) return;
            done = true;
            try { delete window[callbackName]; } catch (e) { window[callbackName] = null; }
            // quitar script si quedó
            if (script.parentNode) script.parentNode.removeChild(script);
            resolve(null);
          }, CONF.jsonpTimeout);
        });
      } catch (e) {
        resolve(null);
      }
    });
  }

  // estima totalPages buscando el mayor 'start' en enlaces de la página
  function estimateTotalPagesFromAnchors(maxResults) {
    const anchors = Array.from(document.querySelectorAll("a[href*='start'], a[href*='start-index']"));
    let maxStart = 0;
    anchors.forEach(a => {
      const s = parseStartFromUrl(a.href);
      if (s && s > maxStart) maxStart = s;
    });
    return maxStart > 0 ? Math.max(2, Math.floor((maxStart - 1) / maxResults) + 1) : null;
  }

  // Construye URL de página
  function buildPageUrl(origin, page, max, label, query) {
    if (page === 1) return origin;
    // intentamos crear /search con params; si el blog usa label/query no lo detectamos aquí (simple)
    return `${origin}/search?max-results=${max}&start=${(page - 1) * max + 1}`;
  }

  // Genera conjunto de hasta V números que incluya current y last
  function computeSetIncludeCurrentAndLast(total, current, V) {
    V = Math.max(3, V);
    if (total <= V) {
      const arr = [];
      for (let i = 1; i <= total; i++) arr.push(i);
      return arr;
    }
    // siempre incluir current y last
    const s = new Set();
    s.add(current);
    s.add(total);

    // añadir vecinos del current: c-1, c+1, c-2, c+2...
    let offset = 1;
    while (s.size < V) {
      const a = current - offset;
      const b = current + offset;
      if (a >= 1) s.add(a);
      if (s.size >= V) break;
      if (b <= total) s.add(b);
      offset++;
      // si ambos fuera de rango, llenar desde beginning (por si current muy alto)
      if (a < 1 && b > total) break;
    }

    // si aún no lleno (por ejemplo current cerca de 1 y total no alcanzado), agregar desde el final-1, end-2 ...
    let fill = 1;
    while (s.size < V) {
      const candidate = total - fill;
      if (candidate >= 1) s.add(candidate);
      fill++;
      if (fill > total) break;
    }

    const arr = Array.from(s).sort((x, y) => x - y);
    // si por alguna razón arr.length > V eliminar desde el centro lejanos (mantener current,last)
    while (arr.length > V) {
      // eliminar el que esté más lejos de current y no sea total ni current
      let idxToRemove = -1;
      let maxDist = -1;
      for (let i = 0; i < arr.length; i++) {
        const val = arr[i];
        if (val === current || val === total) continue;
        const d = Math.abs(val - current);
        if (d > maxDist) { maxDist = d; idxToRemove = i; }
      }
      if (idxToRemove >= 0) arr.splice(idxToRemove, 1);
      else break;
    }

    return arr;
  }

  function renderPagination(container, pagesArray, origin, maxResults, current) {
    container.innerHTML = "";
    const frag = document.createDocumentFragment();

    for (let i = 0; i < pagesArray.length; i++) {
      const n = pagesArray[i];
      if (typeof n === "string") {
        // ellipsis string '...'
        const span = document.createElement("span");
        span.className = "pager-dots";
        span.textContent = "…";
        frag.appendChild(span);
        continue;
      }
      const a = document.createElement("a");
      a.textContent = String(n);
      a.href = buildPageUrl(origin, n, maxResults);
      if (n === current) a.className = "is-active";
      frag.appendChild(a);
      // if gap after this and next isn't contiguous, insert ellipsis (but ensure we keep total visible numbers = pagesArray.length)
      if (i < pagesArray.length - 1) {
        const nxt = pagesArray[i + 1];
        if (typeof nxt === "number" && nxt - n > 1) {
          const el = document.createElement("span");
          el.className = "pager-dots";
          // create a link to jump to page nearest to the gap (n + 1)
          const jumpPage = Math.min(n + 1, Math.max(1, nxt - 1));
          const link = document.createElement("a");
          link.href = buildPageUrl(origin, jumpPage, maxResults);
          link.className = "pager-dots";
          link.textContent = "…";
          frag.appendChild(link);
        }
      }
    }

    container.appendChild(frag);
  }

  // PUBLIC INIT
  function initPager() {
    const pagerEl = $(SEL.pager);
    const numbersEl = $(SEL.numbers);
    if (!pagerEl || !numbersEl) return;

    const origin = location.origin.replace(/\/$/, ""); // base origin
    const maxResults = findMaxResultsOnPage();

    // detect current page
    const currentPage = detectCurrentPage(maxResults, pagerEl);

    // requirement: mostrar numeración sólo desde página 2
    if (currentPage <= 1) {
      numbersEl.innerHTML = "";
      return;
    }

    // obtener totalPosts (intentamos fetch y JSONP)
    getTotalPosts(origin).then(totalPosts => {
      let totalPages = null;
      if (toInt(totalPosts, null) !== null) {
        totalPages = Math.max(1, Math.ceil(totalPosts / maxResults));
      } else {
        // intentar estimación por anchors
        totalPages = estimateTotalPagesFromAnchors(maxResults);
      }

      if (!totalPages || totalPages <= 1) {
        numbersEl.innerHTML = "";
        return;
      }

      // compute set of pages to show (exactly up to visibleCount)
      const pagesSet = computeSetIncludeCurrentAndLast(totalPages, currentPage, CONF.visibleCount);

      // ensure sorted ascending and convert to interleaved '...' if gaps exist
      const finalArr = [];
      for (let i = 0; i < pagesSet.length; i++) {
        finalArr.push(pagesSet[i]);
      }
      // finalArr currently sorted numbers; when rendering we'll create ellipsis where needed
      renderPagination(numbersEl, finalArr, origin, maxResults, currentPage);
    });
  }

  // Exponer global para poder invocarlo desde la consola si hace falta
  window.BloggerPager = window.BloggerPager || {};
  window.BloggerPager.init = initPager;
})();
