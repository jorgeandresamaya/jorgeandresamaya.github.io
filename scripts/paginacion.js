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
!function(t,e){"object"==typeof exports&&"undefined"!=typeof module?module.exports=e():"function"==typeof define&&define.amd?define(e):(t="undefined"!=typeof globalThis?globalThis:t||self).BloggerPager=e()}(this,(function(){"use strict";

/** Configuración por defecto **/
const t={
  pagerSelector:"#blog-pager",
  numberSelector:"#numeracion-paginacion",
  numberClass:"pager-item",
  dotsClass:"pager-dots",
  activeClass:"is-active",
  totalVisibleNumbers:5,
  checkForUpdates:!0,
  enableDotsJump:!0,
  byDate:"false",
  maxResults:null,
  query:null,
  label:null,
  start:null,
  updatedMax:null
};

/** Genera los números de paginación **/
function e({config:t,currentPage:e,totalPages:n}){
  const {totalVisibleNumbers:a,activeClass:s}=t;
  let r=Math.floor(a/2),
      start=Math.max(e-r,1),
      end=start+a-1;
  if(n<=a){start=1;end=n}
  else if(e<=r){start=1;end=a}
  else if(e>=n-r){start=n-a+1;end=n}
  const pages=Array.from({length:end-start+1},(_,i)=>start+i);

  const output=[];
  // Puntos iniciales
  if(e>1 && !pages.includes(1)){
    output.push({number:1,activeClass:""});
    output.push({number:pages[0]-1,isDots:!0});
  }
  // Números visibles
  pages.forEach(p=>output.push({number:p,activeClass:p===e?s:""}));
  // Puntos finales
  if(e<n && !pages.includes(n)){
    output.push({number:pages[pages.length-1]+1,isDots:!0});
    output.push({number:n,activeClass:""});
  }

  return output;
}

/** Convierte strings a boolean/number **/
function n(t){
  const map={true:!0,false:!1,null:null};
  return t in map?map[t]:isNaN(t)?(""===t?null:t):Number(t);
}

/** Extrae parámetros de URL **/
function a(t){
  const e=t.searchParams,n=t.pathname,
        params=Object.fromEntries(["max-results","by-date","updated-max","start","q"].map(k=>{
          const key=k==="q"?"query":k.replace(/-([a-z])/g,(m,p)=>p.toUpperCase());
          const val=e.get(k);
          return val!==null?[key,val]:null
        }).filter(Boolean));
  const label=n.includes("/search/label/")?n.split("/").pop():null;
  if(label) params.label=label;
  return params;
}

/** Lee dataset de container **/
function s({dataset:t={}}={}){return Object.fromEntries(["numberClass","dotsClass","activeClass","totalVisibleNumbers","checkForUpdates","enableDotsJump"].filter(e=>void 0!==t[e]).map(e=>[e,n(t[e])]))}

/** Calcula URL de página **/
function g({config:t,number:e,postDates:n}){
  const {homeUrl:a,label:s,query:r,maxResults:o,byDate:l}=t;
  if(e===1) return s?`${a}/search/label/${s}?max-results=${o}`:r?`${a}/search?q=${r}&max-results=${o}&by-date=${l}`:a;
  const u=function(page,dates,max){const idx=(page-1)*max-1;return Array.isArray(dates)&&dates[idx]?encodeURIComponent(dates[idx]):null}(e,n,o);
  return u?`${a}${s?`/search/label/${s}?`:r?`/search?q=${r}&`:""}updated-max=${u}&max-results=${o}&start=${(e-1)*o}&by-date=${l}`:"#fetching";
}

/** Renderiza paginación **/
function p({config:t,paginationData:n,postDates:a}){
  if(!n.length) return;
  const {numberContainer:s,numberClass:r,dotsClass:o,enableDotsJump:l}=t,
        frag=document.createDocumentFragment(),
        createDots=n=>{
          const el=document.createElement(l?"button":"span");
          el.className=o; el.textContent="...";
          if(l) el.addEventListener("click",e=>{e.preventDefault();p({config:t,paginationData:e({config:t,currentPage:n,totalPages:Math.ceil(a.length/t.maxResults)}),postDates:a})});
          return el;
        };
  n.forEach(x=>{
    if(x.isDots) frag.appendChild(createDots(x.number));
    else{
      const el=document.createElement("a");
      el.className=`${r} ${x.activeClass}`.trim();
      el.textContent=x.number;
      el.href=g({config:t,number:x.number,postDates:a});
      frag.appendChild(el);
    }
  });
  s.innerHTML=""; s.appendChild(frag);
}

/** Inicia paginación **/
return class{
  constructor(e={}){
    this.currentUrl=new URL(window.location.href);
    this.config={...t,...e,...a(this.currentUrl),homeUrl:this.currentUrl.origin};
    this.pagerContainer=document.querySelector(this.config.pagerSelector);
    this.numberContainer=document.querySelector(this.config.numberSelector);
  }
  async init(){
    if(!this.pagerContainer||!this.numberContainer) return;
    const totalPosts=0, postDates=[]; // Se puede reemplazar con fetch si quieres histórico real
    const totalPages=Math.ceil(totalPosts/this.config.maxResults);
    p({config:this.config,paginationData:e({config:this.config,currentPage:1,totalPages:totalPages}),postDates:postDates});
  }
}
}));
