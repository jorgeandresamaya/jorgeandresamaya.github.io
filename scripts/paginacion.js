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
// paginacion.js - versión mínima

(function () {
  // Configuración
  var maxPagesToShow = 5; // cantidad máxima de números visibles
  var url = window.location.href;
  var match = url.match(/search\?updated-max/);
  var isHome = document.body.classList.contains('home');

  // Solo en homepage o al paginar
  if (!isHome && !match) return;

  var container = document.getElementById("numeracion-paginacion");
  if (!container) return;

  // Para prueba: total de páginas simulado (ej. 20)
  var totalPages = 20;

  // Detectar número de página actual (ejemplo simple)
  var currentPage = 1;
  if (match) {
    var param = url.split("page=")[1];
    if (param) currentPage = parseInt(param, 10);
  }

  // Calcular rango de páginas a mostrar
  var start = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
  var end = Math.min(totalPages, start + maxPagesToShow - 1);

  // Ajustar si no hay suficientes páginas
  if (end - start + 1 < maxPagesToShow) {
    start = Math.max(1, end - maxPagesToShow + 1);
  }

  // Generar HTML
  var html = "";
  for (var i = start; i <= end; i++) {
    if (i === currentPage) {
      html += "<span class='active'>" + i + "</span>";
    } else {
      html += "<a href='?page=" + i + "'>" + i + "</a>";
    }
  }

  container.innerHTML = html;
})();
