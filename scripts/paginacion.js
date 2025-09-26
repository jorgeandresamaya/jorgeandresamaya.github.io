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
const t={pagerSelector:"#blog-pager",numberSelector:"#numeracion-paginacion",numberClass:"pager-item",dotsClass:"pager-dots",activeClass:"is-active",totalVisibleNumbers:5,checkForUpdates:!0,enableDotsJump:!0,byDate:"false",maxResults:null,query:null,label:null,start:null,updatedMax:null};

/** Genera la lista de páginas visibles **/
function e({config:t,currentPage:e,totalPages:n}){
  const {totalVisibleNumbers:a,activeClass:s}=t;
  const half=Math.floor(a/2);
  let start=Math.max(e-half,1),end=Math.min(start+a-1,n);
  if(n<=a){start=1;end=n}
  else if(e<=half){start=1;end=a}
  else if(e>=n-half){start=n-a+1;end=n}
  const range=Array.from({length:end-start+1},(_,i)=>start+i);

  const output=[];
  if(e>1 && !range.includes(1)){
    output.push({number:1,activeClass:""});
    output.push({number:range[0]-1,isDots:!0});
  }
  range.forEach(num=>output.push({number:num,activeClass:num===e?s:""}));
  if(e<n && !range.includes(n)){
    output.push({number:range[range.length-1]+1,isDots:!0});
    output.push({number:n,activeClass:""});
  }
  return output;
}

/** Helpers **/
function n(t){const e=t.trim(),n={true:!0,false:!1,null:null};return e in n?n[e]:isNaN(e)?""===e?null:e:Number(e)}
function a(t){const e=t.searchParams,n=t.pathname,a=Object.fromEntries(["max-results","by-date","updated-max","start","q"].map((t=>{const n="q"===t?"query":t.replace(/-([a-z])/g,((t,e)=>e.toUpperCase()));const a=e.get(t);return null!==a?[n,a]:null})).filter(Boolean)),s=(r=n).includes("/search/label/")?r.split("/").pop():null;var r;return s&&(a.label=s),a}
function s({dataset:t={}}={}){return Object.fromEntries(["numberClass","dotsClass","activeClass","totalVisibleNumbers","checkForUpdates","enableDotsJump"].filter((e=>void 0!==t[e])).map((e=>[e,n(t[e])])))} 
function r(t){const e=Array.from(t.querySelectorAll("a")).find((t=>t.href.includes("max-results=")));if(!e)return{};const n=new URL(e.href).searchParams.get("max-results");return{maxResults:Number(n)}}
const o="bloggerPagination";function l(){try{const t=localStorage.getItem(o);return t?JSON.parse(t):{}}catch(t){return console.warn("Invalid localStorage data, resetting cache",t),localStorage.removeItem(o),{}}}
function u(t){let e=5381;for(let n=0;n<t.length;n++)e=33*e^t.charCodeAt(n);return(e>>>0).toString(36)}
function i(t=null,e=null){return t?`query${u(t)}`:e?`label${u(e)}`:"all"}
function c(t,e=null,n=null){const a=i(e,n),s=l();s[a]=t,localStorage.setItem(o,JSON.stringify(s))}
function m(t=null,e=null){const n=i(t,e);return l()[n]||{totalPosts:0,postDates:[],blogUpdated:null}}
function f(t,e){return Math.ceil(Number(t)/e)}
function g({config:t,number:e,postDates:n}){const{homeUrl:a,label:s,query:r,maxResults:o,byDate:l}=t;if(1===e)return function({homeUrl:t,label:e,query:n,maxResults:a,byDate:s}){return e?`${t}/search/label/${e}?max-results=${a}`:n?`${t}/search?q=${n}&max-results=${a}&by-date=${s}`:t}({homeUrl:a,label:s,query:r,maxResults:o,byDate:l});const u=function(t,e,n){const a=(t-1)*n-1;return Array.isArray(e)&&e[a]?encodeURIComponent(e[a]):null}(e,n,o);return u?`${a}${function(t,e){return t?`/search/label/${t}?`:e?`/search?q=${e}&`:"/search?"}(s,r)}updated-max=${u}&max-results=${o}&start=${(e-1)*o}&by-date=${l}`:"#fetching"}

