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
/** Paginación numérica visible - Jorge Andrés Amaya - MIT **/
(function() {
  const itemsPerPage = 10;
  const pagesToShow = 5;
  const container = document.getElementById("numeracion-paginacion");
  if (!container) return;

  const url = location.href;
  const match = url.match(/[?&]start=(\d+)/);
  const currentStart = match ? parseInt(match[1], 10) : 0;
  const currentPage = Math.floor(currentStart / itemsPerPage) + 1;

  if (currentPage < 2) return; // Ocultar en la primera página

  const half = Math.floor(pagesToShow / 2);
  let startPage = Math.max(currentPage - half, 2);
  let endPage = startPage + pagesToShow - 1;

  const fragment = document.createDocumentFragment();
  for (let i = startPage; i <= endPage; i++) {
    const startParam = (i - 1) * itemsPerPage;
    const link = document.createElement("a");
    link.href = `/?start=${startParam}#PageNo=${i}`;
    link.textContent = i;
    if (i === currentPage) link.style.fontWeight = "bold";
    fragment.appendChild(link);
  }

  container.innerHTML = "";
  container.style.textAlign = "center";
  container.appendChild(fragment);
})();
