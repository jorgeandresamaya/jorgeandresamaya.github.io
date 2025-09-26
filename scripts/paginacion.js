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
(function () {
  const config = {
    pagerSelector: "#blog-pager",
    numberSelector: "#numeracion-paginacion",
    numberClass: "pager-item",
    dotsClass: "pager-dots",
    activeClass: "is-active",
    totalVisibleNumbers: 5,
    maxResults: 10
  };

  const getCurrentPage = () => {
    const url = new URL(location.href);
    const updatedMax = url.searchParams.get("updated-max");
    const start = url.searchParams.get("start");
    if (!updatedMax && !start) return 1;
    const startIndex = parseInt(start || "0", 10);
    return Math.floor(startIndex / config.maxResults) + 2;
  };

  const getTotalPosts = async () => {
    const feedUrl = "/feeds/posts/summary?alt=json&max-results=0";
    const response = await fetch(feedUrl);
    const data = await response.json();
    return parseInt(data.feed.openSearch$totalResults.$t, 10);
  };

  const getPostDates = async (totalPosts) => {
    const batchSize = 150;
    const batches = Math.ceil(totalPosts / batchSize);
    const allDates = [];

    for (let i = 0; i < batches; i++) {
      const startIndex = i * batchSize + 1;
      const url = `/feeds/posts/summary?alt=json&max-results=${batchSize}&start-index=${startIndex}`;
      const response = await fetch(url);
      const data = await response.json();
      const entries = data.feed.entry || [];
      entries.forEach(entry => {
        allDates.push(entry.published.$t.replace(/\.\d+/, ""));
      });
    }

    return allDates;
  };

  const buildPageUrl = (pageNumber, postDates) => {
    if (pageNumber === 1) return "/";
    const index = (pageNumber - 1) * config.maxResults - 1;
    const date = encodeURIComponent(postDates[index]);
    const start = (pageNumber - 1) * config.maxResults;
    return `/search?updated-max=${date}&max-results=${config.maxResults}&start=${start}&by-date=false`;
  };

  const renderPagination = (currentPage, totalPages, postDates) => {
    const container = document.querySelector(config.numberSelector);
    if (!container) return;

    if (location.pathname === "/") {
      container.style.display = "none";
      return;
    }

    const half = Math.floor(config.totalVisibleNumbers / 2);
    let start = Math.max(currentPage - half, 1);
    let end = Math.min(start + config.totalVisibleNumbers - 1, totalPages);
    if (end - start < config.totalVisibleNumbers - 1) {
      start = Math.max(end - config.totalVisibleNumbers + 1, 1);
    }

    const fragment = document.createDocumentFragment();

    if (start > 1) {
      const first = document.createElement("a");
      first.className = config.numberClass;
      first.textContent = "1";
      first.href = buildPageUrl(1, postDates);
      fragment.appendChild(first);

      const dots = document.createElement("span");
      dots.className = config.dotsClass;
      dots.textContent = "...";
      fragment.appendChild(dots);
    }

    for (let i = start; i <= end; i++) {
      const link = document.createElement("a");
      link.className = config.numberClass + (i === currentPage ? ` ${config.activeClass}` : "");
      link.textContent = i;
      link.href = buildPageUrl(i, postDates);
      fragment.appendChild(link);
    }

    if (end < totalPages) {
      const dots = document.createElement("span");
      dots.className = config.dotsClass;
      dots.textContent = "...";
      fragment.appendChild(dots);

      const last = document.createElement("a");
      last.className = config.numberClass;
      last.textContent = totalPages;
      last.href = buildPageUrl(totalPages, postDates);
      fragment.appendChild(last);
    }

    container.innerHTML = "";
    container.appendChild(fragment);
  };

  const initPagination = async () => {
    const pager = document.querySelector(config.pagerSelector);
    if (!pager) return;

    const totalPosts = await getTotalPosts();
    const postDates = await getPostDates(totalPosts);
    const totalPages = Math.ceil(totalPosts / config.maxResults);
    const currentPage = getCurrentPage();

    renderPagination(currentPage, totalPages, postDates);
  };

  window.addEventListener("DOMContentLoaded", initPagination);
})();
