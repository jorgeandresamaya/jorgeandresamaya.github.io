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
/** Paginación numérica real - Descubre con Jorge Andrés Amaya - MIT **/
(function() {
  const itemsPerPage = window.itemsPerPage || 10;
  const pagesToShow = window.pagesToShow || 5;
  const homePage = window.home_page || "/";
  const container = document.getElementById("numeracion-paginacion");
  if (!container) return;

  function getTotalPosts(callback) {
    fetch(homePage + "feeds/posts/summary?alt=json&max-results=0")
      .then(res => res.json())
      .then(data => {
        const total = parseInt(data.feed.openSearch$totalResults.$t, 10);
        callback(total);
      })
      .catch(() => callback(0));
  }

  function getCurrentPage() {
    const url = location.href;
    const match = url.match(/start-index=(\d+)/);
    const index = match ? parseInt(match[1], 10) : 1;
    return Math.ceil(index / itemsPerPage);
  }

  function buildPagination(totalPosts) {
    const totalPages = Math.ceil(totalPosts / itemsPerPage);
    const currentPage = getCurrentPage();
    if (totalPages <= 1 || currentPage < 2) return;

    const half = Math.floor(pagesToShow / 2);
    let start = Math.max(currentPage - half, 2);
    let end = Math.min(start + pagesToShow - 1, totalPages);

    if (end - start < pagesToShow - 1) {
      start = Math.max(end - pagesToShow + 1, 2);
    }

    const fragment = document.createDocumentFragment();
    for (let i = start; i <= end; i++) {
      const index = (i - 1) * itemsPerPage + 1;
      const link = document.createElement("a");
      link.href = homePage + "search?updated-max&start-index=" + index + "&max-results=" + itemsPerPage;
      link.textContent = i;
      if (i === currentPage) link.style.fontWeight = "bold";
      fragment.appendChild(link);
    }

    container.innerHTML = "";
    container.style.textAlign = "center";
    container.appendChild(fragment);
  }

  getTotalPosts(buildPagination);
})();
