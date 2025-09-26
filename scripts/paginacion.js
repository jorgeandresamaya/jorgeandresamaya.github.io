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
    let paginationHTML = "";
    let leftnum = Math.floor(pagesToShow / 2);
    let maximum = Math.ceil(totalPosts / itemsPerPage);
    totalPages = maximum; // Almacenar el total de páginas

    // Referencia al contenedor principal de paginación
    const blogPagerElement = document.getElementById("blog-pager");
    const numeracionPaginacionElement = document.getElementById("numeracion-paginacion");

    if (!blogPagerElement || !numeracionPaginacionElement) {
        console.error("Elementos de paginación no encontrados. Asegúrate de que #blog-pager y #numeracion-paginacion existen en tu HTML.");
        return;
    }

    // Limpiar el contenido existente en el contenedor principal de paginación de Blogger
    // para evitar duplicados con los enlaces originales.
    blogPagerElement.innerHTML = '';

    // Si solo hay una página, no mostramos paginación
    if (maximum <= 1) {
        return;
    }

    // --- Generación de los enlaces de Paginación ---

    // 1. Botón "Entradas más recientes"
    if (currentPage > 1) {
        paginationHTML += `<a class='blog-pager-newer-link' href='${getNavLinkHref(currentPage - 1)}'>&#8592; Entradas más recientes</a>`;
    }

    // 2. Numeración de páginas
    let pageNumbersHTML = "";
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
    // Esto asegura que se agrupen y se puedan centrar.
    numeracionPaginacionElement.innerHTML = pageNumbersHTML;
    // Añadimos el contenido de #numeracion-paginacion al paginationHTML principal
    paginationHTML += numeracionPaginacionElement.outerHTML;


    // 3. Botón "Entradas anteriores"
    if (currentPage < maximum) {
        paginationHTML += `<a class='blog-pager-older-link' href='${getNavLinkHref(currentPage + 1)}'>Entradas anteriores &#8594;</a>`;
    }

    // Finalmente, insertar todo el HTML generado en el contenedor principal #blog-pager
    blogPagerElement.innerHTML = paginationHTML;
}

// Función auxiliar para obtener el href de los botones "Anterior/Siguiente"
function getNavLinkHref(pageNum) {
    let baseUrl = window.location.origin;
    let url;
    let startIndex = (pageNum - 1) * itemsPerPage;
    // La fecha del último post es crucial para la paginación de Blogger basada en 'updated-max'
    // Asegurarse de que lastPostDate esté disponible y sea válido.
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


// Crear enlace de página
function createPageLink(pageNum, linkText) {
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

    return `<span class="pagenumber"><a href="${url}">${linkText}</a></span>`;
}


// Manejar la paginación del feed
function paginationall(data) {
    let totalResults = parseInt(data.feed.openSearch$totalResults.$t, 10);
    if (isNaN(totalResults) || totalResults <= 0) {
        totalResults = itemsPerPage; // Fallback si no hay resultados válidos.
    }
    
    // Obtener la fecha de la última entrada si existe, crucial para 'updated-max'
    if (data.feed.entry && data.feed.entry.length > 0) {
        // Usar la fecha de la primera entrada si queremos que el updated-max se refiera a la "última" cargada
        // o la de la última entrada si el feed está ordenado inversamente.
        // Para la paginación de Blogger, `updated-max` en la URL se refiere a la fecha del post MÁS ANTIGUO visible en la página actual.
        // Por lo tanto, necesitamos la fecha del post MÁS ANTIGUO del feed actual.
        lastPostDate = data.feed.entry[data.feed.entry.length - 1].published.$t; 
    } else if (!lastPostDate) {
        lastPostDate = new Date().toISOString(); // Si no hay entradas, usar la fecha actual como fallback
    }

    pagination(totalResults);
}

// Redirigir a página (se mantiene pero la paginación numérica no la usa directamente)
function redirectpage(pageNum) {
    let url = (pageNum === 1) ? home_page : `/search?max-results=${itemsPerPage}&start=${(pageNum - 1) * itemsPerPage}#PageNo=${pageNum}`;
    location.href = url;
}

// Redirigir a etiqueta (se mantiene pero la paginación numérica no la usa directamente)
function redirectlabel(pageNum) {
    let url = (pageNum === 1) ? `${window.location.origin}/search/label/${lblname1}?max-results=${itemsPerPage}` : `/search/label/${lblname1}?max-results=${itemsPerPage}&start=${(pageNum - 1) * itemsPerPage}#PageNo=${pageNum}`;
    location.href = url;
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
    // Para obtener el total de resultados y la fecha del último post, necesitamos cargar el feed.
    // max-results=1 es suficiente para openSearch$totalResults y la fecha de la última entrada.
    // Si la paginación de Blogger empieza a dar problemas con max-results=1, se podría aumentar,
    // pero idealmente no debería ser necesario.
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
    // Esto es independiente de la paginación numérica, pero es una buena práctica
    // para asegurar que las páginas de etiquetas se carguen con la cantidad correcta de elementos.
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
