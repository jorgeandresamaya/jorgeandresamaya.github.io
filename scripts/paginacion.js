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
(function(){
  var itemsPerPage = 10;
  var pagesToShow = 5;
  var prevLabel = 'Artículos más recientes';
  var nextLabel = 'Artículos anteriores';
  var homePage = "/";
  var currentPage = 1;
  var totalPages = 1;
  var searchQuery = "";
  var type = "page"; // page, label, search
  var labelName = "";
  var lastPostDate = null;

  // Obtener página actual del URL
  function getCurrentPage() {
    var url = window.location.href;
    var match = url.match(/#PageNo=(\d+)/);
    if(match) return parseInt(match[1],10);
    return 1;
  }

  function getSearchQueryParam() {
    var params = new URLSearchParams(window.location.search);
    return params.get("q") || "";
  }

  // Construir enlace paginación
  function createLink(pageNum, text) {
    var href = "#";
    if(type === "page") {
      href = homePage + "?updated-max=" + encodeURIComponent(lastPostDate || new Date().toISOString()) + "&max-results=" + itemsPerPage + "&start=" + ((pageNum-1)*itemsPerPage) + "#PageNo=" + pageNum;
    } else if(type === "label") {
      href = homePage + "search/label/" + labelName + "?updated-max=" + encodeURIComponent(lastPostDate || new Date().toISOString()) + "&max-results=" + itemsPerPage + "&start=" + ((pageNum-1)*itemsPerPage) + "#PageNo=" + pageNum;
    } else if(type === "search") {
      href = homePage + "search?q=" + encodeURIComponent(searchQuery) + "&updated-max=" + encodeURIComponent(lastPostDate || new Date().toISOString()) + "&max-results=" + itemsPerPage + "&start=" + ((pageNum-1)*itemsPerPage) + "#PageNo=" + pageNum;
    }
    return `<a href="${href}">${text}</a>`;
  }

  // Generar HTML de paginación
  function buildPagination() {
    var paginationHTML = "";
    var half = Math.floor(pagesToShow / 2);
    var start = 1;
    var end = totalPages;

    if(totalPages <= pagesToShow) {
      start = 1;
      end = totalPages;
    } else if(currentPage <= half + 1) {
      start = 1;
      end = pagesToShow;
    } else if(currentPage >= totalPages - half) {
      start = totalPages - pagesToShow +1;
      end = totalPages;
    } else {
      start = currentPage - half;
      end = currentPage + half;
    }

    // Botón anterior
    var prevHTML = "";
    if(currentPage > 1) {
      prevHTML = createLink(currentPage - 1, prevLabel);
    }

    // Botón siguiente
    var nextHTML = "";
    if(currentPage < totalPages) {
      nextHTML = createLink(currentPage + 1, nextLabel);
    }

    // Números de página
    var numbersHTML = "";
    if(start > 1) {
      numbersHTML += `<span class="pagenumber">${createLink(1, "1")}</span>`;
      if(start > 2) numbersHTML += `<span class="dots">...</span>`;
    }
    for(var i = start; i <= end; i++) {
      if(i === currentPage) {
        numbersHTML += `<span class="pagenumber current">${i}</span>`;
      } else {
        numbersHTML += `<span class="pagenumber">${createLink(i, i)}</span>`;
      }
    }
    if(end < totalPages) {
      if(end < totalPages -1) numbersHTML += `<span class="dots">...</span>`;
      numbersHTML += `<span class="pagenumber">${createLink(totalPages, totalPages)}</span>`;
    }

    // Insertar en elementos HTML
    var pager = document.getElementById("blog-pager");
    var numbersContainer = document.getElementById("numeracion-paginacion");

    if(!pager || !numbersContainer) return;

    // Insertar botones en blog-pager, sin texto antes
    pager.innerHTML = "";
    if(prevHTML) pager.insertAdjacentHTML('beforeend', `<span class="pager-prev">${prevHTML}</span>`);
    if(nextHTML) pager.insertAdjacentHTML('beforeend', `<span class="pager-next">${nextHTML}</span>`);

    // Insertar numeros centrados sólo si página > 1
    numbersContainer.innerHTML = currentPage > 1 ? numbersHTML : "";
  }

  // Obtener datos totales mediante feed
  function fetchTotalPosts() {
    var feedURL = "";
    if(type === "search") {
      feedURL = homePage + "feeds/posts/summary?q=" + encodeURIComponent(searchQuery) + "&max-results=1&alt=json-in-script&callback=totalPostsCallback";
    } else if(type === "label") {
      feedURL = homePage + "feeds/posts/summary/-/" + labelName + "?max-results=1&alt=json-in-script&callback=totalPostsCallback";
    } else {
      feedURL = homePage + "feeds/posts/summary?max-results=1&alt=json-in-script&callback=totalPostsCallback";
    }
    var script = document.createElement("script");
    script.src = feedURL;
    document.body.appendChild(script);
  }

  // Callback feed JSON para obtener total de entradas
  window.totalPostsCallback = function(data) {
    var total = 0;
    try {
      total = parseInt(data.feed.openSearch$totalResults.$t, 10);
    } catch(e) {
      total = itemsPerPage;
    }
    if(total === 0) total = itemsPerPage;

    try {
      lastPostDate = data.feed.entry[data.feed.entry.length - 1].updated.$t;
    } catch(e) {
      lastPostDate = new Date().toISOString();
    }

    totalPages = Math.ceil(total / itemsPerPage);
    buildPagination();
  };

  // Detectar tipo de página y configurar variables globales
  function initialize() {
    currentPage = getCurrentPage();
    searchQuery = getSearchQueryParam();

    var url = window.location.href;
    if(url.match(/\/search\/label\//)) {
      type = "label";
      labelName = url.match(/\/search\/label\/([^?]+)/)[1];
    } else if(searchQuery !== "") {
      type = "search";
    } else {
      type = "page";
    }
    fetchTotalPosts();
  }

  // Iniciar cuando DOM listo
  document.addEventListener("DOMContentLoaded", initialize);
})();
