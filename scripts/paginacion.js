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

  function normalizeDate(s){ return s ? String(s).replace(/\.\d+/,"").trim() : s; }
  function ranges(a,b){ const o=[]; for(let i=a;i<=b;i++) o.push(i); return o; }
  function buildPageLink({homeUrl,label,query,updated,maxResults,startIndex}){
    const prefix = label ? `${homeUrl}/search/label/${label}?` : (query ? `${homeUrl}/search?q=${encodeURIComponent(query)}&` : `${homeUrl}/search?`);
    const startPart = (typeof startIndex==="number" && startIndex>1)?`&start=${startIndex}`:"";
    return `${prefix}updated-max=${encodeURIComponent(updated)}&max-results=${maxResults}${startPart}`;
  }

  class BloggerPager {
    constructor(opts={}){
      this.config = Object.assign({}, DEFAULTS, opts);
      this.homeUrl = window.location.origin;
      this.curUrl = new URL(window.location.href);
      this.label = this.curUrl.pathname.includes("/search/label/") ? this.curUrl.pathname.split("/").pop() : null;
      this.query = this.curUrl.searchParams.get("q") || null;
      this.currentStart = this.curUrl.searchParams.get("start") ? Number(this.curUrl.searchParams.get("start")) : (this.curUrl.searchParams.get("start-index") ? Number(this.curUrl.searchParams.get("start-index")) : null);
      this.currentUpdated = this.curUrl.searchParams.get("updated-max") || null;
      this.numbersNode = null;
    }

    async init(){
      this.pagerNode = qs(this.config.pagerSelector);
      if(!this.pagerNode) return;

      // Ocultar en Home
      if(this.curUrl.pathname === "/" || this.curUrl.pathname === "/index.html") return;

      this.maxResults = this._parseMaxResults() || 10;

      const cached = JSON.parse(localStorage.getItem(this.config.cacheKey) || '{"totalPosts":0,"postDates":[],"updated":null}');
      let summary=null;
      try{ summary = await this._fetchSummary(); } catch(e){}

      let postDates = cached.postDates || [];
      if(!postDates.length || (summary && summary.updated !== cached.updated)){
        try {
          const fetched = await this._fetchAllPostDates(summary ? summary.totalPosts : cached.totalPosts);
          postDates = fetched.postDates;
          localStorage.setItem(this.config.cacheKey, JSON.stringify({totalPosts: fetched.totalPosts, postDates, updated: summary?.updated || cached.updated}));
        } catch(e){}
      }

      const totalPosts = summary?.totalPosts || cached.totalPosts || 0;
      const totalPages = Math.max(1, Math.ceil(totalPosts/this.maxResults));
      const currentPage = this._computeCurrentPage(postDates,totalPages);
      const pagesToShow = this._computePagesToShow(totalPages,currentPage);

      this._renderPager(pagesToShow, postDates, currentPage);
      this._renderFlexContainer();
    }

    _parseMaxResults(){
      const a = qsa("a", this.pagerNode).find(el=>el.href.includes("max-results="));
      if(!a) return null;
      try{ return Number(new URL(a.href).searchParams.get("max-results")) || null }catch(e){return null;}
    }

    _computeCurrentPage(postDates,totalPages){
      if(this.currentStart) return Math.floor(this.currentStart/this.maxResults)+1;
      if(!this.currentUpdated) return 1;
      const cur = normalizeDate(this.currentUpdated);
      for(let p=2;p<=totalPages;p++){
        const idx=(p-1)*this.maxResults-1;
        if(idx>=0 && idx<postDates.length && normalizeDate(postDates[idx])===cur) return p;
      }
      return 1;
    }

    _computePagesToShow(totalPages,currentPage){
      const visible=Math.max(1,this.config.totalVisibleNumbers);
      if(totalPages<=visible) return ranges(1,totalPages);
      const k=visible-1;
      let start=currentPage-Math.floor(k/2); if(start<2) start=2;
      let end=start+k-1; if(end>totalPages-1){ end=totalPages-1; start=Math.max(2,end-k+1);}
      return [1, ...ranges(start,end), totalPages];
    }

    _renderPager(pagesArr,postDates,currentPage){
      if(!this.numbersNode){
        this.numbersNode=document.createElement("div");
        this.numbersNode.id=this.config.numberSelector;
        this.numbersNode.style.display="inline-flex";
        this.numbersNode.style.alignItems="center";
        this.numbersNode.style.justifyContent="center";
        this.numbersNode.style.gap="6px";
      }
      this.numbersNode.innerHTML="";

      const frag=document.createDocumentFragment();
      let prev=null;
      pagesArr.forEach(p=>{
        if(prev!==null && p-prev>1){
          const dots=document.createElement("span"); dots.textContent="…"; dots.style.margin="0 6px"; frag.appendChild(dots);
        }
        const a=document.createElement("a");
        a.textContent=p;
        a.className=this.config.numberClass+(p===currentPage?" "+this.config.activeClass:"");
        if(p!==currentPage){
          const startIndex=(p-1)*this.maxResults;
          const updated=(startIndex-1>=0 && startIndex-1<postDates.length)?postDates[startIndex-1]:null;
          a.href=buildPageLink({homeUrl:this.homeUrl,label:this.label,query:this.query,updated,maxResults:this.maxResults,startIndex});
        }
        a.style.margin="0 6px"; a.style.display="inline-block";
        frag.appendChild(a);
        prev=p;
      });
      this.numbersNode.appendChild(frag);
    }

    _renderFlexContainer(){
      const olderBtn=qs(".blog-pager-older-link",this.pagerNode);
      const newerBtn=qs(".blog-pager-newer-link",this.pagerNode);

      const flex=document.createElement("div");
      flex.style.display="flex";
      flex.style.justifyContent="center";
      flex.style.alignItems="center";
      flex.style.gap="12px";

      if(newerBtn) flex.appendChild(newerBtn);
      flex.appendChild(this.numbersNode);
      if(olderBtn) flex.appendChild(olderBtn);

      this.pagerNode.innerHTML="";
      this.pagerNode.appendChild(flex);
    }

    async _fetchSummary(){
      const url=`${this.homeUrl}/feeds/posts/summary/${this.label?`-/${this.label}?`:"?"}alt=json&max-results=0`;
      const res=await fetch(url); const j=await res.json();
      return {totalPosts:Number(j.feed.openSearch$totalResults.$t||0), updated:j.feed.updated?.$t||null};
    }

    async _fetchAllPostDates(total){
      if(!total) return {totalPosts:0, postDates:[]};
      const batch=this.config.batchSize, pages=Math.ceil(total/batch), promises=[];
      for(let i=0;i<pages;i++){
        const startIndex=i*batch+1;
        const url=`${this.homeUrl}/feeds/posts/summary/${this.label?`-/${this.label}?`:"?"}alt=json&max-results=${batch}&start-index=${startIndex}`;
        promises.push(fetch(url).then(r=>r.json()).catch(()=>null));
      }
      const results=await Promise.all(promises);
      const postDates=results.flatMap(r=>(r?.feed?.entry)?.map(en=>normalizeDate(en.published.$t))||[]);
      return {totalPosts:total, postDates};
    }
  }

  function autoInit(attempts=14, delay=400){
    let tries=0;
    const tryNow=()=>{
      tries++;
      if(qs(DEFAULTS.pagerSelector)){
        const inst=new BloggerPager(); inst.init().catch(console.warn); return;
      }
      if(tries<attempts) setTimeout(tryNow,delay);
    };
    if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",tryNow);
    else tryNow();
  }

  autoInit();

})();
