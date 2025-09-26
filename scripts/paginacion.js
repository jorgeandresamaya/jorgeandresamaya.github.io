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
// Parámetros globales
var currentPage, searchQuery, lastPostDate = null, type, lblname1, nopage;

// Configuración
var itemsPerPage = 10;
var pagesToShow = 5;
var prevpage = 'Artículos más recientes';
var nextpage = 'Artículos anteriores';
var urlactivepage = location.href;
var home_page = "/";

// Obtener parámetro de búsqueda
function getSearchQuery() {
    var urlParams = new URLSearchParams(window.location.search);
    return urlParams.get("q") || "";
}

// Función principal de paginación
function pagination(totalPosts) {
    var paginationHTML = "";
    var maximum = Math.ceil(totalPosts / itemsPerPage);
    if (maximum <= 1) return;

    var leftnum = Math.floor(pagesToShow / 2);

    // Enlace "Anterior"
    if (currentPage > 1) {
        paginationHTML += createPageLink(currentPage - 1, prevpage);
    }

    // Mostrar numeración solo a partir de la página 2
    if (currentPage >= 2) {
        var start = Math.max(currentPage - leftnum, 1);
        var end = Math.min(start + pagesToShow - 1, maximum);
        if (end - start + 1 < pagesToShow) {
            start = Math.max(end - pagesToShow + 1, 1);
        }

        // Primer número y puntos suspensivos
        if (start > 1) {
            paginationHTML += createPageLink(1, "1");
            if (start > 2) paginationHTML += "<span class='dots'>...</span>";
        }

        // Números intermedios
        for (var r = start; r <= end; r++) {
            paginationHTML += (r === currentPage)
                ? "<span class='pagenumber current'>" + r + "</span>"
                : createPageLink(r, r);
        }

        // Último número y puntos suspensivos
        if (end < maximum) {
            if (end < maximum - 1) paginationHTML += "<span class='dots'>...</span>";
            paginationHTML += createPageLink(maximum, maximum);
        }
    }

    // Enlace "Siguiente"
    if (currentPage < maximum) {
        paginationHTML += createPageLink(currentPage + 1, nextpage);
    }

    // Insertar numeración centrada sin afectar los botones
    var numeracion = document.getElementById("numeracion-paginacion");
    if (numeracion) {
        numeracion.innerHTML = "<div style='display:flex;justify-content:center;align-items:center;flex-wrap:wrap;gap:5px;'>" + paginationHTML + "</div>";
    }
}

// Crear enlace de página
function createPageLink(pageNum, linkText) {
    if (type === "page") {
        return "<span class='pagenumber'><a href='#' onclick='redirectpage(" + pageNum + "); return false;'>" + linkText + "</a></span>";
    } else if (type === "label") {
        return "<span class='pagenumber'><a href='#' onclick='redirectlabel(" + pageNum + "); return false;'>" + linkText + "</a></span>";
    } else { // search
        var searchParam = searchQuery ? "q=" + encodeURIComponent(searchQuery) : "";
        var startIndex = (pageNum - 1) * itemsPerPage;
        var url = window.location.origin + "/search?" + searchParam + "&updated-max=" + encodeURIComponent(lastPostDate || new Date().toISOString()) + "&max-results=" + itemsPerPage + "&start=" + startIndex + "&by-date=false#PageNo=" + pageNum;
        return "<span class='pagenumber'><a href='" + url + "'>" + linkText + "</a></span>";
    }
}

// Manejar la paginación del feed
function paginationall(data) {
    var totalResults = parseInt(data.feed.openSearch$totalResults.$t, 10);
    if (isNaN(totalResults) || totalResults <= 0) totalResults = itemsPerPage;
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
    nopage = pageNum;
    var jsonstart = (pageNum - 1) * itemsPerPage;
    var script = document.createElement("script");
    script.type = "text/javascript";
    script.src = home_page + "feeds/posts/summary?start-index=" + jsonstart + "&max-results=1&alt=json-in-script&callback=finddatepost";
    document.getElementsByTagName("head")[0].appendChild(script);
}

// Redirigir a etiqueta
function redirectlabel(pageNum) {
    if (pageNum === 1) {
        location.href = window.location.origin + "/search/label/" + lblname1 + "?max-results=" + itemsPerPage + "#PageNo=1";
        return;
    }
    nopage = pageNum;
    var jsonstart = (pageNum - 1) * itemsPerPage;
    var script = document.createElement("script");
    script.type = "text/javascript";
    script.src = home_page + "feeds/posts/summary/-/" + lblname1 + "?start-index=" + jsonstart + "&max-results=1&alt=json-in-script&callback=finddatepost";
    document.getElementsByTagName("head")[0].appendChild(script);
}

// Redirección con fecha
function finddatepost(data) {
    var post = data.feed.entry[0];
    var dateStr = post.published.$t.substring(0, 19) + post.published.$t.substring(23, 29);
    var encodedDate = encodeURIComponent(dateStr);
    var redirectUrl = (type === "page")
        ? "/search?updated-max=" + encodedDate + "&max-results=" + itemsPerPage + "#PageNo=" + nopage
        : "/search/label/" + lblname1 + "?updated-max=" + encodedDate + "&max-results=" + itemsPerPage + "#PageNo=" + nopage;
    location.href = redirectUrl;
}

// Determinar tipo de página y cargar datos
function bloggerpage() {
    searchQuery = getSearchQuery();
    var activePage = urlactivepage;
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

    var scriptUrl;
    if (type === "search") {
        var searchParam = searchQuery ? "?q=" + encodeURIComponent(searchQuery) : "";
        scriptUrl = home_page + "feeds/posts/summary" + searchParam + "&max-results=150&alt=json-in-script&callback=paginationall";
    } else if (type === "label") {
        scriptUrl = home_page + "feeds/posts/summary/-/" + lblname1 + "?max-results=1&alt=json-in-script&callback=paginationall";
    } else {
        scriptUrl = home_page + "feeds/posts/summary?max-results=1&alt=json-in-script&callback=paginationall";
    }

    var script = document.createElement("script");
    script.src = scriptUrl;
    script.onerror = function() { console.error("Error al cargar el feed:", scriptUrl); };
    document.body.appendChild(script);
}

// Ajustar enlaces de etiquetas
document.addEventListener("DOMContentLoaded", function () {
    bloggerpage();
    var labelLinks = document.querySelectorAll('a[href*="/search/label/"]');
    labelLinks.forEach(function (link) {
        if (!link.href.includes("?&max-results=")) link.href += "?&max-results=" + itemsPerPage;
    });
});

// Buscar con max-results
function addMaxResults(event) {
    event.preventDefault();
    var query = document.querySelector('input[name="q"]').value;
    var baseUrl = typeof searchBaseUrl !== 'undefined' ? searchBaseUrl : home_page + 'search';
    var searchUrl = baseUrl + "?q=" + encodeURIComponent(query) + "&max-results=" + itemsPerPage;
    window.location.href = searchUrl;
}
