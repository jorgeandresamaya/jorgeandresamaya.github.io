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
/** Paginación Descubre con Jorge Andrés Amaya - Copyright © 2025 (Licencia MIT) **/
(function() {
  // Configuración
  var numeracionContainer = document.getElementById('numeracion-paginacion');
  if (!numeracionContainer) return;

  // Detecta la página actual y total de páginas
  function getCurrentPage() {
    var params = new URLSearchParams(window.location.search);
    return parseInt(params.get('max-results') || 1) || 1;
  }

  function getTotalPages() {
    var totalPosts = parseInt(document.querySelectorAll('.post').length);
    return Math.ceil(totalPosts / 10) || 1;
  }

  function createPageLink(pageNum, isActive) {
    var a = document.createElement('a');
    a.href = '?updated-max=' + pageNum; // Enlace básico, Blogger se ajustará automáticamente
    a.textContent = pageNum;
    if (isActive) a.style.fontWeight = 'bold';
    return a;
  }

  function renderPagination() {
    var currentPage = getCurrentPage();
    var totalPages = getTotalPages();

    if (totalPages <= 1 || currentPage === 1) return; // Solo a partir de la segunda página

    numeracionContainer.innerHTML = ''; // Limpiar contenedor

    var pagesToShow = 5;
    var startPage = Math.max(currentPage - 2, 1);
    var endPage = Math.min(startPage + pagesToShow - 1, totalPages);

    if (endPage - startPage < pagesToShow - 1) {
      startPage = Math.max(endPage - pagesToShow + 1, 1);
    }

    for (var i = startPage; i <= endPage; i++) {
      numeracionContainer.appendChild(createPageLink(i, i === currentPage));
    }
  }

  document.addEventListener('DOMContentLoaded', renderPagination);
})();
