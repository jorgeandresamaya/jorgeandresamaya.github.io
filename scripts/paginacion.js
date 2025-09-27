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
/* paginacion.js — ajustado: centrado entre flechas, oculto en home */
(function(){
  "use strict";

  const DEFAULTS = {
    pagerSelector: "#blog-pager",
    numberSelector: "#numeracion-paginacion",
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
    const a = qsa("a", pagerNode).find(el => el.href && el.href.includes("max-results="));
    if(!a) return null;
    try{ const u = new URL(a.href); return Number(u.searchParams.get("max-results")) || null; } catch(e){ return null; }
  }

  function normalizeDate(s){ return s ? String(s).replace(/\.\d+/, "").trim() : s; }

  function buildPageLink({homeUrl,label,query,updated,maxResults,startIndex}){
    if(!updated && (!startIndex || startIndex <= 1)){
      if(label) return `${homeUrl}/search/label/${label}?max-results=${maxResults}`;
      if(query) return `${homeUrl}/search?q=${encodeURIComponent(query)}&max-results=${maxResults}`;
      return homeUrl + "/";
    }
    const prefix = label ? `${homeUrl}/search/label/${label}?` : (query ? `${homeUrl}/search?q=${encodeURIComponent(query)}&` : `${homeUrl}/search?`);
    const startPart = (startIndex > 1) ? `&start=${startIndex}` : "";
    return `${prefix}updated-max=${encodeURIComponent(updated)}&max-results=${maxResults}${startPart}`;
  }

  function ranges(a,b){ const o=[]; for(let i=a;i<=b;i++) o.push(i); return o; }

  class BloggerPager {
    constructor(opts={}){
      this.config = Object.assign({}, DEFAULTS, opts);
      this.homeUrl = window.location.origin;
      this.curUrl = new URL(window.location.href);
      this.isHome = this.curUrl.pathname === "/" || this.curUrl.pathname === "/index.html";
      this.label = this.curUrl.pathname.includes("/search/label/") ? decodeURIComponent(this.curUrl.pathname.split("/").pop()) : null;
      this.query = this.curUrl.searchParams.get("q") || null;
      this.pagerNode = qs(this.config.pagerSelector);
      this.numbersNode = null;
      this.maxResults = parseMaxResultsFromPager(this.pagerNode) || 10;
      this.currentUpdated = this.curUrl.searchParams.get("updated-max") || null;
      this.currentStart = this.curUrl.searchParams.get("start") ? Number(this.curUrl.searchParams.get("start")) : null;
      this._cacheKey = `${this.config.cacheKey}::${this.query || ""}::${this.label || ""}`;
    }

    async init(){
      if(this.isHome || !this.pagerNode) return;

      this._prepareLayout();

      const cached = readCache(this._cacheKey) || { totalPosts:0, postDates:[], updated:null };
      let summary = await this._fetchSummary().catch(()=>null);

      let postDates = cached.postDates || [];
      if(!postDates.length || (summary && summary.updated !== cached.updated)){
        const fetched = await this._fetchAllPostDates(summary?.totalPosts || cached.totalPosts || 0).catch(()=>null);
        if(fetched?.postDates?.length){
          postDates = fetched.postDates;
          writeCache(this._cacheKey, { totalPosts: fetched.totalPosts, postDates, updated: summary?.updated || cached.updated });
        }
      }

      const totalPosts = summary?.totalPosts || cached.totalPosts || 0;
      const totalPages = Math.max(1, Math.ceil(totalPosts / this.maxResults));
      const currentPage = this._computeCurrentPage(postDates, totalPages);
      const pagesToShow = this._computePagesToShow(totalPages, currentPage);
      this._render(pagesToShow, postDates, currentPage);
    }

    _prepareLayout(){
      this.pagerNode.style.display = "flex";
      this.pagerNode.style.flexDirection = "column";
      this.pagerNode.style.alignItems = "center";
      this.pagerNode.style.gap = "10px";

      const newer = this.pagerNode.querySelector(".blog-pager-newer-link");
      const older = this.pagerNode.querySelector(".blog-pager-older-link");

      this.numbersNode = document.createElement("div");
      this.numbersNode.id = this.config.numberSelector.replace(/^#/,"");
      this.numbersNode.style.display = "flex";
      this.numbersNode.style.justifyContent = "center";
      this.numbersNode.style.flexWrap = "wrap";
      this.numbersNode.style.gap = "6px";

      const links = [];
      if (newer) links.push(newer);
      if (older) links.push(older);

      links.forEach(link => link.remove());
      this.pagerNode.innerHTML = "";
      if (links[0]) this.pagerNode.appendChild(links[0]);
      this.pagerNode.appendChild(this.numbersNode);
      if (links[1]) this.pagerNode.appendChild(links[1]);
    }

    async _fetchSummary(){
      const url = `${this.homeUrl}/feeds/posts/summary/${this.label ? `-/${this.label}?` : "?"}alt=json&max-results=0`;
      const res = await fetch(url);
      const json = await res.json();
      return {
        totalPosts: Number(json.feed.openSearch$totalResults.$t || 0),
        updated: json.feed.updated?.$t || null
      };
    }

    async _fetchAllPostDates(total){
      const batch = this.config.batchSize;
      const pages = Math.ceil(total / batch);
      const promises = [];
      for(let i=0;i<pages;i++){
        const start = i*batch+1;
        const url = `${this.homeUrl}/feeds/posts/summary/${this.label ? `-/${this.label}?` : "?"}alt=json&max-results=${batch}&start-index=${start}`;
        promises.push(fetch(url).then(r=>r.json()).catch(()=>null));
      }
      const results = await Promise.all(promises);
      const dates = results.flatMap(r => r?.feed?.entry?.map(en => normalizeDate(en.published.$t)) || []);
      return { totalPosts: total, postDates: dates };
    }

    _computeCurrentPage(postDates, totalPages){
      if(this.currentStart) return Math.floor(this.currentStart / this.maxResults) + 2;
      if(!this.currentUpdated) return 1;
      const cur = normalizeDate(this.currentUpdated);
      for(let p=2;p<=totalPages;p++){
        const idx = (p-1)*this.maxResults -1;
        if(postDates[idx] && normalizeDate(postDates[idx]) === cur) return p;
      }
      return 1;
    }

    _computePagesToShow(totalPages, currentPage){
      const visible = this.config.totalVisibleNumbers;
      if(totalPages <= visible) return ranges(1,totalPages);
      let start = Math.max(2, currentPage - Math.floor((visible-2)/2));
      let end = Math.min(totalPages-1, start + visible - 3);
      if(end - start < visible - 3) start = Math.max(2, end - (visible - 3));
      const middle = ranges(start,end);
      return [1, ...middle, totalPages];
    }

    _render(pages, postDates, currentPage){
      this.numbersNode.innerHTML = "";
      let prev = null;
      pages.forEach(p => {
        if(prev && p - prev > 1){
          const dots = document.createElement("span");
          dots.className = this.config.dotsClass;
          dots.textContent = "…";
          this.numbersNode.appendChild(dots);
        }
        const a = document.createElement("a");
        a.className = this.config.numberClass + (p === currentPage ? ` ${this.config
                                                                                 a.className = this.config.numberClass + (p === currentPage ? ` ${this.config.activeClass}` : "");
        a.textContent = String(p);
        if (p !== currentPage) {
          const idx = (p - 1) * this.maxResults - 1;
          const updated = (idx >= 0 && idx < postDates.length) ? postDates[idx] : null;
          const startIndex = (p - 1) * this.maxResults;
          a.href = buildPageLink({
            homeUrl: this.homeUrl,
            label: this.label,
            query: this.query,
            updated,
            maxResults: this.maxResults,
            startIndex
          });
        }
        this.numbersNode.appendChild(a);
        prev = p;
      });
    }
  }

  function autoInit(attempts = 14, delay = 400) {
    let tries = 0;
    const tryNow = () => {
      tries++;
      const pager = qs(DEFAULTS.pagerSelector);
      if (pager) {
        const inst = new BloggerPager();
        inst.init().catch(e => console.warn("BloggerPager init error:", e));
        return;
      }
      if (tries < attempts) setTimeout(tryNow, delay);
    };
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", tryNow);
    } else {
      tryNow();
    }
  }

  try {
    autoInit();
  } catch (e) {
    console.error("BloggerPager bootstrap error", e);
  }

})();

