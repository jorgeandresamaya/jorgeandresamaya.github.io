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
var totalPages = 0; // Variable para almacenar el total de páginas

// Obtener el parámetro de búsqueda
function getSearchQuery() {
    let urlParams = new URLSearchParams(window.location.search);
    return urlParams.get("q") || "";
}

// Función principal de paginación
function pagination(totalPosts) {
    let paginationHTML = "";
    let leftnum = Math.floor(pagesToShow / 2);
    let maximum = Math.ceil(totalPosts / itemsPerPage);
    totalPages = maximum; // Almacenar el total de páginas

    // Eliminar los botones de "Entradas más recientes" y "Entradas anteriores"
    // para insertarlos manualmente en el lugar correcto
    let blogPagerElement = document.getElementById("blog-pager");
    let newerLink = blogPagerElement ? blogPagerElement.querySelector(".blog-pager-newer-link") : null;
    let olderLink = blogPagerElement ? blogPagerElement.querySelector(".blog-pager-older-link") : null;

    let newerLinkHTML = newerLink ? newerLink.outerHTML : '';
    let olderLinkHTML = olderLink ? olderLink.outerHTML : '';

    // No mostrar la numeración si solo hay una página
    if (maximum <= 1) {
        if (blogPagerElement) blogPagerElement.innerHTML = ''; // Limpiar el contenedor si no hay paginación
        return;
    }

    // Botón "Entradas más recientes"
    if (currentPage > 1) {
        paginationHTML += `<a class='blog-pager-newer-link' href='${getNavLinkHref(currentPage - 1)}'>&#8592; Entradas más recientes</a>`;
    }

    // Numeración de páginas
    let startPage = Math.max(1, currentPage - leftnum);
    let endPage = Math.min(maximum, startPage + pagesToShow - 1);

    // Ajustar startPage y endPage si no hay suficientes páginas al final
    if (endPage - startPage + 1 < pagesToShow) {
        startPage = Math.max(1, endPage - pagesToShow + 1);
    }

    // Mostrar el primer número si no está en el rango visible y hay más de 5 páginas
    if (startPage > 1) {
        paginationHTML += createPageLink(1, "1");
        if (startPage > 2) paginationHTML += `<span class="pagination-dots">...</span>`;
    }

    for (let r = startPage; r <= endPage; r++) {
        paginationHTML += r === currentPage
            ? `<span class="pagenumber current">${r}</span>`
            : createPageLink(r, r);
    }

    // Mostrar los puntos suspensivos y el último número si no están en el rango visible
    if (endPage < maximum) {
        if (endPage < maximum - 1) paginationHTML += `<span class="pagination-dots">...</span>`;
        paginationHTML += createPageLink(maximum, maximum);
    }

    // Botón "Entradas anteriores"
    if (currentPage < maximum) {
        paginationHTML += `<a class='blog-pager-older-link' href='${getNavLinkHref(currentPage + 1)}'>Entradas anteriores &#8594;</a>`;
    }

    let numeracionPaginacion = document.getElementById("numeracion-paginacion");
    if (numeracionPaginacion) {
        numeracionPaginacion.innerHTML = paginationHTML;
    } else if (blogPagerElement) {
        // Fallback si por alguna razón 'numeracion-paginacion' no existe,
        // aunque el HTML lo provee. Esto aseguraría que se muestre.
        blogPagerElement.innerHTML = paginationHTML;
    }

    // Limpiar el contenido original del blog-pager para evitar duplicados,
    // ya que ahora la paginación se genera dentro de 'numeracion-paginacion'.
    // Esto es importante para que no se muestren los enlaces originales de Blogger
    // una vez que nuestro script ha tomado el control.
    if (blogPagerElement) {
        const originalNewerLink = blogPagerElement.querySelector(".blog-pager-newer-link");
        const originalOlderLink = blogPagerElement.querySelector(".blog-pager-older-link");
        if (originalNewerLink) originalNewerLink.remove();
        if (originalOlderLink) originalOlderLink.remove();
    }
}

// Función auxiliar para obtener el href de los botones "Anterior/Siguiente"
function getNavLinkHref(pageNum) {
    if (type === "page") {
        return pageNum === 1 ? home_page : `/search?updated-max=${lastPostDate || new Date().toISOString()}&max-results=${itemsPerPage}&start=${(pageNum - 1) * itemsPerPage}&by-date=false#PageNo=${pageNum}`;
    } else if (type === "label") {
        return pageNum === 1 ? `${window.location.origin}/search/label/${lblname1}?max-results=${itemsPerPage}` : `/search/label/${lblname1}?updated-max=${lastPostDate || new Date().toISOString()}&max-results=${itemsPerPage}&start=${(pageNum - 1) * itemsPerPage}&by-date=false#PageNo=${pageNum}`;
    } else { // type === "search"
        let searchParam = searchQuery ? `q=${encodeURIComponent(searchQuery)}` : "";
        let startIndex = (pageNum - 1) * itemsPerPage;
        return `${window.location.origin}/search?${searchParam}&updated-max=${encodeURIComponent(lastPostDate || new Date().toISOString())}&max-results=${itemsPerPage}&start=${startIndex}&by-date=false#PageNo=${pageNum}`;
    }
}

