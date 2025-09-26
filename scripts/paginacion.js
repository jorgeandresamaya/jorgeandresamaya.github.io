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
!function(t,e){
  "object"==typeof exports&&"undefined"!=typeof module?module.exports=e():
  "function"==typeof define&&define.amd?define(e):
  (t="undefined"!=typeof globalThis?globalThis:t||self).BloggerPager=e()
}(this,(function(){
  "use strict";

  const configDefaults = {
    pagerSelector: "#blog-pager",
    numberSelector: "#numeracion-paginacion",
    numberClass: "pager-item",
    dotsClass: "pager-dots",
    activeClass: "is-active",
    totalVisibleNumbers: 5,
    checkForUpdates: true,
    enableDotsJump: true,
    byDate: "false",
    maxResults: null,
    query: null,
    label: null,
    start: null,
    updatedMax: null
  };

  function buildPagination({config, currentPage, totalPages}) {
    const { totalVisibleNumbers, activeClass } = config;
    const half = Math.floor(totalVisibleNumbers / 2);
    let start = Math.max(currentPage - half, 1);
    let end = Math.min(start + totalVisibleNumbers - 1, totalPages);

    if (totalPages <= totalVisibleNumbers) {
      start = 1;
      end = totalPages;
    } else if (currentPage <= half) {
      start = 1;
      end = totalVisibleNumbers;
    } else if (currentPage >= totalPages - half) {
      start = totalPages - totalVisibleNumbers + 1;
      end = totalPages;
    }

    const range = Array.from({ length: end - start + 1 }, (_, i) => start + i);
    const items = range.map(n => ({
      number: n,
      activeClass: n === currentPage ? activeClass : ""
    }));

    if (currentPage > 1 && !range.includes(1)) {
      items.unshift({ number: 1, activeClass: "" }, { number: Math.max(start - half, 1), isDots: true });
    }

    if (currentPage < totalPages && !range.includes(totalPages)) {
      items.push({ number: Math.min(end + half, totalPages), isDots: true }, { number: totalPages, activeClass: "" });
    }

    return items;
  }

  function parseBool(val) {
    const map = { true: true, false: false, null: null };
    return val in map ? map[val] : isNaN(val) ? (val === "" ? null : val) : Number(val);
  }

  function extractParams(url) {
    const params = url.searchParams;
    const path = url.pathname;
    const result = Object.fromEntries(["max-results", "by-date", "updated-max", "start", "q"].map(key => {
      const prop = key === "q" ? "query" : key.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
      const value = params.get(key);
      return value !== null ? [prop, value] : null;
    }).filter(Boolean));

    if (path.includes("/search/label/")) {
      result.label = path.split("/").pop();
    }

    return result;
  }

  function extractDataset({ dataset = {} } = {}) {
    return Object.fromEntries([
      "numberClass", "dotsClass", "activeClass", "totalVisibleNumbers", "checkForUpdates", "enableDotsJump"
    ].filter(key => dataset[key] !== undefined).map(key => [key, parseBool(dataset[key])]));
  }

  function extractMaxResults(container) {
    const link = Array.from(container.querySelectorAll("a")).find(a => a.href.includes("max-results="));
    if (!link) return {};
    const max = new URL(link.href).searchParams.get("max-results");
    return { maxResults: Number(max) };
  }

  const cacheKey = "bloggerPagination";

  function getCache() {
    try {
      const raw = localStorage.getItem(cacheKey);
      return raw ? JSON.parse(raw) : {};
    } catch (err) {
      console.warn("Invalid localStorage data, resetting cache", err);
      localStorage.removeItem(cacheKey);
      return {};
    }
  }

  function hash(str) {
    let h = 5381;
    for (let i = 0; i < str.length; i++) h = 33 * h ^ str.charCodeAt(i);
    return (h >>> 0).toString(36);
  }

  function getKey(query = null, label = null) {
    return query ? `query${hash(query)}` : label ? `label${hash(label)}` : "all";
  }

  function setCache(data, query = null, label = null) {
    const key = getKey(query, label);
    const cache = getCache();
    cache[key] = data;
    localStorage.setItem(cacheKey, JSON.stringify(cache));
  }

  function getCachedData(query = null, label = null) {
    return getCache()[getKey(query, label)] || { totalPosts: 0, postDates: [], blogUpdated: null };
  }

  function getTotalPages(totalPosts, maxResults) {
    return Math.ceil(Number(totalPosts) / maxResults);
  }

  function buildPageUrl({ config, number, postDates }) {
    const { homeUrl, label, query, maxResults, byDate } = config;

    if (number === 1) {
      return label ? `${homeUrl}/search/label/${label}?max-results=${maxResults}` :
             query ? `${homeUrl}/search?q=${query}&max-results=${maxResults}&by-date=${byDate}` :
             homeUrl;
    }

    const updatedMax = (() => {
      const index = (number - 1) * maxResults - 1;
      return Array.isArray(postDates) && postDates[index] ? encodeURIComponent(postDates[index]) : null;
    })();

    return updatedMax ? `${homeUrl}${label ? `/search/label/${label}?` : query ? `/search?q=${query}&` : "/search?"}updated-max=${updatedMax}&max-results=${maxResults}&start=${(number - 1) * maxResults}&by-date=${byDate}` : "#fetching";
  }

  function renderPagination({ config, paginationData, postDates }) {
    if (!paginationData.length) return;
    const { numberContainer, numberClass, dotsClass, enableDotsJump } = config;
    const fragment = document.createDocumentFragment();

    paginationData.forEach(item => {
      if (item.isDots) {
        const el = document.createElement(enableDotsJump ? "button" : "span");
        el.className = dotsClass;
        el.textContent = "...";
        el.dataset.page = item.number;
        if (enableDotsJump) {
          el.addEventListener("click", e => {
            e.preventDefault();
            const totalPages = getTotalPages(postDates.length, config.maxResults);
            renderPagination({
              config,
              paginationData: buildPagination({ config, currentPage: item.number, totalPages }),
              postDates
            });
          });
        }
        fragment.appendChild(el);
      } else {
        const link = document.createElement("a");
        link.className = `${numberClass} ${item.activeClass}`.trim();
        link.textContent = item.number;
        link.href = buildPageUrl({ config, number: item.number, postDates });
        fragment.appendChild(link);
      }
    });

    numberContainer.innerHTML = "";
    numberContainer.appendChild(fragment);
  }

  function renderIfNeeded({ config, totalPosts, postDates }) {
    const totalPages = getTotalPages(totalPosts, config.maxResults);
    const currentPage = (() => {
      const { query, maxResults, updatedMax, start } = config;
      if (!updatedMax && !start) return 1;
      const index = postDates.filter((_, i) => (i + 1) % maxResults === 0).indexOf(updatedMax);
      return (start && query) ? Math.ceil(start / maxResults) + 1 : (index !== -1 ? index + 2 : 1);
    })();

    if (currentPage > 1) {
      renderPagination({
        config,
        paginationData: buildPagination({ config, currentPage, totalPages }),
        postDates
      });
    }
  }

  return class {
    constructor(options = {}) {
      const url = new URL(window.location.href);
      this.config = {
        ...configDefaults,
        ...options,
        ...extractParams(url),
        homeUrl: url.origin
      };
      this.pagerContainer = document.querySelector(this.config.pagerSelector);
      this.numberContainer = document.querySelector(this.config.numberSelector);
    }

    async init() {
      if (!this.pagerContainer || !
