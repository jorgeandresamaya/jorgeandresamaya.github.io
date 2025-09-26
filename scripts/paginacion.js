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
/** Paginación simple para Blogger - Jorge Andrés Amaya 2025 **/
(function() {
  var container = document.getElementById('numeracion-paginacion');
  if (!container) return;

  var postsPerPage = 10; // Ajusta según tu blog
  var params = new URLSearchParams(window.location.search);
  var start = parseInt(params.get('start')) || 0;
  var currentPage = Math.floor(start / postsPerPage) + 1;

  if (currentPage <= 1) return; // Solo mostrar a partir de la segunda página

  // Crear el indicador de página
  var span = document.createElement('span');
  span.textContent = 'Página ' + currentPage;
  span.style.fontWeight = 'bold';
  span.style.margin = '0 5px';

  container.appendChild(span);
})();

  getTotalPosts(buildPagination);
})();
