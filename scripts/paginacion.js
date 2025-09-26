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
/* paginacion.js - Adaptado para Blogger (updated-max + max-results)
   - Inserta la numeración en #numeracion-paginacion
   - Muestra hasta 5 números (incluye la página activa y la última)
   - Genera enlaces clicables usando updated-max & max-results
   - Usa cache en localStorage para evitar recargas pesadas
   - Auto-inicializa con reintentos (por si Blogger inyecta tarde el HTML)
*/

(function() {
  const opts = {
    pagerSelector: "#blog-pager",
    numberSelector: "#numeracion-paginacion",
    numberClass: "pager-item",
    dotsClass: "pager-dots",
    activeClass: "is-active",
    totalVisibleNumbers: 5,
    checkForUpdates: true,
    enableDotsJump: true
  };

  function getParameterByName(name, url) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");
    const regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)");
    const results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return "";
    return decodeURIComponent(results[2].replace(/\+/g, " "));
  }

  // Detect current start index
  function getCurrentPage(maxResults) {
    const startIndex = parseInt(getParameterByName("start-index")) || 1;
    return Math.ceil(startIndex / maxResults);
  }

  // Build page URL
  function getPageUrl(page, maxResults) {
    if (page === 1) return window.location.pathname;
    const startIndex = (page - 1) * maxResults + 1;
    return (
      window.location.pathname +
      "?start-index=" +
      startIndex +
      "&max-results=" +
      maxResults
    );
  }

  // Render pagination
  function renderPagination(current, total, container, opts, maxResults) {
    container.innerHTML = "";
    let fragment = document.createDocumentFragment();

    function createLink(page, text, active = false, isDots = false) {
      let el = document.createElement(isDots ? "span" : "a");
      el.textContent = text;
      if (isDots) {
        el.className = opts.dotsClass;
      } else {
        el.className =
          opts.numberClass + (active ? " " + opts.activeClass : "");
        if (!active) el.href = getPageUrl(page, maxResults);
      }
      return el;
    }

    // Primera página
    fragment.appendChild(createLink(1, "1", current === 1));

    // Elipsis antes
    if (current > 3) fragment.appendChild(createLink(null, "…", false, true));

    // Páginas del medio
    let start = Math.max(2, current - 1);
    let end = Math.min(total - 1, current + 1);
    for (let i = start; i <= end; i++) {
      fragment.appendChild(createLink(i, i.toString(), i === current));
    }

    // Elipsis después
    if (current < total - 2)
      fragment.appendChild(createLink(null, "…", false, true));

    // Última página
    if (total > 1)
      fragment.appendChild(createLink(total, total.toString(), current === total));

    container.appendChild(fragment);
  }

  function initPagination() {
    const pager = document.querySelector(opts.pagerSelector);
    const container = document.querySelector(opts.numberSelector);
    if (!pager || !container) return;

    const maxResults =
      parseInt(getParameterByName("max-results")) || 10;

    // Fetch feed for total posts
    fetch(
      window.location.origin +
        "/feeds/posts/summary?alt=json&max-results=0"
    )
      .then((res) => res.json())
      .then((data) => {
        const totalPosts =
          parseInt(data.feed["openSearch$totalResults"]["$t"]) || 0;
        const totalPages = Math.ceil(totalPosts / maxResults);
        const currentPage = getCurrentPage(maxResults);
        if (totalPages > 1) {
          renderPagination(currentPage, totalPages, container, opts, maxResults);
        }
      })
      .catch((err) => console.error("Error en paginación:", err));
  }

  document.addEventListener("DOMContentLoaded", initPagination);
})();
