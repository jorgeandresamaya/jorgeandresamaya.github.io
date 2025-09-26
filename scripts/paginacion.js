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
// Variables globales
var currentPage, searchQuery, lastPostDate = null, type, lblname1, nopage;

var itemsPerPage = 10;
var pagesToShow = 5;
var prevpage = 'Artículos más recientes';
var nextpage = 'Artículos anteriores';
var urlactivepage = location.href;
var home_page = "/";

function getSearchQuery() {
    let urlParams = new URLSearchParams(window.location.search);
    return urlParams.get("q") || "";
}

function createPageLink(pageNum, linkText) {
    if (type === "page") {
        return `<a href="#" onclick="redirectpage(${pageNum}); return false;">${linkText}</a>`;
    } else if (type === "label") {
        return `<a href="#" onclick="redirectlabel(${pageNum}); return false;">${linkText}</a>`;
    } else {
        let searchParam = searchQuery ? `q=${encodeURIComponent(searchQuery)}` : "";
        let startIndex = (pageNum - 1) * itemsPerPage;
        let url = `${window.location.origin}/search?${searchParam}&updated-max=${encodeURIComponent(lastPostDate || new Date().toISOString())}&max-results=${itemsPerPage}&start=${startIndex}&by-date=false#PageNo=${pageNum}`;
        return `<a href="${url}">${linkText}</a>`;
    }
}

function pagination(totalPosts) {
    let maxPages = Math.ceil(totalPosts / itemsPerPage);
    let half = Math.floor(pagesToShow / 2);
    let start, end;

    if (currentPage > maxPages) currentPage = maxPages;

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

    // Botón "Entradas más recientes" (anterior) a la izquierda
    let prevHTML = currentPage > 1 ? `<span class="blog-pager-newer-link">${createPageLink(currentPage - 1, prevpage)}</span>` : '';

    // Botón "Entradas anteriores" (siguiente) a la derecha
    let nextHTML = currentPage < maxPages ? `<span class="blog-pager-older-link">${createPageLink(currentPage + 1, nextpage)}</span>` : '';

    // Construir números de página para centrar
    let numbersHTML = '';
    if (start > 1) {
        numbersHTML += `<span class="pagenumber">${createPageLink(1, '1')}</span>`;
        if (start > 2) numbersHTML += `<span class="dots">...</span>`;
    }

    for (let i = start; i <= end; i++) {
        if (i === currentPage) {
            numbersHTML += `<span class="pagenumber current">${i}</span>`;
        } else {
            numbersHTML += `<span class="pagenumber">${createPageLink(i, i)}</span>`;
        }
    }

    if (end < maxPages) {
        if (end < maxPages - 1) numbersHTML += `<span class="dots">...</span>`;
        numbersHTML += `<span class="pagenumber">${createPageLink(maxPages, maxPages)}</span>`;
    }

    // Insertar en el DOM
    let pagerElement = document.getElementById("blog-pager");
    let numberContainer = document.getElementById("numeracion-paginacion");

    if (pagerElement && numberContainer) {
        // Botones anteriores y siguientes en blog-pager
        pagerElement.innerHTML = prevHTML + nextHTML;

        // Mostrar numeración centrada solo si no es la primera página
        numberContainer.innerHTML = currentPage > 1 ? numbersHTML : '';
    }
}

// Resto funciones sin cambios (paginationall, redirectpage, redirectlabel, finddatepost, bloggerpage)

function paginationall(data) {
    let totalResults = parseInt(data.feed.openSearch$totalResults.$t, 10);
    if (isNaN(totalResults) || totalResults <= 0) {
        totalResults = itemsPerPage;
    }
    if (data.feed.entry && data.feed.entry.length > 0) {
        lastPostDate = data.feed.entry[data.feed.entry.length - 1].updated.$t;
    } else if (!lastPostDate) {
        lastPostDate = new Date().toISOString();
    }
    pagination(totalResults);
}

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

function finddatepost(data) {
    let post = data.feed.entry[0];
    let dateStr = post.published.$t.substring(0, 19) + post.published.$t.substring(23, 29);
    let encodedDate = encodeURIComponent(dateStr);
    let redirectUrl = type === "page"
        ? `/search?updated-max=${encodedDate}&max-results=${itemsPerPage}#PageNo=${nopage}`
        : `/search/label/${lblname1}?updated-max=${encodedDate}&max-results=${itemsPerPage}#PageNo=${nopage}`;
    location.href = redirectUrl;
}

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
        let searchParam = searchQuery ? `?q=${encodeURIComponent(searchQuery)}` : "";
        scriptUrl = `${home_page}feeds/posts/summary${searchParam}&max-results=150&alt=json-in-script&callback=paginationall`;
    } else if (type === "label") {
        scriptUrl = `${home_page}feeds/posts/summary/-/${lblname1}?max-results=1&alt=json-in-script&callback=paginationall`;
    } else {
        scriptUrl = `${home_page}feeds/posts/summary?max-results=1&alt=json-in-script&callback=paginationall`;
    }

    let script = document.createElement("script");
    script.src = scriptUrl;
    script.onerror = () => console.error("Error al cargar el feed:", scriptUrl);
    document.body.appendChild(script);
}

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
  event.preventDefault();
  var query = document.querySelector('input[name="q"]').value;
  var baseUrl = (typeof searchBaseUrl !== 'undefined' ? searchBaseUrl : (home_page + 'search'));
  var searchUrl = baseUrl + "?q=" + encodeURIComponent(query) + "&max-results=" + itemsPerPage;
  window.location.href = searchUrl;
}
