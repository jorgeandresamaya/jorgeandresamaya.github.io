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
/** Paginación numérica visible - Jorge Andrés Amaya - MIT **/
!function(root, factory) {
  if (typeof exports === "object" && typeof module !== "undefined") module.exports = factory();
  else if (typeof define === "function" && define.amd) define(factory);
  else (root = typeof globalThis !== "undefined" ? globalThis : root || self).BloggerPager = factory();
}(this, (function() {
  "use strict";

  // -----------------------
  // Configuración por defecto
  // -----------------------
  const DEFAULTS = {
    pagerSelector: "#blog-pager",
    numberSelector: "#numeracion-paginacion", // coincide con tu HTML
    numberClass: "pager-item",
    dotsClass: "pager-dots",
    activeClass: "is-active",
    totalVisibleNumbers: 5,    // <-- solicitado: 5 números visibles
    checkForUpdates: true,
    enableDotsJump: true,
    byDate: "false",
    maxResults: null,
    query: null,
    label: null,
    start: null,
    updatedMax: null
  };

  // -----------------------
  // Helper: parse strings como boolean/number/null
  // -----------------------
  function parseMaybe(v = "") {
    if (typeof v !== "string") return v;
    const s = v.trim();
    const map = { "true": true, "false": false, "null": null };
    if (s in map) return map[s];
    if (s === "") return null;
    return isNaN(s) ? s : Number(s);
  }

  // -----------------------
  // Helper: extrae params de URL actual
  // -----------------------
  function extractUrlParams(urlObj) {
    const sp = urlObj.searchParams;
    const pathname = urlObj.pathname;
    const keys = ["max-results", "by-date", "updated-max", "start", "q"];
    const out = Object.fromEntries(keys.map(k => {
      const key = k === "q" ? "query" : k.replace(/-([a-z])/g, (m, p) => p.toUpperCase());
      const v = sp.get(k);
      return v !== null ? [key, v] : null;
    }).filter(Boolean));
    // si URL contiene /search/label/<label>
    if (pathname.includes("/search/label/")) {
      out.label = pathname.split("/").pop();
    }
    return out;
  }

  // -----------------------
  // Helper: dataset -> config
  // -----------------------
  function datasetToConfig(container = {}) {
    const ds = container.dataset || {};
    const keys = ["numberClass", "dotsClass", "activeClass", "totalVisibleNumbers", "checkForUpdates", "enableDotsJump"];
    return Object.fromEntries(keys.filter(k => typeof ds[k] !== "undefined").map(k => [k, parseMaybe(ds[k])]));
  }

  // -----------------------
  // LocalStorage caching helpers (mantengo el enfoque original)
  // -----------------------
  const CACHE_KEY = "bloggerPagination";
  function readCache() {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (err) {
      console.warn("Invalid localStorage data, resetting cache", err);
      localStorage.removeItem(CACHE_KEY);
      return {};
    }
  }
  function hashString(s = "") {
    // djb2-like, salida en base36
    let h = 5381;
    for (let i = 0; i < s.length; i++) h = (h * 33) ^ s.charCodeAt(i);
    return (h >>> 0).toString(36);
  }
  function makeCacheKey(q = null, label = null) {
    return q ? `query${hashString(q)}` : label ? `label${hashString(label)}` : "all";
  }
  function writeCache(obj, q = null, label = null) {
    const key = makeCacheKey(q, label);
    const store = readCache();
    store[key] = obj;
    localStorage.setItem(CACHE_KEY, JSON.stringify(store));
  }
  function readCacheFor(q = null, label = null) {
    const key = makeCacheKey(q, label);
    return readCache()[key] || { totalPosts: 0, postDates: [], blogUpdated: null };
  }

  // -----------------------
  // Calculo: páginas totales
  // -----------------------
  function totalPages(totalPosts, perPage) {
    return Math.ceil(Number(totalPosts) / perPage);
  }

  // -----------------------
  // Construye URL para cada número de página (igual que tu original)
  // -----------------------
  function pageUrl({ config, number, postDates }) {
    const { homeUrl, label, query, maxResults, byDate } = config;
    if (number === 1) {
      // página 1 -> home o label/search base
      if (label) return `${homeUrl}/search/label/${label}?max-results=${maxResults}`;
      if (query) return `${homeUrl}/search?q=${query}&max-results=${maxResults}&by-date=${byDate}`;
      return homeUrl;
    }
    // para páginas > 1 intentamos usar updated-max (fecha) si existe en postDates
    const idx = (number - 1) * maxResults - 1; // igual cálculo que antes
    const dateToken = Array.isArray(postDates) && postDates[idx] ? encodeURIComponent(postDates[idx]) : null;
    if (!dateToken) return "#fetching";
    const prefix = label ? `${homeUrl}/search/label/${label}?` : (query ? `${homeUrl}/search?q=${query}&` : `${homeUrl}/search?`);
    return `${prefix}updated-max=${dateToken}&max-results=${maxResults}&start=${(number - 1) * maxResults}&by-date=${byDate}`;
  }

  // -----------------------
  // Generador de la secuencia de paginación (5 centrados, con dots y último siempre visible)
  // -----------------------
  function buildPagination({ config, currentPage, totalPagesCount }) {
    const visible = config.totalVisibleNumbers || DEFAULTS.totalVisibleNumbers;
    const activeClass = config.activeClass || DEFAULTS.activeClass;
    const half = Math.floor(visible / 2);
    let start = Math.max(currentPage - half, 1);
    let end = start + visible - 1;
    if (totalPagesCount <= visible) { start = 1; end = totalPagesCount; }
    else if (currentPage <= half) { start = 1; end = visible; }
    else if (currentPage >= totalPagesCount - half) { start = totalPagesCount - visible + 1; end = totalPagesCount; }
    // construir rango
    const range = Array.from({ length: (end - start + 1) }, (_, i) => start + i);

    const out = [];
    // si no incluye 1, agregar 1 y dots (que apunta a la página previa al inicio del rango)
    if (currentPage > 1 && !range.includes(1)) {
      out.push({ number: 1, activeClass: "" });
      out.push({ number: Math.max(range[0] - 1, 2), isDots: true });
    }
    // números visibles
    range.forEach(n => out.push({ number: n, activeClass: n === currentPage ? activeClass : "" }));
    // si no incluye último, agregar dots (apunta a siguiente después del fin del rango) y último
    if (currentPage < totalPagesCount && !range.includes(totalPagesCount)) {
      out.push({ number: Math.min(range[range.length - 1] + 1, totalPagesCount - 1), isDots: true });
      out.push({ number: totalPagesCount, activeClass: "" });
    }
    return out;
  }

  // -----------------------
  // Renderiza los elementos en el contenedor '#numeracion-paginacion'
  // -----------------------
  function renderPagination({ config, paginationData, postDates }) {
    if (!paginationData || !paginationData.length) return;
    const container = config.numberContainer;
    if (!container) return;
    const numberClass = config.numberClass || DEFAULTS.numberClass;
    const dotsClass = config.dotsClass || DEFAULTS.dotsClass;
    const enableDotsJump = config.enableDotsJump !== undefined ? config.enableDotsJump : DEFAULTS.enableDotsJump;

    const frag = document.createDocumentFragment();

    function createDotsElement(targetPage) {
      const el = document.createElement(enableDotsJump ? "button" : "span");
      el.className = dotsClass;
      el.textContent = "...";
      el.dataset.page = targetPage;
      if (enableDotsJump) {
        el.addEventListener("click", function(evt) {
          evt.preventDefault();
          // recalcular con la targetPage como current
          const total = totalPages((postDates && postDates.length) || 0, config.maxResults);
          const newPagination = buildPagination({ config, currentPage: Number(targetPage), totalPagesCount: total });
          renderPagination({ config, paginationData: newPagination, postDates });
        });
      }
      return el;
    }

    paginationData.forEach(item => {
      if (item.isDots) {
        frag.appendChild(createDotsElement(item.number));
      } else {
        const a = document.createElement("a");
        a.className = `${numberClass} ${item.activeClass || ""}`.trim();
        a.textContent = item.number;
        a.href = pageUrl({ config, number: item.number, postDates });
        frag.appendChild(a);
      }
    });

    container.innerHTML = "";
    container.appendChild(frag);
  }

  // -----------------------
  // Determina la "página actual" desde config (updatedMax/start) y oculta en home (página 1)
  // -----------------------
  function computeAndRender({ config, totalPosts, postDates }) {
    const perPage = config.maxResults;
    const total = totalPages(totalPosts, perPage);

    // lógica para obtener página actual basada en updatedMax / start (misma idea del original)
    const detected = (function localDetect({ config, postDates }) {
      const { query, maxResults, updatedMax, start } = config;
      if (!updatedMax && !start) return 1;
      // si updatedMax está en postDates, obtenemos su índice
      const idx = (postDates || []).filter((d, i) => ((i + 1) % maxResults) === 0).indexOf(updatedMax);
      // preferencia por start si existe; de lo contrario por updatedMax
      if (start && total) return Math.ceil(Number(start) / maxResults) + 1;
      if (idx !== -1) return idx + 2; // +2 por la forma en que se indexaba en original
      return 1;
    })({ config, postDates });

    // Si estamos en la primera página (home), NO mostrar numeración (requisito)
    if (Number(detected) === 1) {
      // asegúrate que el contenedor quede vacío
      if (config.numberContainer) config.numberContainer.innerHTML = "";
      return;
    }

    const paginationData = buildPagination({ config, currentPage: Number(detected), totalPagesCount: total });
    renderPagination({ config, paginationData, postDates });
  }

  // -----------------------
  // Clase principal (mantiene toda la lógica de fetch y cache del original)
  // -----------------------
  return class {
    constructor(options = {}) {
      this.currentUrl = new URL(window.location.href);
      this.config = Object.assign({}, DEFAULTS, options, extractUrlParams(this.currentUrl), { homeUrl: this.currentUrl.origin });
      // si hay variables globales definidas en tu template, úsalas
      if (!this.config.maxResults) this.config.maxResults = window.itemsPerPage || window.itemsPer_page || this.config.maxResults || 10;
      if (!this.config.totalVisibleNumbers) this.config.totalVisibleNumbers = window.pagesToShow || window.pages_to_show || this.config.totalVisibleNumbers;
      this.pagerContainer = document.querySelector(this.config.pagerSelector);
      this.numberContainer = document.querySelector(this.config.numberSelector);
      // exponer numberContainer en config para render
      this.config.numberContainer = this.numberContainer;
    }

    // read anchor inside pager to get max-results if present (igual que el original)
    readPagerMaxFromAnchors(container) {
      if (!container) return {};
      const a = Array.from(container.querySelectorAll("a")).find(x => x.href && x.href.includes("max-results="));
      if (!a) return {};
      const val = new URL(a.href).searchParams.get("max-results");
      return { maxResults: Number(val) };
    }

    // cache helpers reutilizados
    _loadCache(q, label) { return readCacheFor(q, label); }
    _saveCache(obj, q, label) { writeCache(obj, q, label); }

    async init() {
      try {
        // si no existen contenedores necesarios, nada que hacer
        if (!this.pagerContainer || !this.numberContainer) return;

        // merge dataset-based config and anchor-based config
        const datasetCfg = datasetToConfig(this.pagerContainer);
        const anchorCfg = this.readPagerMaxFromAnchors(this.pagerContainer);
        Object.assign(this.config, datasetCfg, anchorCfg);

        // si maxResults aún no está, fallback ya aplicado en constructor

        const { query, label, homeUrl } = this.config;
        const cached = this._loadCache(query, label);
        let { totalPosts, blogUpdated, postDates } = cached || { totalPosts: 0, blogUpdated: null, postDates: [] };

        const hasCachedDates = Array.isArray(postDates) && postDates.length > 0;

        // Si hay postDates en cache y ya podemos renderizar -> renderiza
        if (hasCachedDates) {
          computeAndRender({ config: this.config, totalPosts, postDates });
        }

        // Si checkForUpdates es true (ó si no hay cache), hacemos fetch al feed para asegurar actualizaciones
        if (!this.config.checkForUpdates && hasCachedDates) {
          // si no se chequea y ya hay cache, salir (comportamiento antiguo)
          if (this.config.maxResults >= totalPosts) {
            // si paginador no aplica, eliminar contenedor entero
            if (this.pagerContainer) this.pagerContainer.remove();
          }
          return;
        }

        // fetch resumen para obtener totalPosts y última actualización
        const feedSummaryUrl = `${homeUrl}/feeds/posts/summary/${label ? `-/${label}?` : "?"}alt=json&max-results=0`;
        const resSummary = await fetch(feedSummaryUrl);
        const jsonSummary = await resSummary.json();
        const remoteTotal = Number(jsonSummary.feed.openSearch$totalResults.$t || 0);
        const remoteUpdated = jsonSummary.feed.updated?$jsonSummary = jsonSummary.feed.updated.$t : (jsonSummary.feed.updated ? jsonSummary.feed.updated.$t : null);
        // fallback more robust:
        const remoteUpdatedSafe = jsonSummary.feed && jsonSummary.feed.updated ? jsonSummary.feed.updated.$t : null;

        if (remoteTotal) {
          // actualizamos cache.totalPosts si es query (en original había manejo especial)
          if (query) {
            cached.totalPosts = remoteTotal;
          }
        }
        if (remoteUpdatedSafe) {
          cached.blogUpdated = remoteUpdatedSafe;
        }
        // guardar temporalmente
        this._saveCache(cached, query, label);

        // Si el feed remoto indica cambios o no había postDates cacheados -> descargar posts para fechas
        if (cached.blogUpdated !== blogUpdated || !hasCachedDates) {
          // Obtener todas las fechas (paginando por bloques de 150)
          const perRequest = 150;
          const pagesToFetch = Math.ceil((remoteTotal || this.config.maxResults) / perRequest) || 0;
          const fetches = Array.from({ length: pagesToFetch }, (v, i) => {
            const startIndex = 150 * i + 1;
            const feedUrl = `${homeUrl}/feeds/posts/summary/${query ? `?q=${query}&orderby=${this.config.byDate === "false" ? "relevance" : "published"}&` : label ? `-/${label}?` : "?"}alt=json&max-results=${perRequest}&start-index=${startIndex}`;
            return fetch(feedUrl).then(r => r.json()).catch(() => ({ feed: { entry: [] } }));
          });

          const pagesJson = await Promise.all(fetches);
          const allDates = pagesJson.flatMap(pageJson => {
            const entries = pageJson.feed && pageJson.feed.entry ? pageJson.feed.entry : [];
            // published.$t con eliminación de miliseconds (igual que en original)
            return entries.map(en => en.published && en.published.$t ? en.published.$t.replace(/\.\d+/, "") : null).filter(Boolean);
          });

          // actualizar cache
          const cacheObj = readCacheFor(query, label);
          cacheObj.postDates = allDates;
          if (query) cacheObj.totalPosts = remoteTotal;
          cacheObj.blogUpdated = remoteUpdatedSafe || cacheObj.blogUpdated;
          writeCache(cacheObj, query, label);

          // finalmente renderizar con datos frescos
          computeAndRender({ config: this.config, totalPosts: cacheObj.totalPosts || remoteTotal || 0, postDates: cacheObj.postDates || allDates });
        }

        // Si hay un caso donde no se necesitan paginadores (maxResults >= total posts), remover contenedor completo
        const finalTotal = cached.totalPosts || remoteTotal || 0;
        if (this.config.maxResults >= finalTotal) {
          if (this.pagerContainer) this.pagerContainer.remove();
        }
      } catch (err) {
        console.warn("BloggerPager init error:", err);
      }
    }
  };

}));

// -----------------------
// Auto-inicialización segura
// -----------------------
(function tryAutoInit() {
  try {
    if (typeof window === "undefined") return;
    if (window.__BLOGGER_PAGER_AUTO_STARTED__) return;
    window.__BLOGGER_PAGER_AUTO_STARTED__ = true;
    window.addEventListener("DOMContentLoaded", function() {
      try {
        if (typeof BloggerPager === "function" || typeof BloggerPager === "object") {
          // si BloggerPager es la clase (función-constructor), instanciar
          try {
            const instance = new BloggerPager();
            if (instance && typeof instance.init === "function") instance.init();
          } catch (e) {
            // en algunos entornos globales el export puede ser directamente la clase, o bien un objeto que contiene la clase
            try {
              if (window.BloggerPager && typeof window.BloggerPager === "function") {
                new window.BloggerPager().init();
              }
            } catch (er) {
              console.warn("Auto-init fallback failed:", er);
            }
          }
        }
      } catch (e) {
        console.warn("Auto init error for BloggerPager:", e);
      }
    });
  } catch (e) {
    console.warn("Auto-init wrapper error:", e);
  }
})();