/** Render de paginación **/
function p({config:t,paginationData:n,postDates:a}){
  if(!n.length)return;
  const{numberContainer:s,numberClass:r,dotsClass:o,enableDotsJump:l}=t,u=document.createDocumentFragment(),
  i=n=>{const s=document.createElement(l?"button":"span");s.className=o,s.textContent="...";s.dataset.page=n;return s};
  n.forEach((e=>{u.appendChild(e.isDots?i(e.number):(({number:e,activeClass:n})=>{const s=document.createElement("a");return s.className=`${r} ${n}`.trim(),s.textContent=e,s.href=g({config:t,number:e,postDates:a}),s})(e))}));
  s.innerHTML="",s.appendChild(u)
}

/** Determinar página actual **/
function h({config:t,totalPosts:n,postDates:a}){
  const{maxResults:s}=t,r=f(n,s),o=function({config:t,postDates:e}){const{query:n,maxResults:a,updatedMax:s,start:r}=t;if(!s&&!r)return 1;const o=e.filter(((t,e)=>(e+1)%a==0)).indexOf(s);return(r&&n?Math.ceil(r/a)+1:null)??(-1!==o?o+2:null)??1}({config:t,postDates:a});
  // ocultar numeración en home (página 1)
  if(o===1)return;
  p({config:t,paginationData:e({config:t,currentPage:o,totalPages:r}),postDates:a})
}

/** Clase principal **/
return class{constructor(e={}){this.currentUrl=new URL(window.location.href),this.config={...t,...e,...a(this.currentUrl),homeUrl:this.currentUrl.origin},this.pagerContainer=document.querySelector(this.config.pagerSelector),this.numberContainer=document.querySelector(this.config.numberSelector)}async init(){if(!this.pagerContainer||!this.numberContainer)return;const{query:t,label:e,homeUrl:n}=this.config,a=m(t,e),{totalPosts:o,blogUpdated:l,postDates:u}=a,i={...this.config,...r(this.pagerContainer),...s(this.pagerContainer),numberContainer:this.numberContainer},f=i.checkForUpdates,g=o&&u.length;if(g&&h({config:i,totalPosts:o,postDates:u}),g&&!f)return void(i.maxResults>=o&&this.pagerContainer.remove());const p=await async function({homeUrl:t,query:e,label:n}){const a=`${t}/feeds/posts/summary/${n?`-/${n}?`:"?"}alt=json&max-results=0`,s=await fetch(a),r=await s.json(),o=Number(r.feed.openSearch$totalResults.$t),l=r.feed.updated.$t,u=m(e,n);return e||(u.totalPosts=o),u.blogUpdated=l,c(u,e,n),{totalPosts:o,blogUpdated:l}}({homeUrl:n,query:t,label:e});if(p.blogUpdated!==l||!u.length){const t=await async function({config:t,totalPosts:e}){const{homeUrl:n,query:a,label:s,byDate:r}=t;if(0===e)return[];const o=Math.ceil(e/150);let l=0;const u=Array.from({length:o},((t,e)=>fetch(`${n}/feeds/posts/summary/${a?`?q=${a}&orderby=${!1===r?"relevance":"published"}&`:s?`-/${s}?`:"?"}alt=json&max-results=150&start-index=${150*e+1}`).then((t=>t.json())))),i=(await Promise.all(u)).flatMap((t=>(a&&(l+=Number(t.feed.openSearch$totalResults.$t)),t.feed.entry?.map((t=>t.published.$t.replace(/\.\d+/,"")))||[]))),f=m(a,s);return f.postDates=i,a&&(f.totalPosts=l),c(f,a,s),{totalPosts:a?l:e,postDates:i}}({config:i,totalPosts:p.totalPosts});h({config:i,totalPosts:t.totalPosts,postDates:t.postDates})}i.maxResults>=(o||p.totalPosts)&&this.pagerContainer.remove()}}}
}));
