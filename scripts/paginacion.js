/*!
 * Paginación numérica personalizada para Blogger
 * Autor: Jorge Andrés Amaya
 * Blog: Descubre con Jorge Andrés Amaya
 * URL: https://jorgeandresamaya.blogspot.com
 * Versión: 1.0
 * Descripción: Inserta paginación numérica real en el contenedor #numeracion-paginacion,
 *              oculta en la primera página, sin reemplazar #blog-pager ni duplicar elementos.
 */

// Variables internas del script
var currentPage, searchQuery, lastPostDate = null, type, lblname1, nopage;
var isPaginationRendered = false;
var itemsPerPage = 10; // Ajustar según tu configuración
var pagesToShow = 5; // Números visibles
var home_page = window.location.origin + "/"; // Ajusta si es necesario
var prevpage = "« Anterior", nextpage = "Siguiente »";

// =============================================================================
// FUNCIONES AUXILIARES
// =============================================================================

function getSearchQuery() {
    let urlParams = new URLSearchParams(window.location.search);
    return urlParams.get("q") || "";
}

function createPageLink(pageNum, linkText) {
    let url;
    if (type === "page") {
        return `<span class="pagenumber"><a href="#" onclick="redirectpage(${pageNum}); return false;">${linkText}</a></span>`;
    } else if (type === "label") {
        return `<span class="pagenumber"><a href="#" onclick="redirectlabel(${pageNum}); return false;">${linkText}</a></span>`;
    } else { // search
        let searchParam = searchQuery ? `q=${encodeURIComponent(searchQuery)}` : "";
        let startIndex = (pageNum - 1) * itemsPerPage;
        url = `${home_page}search?${searchParam}&updated-max=${encodeURIComponent(lastPostDate || new Date().toISOString())}&max-results=${itemsPerPage}&start=${startIndex}&by-date=false#PageNo=${pageNum}`;
        return `<span class="pagenumber"><a href="${url}">${linkText}</a></span>`;
    }
}

// =============================================================================
// FUNCIONES PRINCIPALES DE PAGINACIÓN
// =============================================================================

function renderPagination(totalPosts) {
    if (isPaginationRendered) return;

    let maximum = Math.ceil(totalPosts / itemsPerPage);
    if (maximum < 2) return; // No mostrar paginación si solo hay 1 página

    let paginationHTML = "";
    let half = Math.floor(pagesToShow / 2);
    let start = currentPage - half;
    let end = currentPage + half;

    if (start < 1) { end += (1 - start); start = 1; }
    if (end > maximum) { start -= (end - maximum); end = maximum; }
    if (start < 1) start = 1;

    // Botón "Anterior"
    if (currentPage > 1) paginationHTML += createPageLink(currentPage - 1, prevpage);

    // Primer número y "..."
    if (start > 1) {
        paginationHTML += createPageLink(1, "1");
        if (start > 2) paginationHTML += "...";
    }

    // Números intermedios
    for (let i = start; i <= end; i++) {
        paginationHTML += i === currentPage ? `<span class="pagenumber current">${i}</span>` : createPageLink(i, i);
    }

    // Último número y "..."
    if (end < maximum) {
        if (end < maximum - 1) paginationHTML += "...";
        paginationHTML += createPageLink(maximum, maximum);
    }

    // Botón "Siguiente"
    if (currentPage < maximum) paginationHTML += createPageLink(currentPage + 1, nextpage);

    // Insertar paginación en #blog-pager
    let pagerElement = document.getElementById("blog-pager");
    if (pagerElement) {
        let wrapper = document.createElement("div");
        wrapper.className = "pagination-numbers-wrapper";
        wrapper.style.cssText = "text-align:center;margin:10px 0;display:flex;flex-wrap:wrap;justify-content:center;gap:5px;";
        wrapper.innerHTML = paginationHTML;
        pagerElement.innerHTML = "";
        pagerElement.appendChild(wrapper);
    }

    isPaginationRendered = true;
}

// =============================================================================
// CALLBACK FEED
// =============================================================================

function paginationall(data) {
    let totalResults = parseInt(data.feed.openSearch$totalResults.$t, 10);
    if (isNaN(totalResults) || totalResults <= 0) totalResults = itemsPerPage;

    if (data.feed.entry && data.feed.entry.length > 0) {
        lastPostDate = data.feed.entry[data.feed.entry.length - 1].updated.$t;
    } else if (!lastPostDate) {
        lastPostDate = new Date().toISOString();
    }
    renderPagination(totalResults);
}

