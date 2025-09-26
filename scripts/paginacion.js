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
// ==============================
// Paginación numérica centrada
// Compatible con tu plantilla
// ==============================

var itemsPerPage = 10;   // Posts por página
var pagesToShow = 5;     // Máximo números visibles
var currentPage = 1;
var totalPosts = 0;
var home_page = "/";

// Obtener número de página actual desde URL
function getCurrentPage() {
    var page = 1;
    if (location.href.includes("#PageNo=")) {
        page = parseInt(location.href.split("#PageNo=")[1], 10);
    }
    return page;
}

// Crear enlace de página
function createPageLink(pageNum, text) {
    return "<span class='pagenumber'><a href='" + home_page + "?start=" + ((pageNum-1)*itemsPerPage) + "#PageNo=" + pageNum + "'>" + text + "</a></span>";
}

// Generar numeración
function renderPagination(totalPostsCount) {
    totalPosts = totalPostsCount;
    var totalPages = Math.ceil(totalPosts / itemsPerPage);
    currentPage = getCurrentPage();

    if (totalPages <= 1 || currentPage < 2) return; // Solo mostrar a partir de página 2

    var paginationHTML = "";
    var leftNum = Math.floor(pagesToShow / 2);
    var start = Math.max(currentPage - leftNum, 1);
    var end = Math.min(start + pagesToShow - 1, totalPages);

    // Ajustar si quedan menos de pagesToShow
    if (end - start + 1 < pagesToShow) start = Math.max(end - pagesToShow + 1, 1);

    // Primer número y puntos
    if (start > 1) {
        paginationHTML += createPageLink(1, "1");
        if (start > 2) paginationHTML += "<span class='dots'>...</span>";
    }

    // Números intermedios
    for (var i = start; i <= end; i++) {
        if (i === currentPage) {
            paginationHTML += "<span class='pagenumber current'>" + i + "</span>";
        } else {
            paginationHTML += createPageLink(i, i);
        }
    }

    // Último número y puntos
    if (end < totalPages) {
        if (end < totalPages - 1) paginationHTML += "<span class='dots'>...</span>";
        paginationHTML += createPageLink(totalPages, totalPages);
    }

    // Insertar en contenedor centrado
    var container = document.getElementById("numeracion-paginacion");
    if (container) {
        container.innerHTML = "<div style='display:flex;justify-content:center;align-items:center;flex-wrap:wrap;gap:5px;'>" + paginationHTML + "</div>";
    }
}

// ==============================
// Detectar número total de posts mediante feed JSON
// ==============================
function loadTotalPosts() {
    var script = document.createElement("script");
    script.src = home_page + "feeds/posts/summary?max-results=1&alt=json-in-script&callback=processTotalPosts";
    document.body.appendChild(script);
}

// Callback para procesar feed
function processTotalPosts(data) {
    var total = parseInt(data.feed.openSearch$totalResults.$t, 10);
    if (!isNaN(total)) renderPagination(total);
}

// Ejecutar al cargar DOM
document.addEventListener("DOMContentLoaded", function() {
    loadTotalPosts();
});
