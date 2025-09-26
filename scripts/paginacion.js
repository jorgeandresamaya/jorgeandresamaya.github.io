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
// Parámetros globales (estas variables se definirán en la plantilla)
var currentPage, searchQuery, lastPostDate = null, type, lblname1, nopage;
var totalPages = 0; // Variable para almacenar el total de páginas

// Obtener el parámetro de búsqueda
function getSearchQuery() {
    let urlParams = new URLSearchParams(window.location.search);
    return urlParams.get("q") || "";
}

// Función principal de paginación
function pagination(totalPosts) {
    let pageNumbersHTML = ""; // HTML para la numeración central
    let leftnum = Math.floor(pagesToShow / 2);
    let maximum = Math.ceil(totalPosts / itemsPerPage);
    totalPages = maximum; // Almacenar el total de páginas

    // Referencias a los elementos existentes en el DOM
    const numeracionPaginacionElement = document.getElementById("numeracion-paginacion");
    const newerLinkElement = document.querySelector(".blog-pager-newer-link");
    const olderLinkElement = document.querySelector(".blog-pager-older-link");

    if (!numeracionPaginacionElement) {
        console.error("El elemento #numeracion-paginacion no se encontró. Asegúrate de que existe en tu HTML.");
        return;
    }

    // Si solo hay una página, limpiar la numeración y deshabilitar/ocultar botones si existen
    if (maximum <= 1) {
        numeracionPaginacionElement.innerHTML = '';
        if (newerLinkElement) newerLinkElement.style.display = 'none'; // Ocultar
        if (olderLinkElement) olderLinkElement.style.display = 'none'; // Ocultar
        return;
    } else {
        // Asegurarse de que los botones estén visibles si hay más de una página
        if (newerLinkElement) newerLinkElement.style.display = '';
        if (olderLinkElement) olderLinkElement.style.display = '';
    }

    // --- Generación de los enlaces de Paginación Numérica ---
    let startPage = Math.max(1, currentPage - leftnum);
    let endPage = Math.min(maximum, startPage + pagesToShow - 1);

    // Ajustar startPage y endPage si no hay suficientes páginas al final
    if (endPage - startPage + 1 < pagesToShow) {
        startPage = Math.max(1, endPage - pagesToShow + 1);
    }

    // Mostrar el primer número si no está en el rango visible y hay más de `pagesToShow` páginas
    if (startPage > 1 && maximum > pagesToShow) {
        pageNumbersHTML += createPageLink(1, "1");
        if (startPage > 2) pageNumbersHTML += `<span class="pagination-dots">...</span>`;
    }

    for (let r = startPage; r <= endPage; r++) {
        pageNumbersHTML += r === currentPage
            ? `<span class="pagenumber current">${r}</span>`
            : createPageLink(r, r);
    }

    // Mostrar los puntos suspensivos y el último número si no están en el rango visible y hay más de `pagesToShow` páginas
    if (endPage < maximum && maximum > pagesToShow) {
        if (endPage < maximum - 1) pageNumbersHTML += `<span class="pagination-dots">...</span>`;
        pageNumbersHTML += createPageLink(maximum, maximum);
    }
    
    // Insertar la numeración de páginas dentro del div #numeracion-paginacion
    numeracionPaginacionElement.innerHTML = pageNumbersHTML;

    // --- Actualizar los enlaces de los botones "Más recientes" y "Anteriores" ---
    if (newerLinkElement) {
        if (currentPage > 1) {
            newerLinkElement.href = getNavLinkHref(currentPage - 1);
            newerLinkElement.style.display = ''; // Asegurar visibilidad
        } else {
            newerLinkElement.style.display = 'none'; // Ocultar si estamos en la primera página
        }
    }

    if (olderLinkElement) {
        if (currentPage < maximum) {
            olderLinkElement.href = getNavLinkHref(currentPage + 1);
            olderLinkElement.style.display = ''; // Asegurar visibilidad
        } else {
            olderLinkElement.style.display = 'none'; // Ocultar si estamos en la última página
        }
    }
}

