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
(function() {
  const config = {
    numberSelector: '#numeracion-paginacion',
    numberClass: 'pager-item',
    dotsClass: 'pager-dots',
    activeClass: 'is-active',
    totalVisibleNumbers: 5
  };

  function createLink(href, text, isActive = false, isDots = false) {
    const a = document.createElement('a');
    a.textContent = text;
    if (href) a.href = href;
    if (isActive) a.classList.add(config.activeClass);
    if (isDots) a.classList.add(config.dotsClass);
    a.classList.add(config.numberClass);
    return a;
  }

  function renderPagination(totalPages, currentPage, baseUrl) {
    const container = document.querySelector(config.numberSelector);
    if (!container) return;
    container.innerHTML = '';
    container.style.textAlign = 'center';

    let start = Math.max(1, currentPage - 2);
    let end = Math.min(totalPages, start + config.totalVisibleNumbers - 1);

    if (end - start < config.totalVisibleNumbers - 1) {
      start = Math.max(1, end - config.totalVisibleNumbers + 1);
    }

    if (start > 1) {
      container.appendChild(createLink(baseUrl + '?page=1', '1'));
      if (start > 2) {
        container.appendChild(createLink(null, '...', false, true));
      }
    }

    for (let i = start; i <= end; i++) {
      const isActive = i === currentPage;
      container.appendChild(createLink(baseUrl + '?page=' + i, i, isActive));
    }

    if (end < totalPages) {
      if (end < totalPages - 1) {
        container.appendChild(createLink(null, '...', false, true));
      }
      container.appendChild(createLink(baseUrl + '?page=' + totalPages, totalPages));
    }
  }

  // ===============================
  // 🔹 Aquí adaptamos Blogger
  // ===============================
  function initPagination() {
    const postsPerPage = 7; // <-- cambia este número al "max-results" de tu feed
    const totalPostsEl = document.querySelector('meta[name="totalPosts"]');
    const totalPosts = totalPostsEl ? parseInt(totalPostsEl.content, 10) : 100; // valor por defecto
    const totalPages = Math.ceil(totalPosts / postsPerPage);

    const currentPage = parseInt(new URLSearchParams(window.location.search).get('page')) || 1;
    const baseUrl = window.location.pathname;

    renderPagination(totalPages, currentPage, baseUrl);
  }

  document.addEventListener('DOMContentLoaded', initPagination);
})();
