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
/* paginacion.js - Adaptado para Blogger (updated-max + max-results)
   - Inserta la numeración en #numeracion-paginacion
   - Muestra hasta 5 números (incluye la página activa y la última)
   - Genera enlaces clicables usando updated-max & max-results
   - Usa cache en localStorage para evitar recargas pesadas
   - Auto-inicializa con reintentos (por si Blogger inyecta tarde el HTML)
*/

(function () {
  "use strict";

  const DEFAULTS = {
    pagerSelector: "#blog-pager",
    numberSelector: "#numeracion-paginacion",
    numberClass: "pager-item",
    activeClass: "is-active",
    dotsClass: "pager-dots",
    totalVisibleNumbers: 5, // EXACTAMENTE 5 números visibles (incluye activo y el final)
    enableDotsJump: false, // no usamos dots clicables para mantener los 5 números exactos
    cacheKey: "bloggerPager_v1",
    batchSize: 150 // how many posts per feed request (Blogger limit)
  };

  /* ---------- Helpers ---------- */
  const qs = (sel, ctx = document) => ctx.querySelector(sel);
  const qsa = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const readCache = (key) => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      try { localStorage.removeItem(key); } catch {}
      return null;
    }
  };
  const writeCache = (key, val) => {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) {}
  };

  function parseMaxResultsFromPager(pagerNode) {
    if (!pagerNode) return null;
    const a = qsa("a", pagerNode).find((el) => el.href && el.href.includes("max-results="));
    if (!a) return null;
    try {
      const u = new URL(a.href);
      return Number(u.searchParams.get("max-results")) || null;
    } catch (e) {
      return null;
    }
  }

  function buildPageLink({ homeUrl, label, query, updated, maxResults, startIndex }) {
    // if page 1 (updated == null) -> homeUrl (root)
    if (!updated) {
      if (label) return `${homeUrl}/search/label/${label}?max-results=${maxResults}`;
      if (query) return `${homeUrl}/search?q=${encodeURIComponent(query)}&max-results=${maxResults}`;
      return homeUrl + "/";
    }
    const prefix = label ? `${homeUrl}/search/label/${label}?` : (query ? `${homeUrl}/search?q=${encodeURIComponent(query)}&` : `${homeUrl}/search?`);
    // include start index for clarity (some Blogger setups use it)
    const startPart = (typeof startIndex === "number" && startIndex > 0) ? `&start=${startIndex}` : "";
    return `${prefix}updated-max=${encodeURIComponent(updated)}&max-results=${maxResults}${startPart}`;
  }

  function ranges(start, end) {
    const out = [];
    for (let i = start; i <= end; i++) out.push(i);
    return out;
  }

  /* ---------- Core Pager Class ---------- */
  class BloggerPager {
    constructor(options = {}) {
      this.config = Object.assign({}, DEFAULTS, options);
      this.homeUrl = window.location.origin;
      this.currentUrl = new URL(window.location.href);
      // parse possible label from pathname (e.g. /search/label/X)
      this.label = null;
      if (this.currentUrl.pathname.includes("/search/label/")) {
        const bits = this.currentUrl.pathname.split("/");
        this.label = bits[bits.length - 1] || null;
      }
      // query param 'q' if present (search)
      this.query = this.currentUrl.searchParams.get("q") || null;
      this.pagerNode = qs(this.config.pagerSelector);
      this.numbersNode = qs(this.config.numberSelector);
      this.maxResults = parseMaxResultsFromPager(this.pagerNode) || null;
      // current updated-max or start (to compute current page)
      this.currentUpdated = this.currentUrl.searchParams.get("updated-max") || null;
      this.currentStart = this.currentUrl.searchParams.get("start") ? Number(this.currentUrl.searchParams.get("start")) : null;
      // cache key includes label/query to separate
      this._cacheKeyForThis = `${this.config.cacheKey}::${this.query || ""}::${this.label || ""}`;
    }

    async init() {
      // wait until pager exists (Blogger may render it after)
      if (!this._ensureNodes()) {
        // if not found, nothing to do
        return;
      }

      // determine posts per page
      if (!this.maxResults) this.maxResults = 10; // fallback safe default

      // try to get cached data
      const cached = readCache(this._cacheKeyForThis) || { totalPosts: 0, postDates: [], updated: null };

      // get feed summary (total posts and blog updated)
      let feedSummary;
      try {
        feedSummary = await this._fetchFeedSummary();
      } catch (e) {
        console.warn("BloggerPager: feed summary failed", e);
        feedSummary = null;
      }

      // if feed changed or we don't have postDates, fetch postDates (batches)
      let postDates = (cached && cached.postDates && cached.postDates.length) ? cached.postDates : [];
      if (!postDates.length || (feedSummary && feedSummary.updated !== cached.updated)) {
        try {
          const fetched = await this._fetchAllPostDates(feedSummary ? feedSummary.totalPosts : cached.totalPosts);
          if (fetched && fetched.postDates && fetched.postDates.length) {
            postDates = fetched.postDates;
            writeCache(this._cacheKeyForThis, { totalPosts: fetched.totalPosts, postDates: fetched.postDates, updated: feedSummary ? feedSummary.updated : (cached.updated || null) });
          }
        } catch (e) {
          console.warn("BloggerPager: fetchAllPostDates failed", e);
        }
      } else {
        // use cached totalPosts/updated
      }

      const totalPosts = (readCache(this._cacheKeyForThis) && readCache(this._cacheKeyForThis).totalPosts) || (feedSummary ? feedSummary.totalPosts : (cached.totalPosts || 0)) || 0;
      const totalPages = Math.max(1, Math.ceil(totalPosts / this.maxResults));

      // compute current page
      const currentPage = this._computeCurrentPage(postDates, totalPages);

      // compute page numbers to render (exactly N = totalVisibleNumbers)
      const pages = this._computePagesToShow(totalPages, currentPage);

      // render into DOM
      this._render(pages, postDates);

      // if only one page, hide pager container
      if (totalPages <= 1) {
        try { this.pagerNode && this.pagerNode.remove(); } catch (e) {}
      }
    }

    _ensureNodes() {
      // Make sure pagerNode exists
      if (!this.pagerNode) {
        this.pagerNode = qs(this.config.pagerSelector);
        if (!this.pagerNode) return false;
      }
      // Ensure numbersNode exists; if not, create it (insert between newer/older links)
      if (!this.numbersNode) {
        let created = false;
        const existing = this.pagerNode.querySelector(this.config.numberSelector);
        if (existing) {
          this.numbersNode = existing;
          created = true;
        } else {
          const div = document.createElement("div");
          const id = (this.config.numberSelector || "#numeracion-paginacion").replace(/^#/, "");
          div.id = id;
          // try to insert before the older-link so it sits between buttons
          const older = this.pagerNode.querySelector(".blog-pager-older-link");
          this.pagerNode.insertBefore(div, older || null);
          this.numbersNode = div;
          created = true;
        }
        if (created) {
          // ensure basic centering, but keep subclassing to your template's CSS
          this.numbersNode.style.textAlign = "center";
        }
      }
      return !!this.numbersNode;
    }

    async _fetchFeedSummary() {
      // returns { totalPosts: number, updated: string }
      const feedUrl = `${this.homeUrl}/feeds/posts/summary/${this.label ? `-/${this.label}?` : "?"}alt=json&max-results=0`;
      const res = await fetch(feedUrl);
      const j = await res.json();
      const total = Number(j.feed.openSearch$totalResults.$t || 0);
      const updated = j.feed.updated ? j.feed.updated.$t : null;
      return { totalPosts: total, updated: updated };
    }

    async _fetchAllPostDates(totalFromSummary = 0) {
      // fetch in batches of batchSize and return { totalPosts, postDates[] }
      const totals = totalFromSummary || 0;
      const batch = this.config.batchSize;
      if (totals === 0) return { totalPosts: 0, postDates: [] };
      const pages = Math.ceil(totals / batch);
      const promises = [];
      for (let i = 0; i < pages; i++) {
        const startIndex = i * batch + 1;
        const url = `${this.homeUrl}/feeds/posts/summary/${this.label ? `-/${this.label}?` : "?"}alt=json&max-results=${batch}&start-index=${startIndex}`;
        promises.push(fetch(url).then(r => r.json()).catch(() => null));
      }
      const results = await Promise.all(promises);
      const postDates = results.flatMap(r => (r && r.feed && r.feed.entry) ? r.feed.entry.map(en => en.published.$t.replace(/\.\d+/, "")) : []);
      return { totalPosts: totals, postDates: postDates };
    }

    _computeCurrentPage(postDates, totalPages) {
      // If URL has start param, use it (Blogger sometimes uses start)
      if (this.currentStart && !Number.isNaN(this.currentStart)) {
        return Math.floor(this.currentStart / this.maxResults) + 1;
      }
      // If no updated-max in URL -> page 1
      if (!this.currentUpdated) return 1;

      // Try to find which page corresponds to updated-max
      // For page p>1, updated for that page is postDates[(p-1)*maxResults - 1]
      const encodedCurrentUpdated = this.currentUpdated;
      for (let p = 2; p <= totalPages; p++) {
        const idx = (p - 1) * this.maxResults - 1;
        if (idx >= 0 && idx < postDates.length) {
          const expected = encodeURIComponent(postDates[idx]);
          if (expected === encodedCurrentUpdated || postDates[idx] === decodeURIComponent(encodedCurrentUpdated)) {
            return p;
          }
        }
      }
      // fallback: page 1
      return 1;
    }

    _computePagesToShow(totalPages, currentPage) {
      const visible = Math.max(1, Number(this.config.totalVisibleNumbers) || 5);
      if (totalPages <= visible) return ranges(1, totalPages);

      // We'll reserve one slot for the last page => we'll show (visible - 1) numbers + last
      const k = visible - 1; // numbers besides last
      let start = currentPage - Math.floor(k / 2);
      if (start < 1) start = 1;
      let end = start + k - 1;
      if (end > totalPages - 1) {
        end = totalPages - 1;
        start = end - k + 1;
        if (start < 1) start = 1;
      }
      const middle = ranges(start, end);
      // ensure currentPage is inside middle (if currentPage == totalPages then middle may be before)
      if (!middle.includes(currentPage) && currentPage < totalPages) {
        // shift the window to include currentPage
        start = Math.max(1, currentPage - Math.floor(k / 2));
        end = start + k - 1;
        if (end > totalPages - 1) {
          end = totalPages - 1;
          start = Math.max(1, end - k + 1);
        }
      }
      const finalStart = Math.max(1, start);
      const finalEnd = Math.min(totalPages - 1, end);
      const result = ranges(finalStart, finalEnd);
      // append last page
      if (!result.includes(totalPages)) result.push(totalPages);
      return result;
    }

    _render(pages, postDates) {
      if (!this.numbersNode) return;
      // clear
      this.numbersNode.innerHTML = "";

      // make sure centered
      this.numbersNode.style.textAlign = "center";

      // create fragment
      const frag = document.createDocumentFragment();

      // create anchor elements for each page number in `pages` array
      pages.forEach((p) => {
        const a = document.createElement("a");
        a.className = this.config.numberClass;
        a.textContent = String(p);
        // active class
        const cur = this._computeCurrentPage(postDates, Math.ceil((postDates.length || 1) / (this.maxResults || 10)));
        if (p === cur) a.classList.add(this.config.activeClass);

        // build href
        if (p === 1) {
          // first page -> home or label root
          if (this.label) {
            a.href = `${this.homeUrl}/search/label/${this.label}?max-results=${this.maxResults}`;
          } else if (this.query) {
            a.href = `${this.homeUrl}/search?q=${encodeURIComponent(this.query)}&max-results=${this.maxResults}`;
          } else {
            a.href = this.homeUrl + "/";
          }
        } else {
          const idx = (p - 1) * this.maxResults - 1;
          const updated = (idx >= 0 && idx < postDates.length) ? postDates[idx] : null;
          const startIndex = (p - 1) * this.maxResults;
          a.href = buildPageLink({
            homeUrl: this.homeUrl,
            label: this.label,
            query: this.query,
            updated: updated,
            maxResults: this.maxResults,
            startIndex: startIndex
          });
        }
        frag.appendChild(a);
      });

      // append to container
      this.numbersNode.appendChild(frag);
    }
  }

  /* ---------- Auto init with retries ---------- */
  function autoInit(maxAttempts = 14, delay = 400) {
    let tries = 0;
    const tryNow = () => {
      tries++;
      const pager = qs(DEFAULTS.pagerSelector);
      const numbers = qs(DEFAULTS.numberSelector);
      // if pager exists (Blogger rendered) proceed
      if (pager) {
        const inst = new BloggerPager();
        inst.init().catch(err => console.warn("BloggerPager init error:", err));
        return;
      }
      if (tries < maxAttempts) {
        setTimeout(tryNow, delay);
      } else {
        // give up silently
        // console.warn("BloggerPager: pager not found after retries");
      }
    };
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", tryNow);
    } else {
      tryNow();
    }
  }

  // Start
  try { autoInit(); } catch (e) { console.error("BloggerPager bootstrap error", e); }

})();
