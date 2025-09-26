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
(function () {
  const itemsPerPage = typeof window.itemsPerPage !== "undefined" ? window.itemsPerPage : 10;
  const pagesToShow = 5;
  const containerId = "numeracion-paginacion";
  const currentPage = location.href.includes("#PageNo=")
    ? parseInt(location.href.split("#PageNo=")[1], 10)
    : 1;

  if (currentPage === 1) return;

  const feedUrl = `${location.origin}/feeds/posts/summary?alt=json-in-script&max-results=1&callback=renderPagination`;

  const script = document.createElement("script");
  script.src = feedUrl;
  document.body.appendChild(script);

  window.renderPagination = function (data) {
    const totalPosts = parseInt(data.feed.openSearch$totalResults.$t, 10);
    const totalPages = Math.ceil(totalPosts / itemsPerPage);
    if (totalPages <= 1) return;

    let html = "";
    let left = Math.floor(pagesToShow / 2);
    let start = Math.max(currentPage - left, 2);
    let end = Math.min(start + pagesToShow - 1, totalPages);

    if (end - start < pagesToShow - 1) {
      start = Math.max(end - pagesToShow + 1, 2);
    }

    if (start > 2) {
      html += pageLink(1);
      if (start > 3) html += ellipsis();
    }

    for (let i = start; i <= end; i++) {
      html += i === currentPage ? current(i) : pageLink(i);
    }

    if (end < totalPages - 1) html += ellipsis();
    if (end < totalPages) html += pageLink(totalPages);

    const container = document.getElementById(containerId);
    if (container) {
      container.innerHTML = `<div style="text-align:center;">${html}</div>`;
    }
  };

  function pageLink(page) {
    const url = `${location.origin}/search?updated-max=${new Date().toISOString()}&max-results=${itemsPerPage}#PageNo=${page}`;
    return `<span class="pagenumber"><a href="${url}">${page}</a></span>`;
  }

  function current(page) {
    return `<span class="pagenumber current">${page}</span>`;
  }

  function ellipsis() {
    return `<span class="pagenumber">...</span>`;
  }
})();
