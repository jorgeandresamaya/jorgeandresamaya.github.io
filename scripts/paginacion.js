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
(function(){
  var itemsPerPage = 10;
  var pagesToShow = 5;
  var prevLabel = 'Artículos más recientes';
  var nextLabel = 'Artículos anteriores';
  var homePage = "/";
  var currentPage, totalPages, searchQuery, type, labelName, lastPostDate;

  function getCurrentPage() {
    var match = location.href.match(/#PageNo=(\d+)/);
    return match ? parseInt(match[1], 10) : 1;
  }

  function getSearchQueryParam() {
    var params = new URLSearchParams(window.location.search);
    return params.get("q") || "";
  }

  function createPageLink(pageNum, text) {
    var href = "#";
    if(type === "page"){
      href = homePage + "?updated-max=" + encodeURIComponent(lastPostDate || new Date().toISOString()) + 
             "&max-results=" + itemsPerPage + "&start=" + ((pageNum-1)*itemsPerPage) + "#PageNo=" + pageNum;
    } else if(type === "label"){
      href = homePage + "search/label/" + encodeURIComponent(labelName) + "?updated-max=" + encodeURIComponent(lastPostDate || new Date().toISOString()) +
             "&max-results=" + itemsPerPage + "&start=" + ((pageNum-1)*itemsPerPage) + "#PageNo=" + pageNum;
    } else if(type === "search"){
      href = homePage + "search?q=" + encodeURIComponent(searchQuery) + "&updated-max=" + encodeURIComponent(lastPostDate || new Date().toISOString()) + 
             "&max-results=" + itemsPerPage + "&start=" + ((pageNum-1)*itemsPerPage) + "#PageNo=" + pageNum;
    }
    return `<a href="${href}">${text}</a>`;
  }

  function buildPagination(){
    totalPages = Math.max(totalPages, 1);
    var half = Math.floor(pagesToShow / 2);
    var start, end;

    if(totalPages <= pagesToShow){
      start = 1;
      end = totalPages;
    } else if(currentPage <= half + 1) {
      start = 1;
      end = pagesToShow;
    } else if(currentPage >= totalPages - half){
      start = totalPages - pagesToShow + 1;
      end = totalPages;
    } else {
      start = currentPage - half;
      end = currentPage + half;
    }

    var pager = document.getElementById("blog-pager");
    var numbersContainer = document.getElementById("numeracion-paginacion");
    if(!pager || !numbersContainer) return;

    var prevHTML = currentPage > 1 ? `<a class="blog-pager-newer-link" href="#" onclick="redirectPage(${currentPage-1}); return false;">${prevLabel}</a>` : "";
    var nextHTML = currentPage < totalPages ? `<a class="blog-pager-older-link" href="#" onclick="redirectPage(${currentPage+1}); return false;">${nextLabel}</a>` : "";

    pager.innerHTML = prevHTML + nextHTML;

    if(currentPage > 1){
      var numberHTML = "";
      if(start > 1){
        numberHTML += `<span class="pagenumber">${createPageLink(1, '1')}</span>`;
        if(start > 2) numberHTML += `<span class="dots">...</span>`;
      }
      for(let i = start; i <= end; i++){
        if(i === currentPage){
          numberHTML += `<span class="pagenumber current">${i}</span>`;
        } else {
          numberHTML += `<span class="pagenumber">${createPageLink(i, i)}</span>`;
        }
      }
      if(end < totalPages){
        if(end < totalPages -1) numberHTML += `<span class="dots">...</span>`;
        numberHTML += `<span class="pagenumber">${createPageLink(totalPages, totalPages)}</span>`;
      }
      numbersContainer.innerHTML = numberHTML;
    } else {
      numbersContainer.innerHTML = "";
    }
  }

  window.redirectPage = function(pageNum){
    if(pageNum === 1){
      window.location.href = homePage;
      return;
    }
    var startIndex = (pageNum - 1) * itemsPerPage;
    var url = homePage + "?updated-max=" + encodeURIComponent(lastPostDate || new Date().toISOString()) + 
              "&max-results=" + itemsPerPage + "&start=" + startIndex + "#PageNo=" + pageNum;
    window.location.href = url;
  }

  window.totalPostsCallback = function(data){
    try {
      var total = parseInt(data.feed.openSearch$totalResults.$t, 10);
      if(isNaN(total) || total <= 0) total = itemsPerPage;
      lastPostDate = data.feed.entry && data.feed.entry.length ? data.feed.entry[data.feed.entry.length-1].updated.$t : new Date().toISOString();
      totalPages = Math.ceil(total / itemsPerPage);
      buildPagination();
    } catch(e){
      totalPages = 1;
      buildPagination();
    }
  }

  function fetchTotalPosts(){
    let feedURL = '';
    if(type === "search"){
      feedURL = `${homePage}feeds/posts/summary?q=${encodeURIComponent(searchQuery)}&max-results=1&alt=json-in-script&callback=totalPostsCallback`;
    } else if(type === "label"){
      feedURL = `${homePage}feeds/posts/summary/-/${encodeURIComponent(labelName)}?max-results=1&alt=json-in-script&callback=totalPostsCallback`;
    } else {
      feedURL = `${homePage}feeds/posts/summary?max-results=1&alt=json-in-script&callback=totalPostsCallback`;
    }
    var script = document.createElement("script");
    script.src = feedURL;
    document.body.appendChild(script);
  }

  function initialize(){
    currentPage = getCurrentPage();
    searchQuery = getSearchQueryParam();
    var url = window.location.href;

    if(/\/search\/label\//.test(url)) {
      type = "label";
      var match = url.match(/\/search\/label\/([^?&#]+)/);
      labelName = match ? decodeURIComponent(match[1]) : "";
    } else if(searchQuery !== "") {
      type = "search";
    } else {
      type = "page";
    }
    fetchTotalPosts();
  }

  document.addEventListener("DOMContentLoaded", initialize);
})();
