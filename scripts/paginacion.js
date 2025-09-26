/*!
 * Paginación numérica personalizada para Blogger
 * Autor: Jorge Andrés Amaya
 * Blog: Descubre con Jorge Andrés Amaya
 * URL: https://jorgeandresamaya.blogspot.com
 * Versión: 1.0
 * Descripción: Inserta paginación numérica real en el contenedor #numeracion-paginacion,
 *              oculta en la primera página, sin reemplazar #blog-pager ni duplicar elementos.
 */

// =============================================================================
// VARIABLES GLOBALES DEL SCRIPT (se esperan que sean definidas en la plantilla)
// =============================================================================
// Esperamos que estas variables estén definidas en la plantilla de Blogger:
// var itemsPerPage = 10;
// var pagesToShow = 5;
// var prevpage = 'Artículos más recientes';
// var nextpage = 'Artículos anteriores';
// var home_page = "<data:blog.homepageUrl/>"; // URL completa del blog

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
    if (isPaginationRendered) {
        console.log("Pagination already rendered, skipping.");
        return;
    }
    console.log("renderPagination() called.");
    console.log("currentPage:", currentPage, "totalPosts:", totalPosts, "itemsPerPage:", itemsPerPage);

    let paginationHTML = "";
    let leftnum = Math.floor(pagesToShow / 2);
    let maximum = Math.ceil(totalPosts / itemsPerPage);

    console.log("Calculated maximum pages:", maximum);

    // TODO: Ajuste aquí
    // La numeración completa (incluido "Hoja X de Y") solo se genera
    // si NO es la primera página Y hay más de una página en total.
    if (currentPage > 1 && maximum > 1) {
        // "Hoja X de Y" ahora se genera dentro de esta condición
        paginationHTML += `<span class='totalpages'>Hoja ${currentPage} de ${maximum}</span>`;

        // Botón "Anterior"
        paginationHTML += createPageLink(currentPage - 1, prevpage);
        
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
        paginationHTML += createPageLink(currentPage + 1, nextpage);

    } else {
        console.log("No pagination numbers or 'Hoja X de Y' displayed: currentPage is 1 or maximum pages is 1.");
    }

    let pagerElement = document.getElementById("blog-pager");

    if (pagerElement) {
        console.log("#blog-pager found.");
        
        let prevButton = pagerElement.querySelector(".blog-pager-older-link");
        let nextButton = pagerElement.querySelector(".blog-pager-newer-link");

        console.log("prevButton:", prevButton, "nextButton:", nextButton);

        // Limpiamos cualquier paginación anterior personalizada
        let existingWrapper = pagerElement.querySelector(".pagination-numbers-wrapper");
        if (existingWrapper) {
            console.log("Removing existing .pagination-numbers-wrapper.");
            existingWrapper.remove();
        }

        // Si tenemos HTML de paginación (es decir, currentPage > 1 y maximum > 1)
        if (paginationHTML) {
            let paginationWrapper = document.createElement("div");
            paginationWrapper.className = "pagination-numbers-wrapper";
            paginationWrapper.innerHTML = paginationHTML;

            // Intento 1: Insertar entre los botones si ambos existen
            if (prevButton && nextButton) {
                console.log("Both prev and next buttons found. Inserting pagination in the middle.");
                pagerElement.insertBefore(paginationWrapper, nextButton);
            } 
            // Intento 2: Si solo existe el botón de "más reciente", insertar antes
            else if (nextButton) {
                 console.log("Only next button found. Inserting pagination before it.");
                 pagerElement.insertBefore(paginationWrapper, nextButton);
            }
            // Intento 3: Si solo existe el botón de "más antiguo", insertar después
            else if (prevButton) {
                 console.log("Only prev button found. Inserting pagination after it.");
                 pagerElement.appendChild(paginationWrapper);
            }
            // Intento 4: Si no hay botones predeterminados, pero sí hay #blog-pager, reemplazar su contenido
            else {
                console.log("No specific prev/next buttons found. Replacing #blog-pager content.");
                pagerElement.innerHTML = paginationHTML;
            }
        } else {
            console.log("No pagination HTML generated for current page conditions.");
            // Si no hay paginación para mostrar, asegúrate de que el contenedor esté vacío o inexistente
        }
    } else {
        console.error("#blog-pager not found. Custom pagination cannot be injected.");
    }
    isPaginationRendered = true; // Marcar como renderizado para evitar duplicados
}

