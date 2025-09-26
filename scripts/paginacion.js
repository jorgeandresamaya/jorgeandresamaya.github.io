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
      this.isHome = this.curUrl.pathname === "/" || this.curUrl.pathname === "/index.html";
      this.label = this.curUrl.pathname.includes("/search/label/") ? decodeURIComponent(this.curUrl.pathname.split("/").pop()) : null;
      this.query = this.curUrl.searchParams.get("q") || null;
      this.pagerNode = qs(this.config.pagerSelector);
      this.numbersNode = qs(this.config.numberSelector);
      this.maxResults = parseMaxResultsFromPager(this.pagerNode) || null;
      this.currentUpdated = this.curUrl.searchParams.get("updated-max") || null;
      this.currentStart = this.curUrl.searchParams.get("start") ? Number(this.curUrl.searchParams.get("start")) : (this.curUrl.searchParams.get("start-index") ? Number(this.curUrl.searchParams.get("start-index")) : null);
      this._cacheKey = `${this.config.cacheKey}::${this.query || ""}::${this.label || ""}`;
    }

    async init(){
      if(this.isHome || !this._ensureNodes()) return;
      if(!this.maxResults) this.maxResults = 10;

      const cached = readCache(this._cacheKey) || { totalPosts:0, postDates:[], updated:null };
      let summary=null;
      try { summary = await this._fetchSummary(); } catch(e){}

      let postDates = (cached.postDates && cached.postDates.length) ? cached.postDates : [];
      if(!postDates.length || (summary && summary.updated && summary.updated !== cached.updated)){
        try {
          const fetched = await this._fetchAllPostDates(summary ? summary.totalPosts : (cached.totalPosts || 0));
          if(fetched && fetched.postDates && fetched.postDates.length){
            postDates = fetched.postDates;
            writeCache(this._cacheKey, { totalPosts: fetched.totalPosts, postDates: fetched.postDates, updated: (summary ? summary.updated : (cached.updated || null)) });
          }
        } catch(e){}
      }

      const totalPosts = (readCache(this._cacheKey)?.totalPosts) || (summary ? summary.totalPosts : (cached.totalPosts || 0)) || 0;
      const totalPages = Math.max(1, Math.ceil(totalPosts / this.maxResults));
      const currentPage = this._computeCurrentPage(postDates, totalPages);
      const pagesToShow = this._computePagesToShow(totalPages, currentPage);
      this._render(pagesToShow, postDates, totalPages, currentPage);
    }

    _ensureNodes(){
      if(!this.pagerNode) this.pagerNode = qs(this.config.pagerSelector);
      if(!this.pagerNode) return false;

      if(!this.numbersNode){
        const wrapper = document.createElement("div");
        wrapper.id = (this.config.numberSelector||"#numeracion-paginacion").replace(/^#/,"");
        wrapper.style.display = "flex";
        wrapper.style.justifyContent = "center";
        wrapper.style.alignItems = "center";
        wrapper.style.margin = "10px 0";
        this.numbersNode = wrapper;
      }

      this.pagerNode.style.display = "flex";
      this.pagerNode.style.flexDirection = "column";
      this.pagerNode.style.alignItems = "center";
      this.pagerNode.style.gap = "8px";

      const newer = this.pagerNode.querySelector(".blog-pager-newer-link");
      const older = this.pagerNode.querySelector(".blog-pager-older-link");

      const links = [];
      if (newer) links.push(newer);
      if (older) links.push(older);

      links.forEach(link => link.remove());
      this.pagerNode.innerHTML = "";
      if (links[0]) this.pagerNode.appendChild(links[0]);
      this.pagerNode.appendChild(this.numbersNode);
      if (links[1]) this.pagerNode.appendChild(links[1]);

      return !!this.numbersNode;
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
      if(total===0) return { totalPosts:0, postDates:[] };
      const batch = this.config.batchSize;
      const pages = Math.ceil(total / batch);
      const promises=[];
      for(let i=0;i<pages;i++){
        const startIndex=i*batch+1;
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
        if(idx>=0 && idx<postDates.length){
          const candidate = normalizeDate(postDates[idx]);
          if(candidate===cur || encodeURIComponent(candidate)===this.currentUpdated || decodeURIComponent(this.currentUpdated||"")===candidate) return p;
        }
      }
      return 1;
    }

    _computePagesToShow(totalPages, currentPage){
      const visible = Number(this.config.totalVisibleNumbers) || 5;
      if(total
                 a.className=this.config.numberClass + (isActive ? " " + this.config.activeClass : "");
        a.textContent = String(text);
        if (!isActive) {
          const idx = (page - 1) * this.maxResults - 1;
          const updated = (idx >= 0 && idx < postDates.length) ? postDates[idx] : null;
          const startIndex = (page - 1) * this.maxResults;
          a.href = buildPageLink({
            homeUrl: this.homeUrl,
            label: this.label,
            query: this.query,
            updated: updated,
            maxResults: this.maxResults,
            startIndex: startIndex
          });
        }
        a.style.margin = "0 4px";
        return a;
      };

      const makeDots = () => {
        const s = document.createElement("span");
        s.className = this.config.dotsClass;
        s.textContent = "…";
        s.style.margin = "0 4px";
        return s;
      };

      let prev = null;
      pagesArr.forEach(p => {
        if (prev !== null && p - prev > 1) frag.appendChild(makeDots());
        const isActive = (p === currentPage);
        frag.appendChild(makeAnchor(p, p, isActive));
        prev = p;
      });

      this.numbersNode.appendChild(frag);
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
