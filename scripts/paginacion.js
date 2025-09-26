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
var currentPage, searchQuery, lastPostDate = null, type, lblname1, nopage;

// Número de entradas por página y cantidad visible de páginas
var itemsPerPage = 10; 
var pagesToShow = 5; 
var prevpage = 'Artículos más recientes'; 
var nextpage = 'Artículos anteriores'; 
var urlactivepage = location.href; 
var home_page = "/";

// Obtener el parámetro de búsqueda
function getSearchQuery() {
    let urlParams = new URLSearchParams(window.location.search);
    return urlParams.get("q") || "";
}

// Función principal de paginación adaptada
function pagination(totalPosts) {
    let paginationHTML = "";
    let maxPages = Math.ceil(totalPosts / itemsPerPage);
    let half = Math.floor(pagesToShow / 2);
    let start, end;

    if (currentPage > maxPages) currentPage = maxPages;

    // Calcular los límites de páginas a mostrar para centrar la numeración
    if (maxPages <= pagesToShow) {
        start = 1;
        end = maxPages;
    } else if (currentPage - half <= 1) {
        start = 1;
        end = pagesToShow;
    } else if (currentPage + half >= maxPages) {
        start = maxPages - pagesToShow + 1;
        end = maxPages;
    } else {
        start = currentPage - half;
        end = currentPage + half;
    }

    // Crear botón Anterior si no está en la primera página
    if (currentPage > 1) {
        paginationHTML += createPageLink(currentPage - 1, prevpage);
    }

    // Mostrar primera página y puntos suspensivos si corresponde
    if (start > 1) {
        paginationHTML += createPageLink(1, "1");
        if (start > 2) {
            paginationHTML += `<span class="dots">...</span>`;
        }
    }

    // Mostrar rango de páginas centrado
    for (let i = start; i <= end; i++) {
        if (i === currentPage) {
            paginationHTML += `<span class="pagenumber current">${i}</span>`;
        } else {
            paginationHTML += createPageLink(i, i);
        }
    }

    // Mostrar puntos suspensivos y última página si corresponde
    if (end < maxPages) {
        if (end < maxPages - 1) {
            paginationHTML += `<span class="dots">...</span>`;
        }
        paginationHTML += createPageLink(maxPages, maxPages);
    }

    // Crear botón Siguiente si no está en la última página
    if (currentPage < maxPages) {
        paginationHTML += createPageLink(currentPage + 1, nextpage);
    }

    // Insertar la paginación centrada solo a partir de la segunda página
    let pagerElement = document.getElementById("blog-pager");
    if (pagerElement) {
        if (currentPage > 1) {
            pagerElement.innerHTML = paginationHTML;
        } else {
            // Página 1 solo muestra botones sin numeración centrada
            let firstPageHTML = "";
            if (currentPage > 1) {
                firstPageHTML += createPageLink(currentPage - 1, prevpage);
            }
            if (currentPage < maxPages) {
                firstPageHTML += createPageLink(currentPage + 1, nextpage);
            }
            pagerElement.innerHTML = firstPageHTML;
        }
    }
}

// Crear enlace de página
function createPageLink(pageNum, linkText) {
    if (type === "page") {
        return `<span class="pagenumber"><a href="#" onclick="redirectpage(${pageNum}); return false;">${linkText}</a></span>`;
    } else if (type === "label") {
        return `<span class="pagenumber"><a href="#" onclick="redirectlabel(${pageNum}); return false;">${linkText}</a></span>`;
    } else { // type === "search"
        let searchParam = searchQuery ? `q=${encodeURIComponent(searchQuery)}` : "";
        let startIndex = (pageNum - 1) * itemsPerPage;
        let url = `${window.location.origin}/search?${searchParam}&updated-max=${encodeURIComponent(lastPostDate || new Date().toISOString())}&max-results=${itemsPerPage}&start=${startIndex}&by-date=false#PageNo=${pageNum}`;
        return `<span class="pagenumber"><a href="${url}">${linkText}</a></span>`;
    }
}

// Manejar la paginación del feed
function paginationall(data) {
    let totalResults = parseInt(data.feed.openSearch$totalResults.$t, 10);
    if (isNaN(totalResults) || totalResults <= 0) {
        totalResults = itemsPerPage; // Fallback si no hay resultados válidos
    }
    if (data.feed.entry && data.feed.entry.length > 0) {
        lastPostDate = data.feed.entry[data.feed.entry.length - 1].updated.$t;
    } else if (!lastPostDate) {
        lastPostDate = new Date().toISOString();
    }
    pagination(totalResults);
}

// Redirigir a página
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

// Redirigir a etiqueta
function redirectlabel(pageNum) {
    if (pageNum === 1) {
        location.href = `${window.location.origin}/search/label/${lblname1}?max-results=${itemsPerPage}#PageNo=1`;
        return;
    }

    jsonstart = (pageNum - 1) * itemsPerPage;
    nopage = pageNum;

    let script = document.createElement("script");
    script.type = "text/javascript";
    script.src = `${home_page}feeds/posts/summary/-/${lblname1}?start-index=${jsonstart}&max-results=1&alt=json-in-script&callback=finddatepost`;
    document.getElementsByTagName("head")[0].appendChild(script);
}

// Manejar redirección con fecha
function finddatepost(data) {
    let post = data.feed.entry[0];
    let dateStr = post.published.$t.substring(0, 19) + post.published.$t.substring(23, 29);
    let encodedDate = encodeURIComponent(dateStr);

    let redirectUrl = type === "page"
        ? `/search?updated-max=${encodedDate}&max-results=${itemsPerPage}#PageNo=${nopage}`
        : `/search/label/${lblname1}?updated-max=${encodedDate}&max-results=${itemsPerPage}#PageNo=${nopage}`;

    location.href = redirectUrl;
}

// Determinar tipo de página y cargar datos
function bloggerpage() {
    searchQuery = getSearchQuery();
    let activePage = urlactivepage;

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
    if (type === "search") {
        // Usar el feed con el parámetro de búsqueda correctamente
        let searchParam = searchQuery ? `?q=${encodeURIComponent(searchQuery)}` : "";
        scriptUrl = `${home_page}feeds/posts/summary${searchParam}&max-results=150&alt=json-in-script&callback=paginationall`;
    } else if (type === "label") {
        scriptUrl = `${home_page}feeds/posts/summary/-/${lblname1}?max-results=1&alt=json-in-script&callback=paginationall`;
    } else { // type === "page"
        scriptUrl = `${home_page}feeds/posts/summary?max-results=1&alt=json-in-script&callback=paginationall`;
    }

    let script = document.createElement("script");
    script.src = scriptUrl;
    script.onerror = () => console.error("Error al cargar el feed:", scriptUrl);
    document.body.appendChild(script);
}

// Ajustar enlaces de etiquetas
document.addEventListener("DOMContentLoaded", function () {
    bloggerpage();

    let labelLinks = document.querySelectorAll('a[href*="/search/label/"]');
    labelLinks.forEach(function (link) {
        if (!link.href.includes("?&max-results=")) {
            link.href += `?&max-results=${itemsPerPage}`;
        }
    });
});

function addMaxResults(event) {
  event.preventDefault(); // Evitar el envío por defecto
  var query = document.querySelector('input[name="q"]').value;
  var baseUrl = (typeof searchBaseUrl !== 'undefined' ? searchBaseUrl : (home_page + 'search')); // Usar searchBaseUrl o fallback a home_page + 'search'
  var searchUrl = baseUrl + "?q=" + encodeURIComponent(query) + "&max-results=" + itemsPerPage;
  window.location.href = searchUrl; // Redirigir con max-results
}
