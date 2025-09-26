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
/** Paginación numérica automática - Descubre con Jorge Andrés Amaya - MIT License **/
(function() {
  const itemsPerPage = window.itemsPerPage || 10;
  const pagesToShow = window.pagesToShow || 5;
  const urlactivepage = window.urlactivepage || location.href;
  const home_page = window.home_page || "/";
  const numeracionContainer = document.getElementById("numeracion-paginacion");

  if (!numeracionContainer) return;

  function getTotalPosts(callback) {
    const feedUrl = home_page + "feeds/posts/summary?alt=json&max-results=0";
    fetch(feedUrl)
      .then(res => res.json())
      .then(data => {
        const totalPosts = parseInt(data.feed.openSearch$totalResults.$t, 10);
        callback(totalPosts);
      })
      .catch(() => callback(0));
  }

  function getCurrentPage() {
    const match = urlactivepage.match(/\/search\/label\/.*?[?&]start-index=(\d+)/) ||
                  urlactivepage.match(/[?&]start-index=(\d+)/);
    const startIndex = match ? parseInt(match[1], 10) : 1;
    return Math.ceil(startIndex / itemsPerPage);
  }

  function buildPagination(totalPosts) {
    const totalPages = Math.ceil(totalPosts / itemsPerPage);
    const currentPage = getCurrentPage();
    if (totalPages <= 1 || currentPage < 2) return;

    const half = Math.floor(pagesToShow / 2);
    let startPage = Math.max(currentPage - half, 2);
    let endPage = Math.min(startPage + pagesToShow - 1, totalPages);

    if (endPage - startPage < pagesToShow - 1) {
      startPage = Math.max(endPage - pagesToShow + 1, 2);
    }

    const fragment = document.createDocumentFragment();

    for (let i = startPage; i <= endPage; i++) {
      const pageIndex = (i - 1) * itemsPerPage + 1;
      const pageUrl = home_page + "search?updated-max&start-index=" + pageIndex + "&max-results=" + itemsPerPage;
      const link = document.createElement("a");
      link.href = pageUrl;
      link.textContent = i;
      if (i === currentPage) link.style.fontWeight = "bold";
      fragment.appendChild(link);
    }

    numeracionContainer.innerHTML = "";
    numeracionContainer.style.margin = "10px 0";
    numeracionContainer.style.textAlign = "center";
    numeracionContainer.appendChild(fragment);
  }

  getTotalPosts(buildPagination);
})();
