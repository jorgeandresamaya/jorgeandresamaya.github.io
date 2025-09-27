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
  "use strict";

  const DEFAULTS = {
    pagerSelector: "#blog-pager",
    numberSelector: "numeracion-paginacion",
    numberClass: "pager-item",
    activeClass: "is-active",
    dotsClass: "pager-dots",
    totalVisibleNumbers: 5,
    cacheKey: "bloggerPager_v2",
    batchSize: 150
  };

  const qs = (sel, ctx=document) => ctx.querySelector(sel);
  const qsa = (sel, ctx=document) => Array.from((ctx||document).querySelectorAll(sel));
  const readCache = (k) => { try { const s = localStorage.getItem(k); return s ? JSON.parse(s) : null } catch(e){ try{ localStorage.removeItem(k) }catch{} return null } };
  const writeCache = (k,v) => { try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} };

  function parseMaxResultsFromPager(pagerNode){
    if(!pagerNode) return null;
    const a = qsa("a", pagerNode).find(el => el.href && el.href.includes("max-results="));
    if(!a) return null;
    try{ const u = new URL(a.href); return Number(u.searchParams.get("max-results")) || null; } catch(e){ return null; }
  }

  function normalizeDate(s){ if(!s) return s; return String(s).replace(/\.\d+/, "").trim(); }

  function buildPageLink({homeUrl,label,query,updated,maxResults,startIndex}){
    if(!updated && (!startIndex || startIndex <= 1)){
      if(label) return `${homeUrl}/search/label/${label}?max-results=${maxResults}`;
      if(query) return `${homeUrl}/search?q=${encodeURIComponent(query)}&max-results=${maxResults}`;
      return homeUrl + "/";
    }
    const prefix = label ? `${homeUrl}/search/label/${label}?` : (query ? `${homeUrl}/search?q=${encodeURIComponent(query)}&` : `${homeUrl}/search?`);
    const startPart = (typeof startIndex === "number" && startIndex > 1) ? `&start=${startIndex}` : "";
    return `${prefix}updated-max=${encodeURIComponent(updated)}&max-results=${maxResults}${startPart}`;
  }

  function ranges(a,b){ const o=[]; for(let i=a;i<=b;i++) o.push(i); return o; }

  class BloggerPager {
    constructor(opts={}){
      this.config = Object.assign({}, DEFAULTS, opts);
      this.homeUrl = window.location.origin;
      this.curUrl = new URL(window.location.href);
      this.label = null;
      if(this.curUrl.pathname.includes("/search/label/")){
        const bits = this.curUrl.pathname.split("/"); this.label = bits[bits.length-1] || null;
      }
      this.query = this.curUrl.searchParams.get("q") || null;
      this.pagerNode = qs(this.config.pagerSelector);
      this.numbersNode = qs("#" + this.config.numberSelector);
      this.maxResults = parseMaxResultsFromPager(this.pagerNode) || null;
      this.currentUpdated = this.curUrl.searchParams.get("updated-max") || null;
      this.currentStart = this.curUrl.searchParams.get("start") ? Number(this.curUrl.searchParams.get("start")) : (this.curUrl.searchParams.get("start-index") ? Number(this.curUrl.searchParams.get("start-index")) : null);
      this._cacheKey = `${this.config.cacheKey}::${this.query || ""}::${this.label || ""}`;
    }

    async init(){
      if(!this._ensureNodes()) return;
      if(!this.maxResults) this.maxResults = 10;

      const cached = readCache(this._cacheKey) || { totalPosts:0, postDates:[], updated:null };

      let summary = null;
      try { summary = await this._fetchSummary(); } catch(e){ }

      let postDates = (cached && cached.postDates && cached.postDates.length) ? cached.postDates : [];
      if(!postDates.length || (summary && summary.updated && summary.updated !== cached.updated)){
        try {
          const fetched = await this._fetchAllPostDates(summary ? summary.totalPosts : (cached.totalPosts || 0));
          if(fetched && fetched.postDates && fetched.postDates.length){
            postDates = fetched.postDates;
            writeCache(this._cacheKey, { totalPosts: fetched.totalPosts, postDates: fetched.postDates, updated: (summary ? summary.updated : (cached.updated || null)) });
          }
        } catch(e){}
      }

      const totalPosts = (readCache(this._cacheKey) && readCache(this._cacheKey).totalPosts) || (summary ? summary.totalPosts : (cached.totalPosts || 0)) || 0;
      const totalPages = Math.max(1, Math.ceil(totalPosts / this.maxResults));

      const currentPage = this._computeCurrentPage(postDates, totalPages);

      const pagesToShow = this._computePagesToShow(totalPages, currentPage);

      this._render(pagesToShow, postDates, totalPages, currentPage);
    }

    _ensureNodes(){
  if (!this.pagerNode || this.isHome) return false;

  // Detectar botones existentes
  const newer = this.pagerNode.querySelector(".blog-pager-newer-link");
  const older = this.pagerNode.querySelector(".blog-pager-older-link");

  // Crear contenedor de números si no existe
  if (!this.numbersNode) {
    const wrapper = document.createElement("div");
    wrapper.id = this.config.numberSelector.replace(/^#/, "");
    wrapper.style.display = "flex";
    wrapper.style.justifyContent = "center";
    wrapper.style.flexWrap = "wrap";
    wrapper.style.gap = "6px";
    wrapper.style.margin = "6px 0";
    this.numbersNode = wrapper;

    // Insertar entre los botones sin borrar el DOM
    if (newer && older) {
      older.insertAdjacentElement("beforebegin", this.numbersNode);
    } else if (older) {
      this.pagerNode.insertBefore(this.numbersNode, older);
    } else if (newer) {
      newer.insertAdjacentElement("afterend", this.numbersNode);
    } else {
      this.pagerNode.appendChild(this.numbersNode);
    }
  }

  // Asegurar estilo vertical del bloque
  this.pagerNode.style.display = "flex";
  this.pagerNode.style.flexDirection = "column";
  this.pagerNode.style.alignItems = "center";
  this.pagerNode.style.gap = "10px";

  return true;
}

    async _fetchSummary(){
      const feedUrl = `${this.homeUrl}/feeds/posts/summary/${this.label ? `-/${this.label}?` : "?"}alt=json&max-results=0`;
      const res = await fetch(feedUrl);
      const j = await res.json();
      const total = Number(j.feed.openSearch$totalResults.$t || 0);
      const updated = j.feed.updated ? j.feed.updated.$t : null;
      return { totalPosts: total, updated: updated };
    }

    async _fetchAllPostDates(totalFromSummary=0){
      const total = totalFromSummary || 0;
      if(total === 0) return { totalPosts: 0, postDates: [] };
      const batch = this.config.batchSize;
      const pages = Math.ceil(total / batch);
      const promises = [];
      for(let i=0;i<pages;i++){
        const startIndex = i*batch + 1;
        const url = `${this.homeUrl}/feeds/posts/summary/${this.label ? `-/${this.label}?` : "?"}alt=json&max-results=${batch}&start-index=${startIndex}`;
        promises.push(fetch(url).then(r=>r.json()).catch(()=>null));
      }
      const results = await Promise.all(promises);
      const postDates = results.flatMap(r => (r && r.feed && r.feed.entry) ? r.feed.entry.map(en => normalizeDate(en.published.$t)) : []);
      return { totalPosts: total, postDates: postDates };
    }

    _computeCurrentPage(postDates, totalPages){
      if(this.currentStart && !Number.isNaN(this.currentStart)) return Math.floor(this.currentStart / this.maxResults) + 1;
      if(!this.currentUpdated) return 1;
      const cur = normalizeDate(this.currentUpdated);
      for(let p=2;p<=totalPages;p++){
        const idx = (p-1)*this.maxResults -1;
        if(idx >=0 && idx < postDates.length){
          const candidate = normalizeDate(postDates[idx]);
          if(candidate === cur || encodeURIComponent(candidate) === this.currentUpdated || decodeURIComponent(this.currentUpdated||"") === candidate) return p;
        }
      }
      return 1;
    }

    _computePagesToShow(totalPages, currentPage){
      const visible = Math.max(1, Number(this.config.totalVisibleNumbers) || 5);
      if(totalPages <= visible) return ranges(1, totalPages);
      const k = visible - 1;
      let start = currentPage - Math.floor(k/2);
      if(start < 2) start = 2;
      let end = start + k - 1;
      if(end > totalPages - 1){ end = totalPages - 1; start = Math.max(2, end - k + 1); }
      const middle = ranges(start, end);
      const result = [1].concat(middle);
      if(!result.includes(totalPages)) result.push(totalPages);
      return result;
    }

    _render(pagesArr, postDates, totalPages, currentPage){
      if(!this.numbersNode) return;
      this.numbersNode.innerHTML = "";

      const frag = document.createDocumentFragment();

      const makeAnchor = (page, text, isActive) => {
        const a = document.createElement("a");
        a.className = this.config.numberClass + (isActive ? " " + this.config.activeClass : "");
        a.textContent = String(text);
        if(!isActive){
          if(page === 1){
            if(this.label) a.href = `${this.homeUrl}/search/label/${this.label}?max-results=${this.maxResults}`;
            else if(this.query) a.href = `${this.homeUrl}/search?q=${encodeURIComponent(this.query)}&max-results=${this.maxResults}`;
            else a.href = this.homeUrl + "/";
          } else {
            const idx = (page - 1)*this.maxResults - 1;
            const updated = (idx >=0 && idx < postDates.length) ? postDates[idx] : null;
            const startIndex = (page - 1)*this.maxResults;
            a.href = buildPageLink({ homeUrl: this.homeUrl, label: this.label, query: this.query, updated: updated, maxResults: this.maxResults, startIndex: startIndex });
          }
        }
        a.style.display = "inline-block";
        a.style.verticalAlign = "middle";
        a.style.margin = "0 6px";
        return a;
      };

      const makeDots = () => {
        const s = document.createElement("span");
        s.className = this.config.dotsClass;
        s.textContent = "…";
        s.style.display = "inline-block";
        s.style.verticalAlign = "middle";
        s.style.margin = "0 6px";
        s.style.pointerEvents = "none";
        return s;
      };

      let prev = null;
      pagesArr.forEach(p => {
        if(prev !== null && p - prev > 1){
          frag.appendChild(makeDots());
        }
        const isActive = (p === currentPage);
        frag.appendChild(makeAnchor(p, p, isActive));
        prev = p;
      });

      this.numbersNode.appendChild(frag);
    }
  }

  function autoInit(attempts=14, delay=400){
    let tries = 0;
    const tryNow = () => {
      tries++;
      const pager = qs(DEFAULTS.pagerSelector);
      if(pager){
        const inst = new BloggerPager();
        inst.init().catch(e => console.warn("BloggerPager init error:", e));
        return;
      }
      if(tries < attempts) setTimeout(tryNow, delay);
    };
    if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", tryNow);
    else tryNow();
  }

  try{ autoInit(); } catch(e){ console.error("BloggerPager bootstrap error", e); }

})();
