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
  const container = document.querySelector("#numeracion-paginacion");
  if (!container) return;

  const maxPages = 20; // Puedes ajustar este número según el crecimiento de tu blog
  const currentUrl = window.location.href;
  const currentPage = (() => {
    const match = currentUrl.match(/start=(\d+)/);
    const start = match ? parseInt(match[1]) : 0;
    const maxResults = 10; // Ajusta según tu configuración real
    return Math.floor(start / maxResults) + 1;
  })();

  if (currentPage === 1) return; // No mostrar numeración en la primera página

  const visible = 5;
  const half = Math.floor(visible / 2);
  let start = Math.max(currentPage - half, 1);
  let end = Math.min(start + visible - 1, maxPages);

  if (end - start < visible - 1) {
    start = Math.max(end - visible + 1, 1);
  }

  const fragment = document.createDocumentFragment();

  for (let i = start; i <= end; i++) {
    const link = document.createElement("a");
    link.textContent = i;
    link.className = "pager-item" + (i === currentPage ? " is-active" : "");
    const startIndex = (i - 1) * 10; // Ajusta según tu max-results
    link.href = i === 1
      ? window.location.origin
      : `${window.location.origin}/search?updated-max=placeholder&max-results=10&start=${startIndex}&by-date=false`;
    fragment.appendChild(link);
  }

  container.innerHTML = "";
  container.appendChild(fragment);
})();
