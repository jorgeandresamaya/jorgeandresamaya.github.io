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

  var pagerOlder = document.querySelector('.blog-pager-older-link');
  var pagerNewer = document.querySelector('.blog-pager-newer-link');

  // Detecta número de páginas mediante los enlaces existentes
  function getTotalPages() {
    var links = document.querySelectorAll('.blog-pager a');
    var nums = [];
    links.forEach(function(a) {
      var match = a.href.match(/\/search\/label\/.*\?updated-max=.*&max-results=(\d+)/);
      if (match) nums.push(parseInt(match[1]));
    });
    return Math.max.apply(null, nums) || 1;
  }

  function getCurrentPage() {
    var params = new URLSearchParams(window.location.search);
    var start = parseInt(params.get('start')) || 0;
    return Math.floor(start / 10) + 1; // 10 posts por página
  }

  function createLink(pageNum, isActive) {
    var a = document.createElement('a');
    if (!isActive) {
      var start = (pageNum - 1) * 10;
      a.href = start === 0 ? '/' : '?start=' + start;
    } else {
      a.style.fontWeight = 'bold';
      a.style.pointerEvents = 'none';
    }
    a.textContent = pageNum;
    return a;
  }

  function renderPagination() {
    var current = getCurrentPage();
    var total = getTotalPages();

    if (total <= 1 || current === 1) return; // Solo a partir de la segunda página

    container.innerHTML = '';

    var pagesToShow = 5;
    var startPage = Math.max(current - 2, 1);
    var endPage = Math.min(startPage + pagesToShow - 1, total);

    if (endPage - startPage < pagesToShow - 1) {
      startPage = Math.max(endPage - pagesToShow + 1, 1);
    }

    for (var i = startPage; i <= endPage; i++) {
      container.appendChild(createLink(i, i === current));
    }
  }

  document.addEventListener('DOMContentLoaded', renderPagination);
})();
