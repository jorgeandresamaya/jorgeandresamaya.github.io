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
/* paginacion.js — versión final funcional */
(function(){
  "use strict";

  const DEFAULTS = {
    pagerSelector: "#blog-pager",
    numberSelector: "#numeracion-paginacion",
    numberClass: "pager-item",
    activeClass: "is-active",
    dotsClass: "pager-dots",
    totalVisibleNumbers: 5,
    batchSize: 150,
    cacheKey: "bloggerPager_v4"
  };

  const qs = (sel, ctx=document) => ctx.querySelector(sel);
  const qsa = (sel, ctx=document) => Array.from((ctx||document).querySelectorAll(sel));
  const readCache = (k) => { try { const s = localStorage.getItem(k); return s ? JSON.parse(s) : null } catch(e){ localStorage.removeItem(k); return null; } };
  const writeCache = (k,v) => { try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} };
  const normalizeDate = s => s ? String(s).replace(/\.\d+/,"").trim() : s;

  function buildPageLink({homeUrl,label,query,updated,maxResults,startIndex}){
    if(!updated && (!startIndex || startIndex <= 1)){
      if(label) return `${homeUrl}/search/label/${label}?max-results=${maxResults}`;
      if(query) return `${homeUrl}/search?q=${encodeURIComponent(query)}&max-results=${maxResults}`;
      return homeUrl + "/";
    }
    const prefix = label ? `${homeUrl}/search/label/${label}?` : (query ? `${homeUrl}/search?q=${encodeURIComponent(query)}&` : `${homeUrl}/search?`);
    const startPart = (startIndex && startIndex>1) ? `&start=${startIndex}` : "";
    return `${prefix}updated-max=${encodeURIComponent(updated)}&max-results=${maxResults}${startPart}`;
  }

  function ranges(a,b){ const o=[]; for(let i=a;i<=b;i++) o.push(i); return o; }

  class BloggerPager {
    constructor(opts={}){
      this.config = Object.assign({}, DEFAULTS, opts);
      this.homeUrl = window.location.origin;
      this.curUrl = new URL(window.location.href);
      this.isHome = this.curUrl.pathname === "/" || this.curUrl.pathname === "/index.html";
      this.label = this.curUrl.pathname.includes("/search/label/") ? this.curUrl.pathname.split("/").pop() : null;
      this.query = this.curUrl.searchParams.get("q") || null;
      this.pagerNode = qs(this.config.pagerSelector);
      this.numbersNode = qs(this.config.numberSelector);
      this.maxResults = this._parseMaxResults();
      this.currentUpdated = this.curUrl.searchParams.get("updated-max") || null;
      this.currentStart = this.curUrl.searchParams.get("start") ? Number(this.curUrl.searchParams.get("start")) : (this.curUrl.searchParams.get("start-index") ? Number(this.curUrl.searchParams.get("start-index")) : null);
      this._cacheKey = `${this.config.cacheKey}::${this.query || ""}::${this.label || ""}`;
    }

    _parseMaxResults(){
      if(!this.pagerNode) return null;
      const a = qsa("a", this.pagerNode).find(el => el.href && el.href.includes("max-results="));
      if(!a) return null;
      try{ const u = new URL(a.href); return Number(u.searchParams.get("max-results")) || null; } catch(e){ return null; }
    }

    async init(){
      if(this.isHome) return; // oculta en home
      if(!this.pagerNode) return;
      if(!this.numbersNode){
        const div = document.createElement("div");
        div.id = (this.config.numberSelector||"#numeracion-paginacion").replace(/^#/,"");
        this.pagerNode.insertBefore(div, this.pagerNode.querySelector(".blog-pager-older-link") || null);
        this.numbersNode = div;
      }
      if(!this.maxResults) this.maxResults = 10;

      // Obtener fechas de posts
      const cached = readCache(this._cacheKey) || { totalPosts:0, postDates:[], updated:null };
      let postDates = (cached.postDates && cached.postDates.length) ? cached.postDates : [];
      const summary = await this._fetchSummary();
      if(!postDates.length || (summary && summary.updated && summary.updated !== cached.updated)){
        const fetched = await this._fetchAllPostDates(summary.totalPosts);
        postDates = fetched.postDates;
        writeCache(this._cacheKey, { totalPosts: fetched.totalPosts, postDates: postDates, updated: summary.updated });
      }

      const totalPages = Math.max(1, Math.ceil(summary.totalPosts / this.maxResults));
      const currentPage = this._computeCurrentPage(postDates, totalPages);
      const pagesToShow = this._computePagesToShow(totalPages, currentPage);
      this._render(pagesToShow, postDates, totalPages, currentPage);
    }

    async _fetchSummary(){
      const feedUrl = `${this.homeUrl}/feeds/posts/summary/${this.label ? `-/${this.label}?` : "?"}alt=json&max-results=0`;
      const res = await fetch(feedUrl);
      const j = await res.json();
      const total = Number(j.feed.openSearch$totalResults.$t || 0);
      const updated = j.feed.updated ? j.feed.updated.$t : null;
      return { totalPosts: total, updated: updated };
    }

    async _fetchAllPostDates(total){
      if(total <=0) return { postDates: [], totalPosts:0 };
      const batch = this.config.batchSize;
      const pages = Math.ceil(total/batch);
      const promises=[];
      for(let i=0;i<pages;i++){
        const startIndex=i*batch+1;
        const url=`${this.homeUrl}/feeds/posts/summary/${this.label ? `-/${this.label}?` : "?"}alt=json&max-results=${batch}&start-index=${startIndex}`;
        promises.push(fetch(url).then(r=>r.json()).catch(()=>null));
      }
      const results = await Promise.all(promises);
      const postDates = results.flatMap(r=>(r && r.feed && r.feed.entry)? r.feed.entry.map(en=>normalizeDate(en.published.$t)) : []);
      return { postDates: postDates, totalPosts: total };
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
      const visible = Number(this.config.totalVisibleNumbers) || 5;
      if(totalPages <= visible) return ranges(1,totalPages);
      const k = visible-1;
      let start = currentPage - Math.floor(k/2);
      if(start <2) start = 2;
      let end = start+k-1;
      if(end > totalPages-1){ end = totalPages-1; start = Math.max(2, end-k+1);}
      const middle = ranges(start,end);
      const result = [1].concat(middle);
      if(!result.includes(totalPages)) result.push(totalPages);
      return result;
    }

    _render(pagesArr, postDates, totalPages, currentPage){
      if(!this.numbersNode) return;
      this.numbersNode.innerHTML="";
      const frag = document.createDocumentFragment();

      const makeAnchor = (page,text,isActive)=>{
        const a = document.createElement("a");
        a.className = this.config.numberClass + (isActive ? " " + this.config.activeClass : "");
        a.textContent = String(text);
        if(!isActive){
          const idx = (page-1)*this.maxResults -1;
          const updated = (idx>=0 && idx<postDates.length) ? postDates[idx] : null;
          const startIndex = (page-1)*this.maxResults;
          a.href = buildPageLink({ homeUrl:this.homeUrl, label:this.label, query:this.query, updated:updated, maxResults:this.maxResults, startIndex:startIndex });
        }
        a.style.display="inline-block";
        a.style.margin="0 6px";
        return a;
      };

      const makeDots = ()=>{
        const s = document.createElement("span");
        s.className=this.config.dotsClass;
        s.textContent="…";
        s.style.display="inline-block";
        s.style.margin="0 6px";
        return s;
      };

      let last=null;
      pagesArr.forEach(p=>{
        if(last!==null && p-last>1) frag.appendChild(makeDots());
        frag.appendChild(makeAnchor(p,p,p===currentPage));
        last=p;
      });

      this.numbersNode.appendChild(frag);
    }
  }

  window.BloggerPager = BloggerPager;
})();
