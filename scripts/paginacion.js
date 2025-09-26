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
/* BloggerPager - versión resiliente (muestra 5 números y reintenta si el DOM no está listo) */

(function () {
  const config = {
    pagerSelector: "#blog-pager",
    numberSelector: "#numeracion-paginacion",
    numberClass: "pager-item",
    dotsClass: "pager-dots",
    activeClass: "is-active",
    totalVisibleNumbers: 5,
    checkForUpdates: true,
    enableDotsJump: true,
    byDate: "false",
  };

  function getParams() {
    const url = new URL(location.href);
    const params = new URLSearchParams(url.search);
    return {
      maxResults: parseInt(params.get("max-results")) || 10,
      start: parseInt(params.get("start")) || 0,
      updatedMax: params.get("updated-max"),
      label: url.pathname.includes("/search/label/") ? decodeURIComponent(url.pathname.split("/").pop()) : null,
      query: params.get("q"),
    };
  }

  function getCurrentPage(start, maxResults) {
    return start ? Math.floor(start / maxResults) + 2 : 1;
  }

  function getTotalPages(totalPosts, maxResults) {
    return Math.ceil(totalPosts / maxResults);
  }

  function buildUrl(page, totalPosts, maxResults, label, query, byDate) {
    const base = location.origin;
    if (page === 1) {
      return label
        ? `${base}/search/label/${label}?max-results=${maxResults}`
        : query
        ? `${base}/search?q=${query}&max-results=${maxResults}&by-date=${byDate}`
        : base;
    }
    const index = (page - 1) * maxResults - 1;
    const updatedMax = window.postDates?.[index];
    if (!updatedMax) return "#";
    const path = label
      ? `/search/label/${label}?`
      : query
      ? `/search?q=${query}&`
      : "/search?";
    return `${base}${path}updated-max=${encodeURIComponent(updatedMax)}&max-results=${maxResults}&start=${(page - 1) * maxResults}&by-date=${byDate}`;
  }

  function renderPagination(container, currentPage, totalPages) {
    if (currentPage === 1) return;

    const visible = config.totalVisibleNumbers;
    const half = Math.floor(visible / 2);
    let start = Math.max(currentPage - half, 2);
    let end = Math.min(start + visible - 1, totalPages);

    if (end - start < visible - 1) {
      start = Math.max(end - visible + 1, 2);
    }

    const fragment = document.createDocumentFragment();

    if (start > 2) {
      const first = createLink(2, currentPage);
      const dots = createDots(Math.max(currentPage - visible, 2));
      fragment.appendChild(first);
      fragment.appendChild(dots);
    }

    for (let i = start; i <= end; i++) {
      fragment.appendChild(createLink(i, currentPage));
    }

    if (end < totalPages) {
      const dots = createDots(Math.min(currentPage + visible, totalPages));
      const last = createLink(totalPages, currentPage);
      fragment.appendChild(dots);
      fragment.appendChild(last);
    }

    container.innerHTML = "";
    container.appendChild(fragment);
  }

  function createLink(page, currentPage) {
    const a = document.createElement("a");
    a.className = config.numberClass + (page === currentPage ? ` ${config.activeClass}` : "");
    a.textContent = page;
    a.href = buildUrl(page, window.totalPosts, config.maxResults, config.label, config.query, config.byDate);
    return a;
  }

  function createDots(targetPage) {
    const span = document.createElement(config.enableDotsJump ? "button" : "span");
    span.className = config.dotsClass;
    span.textContent = "...";
    if (config.enableDotsJump) {
      span.addEventListener("click", () => {
        location.href = buildUrl(targetPage, window.totalPosts, config.maxResults, config.label, config.query, config.byDate);
      });
    }
    return span;
  }

  async function fetchPostDates(totalPosts, label, query) {
    const base = location.origin;
    const pages = Math.ceil(totalPosts / 150);
    const dates = [];

    for (let i = 0; i < pages; i++) {
      const start = i * 150 + 1;
      const url = label
        ? `${base}/feeds/posts/summary/-/${label}?alt=json&max-results=150&start-index=${start}`
        : query
        ? `${base}/feeds/posts/summary?q=${query}&orderby=published&alt=json&max-results=150&start-index=${start}`
        : `${base}/feeds/posts/summary?alt=json&max-results=150&start-index=${start}`;

      const res = await fetch(url);
      const json = await res.json();
      const entries = json.feed.entry || [];
      entries.forEach(entry => {
        dates.push(entry.published.$t.replace(/\.\d+/, ""));
      });
    }

    return dates;
  }

  async function init() {
    const pager = document.querySelector(config.pagerSelector);
    const numberBox = document.querySelector(config.numberSelector);
    if (!pager || !numberBox) return;

    const params = getParams();
    config.maxResults = params.maxResults;
    config.label = params.label;
    config.query = params.query;

    const url = params.label
      ? `${location.origin}/feeds/posts/summary/-/${params.label}?alt=json&max-results=0`
      : params.query
      ? `${location.origin}/feeds/posts/summary?q=${params.query}&alt=json&max-results=0`
      : `${location.origin}/feeds/posts/summary?alt=json&max-results=0`;

    const res = await fetch(url);
    const json = await res.json();
    const totalPosts = parseInt(json.feed.openSearch$totalResults.$t);
    window.totalPosts = totalPosts;

    if (totalPosts <= config.maxResults) return;

    const postDates = await fetchPostDates(totalPosts, config.label, config.query);
    window.postDates = postDates;

    const currentPage = getCurrentPage(params.start, config.maxResults);
    const totalPages = getTotalPages(totalPosts, config.maxResults);

    renderPagination(numberBox, currentPage, totalPages);
  }

  init();
})();
