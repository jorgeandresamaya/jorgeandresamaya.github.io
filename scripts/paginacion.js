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
var isPaginationRendered = false; // Flag para evitar renderizados múltiples

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
    } else { // type === "search"
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

    let paginationHTML = "";
    let maximum = Math.ceil(totalPosts / itemsPerPage);
    let pagesToShow = 5; // Limitar a 5 números de página visibles
    let leftnum = Math.floor(pagesToShow / 2);

    // Mostrar numeración solo si no estamos en la home y hay más de 1 página
    if (!(type === "page" && currentPage === 1) && maximum > 1) {

        // Texto "Hoja X de Y" solo si no es home ni primera página
        if (!(type === "page" && currentPage === 1)) {
            paginationHTML += `<span class='totalpages'>Hoja ${currentPage} de ${maximum}</span>`;
        }

        // Botón "Anterior"
        if (currentPage > 1) {
            paginationHTML += createPageLink(currentPage - 1, prevpage);
        }

        // Números de página
        let start = Math.max(currentPage - leftnum, 1);
        let end = Math.min(start + pagesToShow - 1, maximum);

        if (start > 1) paginationHTML += createPageLink(1, "1");
        if (start > 2) paginationHTML += "...";

        for (let r = start; r <= end; r++) {
            paginationHTML += r === currentPage 
                ? `<span class="pagenumber current">${r}</span>` 
                : createPageLink(r, r);
        }

        if (end < maximum - 1) paginationHTML += "...";
        if (end < maximum) paginationHTML += createPageLink(maximum, maximum);

        // Botón "Siguiente"
        if (currentPage < maximum) {
            paginationHTML += createPageLink(currentPage + 1, nextpage);
        }
    }

    let pagerElement = document.getElementById("blog-pager");
    if (pagerElement) {
        let prevButton = pagerElement.querySelector(".blog-pager-older-link");
        let nextButton = pagerElement.querySelector(".blog-pager-newer-link");

        if (paginationHTML) {
            let paginationWrapper = document.createElement("div");
            paginationWrapper.className = "pagination-numbers-wrapper";
            paginationWrapper.innerHTML = paginationHTML;

            if (prevButton && nextButton) {
                pagerElement.insertBefore(paginationWrapper, nextButton);
            } else if (nextButton) {
                pagerElement.insertBefore(paginationWrapper, nextButton);
            } else if (prevButton) {
                pagerElement.appendChild(paginationWrapper);
            } else {
                pagerElement.innerHTML = paginationHTML;
            }
        } else {
            let existingWrapper = pagerElement.querySelector(".pagination-numbers-wrapper");
            if (existingWrapper) existingWrapper.remove();
        }
    }
    isPaginationRendered = true;
}

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
// FUNCIONES DE REDIRECCIÓN
// =============================================================================

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

// =============================================================================
// INICIALIZACIÓN DEL SCRIPT
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
    let labelLinks = document.querySelectorAll('a[href*="/search/label/"]');
    labelLinks.forEach(function (link) {
        if (!link.href.includes("?&max-results=") && !link.href.includes("&max-results=")) {
            link.href += `?&max-results=${itemsPerPage}`;
        }
    });
}

// Debounce para asegurar ejecución única
let debounceTimeout;
const debounceInitialize = () => {
    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(() => {
        initializeBloggerPagination();
    }, 500);
};

document.addEventListener("DOMContentLoaded", debounceInitialize);
window.addEventListener("load", debounceInitialize);

// Función para el formulario de búsqueda
function addMaxResults(event) {
  event.preventDefault(); 
  var query = document.querySelector('input[name="q"]').value;
  var baseUrl = (typeof searchBaseUrl !== 'undefined' ? searchBaseUrl : (home_page + 'search')); 
  var searchUrl = baseUrl + "?q=" + encodeURIComponent(query) + "&max-results=" + itemsPerPage;
  window.location.href = searchUrl; 
}
