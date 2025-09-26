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
/* paginacion.js — Versión corregida para Blogger
   - Inserta numeración en #numeracion-paginacion (entre flechas)
   - Upgraded: fallback a start-index, comparación robusta de updated-max
   - Máximo 5 números visibles + puntos suspensivos
   - Inline styles mínimos para mantener alineación vertical
*/

(function () {
  "use strict";

  const DEFAULTS = {
    pagerSelector: "#blog-pager",
    numberSelector: "#numeracion-paginacion",
    numberClass: "pager-item",
    activeClass: "is-active",
    dotsClass: "pager-dots",
    totalVisibleNumbers: 5,
    cacheKey: "bloggerPager_v1",
    batchSize: 150
  };

  const qs = (sel, ctx = document) => ctx.querySelector(sel);
  const qsa = (sel, ctx = document) => Array.from((ctx || document).querySelectorAll(sel));
  const readCache = (k) => {
    try { const r = localStorage.getItem(k); return r ? JSON.parse(r) : null; } catch (e) { try { localStorage.removeItem(k); } catch {} return null; }
  };
  const writeCache = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };

  function parseMaxResultsFromPager(pagerNode) {
    if (!pagerNode) return null;
    const a = qsa("a", pagerNode).find(el => el.href && el.href.includes("max-results="));
    if (!a) return null;
    try { const u = new URL(a.href); return Number(u.searchParams.get("max-results")) || null; } catch (e) { return null; }
  }

  function normalizeDateString(s) {
    if (!s) return s;
    // remove milliseconds (if any) and trim
    return String(s).replace(/\.\d+/, "").trim();
  }

  function buildPageLink(opts) {
    // opts: { homeUrl, label, query, updated, maxResults, startIndex }
    const { homeUrl, label, query, updated, maxResults, startIndex } = opts;
    // first page (no updated nor start)
    if (!updated && (!startIndex || startIndex <= 1)) {
      if (label) return `${homeUrl}/search/label/${label}?max-results=${maxResults}`;
      if (query) return `${homeUrl}/search?q=${encodeURIComponent(query)}&max-results=${maxResults}`;
      return homeUrl + "/";
    }
    const prefix = label ? `${homeUrl}/search/label/${label}?` : (query ? `${homeUrl}/search?q=${encodeURIComponent(query)}&` : `${homeUrl}/search?`);
    if (updated) {
      return `${prefix}updated-max=${encodeURIComponent(updated)}&max-results=${maxResults}${(typeof startIndex === "number" && startIndex > 1) ? `&start=${startIndex}` : ""}`;
    }
    // fallback to start-index
    const sidx = (typeof startIndex === "number" && startIndex > 0) ? startIndex : ((typeof startIndex === "number") ? startIndex : 1);
    return `${prefix}start-index=${sidx}&max-results=${maxResults}`;
  }

  function ranges(a, b) { const out = []; for (let i = a; i <= b; i++) out.push(i); return out; }

  class BloggerPager {
    constructor(options = {}) {
      this.config = Object.assign({}, DEFAULTS, options);
      this.homeUrl = window.location.origin;
      this.curUrl = new URL(window.location.href);
      // label detection
      this.label = null;
      if (this.curUrl.pathname.includes("/search/label/")) {
        const bits = this.curUrl.pathname.split("/");
        this.label = bits[bits.length - 1] || null;
      }
      this.query = this.curUrl.searchParams.get("q") || null;
      this.pagerNode = qs(this.config.pagerSelector);
      this.numbersNode = qs(this.config.numberSelector);
      this.maxResults = parseMaxResultsFromPager(this.pagerNode) || null;
      this.currentUpdated = this.curUrl.searchParams.get("updated-max") || null;
      // some Blogger versions use start or start-index
      this.currentStart = (this.curUrl.searchParams.get("start") ? Number(this.curUrl.searchParams.get("start")) : (this.curUrl.searchParams.get("start-index") ? Number(this.curUrl.searchParams.get("start-index")) : null));
      this._cacheKey = `${this.config.cacheKey}::${this.query || ""}::${this.label || ""}`;
    }

    async init() {
      // ensure nodes exist (Blogger may inject them later)
      if (!this._ensureNodes()) return;

      // determine posts-per-page
      if (!this.maxResults) this.maxResults = 10; // safe default

      // load cache
      const cached = readCache(this._cacheKey) || { totalPosts: 0, postDates: [], updated: null };

      // fetch summary (total & updated)
      let summary = null;
      try {
        summary = await this._fetchSummary();
      } catch (e) {
        console.warn("BloggerPager summary fetch failed", e);
      }

      // decide whether to fetch all post dates
      let postDates = (cached && cached.postDates && cached.postDates.length) ? cached.postDates : [];
      if (!postDates.length || (summary && summary.updated && summary.updated !== cached.updated)) {
        try {
          const fetched = await this._fetchAllPostDates(summary ? summary.totalPosts : (cached.totalPosts || 0));
          if (fetched && fetched.postDates && fetched.postDates.length) {
            postDates = fetched.postDates;
            writeCache(this._cacheKey, { totalPosts: fetched.totalPosts, postDates: fetched.postDates, updated: (summary ? summary.updated : (cached.updated || null)) });
          }
        } catch (e) {
          console.warn("BloggerPager fetchAllPostDates failed", e);
        }
      }

      const totalPosts = (readCache(this._cacheKey) && readCache(this._cacheKey).totalPosts) || (summary ? summary.totalPosts : (cached.totalPosts || 0)) || 0;
      const totalPages = Math.max(1, Math.ceil(totalPosts / this.maxResults));

      const currentPage = this._computeCurrentPage(postDates, totalPages);

      const pagesToShow = this._computePagesToShow(totalPages, currentPage);

      this._render(pagesToShow, postDates, totalPages, currentPage);

      // don't remove the pager container — keep existing Blogger links
    }

    _ensureNodes() {
      // find pager node if not found
      if (!this.pagerNode) this.pagerNode = qs(this.config.pagerSelector);
      if (!this.pagerNode) return false;

      // find or create numbers node in-between the existing links
      if (!this.numbersNode) {
        // try to find existing by id/class inside pagerNode
        const existing = this.pagerNode.querySelector(this.config.numberSelector);
        if (existing) this.numbersNode = existing;
        else {
          // create and insert BEFORE the older-link (so it sits between newer & older)
          const div = document.createElement("div");
          div.id = (this.config.numberSelector || "#numeracion-paginacion").replace(/^#/, "");
          // minimal inline styles to ensure horizontal centering & vertical alignment
          div.style.display = "inline-block";
          div.style.verticalAlign = "middle";
          div.style.margin = "0 6px";
          // insertion point: before older link if present; otherwise append
          const older = this.pagerNode.querySelector(".blog-pager-older-link");
          this.pagerNode.insertBefore(div, older || null);
          this.numbersNode = div;
        }
      }
      // ensure pager container centers inline children
      try { this.pagerNode.style.textAlign = "center"; } catch (e) {}
      return !!this.numbersNode;
    }

    async _fetchSummary() {
      const feedUrl = `${this.homeUrl}/feeds/posts/summary/${this.label ? `-/${this.label}?` : "?"}alt=json&max-results=0`;
      const res = await fetch(feedUrl);
      const j = await res.json();
      const total = Number(j.feed.openSearch$totalResults.$t || 0);
      const updated = j.feed.updated ? j.feed.updated.$t : null;
      return { totalPosts: total, updated: updated };
    }

    async _fetchAllPostDates(totalFromSummary = 0) {
      const total = totalFromSummary || 0;
      if (total === 0) return { totalPosts: 0, postDates: [] };
      const batch = this.config.batchSize;
      const pages = Math.ceil(total / batch);
      const promises = [];
      for (let i = 0; i < pages; i++) {
        const startIndex = i * batch + 1;
        const url = `${this.homeUrl}/feeds/posts/summary/${this.label ? `-/${this.label}?` : "?"}alt=json&max-results=${batch}&start-index=${startIndex}`;
        promises.push(fetch(url).then(r => r.json()).catch(() => null));
      }
      const results = await Promise.all(promises);
      const postDates = results.flatMap(r => (r && r.feed && r.feed.entry) ? r.feed.entry.map(en => normalizeDateString(en.published.$t)) : []);
      return { totalPosts: total, postDates: postDates };
    }

    _computeCurrentPage(postDates, totalPages) {
      // If start param is present, prefer it
      if (this.currentStart && !Number.isNaN(this.currentStart)) {
        return Math.floor(this.currentStart / this.maxResults) + 1;
      }
      // If no updated param -> page 1
      if (!this.currentUpdated) return 1;

      const cur = normalizeDateString(this.currentUpdated);
      // find matching index in postDates
      for (let p = 2; p <= totalPages; p++) {
        const idx = (p - 1) * this.maxResults - 1;
        if (idx >= 0 && idx < postDates.length) {
          const candidate = normalizeDateString(postDates[idx]);
          if (candidate === cur || encodeURIComponent(candidate) === this.currentUpdated || decodeURIComponent(this.currentUpdated || "") === candidate) {
            return p;
          }
        }
      }
      // fallback: try to approximate via totalPages: if updated matches older boundary maybe last page
      return 1;
    }

    _computePagesToShow(totalPages, currentPage) {
      const visible = Math.max(1, Number(this.config.totalVisibleNumbers) || 5);
      if (totalPages <= visible) return ranges(1, totalPages);
      // We'll ensure last page always included; compute middle window of (visible -1) length
      const k = visible - 1; // aside from last
      let start = currentPage - Math.floor(k / 2);
      if (start < 2) start = 2; // reserve 1 for first page
      let end = start + k - 1;
      if (end > totalPages - 1) {
        end = totalPages - 1;
        start = Math.max(2, end - k + 1);
      }
      const middle = ranges(start, end);
      // result: include first, middle, last
      const result = [1].concat(middle);
      if (!result.includes(totalPages)) result.push(totalPages);
      return result;
    }

    _render(pagesArray, postDates, totalPages, currentPage) {
      if (!this.numbersNode) return;
      this.numbersNode.innerHTML = "";
      // inline container to keep same vertical alignment as links
      this.numbersNode.style.display = "inline-block";
      this.numbersNode.style.verticalAlign = "middle";
      this.numbersNode.style.textAlign = "center";

      const frag = document.createDocumentFragment();

      // helper to create anchor or span
      const makeAnchor = (page, text, isActive) => {
        const a = document.createElement("a");
        a.className = this.config.numberClass + (isActive ? " " + this.config.activeClass : "");
        a.textContent = String(text);
        // compute href
        if (!isActive) {
          if (page === 1) {
            if (this.label) a.href = `${this.homeUrl}/search/label/${this.label}?max-results=${this.maxResults}`;
            else if (this.query) a.href = `${this.homeUrl}/search?q=${encodeURIComponent(this.query)}&max-results=${this.maxResults}`;
            else a.href = this.homeUrl + "/";
          } else {
            const idx = (page - 1) * this.maxResults - 1;
            const updated = (idx >= 0 && idx < postDates.length) ? postDates[idx] : null;
            const startIndex = (page - 1) * this.maxResults;
            a.href = buildPageLink({ homeUrl: this.homeUrl, label: this.label, query: this.query, updated: updated, maxResults: this.maxResults, startIndex: startIndex });
          }
        } else {
          // active: keep no href
        }
        // minimal inline style to keep alignment consistent
        a.style.display = "inline-block";
        a.style.verticalAlign = "middle";
        a.style.margin = "0 6px";
        // do not set padding/background — let CSS handle design
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

      // iterate pagesArray and insert dots where gap > 1
      let prev = null;
      pagesArray.forEach((p) => {
        if (prev !== null && p - prev > 1) {
          // insert dots
          frag.appendChild(makeDots());
        }
        const isActive = (p === currentPage);
        frag.appendChild(makeAnchor(p, p, isActive));
        prev = p;
      });

      // append fragment
      this.numbersNode.appendChild(frag);
    }
  }

  // auto-init with retries (Blogger may render pager late)
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
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", tryNow);
    else tryNow();
  }

  try { autoInit(); } catch (e) { console.error("BloggerPager bootstrap error", e); }

})();