// Crear enlace de página
function createPageLink(pageNum, linkText) {
    let url;
    if (type === "page") {
        url = pageNum === 1 ? home_page : `/search?updated-max=${lastPostDate || new Date().toISOString()}&max-results=${itemsPerPage}&start=${(pageNum - 1) * itemsPerPage}&by-date=false#PageNo=${pageNum}`;
    } else if (type === "label") {
        url = pageNum === 1 ? `${window.location.origin}/search/label/${lblname1}?max-results=${itemsPerPage}` : `/search/label/${lblname1}?updated-max=${lastPostDate || new Date().toISOString()}&max-results=${itemsPerPage}&start=${(pageNum - 1) * itemsPerPage}&by-date=false#PageNo=${pageNum}`;
    } else { // type === "search"
        let searchParam = searchQuery ? `q=${encodeURIComponent(searchQuery)}` : "";
        let startIndex = (pageNum - 1) * itemsPerPage;
        url = `${window.location.origin}/search?${searchParam}&updated-max=${encodeURIComponent(lastPostDate || new Date().toISOString())}&max-results=${itemsPerPage}&start=${startIndex}&by-date=false#PageNo=${pageNum}`;
    }

    return `<span class="pagenumber"><a href="${url}">${linkText}</a></span>`;
}


// Manejar la paginación del feed
function paginationall(data) {
    let totalResults = parseInt(data.feed.openSearch$totalResults.$t, 10);
    if (isNaN(totalResults) || totalResults <= 0) {
        totalResults = itemsPerPage; // Fallback si no hay resultados válidos, aunque blogger suele dar 0 en feeds vacíos.
    }
    
    // Obtener la fecha de la última entrada si existe
    if (data.feed.entry && data.feed.entry.length > 0) {
        lastPostDate = data.feed.entry[data.feed.entry.length - 1].published.$t; // Usar 'published' para ser consistente con cómo Blogger construye las URLs de paginación
    } else if (!lastPostDate) {
        lastPostDate = new Date().toISOString(); // Si no hay entradas, usar la fecha actual como fallback
    }

    pagination(totalResults);
}

// Redirigir a página (ya no se usarán directamente en la paginación numérica, pero se mantienen por si hay otras llamadas)
function redirectpage(pageNum) {
    let url = (pageNum === 1) ? home_page : `/search?max-results=${itemsPerPage}&start=${(pageNum - 1) * itemsPerPage}#PageNo=${pageNum}`;
    location.href = url;
}

// Redirigir a etiqueta (ya no se usarán directamente en la paginación numérica, pero se mantienen por si hay otras llamadas)
function redirectlabel(pageNum) {
    let url = (pageNum === 1) ? `${window.location.origin}/search/label/${lblname1}?max-results=${itemsPerPage}` : `/search/label/${lblname1}?max-results=${itemsPerPage}&start=${(pageNum - 1) * itemsPerPage}#PageNo=${pageNum}`;
    location.href = url;
}

// Manejar redirección con fecha
function finddatepost(data) {
    let post = data.feed.entry[0];
    let dateStr = post.published.$t; // Usar la fecha completa para más precisión
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
    let maxResultsForFeed = itemsPerPage * pagesToShow; // Ajustar para obtener suficientes posts y calcular el total correctamente

    if (type === "search") {
        let searchParam = searchQuery ? `q=${encodeURIComponent(searchQuery)}` : "";
        scriptUrl = `${home_page}feeds/posts/summary${searchParam}&max-results=1&alt=json-in-script&callback=paginationall`; // Solo necesitamos 1 para totalResults
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

// Ajustar enlaces de etiquetas (se mantiene por si acaso, aunque la paginación numérica lo maneja)
document.addEventListener("DOMContentLoaded", function () {
    bloggerpage();

    // Este bloque de código asegura que los enlaces de etiqueta existentes en el blog
    // siempre incluyan el parámetro max-results.
    // Esto es independiente de la paginación numérica, pero es una buena práctica
    // para asegurar que las páginas de etiquetas se carguen con la cantidad correcta de elementos.
    let labelLinks = document.querySelectorAll('a[href*="/search/label/"]');
    labelLinks.forEach(function (link) {
        // Solo modificar si no tiene un max-results ya o si está mal formado (e.g. "?&max-results=")
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
