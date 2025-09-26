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
/** Paginación Descubre con Jorge Andrés Amaya - 2025 (Licencia MIT) **/
(function() {
  var container = document.getElementById('numeracion-paginacion');
  if (!container) return;

  var postsPerPage = 10; // Ajusta si cambias el número de posts por página
  var pagesToShow = 5;   // Máximo números visibles

  function getTotalPosts(callback) {
    // Usar feed JSON de Blogger para contar todas las entradas
    var script = document.createElement('script');
    script.src = '/feeds/posts/default?alt=json-in-script&start-index=1&max-results=1&callback=totalPostsCallback';
    window.totalPostsCallback = function(json) {
      var total = parseInt(json.feed.openSearch$totalResults.$t);
      callback(total);
    };
    document.body.appendChild(script);
  }

  function getCurrentPage() {
    var params = new URLSearchParams(window.location.search);
    var start = parseInt(params.get('start')) || 0;
    return Math.floor(start / postsPerPage) + 1;
  }

  function createLink(pageNum, isActive) {
    var a = document.createElement('a');
    if (!isActive) {
      var start = (pageNum - 1) * postsPerPage;
      a.href = start === 0 ? '/' : '?start=' + start;
    } else {
      a.style.fontWeight = 'bold';
      a.style.pointerEvents = 'none';
    }
    a.textContent = pageNum;
    return a;
  }

  function renderPagination(totalPosts) {
    var totalPages = Math.ceil(totalPosts / postsPerPage);
    var current = getCurrentPage();

    if (totalPages <= 1 || current === 1) return; // Solo a partir de la segunda página

    container.innerHTML = '';

    var startPage = Math.max(current - 2, 1);
    var endPage = Math.min(startPage + pagesToShow - 1, totalPages);
    if (endPage - startPage < pagesToShow - 1) {
      startPage = Math.max(endPage - pagesToShow + 1, 1);
    }

    for (var i = startPage; i <= endPage; i++) {
      container.appendChild(createLink(i, i === current));
    }
  }

  getTotalPosts(renderPagination);
})();