// Función auxiliar para obtener el href de los enlaces de paginación (números y botones)
function getNavLinkHref(pageNum) {
    let baseUrl = window.location.origin;
    let url;
    let startIndex = (pageNum - 1) * itemsPerPage;
    const effectiveLastPostDate = lastPostDate || new Date().toISOString(); // Fallback si no hay lastPostDate

    if (type === "page") {
        url = pageNum === 1 
            ? home_page 
            : `${baseUrl}/search?updated-max=${encodeURIComponent(effectiveLastPostDate)}&max-results=${itemsPerPage}&start=${startIndex}&by-date=false#PageNo=${pageNum}`;
    } else if (type === "label") {
        url = pageNum === 1 
            ? `${baseUrl}/search/label/${lblname1}?max-results=${itemsPerPage}` 
            : `${baseUrl}/search/label/${lblname1}?updated-max=${encodeURIComponent(effectiveLastPostDate)}&max-results=${itemsPerPage}&start=${startIndex}&by-date=false#PageNo=${pageNum}`;
    } else { // type === "search"
        let searchParam = searchQuery ? `q=${encodeURIComponent(searchQuery)}` : "";
        url = `${baseUrl}/search?${searchParam}&updated-max=${encodeURIComponent(effectiveLastPostDate)}&max-results=${itemsPerPage}&start=${startIndex}&by-date=false#PageNo=${pageNum}`;
    }
    return url;
}


// Crear enlace de página para los números
function createPageLink(pageNum, linkText) {
    // Reutilizamos getNavLinkHref para consistencia
    let url = getNavLinkHref(pageNum);
    return `<span class="pagenumber"><a href="${url}">${linkText}</a></span>`;
}


// Manejar la paginación del feed
function paginationall(data) {
    let totalResults = parseInt(data.feed.openSearch$totalResults.$t, 10);
    if (isNaN(totalResults) || totalResults <= 0) {
        totalResults = itemsPerPage; // Fallback si no hay resultados válidos.
    }
    
    // Obtener la fecha del último post del feed actual
    if (data.feed.entry && data.feed.entry.length > 0) {
        lastPostDate = data.feed.entry[data.feed.entry.length - 1].published.$t; 
    } else if (!lastPostDate) {
        lastPostDate = new Date().toISOString(); // Fallback
    }

    pagination(totalResults);
}

// Redirigir a página (se mantienen pero no se usan para la paginación numérica)
function redirectpage(pageNum) {
    location.href = getNavLinkHref(pageNum);
}

// Redirigir a etiqueta (se mantienen pero no se usan para la paginación numérica)
function redirectlabel(pageNum) {
    location.href = getNavLinkHref(pageNum);
}

// Manejar redirección con fecha (se mantiene por si acaso)
function finddatepost(data) {
    let post = data.feed.entry[0];
    let dateStr = post.published.$t;
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
    // Siempre necesitamos max-results=1 para obtener totalResults y la fecha del último post de forma eficiente.
    if (type === "search") {
        let searchParam = searchQuery ? `q=${encodeURIComponent(searchQuery)}` : "";
        scriptUrl = `${home_page}feeds/posts/summary${searchParam}&max-results=1&alt=json-in-script&callback=paginationall`;
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

// Ajustar enlaces de etiquetas y búsqueda al cargar el DOM
document.addEventListener("DOMContentLoaded", function () {
    bloggerpage();

    // Este bloque de código asegura que los enlaces de etiqueta existentes en el blog
    // siempre incluyan el parámetro max-results.
    let labelLinks = document.querySelectorAll('a[href*="/search/label/"]');
    labelLinks.forEach(function (link) {
        if (!link.href.includes("max-results=")) {
            link.href += (link.href.includes("?") ? "&" : "?") + `max-results=${itemsPerPage}`;
        }
    });

    // También para enlaces de búsqueda genéricos si los hubiera
    let searchLinks = document.querySelectorAll('a[href*="/search?q="]');
    searchLinks.forEach(function(link) {
        if (!link.href.includes("max-results=")) {
            link.href += (link.href.includes("?") ? "&" : "?") + `max-results=${itemsPerPage}`;
        }
    });
});

// Función para el formulario de búsqueda (se mantiene como estaba)
function addMaxResults(event) {
  event.preventDefault();
  var query = document.querySelector('input[name="q"]').value;
  var baseUrl = (typeof searchBaseUrl !== 'undefined' ? searchBaseUrl : (home_page + 'search'));
  var searchUrl = baseUrl + "?q=" + encodeURIComponent(query) + "&max-results=" + itemsPerPage;
  window.location.href = searchUrl;
}