function paginationall(data) {
    console.log("paginationall() callback received data:", data);
    let totalResults = parseInt(data.feed.openSearch$totalResults.$t, 10);
    if (isNaN(totalResults) || totalResults <= 0) {
        console.warn("totalResults is not a valid number or is 0. Using itemsPerPage as fallback. (This might be a problem if you have many posts).");
        totalResults = itemsPerPage;
    }
    if (data.feed.entry && data.feed.entry.length > 0) {
        lastPostDate = data.feed.entry[data.feed.entry.length - 1].updated.$t;
        console.log("lastPostDate from feed:", lastPostDate);
    } else if (!lastPostDate) {
        lastPostDate = new Date().toISOString();
        console.log("lastPostDate not found in feed, using current date:", lastPostDate);
    }
    renderPagination(totalResults);
}

// =============================================================================
// FUNCIONES DE REDIRECCIÓN (sin cambios importantes, solo logs)
// =============================================================================

function redirectpage(pageNum) {
    console.log("redirectpage() called for page:", pageNum);
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
    console.log("redirectlabel() called for page:", pageNum);
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
    console.log("finddatepost() called with data:", data);
    let post = data.feed.entry[0];
    let dateStr = post.published.$t.substring(0, 19) + post.published.$t.substring(23, 29);
    let encodedDate = encodeURIComponent(dateStr);

    let redirectUrl = type === "page"
        ? `${home_page}search?updated-max=${encodedDate}&max-results=${itemsPerPage}#PageNo=${nopage}`
        : `${home_page}search/label/${lblname1}?updated-max=${encodedDate}&max-results=${itemsPerPage}#PageNo=${nopage}`;

    console.log("Redirecting to:", redirectUrl);
    location.href = redirectUrl;
}

// =============================================================================
// INICIALIZACIÓN DEL SCRIPT
// =============================================================================

function initializeBloggerPagination() {
    console.log("initializeBloggerPagination() called.");
    searchQuery = getSearchQuery();
    let activePage = window.location.href; 
    console.log("Current URL:", activePage);

    if (activePage.includes("/search/label/")) {
        type = "label";
        lblname1 = activePage.split("/search/label/")[1].split("?")[0];
        console.log("Page type: Label, lblname1:", lblname1);
    } else if (searchQuery) {
        type = "search";
        console.log("Page type: Search, searchQuery:", searchQuery);
    } else {
        type = "page";
        console.log("Page type: Home/Archive");
    }

    currentPage = activePage.includes("#PageNo=") 
        ? parseInt(activePage.split("#PageNo=")[1], 10) 
        : 1;
    console.log("Determined currentPage:", currentPage);

    let scriptUrl;
    const maxResultsForTotal = 200; 
    if (type === "search") {
        let searchParam = searchQuery ? `q=${encodeURIComponent(searchQuery)}` : "";
        scriptUrl = `${home_page}feeds/posts/summary${searchParam}&max-results=${maxResultsForTotal}&alt=json-in-script&callback=paginationall`;
    } else if (type === "label") {
        scriptUrl = `${home_page}feeds/posts/summary/-/${lblname1}?max-results=${maxResultsForTotal}&alt=json-in-script&callback=paginationall`; 
    } else { // type === "page" (home or archive)
        scriptUrl = `${home_page}feeds/posts/summary?max-results=${maxResultsForTotal}&alt=json-in-script&callback=paginationall`;
    }

    console.log("Fetching feed from:", scriptUrl);
    let script = document.createElement("script");
    script.src = scriptUrl;
    script.onerror = () => console.error("Error al cargar el feed:", scriptUrl);
    document.body.appendChild(script);

    let labelLinks = document.querySelectorAll('a[href*="/search/label/"]');
    labelLinks.forEach(function (link) {
        if (!link.href.includes("?&max-results=") && !link.href.includes("&max-results=")) {
            link.href += `?&max-results=${itemsPerPage}`;
            console.log("Adjusted label link:", link.href);
        }
    });
}

// Debounce para asegurar que initializeBloggerPagination se llama solo una vez y cuando el DOM esté listo
let debounceTimeout;
const debounceInitialize = () => {
    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(() => {
        initializeBloggerPagination();
    }, 500); 
};

// Event Listeners
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
