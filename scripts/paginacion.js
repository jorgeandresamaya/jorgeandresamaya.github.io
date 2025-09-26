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
 * Paginación ligera para Blogger (numeración centrada, 5 números, visible desde página 2)
 * Compatible para home; enlaces generados con /search?max-results=...&start=...
 * Autor: adaptado para Jorge Andrés Amaya
 */
(function (global) {
  "use strict";

  const DEFAULTS = {
    pagerSelector: "#blog-pager",
    numberSelector: "#numeracion-paginacion",
    numberClass: "pager-item",
    dotsClass: "pager-dots",
    activeClass: "is-active",
    totalVisibleNumbers: 5, // solicitado: 5
    maxResultsDefault: 10,  // fallback si no se detecta
    feedPath: "/feeds/posts/summary", // para obtener totalPosts
    debug: true
  };

  function dbg() {
    if (DEFAULTS.debug && console && console.log) {
      console.log.apply(console, ["BloggerPager:"].concat(Array.from(arguments)));
    }
  }

  function qs(sel) { return document.querySelector(sel); }

  function parseIntSafe(v, fallback = null) {
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
  }

  function findMaxResults() {
    // Busca en enlaces existentes el parámetro max-results
    const anchors = Array.from(document.querySelectorAll("a[href*='max-results']"));
    for (const a of anchors) {
      try {
        const u = new URL(a.href, location.origin);
        const mr = u.searchParams.get("max-results") || u.searchParams.get("maxresults");
        const val = parseIntSafe(mr);
        if (val) return val;
      } catch (e) { /* ignore */ }
    }
    // fallback
    return DEFAULTS.maxResultsDefault;
  }

  function parseStartFromUrlStr(urlStr) {
    try {
      const u = new URL(urlStr, location.origin);
      const s = u.searchParams.get("start") || u.searchParams.get("start-index");
      return s ? parseIntSafe(s, null) : null;
    } catch (e) {
      return null;
    }
  }

  function computeVisibleRange(currentPage, totalPages, visibleCount) {
    // devuelve array de números o {isDots:true, number:marker}
    visibleCount = Math.max(3, visibleCount); // al menos 3
    const half = Math.floor(visibleCount / 2);
    let start = Math.max(1, currentPage - half);
    let end = Math.min(totalPages, start + visibleCount - 1);
    if (end - start + 1 < visibleCount) {
      start = Math.max(1, end - visibleCount + 1);
    }
    const arr = [];
    for (let i = start; i <= end; i++) arr.push(i);

    // insertar páginas 1 y última con puntos si corresponde
    const out = [];
    if (arr[0] > 1) {
      out.push(1);
      if (arr[0] > 2) out.push({ isDots: true, number: Math.max(arr[0] - 1, 2) });
    }
    arr.forEach(n => out.push(n));
    if (arr[arr.length - 1] < totalPages) {
      if (arr[arr.length - 1] < totalPages - 1) out.push({ isDots: true, number: Math.min(arr[arr.length - 1] + 1, totalPages - 1) });
      out.push(totalPages);
    }
    return out;
  }

  function buildPageUrl(homeOrigin, pageNumber, maxResults, label, query) {
    // Página 1 -> home
    if (pageNumber === 1) return homeOrigin;
    // Si hay label o query, crear el path adecuado (intento simple)
    if (label) {
      return `${homeOrigin}/search/label/${encodeURIComponent(label)}?max-results=${maxResults}&start=${(pageNumber - 1) * maxResults + 1}`;
    }
    if (query) {
      return `${homeOrigin}/search?q=${encodeURIComponent(query)}&max-results=${maxResults}&start=${(pageNumber - 1) * maxResults + 1}`;
    }
    return `${homeOrigin}/search?max-results=${maxResults}&start=${(pageNumber - 1) * maxResults + 1}`;
  }

  // Clase pública
  function BloggerPager(opts) {
    this.config = Object.assign({}, DEFAULTS, opts || {});
    this.pager = null;
    this.numberContainer = null;
  }

  BloggerPager.prototype.init = async function () {
    try {
      dbg("init start");
      this.pager = qs(this.config.pagerSelector);
      this.numberContainer = qs(this.config.numberSelector);

      if (!this.pager) {
        dbg("contenedor de paginación no encontrado con selector:", this.config.pagerSelector);
        return;
      }
      if (!this.numberContainer) {
        dbg("contenedor de numeración no encontrado con selector:", this.config.numberSelector);
        return;
      }

      const maxResults = findMaxResults();
      dbg("maxResults detectado:", maxResults);

      // Intentar obtener total posts mediante feed JSON (origen del blog)
      const homeOrigin = window.location.origin;
      const feedUrl = `${homeOrigin}${this.config.feedPath}?alt=json&max-results=0`;
      dbg("fetch feed:", feedUrl);

      let totalPosts = null;
      try {
        const resp = await fetch(feedUrl, { credentials: "same-origin" });
        if (!resp.ok) throw new Error("feed fetch status " + resp.status);
        const j = await resp.json();
        const t = j?.feed?.["openSearch$totalResults"]?.["$t"];
        totalPosts = parseIntSafe(t, null);
        dbg("totalPosts desde feed:", totalPosts);
      } catch (err) {
        dbg("No se pudo obtener totalPosts por fetch:", err);
        // no detenemos la ejecución: inferimos según enlaces
      }

      // totalPages según totalPosts (si no disponible, hacemos intento prudente)
      const pages = totalPosts ? Math.max(1, Math.ceil(totalPosts / maxResults)) : null;

      // Determinar current page usando params en URL (start / start-index) o por older-link
      let currentPage = 1;
      const uNow = new URL(window.location.href);
      const startParam = uNow.searchParams.get("start") || uNow.searchParams.get("start-index");
      if (startParam) {
        const s = parseIntSafe(startParam, null);
        if (s !== null) currentPage = Math.floor((s - 1) / maxResults) + 1;
      } else {
        // si no hay start en URL, intentar deducir por link "older"
        const older = this.pager.querySelector("a.blog-pager-older-link, a[href*='start'], a[href*='start-index']");
        if (older && older.href) {
          const s = parseStartFromUrlStr(older.href);
          if (s !== null) {
            // older.href apunta al inicio de la siguiente página:
            // olderStart = currentPage * maxResults + 1 => currentPage = (olderStart - 1) / maxResults
            currentPage = Math.floor((s - 1) / maxResults);
            if (currentPage < 1) currentPage = 1;
          }
        }
      }
      dbg("currentPage detectada:", currentPage);

      // Si no hay suficientes páginas o estamos en la primera página, limpiamos y no mostramos numeración
      if (pages !== null && pages <= 1) {
        dbg("única página detectada (or pages <=1). No se muestra numeración.");
        this.numberContainer.innerHTML = "";
        return;
      }
      if (currentPage <= 1) {
        // Requisito: solo mostrar numeración a partir de la segunda página
        dbg("Página 1: no se muestra numeración (requisito).");
        this.numberContainer.innerHTML = "";
        return;
      }

      // Si no tenemos totalPages por feed, intentamos estimar buscando el último enlace con start-index
      let totalPages = pages;
      if (!totalPages) {
        // buscar el enlace que contenga 'start' y sea mayor (posible último)
        const anchors = Array.from(document.querySelectorAll("a[href*='start'], a[href*='start-index']"));
        let maxStartFound = 0;
        anchors.forEach(a => {
          const s = parseStartFromUrlStr(a.href);
          if (s && s > maxStartFound) maxStartFound = s;
        });
        if (maxStartFound > 0) {
          totalPages = Math.max(2, Math.floor((maxStartFound - 1) / maxResults) + 1);
          dbg("totalPages estimado por anchors:", totalPages);
        } else {
          // como último recurso, suponer 10 páginas para mostrar algo razonable
          totalPages = Math.max(2, currentPage + 4);
          dbg("totalPages fallback:", totalPages);
        }
      }

      // Computar lista visible (incluye posibles objetos {isDots:true, number:...})
      const visible = computeVisibleRange(currentPage, totalPages, this.config.totalVisibleNumbers);
      dbg("rango visible:", visible);

      // Renderizar
      this.numberContainer.innerHTML = "";
      const frag = document.createDocumentFragment();

      visible.forEach(item => {
        if (typeof item === "object" && item.isDots) {
          const el = document.createElement("span");
          el.className = this.config.dotsClass;
          el.textContent = "...";
          // Si se desea saltar al segmento, convertir en enlace al número representado
          const jumpTo = item.number;
          if (jumpTo && jumpTo > 0) {
            const a = document.createElement("a");
            a.className = this.config.dotsClass;
            a.href = buildPageUrl(homeOrigin, jumpTo, maxResults, null, null);
            a.textContent = "...";
            frag.appendChild(a);
          } else {
            frag.appendChild(el);
          }
        } else {
          const n = Number(item);
          const a = document.createElement("a");
          a.className = `${this.config.numberClass} ${n === currentPage ? this.config.activeClass : ""}`.trim();
          a.textContent = String(n);
          a.href = buildPageUrl(homeOrigin, n, maxResults, null, null);
          frag.appendChild(a);
        }
      });

      this.numberContainer.appendChild(frag);
      dbg("numeración renderizada correctamente.");

    } catch (ex) {
      dbg("Error en init:", ex);
    }
  };

  // Exponer globalmente
  global.BloggerPager = BloggerPager;

})(this);
