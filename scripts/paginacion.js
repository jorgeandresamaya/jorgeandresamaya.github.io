/*!
 * Paginación numérica personalizada para Blogger
 * Autor: Jorge Andrés Amaya
 * Blog: Descubre con Jorge Andrés Amaya
 * URL: https://jorgeandresamaya.blogspot.com
 * Versión: 1.0
 * Descripción: Inserta paginación numérica real en el contenedor #numeracion-paginacion,
 *              oculta en la primera página, sin reemplazar #blog-pager ni duplicar elementos.
 */

// Variables internas del script (no modificar)
var currentPage, searchQuery, lastPostDate = null, type, lblname1, nopage;
var isPaginationRendered = false; // Evitar renderizados múltiples
var itemsPerPage = 10; // Ajusta según tu configuración
var pagesToShow = 5; // Solo mostrar 5 números
var home_page = "/"; // Cambia si tu blog está en subcarpeta
var prevpage = "«"; 
var nextpage = "»";

// ==========================================
// FUNCIONES AUXILIARES
// ==========================================
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
    } else { // búsqueda
        let searchParam = searchQuery ? `q=${encodeURIComponent(searchQuery)}` : "";
        let startIndex = (pageNum - 1) * itemsPerPage;
        url = `${home_page}search?${searchParam}&updated-max=${encodeURIComponent(lastPostDate || new Date().toISOString())}&max-results=${itemsPerPage}&start=${startIndex}&by-date=false#PageNo=${pageNum}`;
        return `<span class="pagenumber"><a href="${url}">${linkText}</a></span>`;
    }
}

// ==========================================
// RENDERIZADO DE PAGINACIÓN
// ==========================================
function renderPagination(totalPosts) {
    if (isPaginationRendered) return;

    let paginationHTML = "";
    let maximum = Math.ceil(totalPosts / itemsPerPage);
    let leftnum = Math.floor(pagesToShow / 2);

    if (maximum <= 1) return; // No paginar si solo hay 1 página

    // Botón "Anterior"
    if (currentPage > 1) {
        paginationHTML += createPageLink(currentPage - 1, prevpage);
    }

    // Determinar rango de números
    let start = Math.max(currentPage - leftnum, 1);
    let end = Math.min(start + pagesToShow - 1, maximum);

    if (end - start < pagesToShow - 1) start = Math.max(end - pagesToShow + 1, 1);

    // Primer número + "..." si aplica
    if (start > 1) {
        paginationHTML += createPageLink(1, 1);
        if (start > 2) paginationHTML += "...";
    }

    // Números del rango
    for (let r = start; r <= end; r++) {
        if (r === currentPage) {
            paginationHTML += `<span class="pagenumber current">${r}</span>`;
        } else {
            paginationHTML += createPageLink(r, r);
        }
    }

    // Último número + "..." si aplica
    if (end < maximum) {
        if (end < maximum - 1) paginationHTML += "...";
        paginationHTML += createPageLink(maximum, maximum);
    }

    // Botón "Siguiente"
    if (currentPage < maximum) {
        paginationHTML += createPageLink(currentPage + 1, nextpage);
    }

    // Insertar en #blog-pager
    let pagerElement = document.getElementById("blog-pager");
    if (!pagerElement) return;

    let prevButton = pagerElement.querySelector(".blog-pager-older-link");
    let nextButton = pagerElement.querySelector(".blog-pager-newer-link");

    let paginationWrapper = document.createElement("div");
    paginationWrapper.className = "pagination-numbers-wrapper";
    paginationWrapper.innerHTML = paginationHTML;

    if (prevButton && nextButton) {
        pagerElement.insertBefore(paginationWrapper, nextButton);
    } else if (nextButton) {
        pagerElement.insertBefore(paginationWrapper, nextButton);
    } else {
        pagerElement.appendChild(paginationWrapper);
    }

    isPaginationRendered = true;
}

// ==========================================
// CALLBACK PARA FEED
// ==========================================
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

// ==========================================
// REDIRECCIÓN
// ==========================================
function redirectpage(pageNum) {
    if (pageNum === 1) {
        location.href = home_page;
        return;
    }
    jsonstart = (pageNum - 1) * itemsPerPage;
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
    jsonstart = (pageNum - 1) * itemsPerPage;
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

// ==========================================
// INICIALIZACIÓN
// ==========================================
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

    let scriptUrl;
    const maxResultsForTotal = 200;

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
    document.body.appendChild(script);

    // Ajustar enlaces de etiquetas
    let labelLinks = document.querySelectorAll('a[href*="/search/label/"]');
    labelLinks.forEach(function(link) {
        if (!link.href.includes("?&max-results=") && !link.href.includes("&max-results=")) {
            link.href += `?&max-results=${itemsPerPage}`;
        }
    });
}

// Debounce para inicializar
let debounceTimeout;
const debounceInitialize = () => {
    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(() => {
        initializeBloggerPagination();
    }, 500);
};

document.addEventListener("DOMContentLoaded", debounceInitialize);
window.addEventListener("load", debounceInitialize);

// ==========================================
// FORMULARIO DE BÚSQUEDA
// ==========================================
function addMaxResults(event) {
    event.preventDefault(); 
    var query = document.querySelector('input[name="q"]').value;
    var baseUrl = home_page + 'search';
    var searchUrl = baseUrl + "?q=" + encodeURIComponent(query) + "&max-results=" + itemsPerPage;
    window.location.href = searchUrl; 
}

