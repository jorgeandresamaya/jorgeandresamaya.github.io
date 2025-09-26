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
(function (global, factory) {
  if (typeof exports === 'object' && typeof module !== 'undefined') module.exports = factory();
  else if (typeof define === 'function' && define.amd) define(factory);
  else (global = typeof globalThis !== 'undefined' ? globalThis : global || self).BloggerPager = factory();
})(this, (function () {
  'use strict';

  // --- Defaults (adaptado) ---
  const defaults = {
    pagerSelector: "#blog-pager",
    numberSelector: "#numeracion-paginacion", // adaptado a tu HTML
    numberClass: "pager-item",
    dotsClass: "pager-dots",
    activeClass: "is-active",
    totalVisibleNumbers: 5, // ahora muestra 5 números
    checkForUpdates: true,
    enableDotsJump: true,
    byDate: "false",
    maxResults: null,
    query: null,
    label: null,
    start: null,
    updatedMax: null
  };

  // --- Helpers (mismos comportamientos del script original) ---
  function buildPaginationData({config, currentPage, totalPages}) {
    const { totalVisibleNumbers, activeClass } = config;
    const range = (function ({ currentPage, totalPages, totalVisibleNumbers }) {
      const total = totalPages;
      const half = Math.floor(totalVisibleNumbers / 2);
      let start = Math.max(currentPage - half, 1);
      let end = Math.min(start + totalVisibleNumbers - 1, total);
      if (total <= totalVisibleNumbers) {
        start = 1; end = total;
      } else if (currentPage <= half) {
        start = 1; end = totalVisibleNumbers;
      } else if (currentPage >= total - half) {
        start = total - totalVisibleNumbers + 1; end = total;
      }
      return Array.from({ length: end - start + 1 }, (_, i) => start + i);
    })({ currentPage, totalPages, totalVisibleNumbers });

    const side = Math.floor(totalVisibleNumbers / 2);
    const makeDots = num => ({ number: num, isDots: true });
    const items = range.map(n => ({ number: n, activeClass: n === currentPage ? activeClass : "" }));

    if (currentPage > 1 && !range.includes(1)) {
      items.unshift(makeDots(Math.max(range[0] + 1 - side, 1)));
      items.unshift({ number: 1, activeClass: "" });
    }
    if (currentPage < totalPages && !range.includes(totalPages)) {
      items.push(makeDots(Math.min(range[range.length - 1] + side, totalPages)));
      items.push({ number: totalPages, activeClass: "" });
    }
    return items;
  }

  function parseBoolOrNum(value) {
    if (value == null) return null;
    const v = String(value).trim();
    const map = { "true": true, "false": false, "null": null };
    if (v in map) return map[v];
    return isNaN(v) ? (v === "" ? null : v) : Number(v);
  }

  function parseUrlParams(url) {
    const params = url.searchParams;
    const pathname = url.pathname;
    const keys = ["max-results", "by-date", "updated-max", "start", "q"];
    const obj = Object.fromEntries(keys
      .map(key => {
        const name = key === "q" ? "query" : key.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
        const val = params.get(key);
        return val !== null ? [name, val] : null;
      })
      .filter(Boolean));
    if (pathname.includes("/search/label/")) {
      obj.label = pathname.split("/").pop();
    }
    return obj;
  }

  function datasetOverrides({ dataset = {} } = {}) {
    const keys = ["numberClass", "dotsClass", "activeClass", "totalVisibleNumbers", "checkForUpdates", "enableDotsJump"];
    return Object.fromEntries(keys.filter(k => dataset[k] !== undefined).map(k => [k, parseBoolOrNum(dataset[k])]));
  }

  function extractMaxResultsFromPager(pagerNode) {
    const a = Array.from(pagerNode.querySelectorAll("a")).find(a => a.href.includes("max-results="));
    if (!a) return {};
    const n = new URL(a.href).searchParams.get("max-results");
    return { maxResults: Number(n) };
  }

  // localStorage caching (same clave que el original)
  const STORAGE_KEY = "bloggerPagination";
  function readCache() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (err) {
      console.warn("Invalid localStorage data, resetting cache", err);
      localStorage.removeItem(STORAGE_KEY);
      return {};
    }
  }
  function hashString(s) {
    let h = 5381;
    for (let i = 0; i < s.length; i++) h = 33 * h ^ s.charCodeAt(i);
    return (h >>> 0).toString(36);
  }
  function cacheKey(query, label) {
    return query ? `query${hashString(query)}` : label ? `label${hashString(label)}` : "all";
  }
  function saveCache(obj, query = null, label = null) {
    const key = cacheKey(query, label);
    const data = readCache();
    data[key] = obj;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }
  function readCachedEntry(query = null, label = null) {
    const key = cacheKey(query, label);
    return readCache()[key] || { totalPosts: 0, postDates: [], blogUpdated: null };
  }

  function pagesCount(total, perPage) {
    return Math.ceil(Number(total) / perPage);
  }

  function buildPageUrl({ config, number, postDates }) {
    const { homeUrl, label, query, maxResults, byDate } = config;
    if (number === 1) {
      if (label) return `${homeUrl}/search/label/${label}?max-results=${maxResults}`;
      if (query) return `${homeUrl}/search?q=${query}&max-results=${maxResults}&by-date=${byDate}`;
      return homeUrl;
    }
    // updated-max for jumping
    const updated = (function (page, dates, per) {
      const idx = (page - 1) * per - 1;
      return Array.isArray(dates) && dates[idx] ? encodeURIComponent(dates[idx]) : null;
    })(number, postDates, maxResults);
    if (!updated) return "#fetching";
    const prefix = label ? `${homeUrl}/search/label/${label}?` : query ? `${homeUrl}/search?q=${query}&` : `${homeUrl}/search?`;
    return `${prefix}updated-max=${updated}&max-results=${maxResults}&start=${(number - 1) * maxResults}&by-date=${byDate}`;
  }

  function renderNumbers({ config, paginationData, postDates }) {
    if (!paginationData.length) return;
    const { numberContainer, numberClass, dotsClass, enableDotsJump } = config;
    const frag = document.createDocumentFragment();

    const createDots = (pageNum) => {
      const el = document.createElement(enableDotsJump ? "button" : "span");
      el.className = dotsClass;
      el.textContent = "...";
      el.dataset.page = pageNum;
      if (enableDotsJump) {
        el.addEventListener("click", (ev) => {
          ev.preventDefault();
          // recreate pagination around the target page
          const targetPage = Number(ev.currentTarget.dataset.page) || pageNum;
          renderNumbers({
            config,
            paginationData: buildPaginationData({ config, currentPage: targetPage, totalPages: pagesCount(postDates.length, config.maxResults) }),
            postDates
          });
        });
      }
      return el;
    };

    paginationData.forEach(item => {
      if (item.isDots) frag.appendChild(createDots(item.number));
      else {
        const a = document.createElement("a");
        a.className = `${numberClass} ${item.activeClass}`.trim();
        a.textContent = item.number;
        a.href = buildPageUrl({ config, number: item.number, postDates });
        frag.appendChild(a);
      }
    });

    numberContainer.innerHTML = "";
    numberContainer.appendChild(frag);
  }

  function initPagination({ config, totalPosts, postDates }) {
    if (!postDates || !postDates.length) return;
    const { maxResults } = config;
    const totalPages = pagesCount(totalPosts, maxResults);
    // determine current page by updated-max/start logic from original:
    const current = (function ({ config, postDates }) {
      const { updatedMax, start, maxResults, query } = config;
      if (!updatedMax && !start) return 1;
      const index = postDates.filter((d, i) => ((i + 1) % maxResults) === 0).indexOf(updatedMax);
      if (start && query) return Math.ceil(start / maxResults) + 1;
      if (index !== -1) return index + 2;
      return 1;
    })({ config, postDates });
    const pdata = buildPaginationData({ config, currentPage: current, totalPages });
    renderNumbers({ config: config, paginationData: pdata, postDates });
  }

  // --- Clase principal (igual que el original, con robusteces añadidas) ---
  return class BloggerPager {
    constructor(options = {}) {
      this.currentUrl = new URL(window.location.href);
      this.config = Object.assign({}, defaults, options, parseUrlParams(this.currentUrl), { homeUrl: this.currentUrl.origin });
      // DOM nodes (buscar el contenedor principal)
      this.pagerContainer = document.querySelector(this.config.pagerSelector);
      this.numberContainer = document.querySelector(this.config.numberSelector);

      // --- FALLBACK: si no existe #numeracion-paginacion -> intentar pager antiguo -> crear el contenedor ---
      if (!this.numberContainer && this.pagerContainer) {
        // Try common alternatives inside pager
        this.numberContainer = this.pagerContainer.querySelector('#numeracion-paginacion') ||
          this.pagerContainer.querySelector('#pager-numbers') ||
          document.querySelector('#numeracion-paginacion') ||
          document.querySelector('#pager-numbers') || null;

        if (!this.numberContainer) {
          // create it and insert between links (so it inherits centering)
          const div = document.createElement('div');
          const idName = (this.config.numberSelector && this.config.numberSelector.startsWith('#')) ? this.config.numberSelector.slice(1) : (this.config.numberSelector || 'numeracion-paginacion');
          div.id = idName;
          // place it before the "older" link if exists, otherwise append
          const older = this.pagerContainer.querySelector('.blog-pager-older-link');
          this.pagerContainer.insertBefore(div, older || null);
          this.numberContainer = div;
        }
      }
    }

    async init() {
      // if required nodes are missing, stop
      if (!this.pagerContainer || !this.numberContainer) return;

      const { query, label, homeUrl } = this.config;
      // load cached data
      const cached = readCachedEntry(query, label);
      const { totalPosts, blogUpdated, postDates } = cached;

      // merges dataset overrides from pager node and any max-results from pager anchors
      const configFromPager = Object.assign({}, extractMaxResultsFromPager(this.pagerContainer), datasetOverrides(this.pagerContainer));
      const cfg = Object.assign({}, this.config, configFromPager, { numberContainer: this.numberContainer });

      // if we have dates, render them and possibly stop (respect checkForUpdates)
      if (postDates && postDates.length) {
        initPagination({ config: cfg, totalPosts: cached.totalPosts, postDates: cached.postDates });
        if (!cfg.checkForUpdates) {
          if (cfg.maxResults >= cached.totalPosts) this.pagerContainer.remove();
          return;
        }
      }

      // fetch feed summary to get latest updated time & total posts
      const feedInfo = await (async function ({ homeUrl, query, label }) {
        const feedUrl = `${homeUrl}/feeds/posts/summary/${label ? `-/${label}?` : "?"}alt=json&max-results=0`;
        const res = await fetch(feedUrl);
        const j = await res.json();
        const total = Number(j.feed.openSearch$totalResults.$t);
        const updated = j.feed.updated.$t;
        const stored = readCachedEntry(query, label);
        if (!query) stored.totalPosts = total;
        stored.blogUpdated = updated;
        saveCache(stored, query, label);
        return { totalPosts: total, blogUpdated: updated };
      })({ homeUrl, query, label });

      // if feed updated or no cached dates -> fetch all dates in batches
      if (feedInfo.blogUpdated !== blogUpdated || !postDates || !postDates.length) {
        const list = await (async function ({ config, totalPosts }) {
          const { homeUrl, query, label, byDate } = config;
          if (totalPosts === 0) return [];
          const batches = Math.ceil(totalPosts / 150);
          const requests = Array.from({ length: batches }, (_, i) =>
            fetch(`${homeUrl}/feeds/posts/summary/${query ? `?q=${query}&orderby=${byDate === false ? "relevance" : "published"}&` : label ? `-/${label}?` : "?"}alt=json&max-results=150&start-index=${150 * i + 1}`)
              .then(r => r.json())
          );
          const results = await Promise.all(requests);
          const dates = results.flatMap(r => (query && r.feed ? Number(r.feed.openSearch$totalResults.$t) : 0, r.feed.entry ? r.feed.entry.map(e => e.published.$t.replace(/\.\d+/, "")) : []));
          const cacheEntry = readCachedEntry(query, label);
          cacheEntry.postDates = dates;
          if (query) {
            // recalcular total posts si es búsqueda
            cacheEntry.totalPosts = results.reduce((acc, r) => acc + (r.feed ? Number(r.feed.openSearch$totalResults.$t) : 0), 0);
          }
          saveCache(cacheEntry, query, label);
          return { totalPosts: cacheEntry.totalPosts || totalPosts, postDates: dates };
        })({ config: cfg, totalPosts: feedInfo.totalPosts });

        // render with freshly fetched data
        initPagination({ config: cfg, totalPosts: list.totalPosts, postDates: list.postDates });
      }

      // if maxResults config means only one page, remove pager to avoid showing it
      if (cfg.maxResults >= (totalPosts || feedInfo.totalPosts)) {
        try { this.pagerContainer.remove(); } catch (err) { /* ignore */ }
      }
    }
  };
}));

// Auto-init: (si el archivo se carga directamente en el navegador, se auto-arranca)
try {
  if (typeof window !== 'undefined' && window.BloggerPager) {
    // si el UMD ya ha puesto BloggerPager en global, use la clase global
    const Cls = window.BloggerPager;
    // instancia por defecto (sin opciones) y arranca
    new Cls().init && new Cls().init();
  }
} catch (err) {
  // no hacer nada si falla la auto-inicialización
}