// =============================================================================
// REDIRECCIONES
// =============================================================================

function redirectpage(pageNum) {
    if (pageNum === 1) { location.href = home_page; return; }
    let jsonstart = (pageNum - 1) * itemsPerPage;
    nopage = pageNum;
    let script = document.createElement("script");
    script.type = "text/javascript";
    script.src = `${home_page}feeds/posts/summary?start-index=${jsonstart}&max-results=1&alt=json-in-script&callback=finddatepost`;
    document.getElementsByTagName("head")[0].appendChild(script);
}

function redirectlabel(pageNum) {
    if (pageNum === 1) {
        location.href = `${home_page}search/label/${lblname1}?max-results=${itemsPerPage}#PageNo=1`;
        return;
    }
    let jsonstart = (pageNum - 1) * itemsPerPage;
    nopage = pageNum;
    let script = document.createElement("script");
    script.type = "text/javascript";
    script.src = `${home_page}feeds/posts/summary/-/${lblname1}?start-index=${jsonstart}&max-results=1&alt=json-in-script&callback=finddatepost`;
    document.getElementsByTagName("head")[0].appendChild(script);
}

function finddatepost(data) {
    let post = data.feed.entry[0];
    let dateStr = post.published.$t.substring(0, 19) + post.published.$t.substring(23, 29);
    let encodedDate = encodeURIComponent(dateStr);

    let redirectUrl = type === "page"
        ? `${home_page}search?updated-max=${encodedDate}&max-results=${itemsPerPage}#PageNo=${nopage}`
        : `${home_page}search/label/${lblname1}?updated-max=${encodedDate}&max-results=${itemsPerPage}#PageNo=${nopage}`;

    location.href = redirectUrl;
}

// =============================================================================
// INICIALIZACIÓN
// =============================================================================

function initializeBloggerPagination() {
    searchQuery = getSearchQuery();
    let activePage = window.location.href;

    if (activePage.includes("/search/label/")) {
        type = "label";
        lblname1 = activePage.split("/search/label/")[1].split("?")[0];
    } else if (searchQuery) {
        type = "search";
    } else {
        type = "page";
    }

    currentPage = activePage.includes("#PageNo=") 
        ? parseInt(activePage.split("#PageNo=")[1], 10) 
        : 1;

    const maxResultsForTotal = 200;
    let scriptUrl;
    if (type === "search") {
        let searchParam = searchQuery ? `q=${encodeURIComponent(searchQuery)}` : "";
        scriptUrl = `${home_page}feeds/posts/summary${searchParam}&max-results=${maxResultsForTotal}&alt=json-in-script&callback=paginationall`;
    } else if (type === "label") {
        scriptUrl = `${home_page}feeds/posts/summary/-/${lblname1}?max-results=${maxResultsForTotal}&alt=json-in-script&callback=paginationall`;
    } else {
        scriptUrl = `${home_page}feeds/posts/summary?max-results=${maxResultsForTotal}&alt=json-in-script&callback=paginationall`;
    }

    let script = document.createElement("script");
    script.src = scriptUrl;
    script.onerror = () => console.error("Error al cargar el feed:", scriptUrl);
    document.body.appendChild(script);

    // Ajustar enlaces de etiquetas
    document.querySelectorAll('a[href*="/search/label/"]').forEach(link => {
        if (!link.href.includes("?&max-results=") && !link.href.includes("&max-results=")) {
            link.href += `?&max-results=${itemsPerPage}`;
        }
    });
}

// Debounce para ejecución única
let debounceTimeout;
const debounceInitialize = () => {
    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(() => { initializeBloggerPagination(); }, 500);
};

document.addEventListener("DOMContentLoaded", debounceInitialize);
window.addEventListener("load", debounceInitialize);

// Función para formulario de búsqueda
function addMaxResults(event) {
  event.preventDefault(); 
  let query = document.querySelector('input[name="q"]').value;
  let baseUrl = (typeof searchBaseUrl !== 'undefined' ? searchBaseUrl : (home_page + 'search')); 
  let searchUrl = baseUrl + "?q=" + encodeURIComponent(query) + "&max-results=" + itemsPerPage;
  window.location.href = searchUrl; 
}
