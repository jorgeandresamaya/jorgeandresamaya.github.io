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
/* BloggerPager - adaptado para tu plantilla
   - numberSelector: "#numeracion-paginacion"
   - totalVisibleNumbers: 5
   - auto-init con reintentos
   - crea #numeracion-paginacion si no existe dentro de #blog-pager
   - logs de consola para debugging
*/

(function (global, factory) {
  if (typeof exports === 'object' && typeof module !== 'undefined') module.exports = factory();
  else if (typeof define === 'function' && define.amd) define(factory);
  else (global = typeof globalThis !== 'undefined' ? globalThis : global || self).BloggerPager = factory();
})(this, (function () {
  'use strict';

  const defaults = {
    pagerSelector: "#blog-pager",
    numberSelector: "#numeracion-paginacion", // <- tu ID
    numberClass: "pager-item",
    dotsClass: "pager-dots",
    activeClass: "is-active",
    totalVisibleNumbers: 5, // <- máximo 5
    checkForUpdates: true,
    enableDotsJump: true,
    byDate: "false",
    maxResults: null,
    query: null,
    label: null,
    start: null,
    updatedMax: null
  };

  // util helpers
  function parseBoolOrNum(v){ if(v==null) return null; const s=String(v).trim(); const m={true:true,false:false,null:null}; if(s in m) return m[s]; return isNaN(s)? (s===""?null:s) : Number(s); }
  function pagesCount(total, per){ return Math.ceil(Number(total)/per); }
  const STORAGE_KEY = "bloggerPagination";
  function readCache(){ try{ const r=localStorage.getItem(STORAGE_KEY); return r?JSON.parse(r):{} }catch(e){ localStorage.removeItem(STORAGE_KEY); return {} } }
  function saveCache(obj, query=null, label=null){ const key = query? `query${hashString(query)}` : label? `label${hashString(label)}` : "all"; const c = readCache(); c[key]=obj; localStorage.setItem(STORAGE_KEY, JSON.stringify(c)); }
  function readCachedEntry(query=null,label=null){ const key = query? `query${hashString(query)}` : label? `label${hashString(label)}` : "all"; return readCache()[key] || { totalPosts:0, postDates:[], blogUpdated:null }; }
  function hashString(s){ let h=5381; for(let i=0;i<s.length;i++) h=33*h ^ s.charCodeAt(i); return (h>>>0).toString(36); }

  function buildRange(currentPage, totalPages, visible){
    const half = Math.floor(visible/2);
    let start = Math.max(currentPage - half, 1);
    let end = Math.min(start + visible - 1, totalPages);
    if(totalPages <= visible){ start = 1; end = totalPages; }
    else if(currentPage <= half){ start = 1; end = visible; }
    else if(currentPage >= totalPages - half){ start = totalPages - visible + 1; end = totalPages; }
    const arr = []; for(let i=start;i<=end;i++) arr.push(i); return {arr, start, end, half};
  }

  function buildPaginationData(config, currentPage, totalPages){
    const visible = config.totalVisibleNumbers;
    const {arr, start, end, half} = buildRange(currentPage, totalPages, visible);
    const items = arr.map(n=>({ number:n, isDots:false, activeClass: n===currentPage?config.activeClass:"" }));
    if(start > 1){
      items.unshift({ number:1, isDots:false, activeClass:"" });
      items.splice(1,0,{ number: Math.max(start - half, 1), isDots:true });
    }
    if(end < totalPages){
      items.push({ number: Math.min(end + half, totalPages), isDots:true });
      items.push({ number: totalPages, isDots:false, activeClass:"" });
    }
    return items;
  }

  function buildPageUrl(config, number, postDates){
    const { homeUrl, label, query, maxResults, byDate } = config;
    if(number === 1){
      if(label) return `${homeUrl}/search/label/${label}?max-results=${maxResults}`;
      if(query) return `${homeUrl}/search?q=${query}&max-results=${maxResults}&by-date=${byDate}`;
      return homeUrl;
    }
    const idx = (number - 1) * maxResults - 1;
    const updated = Array.isArray(postDates) && postDates[idx] ? encodeURIComponent(postDates[idx]) : null;
    if(!updated) return "#fetching";
    const prefix = label ? `${homeUrl}/search/label/${label}?` : query ? `${homeUrl}/search?q=${query}&` : `${homeUrl}/search?`;
    return `${prefix}updated-max=${updated}&max-results=${maxResults}&start=${(number-1)*maxResults}&by-date=${byDate}`;
  }

  function renderToContainer(config, paginationData, postDates){
    if(!paginationData || !paginationData.length) return;
    const container = config.numberContainer;
    if(!container) return;
    container.innerHTML = "";
    const frag = document.createDocumentFragment();
    paginationData.forEach(item=>{
      if(item.isDots){
        const el = config.enableDotsJump ? document.createElement('button') : document.createElement('span');
        el.className = config.dotsClass;
        el.textContent = '...';
        el.dataset.page = item.number;
        if(config.enableDotsJump){
          el.addEventListener('click', (ev)=>{
            ev.preventDefault();
            const target = Number(ev.currentTarget.dataset.page) || item.number;
            const totalPages = pagesCount((config._totalPosts||0), config.maxResults);
            const newData = buildPaginationData(config, target, totalPages);
            renderToContainer(config, newData, postDates);
          });
        }
        frag.appendChild(el);
      } else {
        const a = document.createElement('a');
        a.className = `${config.numberClass} ${item.activeClass}`.trim();
        a.textContent = item.number;
        a.href = buildPageUrl(config, item.number, postDates);
        frag.appendChild(a);
      }
    });
    container.appendChild(frag);
  }

  class BloggerPager {
    constructor(opts={}){
      this.currentUrl = new URL(window.location.href);
      this.config = Object.assign({}, defaults, opts, this._parseUrl(this.currentUrl), { homeUrl: this.currentUrl.origin });
      this.pagerContainer = document.querySelector(this.config.pagerSelector);
      this.numberContainer = document.querySelector(this.config.numberSelector);
    }

    _parseUrl(url){
      const params = url.searchParams;
      const pathname = url.pathname;
      const keys = ["max-results","by-date","updated-max","start","q"];
      const obj = {};
      keys.forEach(k=>{
        const name = k === "q" ? "query" : k.replace(/-([a-z])/g, (_,c)=>c.toUpperCase());
        const val = params.get(k);
        if(val !== null) obj[name] = val;
      });
      if(pathname.includes("/search/label/")) obj.label = pathname.split("/").pop();
      return obj;
    }

    _ensureContainers(){
      if(!this.pagerContainer) this.pagerContainer = document.querySelector(this.config.pagerSelector);
      if(!this.numberContainer) this.numberContainer = document.querySelector(this.config.numberSelector);
      if(this.pagerContainer && !this.numberContainer){
        const div = document.createElement('div');
        const idName = (this.config.numberSelector && this.config.numberSelector.startsWith('#')) ? this.config.numberSelector.slice(1) : (this.config.numberSelector || 'numeracion-paginacion');
        div.id = idName;
        const older = this.pagerContainer.querySelector('.blog-pager-older-link');
        this.pagerContainer.insertBefore(div, older || null);
        this.numberContainer = div;
      }
      if(this.numberContainer) this.config.numberContainer = this.numberContainer;
      return !!(this.pagerContainer && this.numberContainer);
    }

    async init(){
      // asegurar contenedores
      if(!this._ensureContainers()){
        console.warn('BloggerPager: contenedores no encontrados aún.');
        return;
      }

      // extraer max-results
      try {
        const a = Array.from(this.pagerContainer.querySelectorAll('a')).find(a=>a.href && a.href.includes('max-results='));
        if(a){
          const n = new URL(a.href).searchParams.get('max-results');
          if(n) this.config.maxResults = Number(n);
        }
      } catch(e) {}

      if(!this.config.maxResults) this.config.maxResults = 10;

      // leer cache
      const cacheEntry = readCachedEntry(this.config.query, this.config.label);
      const totalPostsCached = cacheEntry.totalPosts || 0;
      const postDatesCached = cacheEntry.postDates || [];

      // si hay fechas en cache, renderizar (inicial)
      if(postDatesCached.length){
        this.config._totalPosts = totalPostsCached;
        const totalPages = pagesCount(totalPostsCached, this.config.maxResults);
        const current = 1;
        const pdata = buildPaginationData(this.config, current, totalPages);
        renderToContainer(this.config, pdata, postDatesCached);
        if(!this.config.checkForUpdates) return;
      }

      // fetch del feed summary
      try {
        const feedUrl = `${this.config.homeUrl}/feeds/posts/summary/${this.config.label ? `-/${this.config.label}?` : "?"}alt=json&max-results=0`;
        const r = await fetch(feedUrl);
        const j = await r.json();
        const total = Number(j.feed.openSearch$totalResults.$t || 0);
        const updated = j.feed.updated ? j.feed.updated.$t : null;
        const stored = readCachedEntry(this.config.query, this.config.label);
        if(!this.config.query) stored.totalPosts = total;
        stored.blogUpdated = updated;
        saveCache(stored, this.config.query, this.config.label);

        if(!stored.postDates || !stored.postDates.length || stored.blogUpdated !== cacheEntry.blogUpdated){
          const batches = Math.ceil(total / 150) || 1;
          const promises = Array.from({ length: batches }, (_, i) =>
            fetch(`${this.config.homeUrl}/feeds/posts/summary/${this.config.query ? `?q=${this.config.query}&orderby=published&` : this.config.label ? `-/${this.config.label}?` : "?"}alt=json&max-results=150&start-index=${150*i+1}`).then(x=>x.json())
          );
          const results = await Promise.all(promises);
          const dates = results.flatMap(r => r.feed && r.feed.entry ? r.feed.entry.map(e=> e.published.$t.replace(/\.\d+/,"")) : []);
          stored.postDates = dates;
          if(this.config.query){
            stored.totalPosts = results.reduce((acc,r)=> acc + (r.feed ? Number(r.feed.openSearch$totalResults.$t || 0) : 0), 0);
          }
          saveCache(stored, this.config.query, this.config.label);
        }

        this.config._totalPosts = stored.totalPosts || total;
        const totalPagesFinal = pagesCount(this.config._totalPosts, this.config.maxResults);
        const pdataFinal = buildPaginationData(this.config, 1, totalPagesFinal);
        renderToContainer(this.config, pdataFinal, stored.postDates || []);

        if(this.config.maxResults >= (stored.totalPosts || total)) try{ this.pagerContainer.remove(); } catch(e){}
      } catch(err) {
        console.warn('BloggerPager: error al obtener feed:', err);
      }
    }
  }

  // Auto-init con reintentos para evitar race conditions en Blogger
  function autoInitRetries(maxAttempts = 12, delay = 500) {
    let attempts = 0;
    function tryNow() {
      attempts++;
      const pagerFound = document.querySelector(defaults.pagerSelector);
      if(pagerFound){
        try {
          const Cls = BloggerPager;
          const instance = new Cls();
          instance.init && instance.init();
          console.info('BloggerPager: inicialización ejecutada.');
          return;
        } catch (e) {
          console.error('BloggerPager: error init', e);
        }
      }
      if(attempts < maxAttempts){
        setTimeout(tryNow, delay);
      } else {
        console.warn('BloggerPager: no se encontró #blog-pager después de reintentos.');
      }
    }
    if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', tryNow);
    else tryNow();
  }

  // Exponer clase y lanzar auto-init
  try { autoInitRetries(14, 500); } catch(e){ console.warn('BloggerPager auto-init fallo', e); }
  return BloggerPager;
}));
