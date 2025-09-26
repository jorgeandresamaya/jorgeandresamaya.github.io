/*!
 * Paginación numérica personalizada para Blogger
 * Autor: Jorge Andrés Amaya
 * Blog: Descubre con Jorge Andrés Amaya
 * URL: https://jorgeandresamaya.blogspot.com
 * Versión: 1.0
 * Descripción: Inserta paginación numérica real en el contenedor #numeracion-paginacion,
 *              oculta en la primera página, sin reemplazar #blog-pager ni duplicar elementos.
 */

// Variables globales (deben definirse en la plantilla antes de cargar este script)
var currentPage, searchQuery, lastPostDate = null, type, lblname1, nopage;
var itemsPerPage = 7; // Asegúrate de que esta variable esté definida en tu plantilla Blogger
var pagesToShow = 5;  // Número de páginas a mostrar en la paginación
var home_page = "https://tudominio.blogspot.com/"; // Reemplaza con la URL de tu blog
var prevpage = "&lt; Prev"; // Texto para el botón "Anterior"
var nextpage = "Next &gt;"; // Texto para el botón "Siguiente"


// --- FUNCIONES DE PAGINACIÓN ---

// Obtener el parámetro de búsqueda
function getSearchQuery() {
    let urlParams = new URLSearchParams(window.location.search);
    return urlParams.get("q") || "";
}

// Función principal de paginación
function pagination(totalPosts) {
    console.log("pagination() called.");
    console.log("currentPage:", currentPage, "totalPosts:", totalPosts, "itemsPerPage:", itemsPerPage);

    let paginationHTML = "";
    let leftnum = Math.floor(pagesToShow / 2);
    let maximum = Math.ceil(totalPosts / itemsPerPage);

    console.log("Calculated maximum pages:", maximum);

    // Solo mostrar la numeración si no es la primera página Y hay más de una página en total
    if (currentPage > 1 && maximum > 1) {
        paginationHTML += `<span class='totalpages'>Hoja ${currentPage} de ${maximum}</span>`;

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
    } else {
        console.log("Pagination numbers not displayed: currentPage is 1 or maximum pages is 1.");
    }

    let pagerElement = document.getElementById("blog-pager");

    if (pagerElement) {
        console.log("#blog-pager found.");
        // Limpiar el contenido existente en pageArea (si se usa)
        let pageArea = document.getElementsByName("pageArea");
        for (let i = 0; i < pageArea.length; i++) {
            pageArea[i].innerHTML = ""; // Vaciar para evitar duplicados si se usa esta clase
        }

        let prevButton = pagerElement.querySelector(".blog-pager-older-link");
        let nextButton = pagerElement.querySelector(".blog-pager-newer-link");

        console.log("prevButton:", prevButton, "nextButton:", nextButton);

        // Insertar la paginación en el medio si prevButton existe y hay HTML de paginación
        if (prevButton && nextButton && paginationHTML) {
            console.log("Both prev and next buttons found. Inserting pagination.");
            // Crear un contenedor para la numeración y su "Hoja X de Y"
            let paginationWrapper = document.createElement("div");
            paginationWrapper.className = "pagination-numbers-wrapper"; // Clase para estilizar
            paginationWrapper.innerHTML = paginationHTML;

            // Insertar el nuevo elemento después del botón "anterior"
            pagerElement.insertBefore(paginationWrapper, nextButton);
        } else if (paginationHTML) {
            console.log("One or both default buttons not found, or no paginationHTML. Appending to #blog-pager.");
            // Si no hay botones predeterminados, simplemente añadir al pagerElement
            pagerElement.innerHTML += paginationHTML; // Usar += para no borrar los botones si solo falta uno
        } else {
            console.log("No pagination HTML generated, or no suitable place to insert it.");
        }
    } else {
        console.error("#blog-pager not found. Paginación no puede ser inyectada.");
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
    console.log("paginationall() called with data:", data);
    let totalResults = parseInt(data.feed.openSearch$totalResults.$t, 10);
    if (isNaN(totalResults) || totalResults <= 0) {
        console.warn("totalResults is not a valid number or is 0. Using itemsPerPage as fallback.");
        totalResults = itemsPerPage; // Fallback si no hay resultados válidos
    }
    if (data.feed.entry && data.feed.entry.length > 0) {
        lastPostDate = data.feed.entry[data.feed.entry.length - 1].updated.$t;
        console.log("lastPostDate from feed:", lastPostDate);
    } else if (!lastPostDate) {
        lastPostDate = new Date().toISOString();
        console.log("lastPostDate not found in feed, using current date:", lastPostDate);
    }
    pagination(totalResults);
}

// Redirigir a página
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

// Redirigir a etiqueta
function redirectlabel(pageNum) {
    console.log("redirectlabel() called for page:", pageNum);
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
    console.log("finddatepost() called with data:", data);
    let post = data.feed.entry[0];
    let dateStr = post.published.$t.substring(0, 19) + post.published.$t.substring(23, 29);
    let encodedDate = encodeURIComponent(dateStr);

    let redirectUrl = type === "page"
        ? `/search?updated-max=${encodedDate}&max-results=${itemsPerPage}#PageNo=${nopage}`
        : `/search/label/${lblname1}?updated-max=${encodedDate}&max-results=${itemsPerPage}#PageNo=${nopage}`;

    console.log("Redirecting to:", redirectUrl);
    location.href = redirectUrl;
}

// Determinar tipo de página y cargar datos
function bloggerpage() {
    console.log("bloggerpage() called.");
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
    // Ajustado para asegurar que max-results sea un número razonable para obtener el total de posts
    const maxResultsForTotal = 200; // Un número alto para obtener el total de posts
    if (type === "search") {
        let searchParam = searchQuery ? `?q=${encodeURIComponent(searchQuery)}` : "";
        scriptUrl = `${home_page}feeds/posts/summary${searchParam}&max-results=${maxResultsForTotal}&alt=json-in-script&callback=paginationall`;
    } else if (type === "label") {
        scriptUrl = `${home_page}feeds/posts/summary/-/${lblname1}?max-results=${maxResultsForTotal}&alt=json-in-script&callback=paginationall`; 
    } else { // type === "page"
        scriptUrl = `${home_page}feeds/posts/summary?max-results=${maxResultsForTotal}&alt=json-in-script&callback=paginationall`;
    }

    console.log("Fetching feed from:", scriptUrl);
    let script = document.createElement("script");
    script.src = scriptUrl;
    script.onerror = () => console.error("Error al cargar el feed:", scriptUrl);
    document.body.appendChild(script);
}

// Ajustar enlaces de etiquetas y ejecutar la función principal
document.addEventListener("DOMContentLoaded", function () {
    console.log("DOM fully loaded and parsed. Initializing bloggerpage().");
    bloggerpage();

    let labelLinks = document.querySelectorAll('a[href*="/search/label/"]');
    labelLinks.forEach(function (link) {
        if (!link.href.includes("?&max-results=") && !link.href.includes("&max-results=")) {
            link.href += `?&max-results=${itemsPerPage}`;
            console.log("Adjusted label link:", link.href);
        }
    });
});

function addMaxResults(event) {
  event.preventDefault(); // Evitar el envío por defecto
  var query = document.querySelector('input[name="q"]').value;
  var baseUrl = (typeof searchBaseUrl !== 'undefined' ? searchBaseUrl : (home_page + 'search')); 
  var searchUrl = baseUrl + "?q=" + encodeURIComponent(query) + "&max-results=" + itemsPerPage;
  window.location.href = searchUrl; 
}
