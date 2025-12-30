(function(){
  const config = window.CDMG_CONFIG || {};
  const I18N = window.CDMG_I18N || {};
  const supported = ["en","es","fr","nl"];
  const defaultLang = "en";

  function getUrlLang(){
    const params = new URLSearchParams(window.location.search);
    const l = params.get("lang");
    return l && supported.includes(l) ? l : null;
  }

  function detectBrowserLang(){
    const nav = (navigator.language || navigator.userLanguage || "").toLowerCase();
    if(nav.startsWith("es")) return "es";
    if(nav.startsWith("fr")) return "fr";
    if(nav.startsWith("nl")) return "nl";
    return "en";
  }

  function getLang(){
    return getUrlLang() || localStorage.getItem("cdmg_lang") || detectBrowserLang() || defaultLang;
  }

  function setLang(lang, pushUrl){
    if(!supported.includes(lang)) lang = defaultLang;
    localStorage.setItem("cdmg_lang", lang);

    // update select UI
    const sel = document.getElementById("langSelect");
    if(sel) sel.value = lang;

    // subtle UI feedback on language swap
    document.body.classList.add("lang-changing");
    window.clearTimeout(window.__cdmgLangT);
    window.__cdmgLangT = window.setTimeout(()=>document.body.classList.remove("lang-changing"), 220);

    applyTranslations(lang);
    if(pushUrl){
      const url = new URL(window.location.href);
      url.searchParams.set("lang", lang);
      window.history.replaceState({}, "", url.toString());
    }
  }

  function t(lang, key){
    const obj = I18N[lang] || {};
    const fallback = I18N[defaultLang] || {};
    return (obj && obj[key]) || (fallback && fallback[key]) || key;
  }

  function formatDate(lang){
    try{
      return new Intl.DateTimeFormat(lang, {year:"numeric", month:"long", day:"numeric"}).format(new Date());
    }catch(e){
      return new Date().toISOString().slice(0,10);
    }
  }

  function applyTranslations(lang){
    document.documentElement.lang = lang;

    // Text nodes
    document.querySelectorAll("[data-i18n]").forEach(el=>{
      const key = el.getAttribute("data-i18n");
      el.textContent = t(lang, key);
    });

    // Placeholders
    document.querySelectorAll("[data-i18n-placeholder]").forEach(el=>{
      const key = el.getAttribute("data-i18n-placeholder");
      el.setAttribute("placeholder", t(lang, key));
    });

    // Meta content
    document.querySelectorAll("[data-i18n-content]").forEach(el=>{
      const key = el.getAttribute("data-i18n-content");
      el.setAttribute("content", t(lang, key));
    });

    // Special: privacy updated date token
    document.querySelectorAll("[data-i18n-date]").forEach(el=>{
      const key = el.getAttribute("data-i18n-date");
      const raw = t(lang, key);
      el.textContent = raw.replace("{date}", formatDate(lang));
    });

    // Update title if present
    const titleEl = document.querySelector("title[data-i18n]");
    if(titleEl){
      titleEl.textContent = t(lang, titleEl.getAttribute("data-i18n"));
    }

    // Update active nav label (optional)
    const page = document.body.getAttribute("data-page") || "";
    document.querySelectorAll(".nav a, .mobile-nav a").forEach(a=>{
      const target = a.getAttribute("data-nav") || "";
      if(target && page && target === page) a.classList.add("active");
      else a.classList.remove("active");
    });
  }

  function applyConfig(){
    // Fill in email links (supports: email, emailGeneral, emailSupport, emailPersonal)
    const emailKeys = ["email", "emailGeneral", "emailSupport", "emailPersonal"];
    emailKeys.forEach((k)=>{
      const val = (config && config[k]) ? String(config[k]).trim() : "";
      if(!val) return;

      document.querySelectorAll(`[data-config='${k}']`).forEach(el=>{ el.textContent = val; });
      document.querySelectorAll(`a[data-config-href='${k}']`).forEach(a=>{ a.setAttribute("href", "mailto:" + val); });

      // Backward compatible default
      if(k === "email"){
        document.querySelectorAll("[data-config='email']").forEach(el=>{ el.textContent = val; });
        document.querySelectorAll("a[data-config-href='email']").forEach(a=>{ a.setAttribute("href", "mailto:" + val); });
      }
    });

    // Calendly / scheduling
    document.querySelectorAll("a[data-config-href='calendly']").forEach(a=>{
      if(config.calendlyUrl) a.setAttribute("href", config.calendlyUrl);
    });

    // LinkedIn
    document.querySelectorAll("a[data-config-href='linkedin']").forEach(a=>{
      if(config.linkedinUrl) a.setAttribute("href", config.linkedinUrl);
    });

    // WhatsApp (later)
    document.querySelectorAll("a[data-config-href='whatsapp']").forEach(a=>{
      if(config.whatsappUrl) a.setAttribute("href", config.whatsappUrl);
    });

    // Company name & tagline
    document.querySelectorAll("[data-config='companyName']").forEach(el=>{
      el.textContent = config.companyName || el.textContent;
    });
    document.querySelectorAll("[data-config='tagline']").forEach(el=>{
      el.textContent = config.tagline || el.textContent;
    });
  }

  function setupLangSelector(){
    const sel = document.getElementById("langSelect");
    if(!sel) return;
    sel.addEventListener("change", (e)=>{
      setLang(e.target.value, true);
    });
  }

  function setupMobileNav(){
    const btn = document.getElementById("hamburger");
    const mob = document.getElementById("mobileNav");
    if(!btn || !mob) return;
    btn.addEventListener("click", ()=>{
      const open = mob.classList.toggle("open");
      btn.setAttribute("aria-expanded", open ? "true":"false");
    });
    // close when clicking a link
    mob.querySelectorAll("a").forEach(a=>{
      a.addEventListener("click", ()=> mob.classList.remove("open"));
    });
  }

  
  async function postToAutomation(payload){
    const cfg = window.CDMG_CONFIG || {};
    const proxyUrl = "/.netlify/functions/automation";
    const directUrl = (cfg.automationWebhookUrl || "").trim();

    try{
      const enriched = Object.assign({
        meta: {
          source: "website",
          page: window.location.pathname + window.location.search + window.location.hash,
          referrer: document.referrer || "",
          userAgent: navigator.userAgent || "",
          timestamp: new Date().toISOString()
        }
      }, payload);

      // Optional shared secret (used by the Netlify Function)
      if(cfg.automationSecret) enriched.secret = cfg.automationSecret;

      // 1) Prefer Netlify Function proxy (no CORS issues)
      try{
        const r1 = await fetch(proxyUrl, {
          method:"POST",
          headers:{ "Content-Type":"application/json" },
          body: JSON.stringify(enriched)
        });
        if(r1.ok) return { ok:true, via:"proxy" };
      }catch(e){ /* ignore and try direct */ }

      // 2) Fallback: direct webhook (requires CORS enabled on your automation server)
      if(!directUrl) return { ok:false, reason:"no_webhook" };

      const r2 = await fetch(directUrl, {
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify(enriched)
      });
      if(!r2.ok) return { ok:false, reason:"http_"+r2.status };
      return { ok:true, via:"direct" };
    }catch(err){
      return { ok:false, reason:"network" };
    }
  }

function getSelectedPlan(){
    const fromUrl = new URLSearchParams(window.location.search).get("plan");
    const fromStore = (()=>{ try{ return localStorage.getItem("cdmg_selected_plan"); }catch(e){ return null; } })();
    return (fromUrl || fromStore || "").trim();
  }

  function setupContactForm(){
    const form = document.getElementById("contactForm");
    if(!form) return;

    // Prefill plan if present
    const planInput = document.getElementById("fPlan");
    if(planInput){
      const plan = getSelectedPlan();
      if(plan) planInput.value = plan;
    }

    const statusEl = document.getElementById("formStatus");

    function setStatus(type, msg){
      if(!statusEl) return;
      statusEl.className = "form-status " + type;
      statusEl.textContent = msg;
      statusEl.hidden = false;
    }

    form.addEventListener("submit", async (e)=>{
      e.preventDefault();

      const lang = getLang();
      const name = (document.getElementById("fName")||{}).value || "";
      const from = (document.getElementById("fEmail")||{}).value || "";
      const company = (document.getElementById("fCompany")||{}).value || "";
      const msg = (document.getElementById("fMessage")||{}).value || "";
      const plan = (planInput && planInput.value) ? planInput.value : getSelectedPlan();

      // Basic validation
      if(!name || !from || !msg){
        setStatus("error", t(getLang(), "contact_err_required"));
        return;
      }

      // Try automation first
      const result = await postToAutomation({
        event: "lead",
        lang,
        plan: plan || "",
        name, email: from, company, message: msg
      });

      if(result.ok){
        setStatus("success", t(getLang(), "contact_success"));
        form.reset();
        if(planInput && plan) planInput.value = plan; // keep selection visible
        return;
      }

      // Fallback: mailto
      const email = (window.CDMG_CONFIG && window.CDMG_CONFIG.email) ? window.CDMG_CONFIG.email : "";
      if(!email){
        setStatus("error", t(getLang(), "contact_err_setup"));
        return;
      }

      const subject = encodeURIComponent("Website inquiry — " + (company || name || "CDMG Automation"));
      const body = encodeURIComponent(
        "Name: " + name + "
" +
        "Email: " + from + "
" +
        "Company: " + company + "
" +
        "Plan: " + (plan || "") + "

" +
        "Message:
" + msg + "
"
      );
      window.location.href = "mailto:" + email + "?subject=" + subject + "&body=" + body;
    });
  }

  function setupPlanPicker(){
    const root = document.getElementById("automation-suite");
    if(!root) return;

    const cards = Array.from(root.querySelectorAll(".cm-plan-select"));
    const nameEl = document.getElementById("cm-selected-name");
    const ctaEl = document.querySelector(".cm-plan-picker a.cm-btn.primary");
    if(!cards.length || !nameEl) return;

    function labelForPlan(plan){
      if(plan === "starter") return t(getLang(),"suite_plan1_name");
      if(plan === "pro") return t(getLang(),"suite_plan2_name");
      if(plan === "growth") return t(getLang(),"suite_plan3_name");
      return plan;
    }

    async function setSelected(plan){
      cards.forEach(c=>c.classList.toggle("is-selected", c.dataset.plan === plan));
      nameEl.textContent = labelForPlan(plan);

      try{ localStorage.setItem("cdmg_selected_plan", plan); }catch(e){}

      // Update CTA to carry the plan to contact page
      if(ctaEl){
        const url = new URL(ctaEl.getAttribute("href") || "contact.html#contactForm", window.location.origin);
        url.pathname = url.pathname.endsWith("contact.html") ? url.pathname : "contact.html";
        url.searchParams.set("plan", plan);
        url.searchParams.set("lang", getLang());
        url.hash = "contactForm";
        ctaEl.setAttribute("href", url.pathname + url.search + url.hash);
      }

      // Send event (non-blocking)
      postToAutomation({ event:"plan_selected", plan, lang:getLang() });
    }

    // Default from storage/url
    const initial = getSelectedPlan() || "pro";
    setSelected(initial);

    cards.forEach(card=>{
      const plan = card.dataset.plan;
      const handler = ()=> setSelected(plan);
      card.addEventListener("click", handler);
      card.addEventListener("keydown", (e)=>{
        if(e.key === "Enter" || e.key === " "){ e.preventDefault(); handler(); }
      });
    });
  }



  function prefersReducedMotion(){
    return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function setupPageTransitions(){
    // Create overlay used for smooth fade between pages
    const overlay = document.createElement("div");
    overlay.className = "page-fade";
    document.body.appendChild(overlay);

    if(prefersReducedMotion()) return;

    // Fade-in on load
    document.body.classList.add("preload");
    requestAnimationFrame(()=> document.body.classList.remove("preload"));

    // Intercept internal navigation for a clean fade-out
    document.addEventListener("click", (e)=>{
      const a = e.target && e.target.closest ? e.target.closest("a[href]") : null;
      if(!a) return;

      // allow new tab / modified clicks
      if(a.target === "_blank" || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

      const href = a.getAttribute("href") || "";
      if(!href) return;

      // allow in-page anchors
      if(href.startsWith("#")) return;

      // allow special protocols
      if(href.startsWith("mailto:") || href.startsWith("tel:")) return;

      const url = new URL(href, window.location.href);

      // external link: let browser handle
      if(url.origin !== window.location.origin) return;

      // same-page hash-only navigation: let browser handle
      if(url.pathname === window.location.pathname && url.hash) return;

      e.preventDefault();
      document.body.classList.add("is-leaving");
      window.setTimeout(()=>{ window.location.href = url.href; }, 280);
    });
  }

  function setupClickAnimations(){
    if(prefersReducedMotion()) return;

    // Subtle ripple ring at click position
    document.addEventListener("pointerdown", (e)=>{
      // ignore right/middle clicks
      if(e.button !== undefined && e.button !== 0) return;

      const t = e.target;
      const tag = t && t.tagName ? t.tagName.toLowerCase() : "";
      if(tag === "input" || tag === "textarea") return;

      const r = document.createElement("div");
      r.className = "click-ripple";
      r.style.left = e.clientX + "px";
      r.style.top = e.clientY + "px";
      document.body.appendChild(r);
      r.addEventListener("animationend", ()=> r.remove(), { once:true });
    });

    // Pulse ring on interactive elements
    document.addEventListener("click", (e)=>{
      const el = e.target && e.target.closest ? e.target.closest(".btn, .card, .nav a, .mobile-nav a, .lang-select") : null;
      if(!el) return;
      el.classList.remove("is-clicked");
      // force reflow to restart animation
      void el.offsetWidth;
      el.classList.add("is-clicked");
      window.setTimeout(()=> el.classList.remove("is-clicked"), 520);
    }, true);
  }

  function setupScrollReveal(){
    if(prefersReducedMotion()) return;

    const selector =
      ".hero h1, .hero p, .hero-actions, .hero-card, .kicker, " +
      ".section-title, .section-subtitle, .grid .card, .steps .step, " +
      ".callout, .two-col > div, .list .li, footer .footer-col";

    const els = Array.from(document.querySelectorAll(selector)).filter(Boolean);

    els.forEach((el, i)=>{
      el.classList.add("reveal");
      el.style.setProperty("--delay", ((i % 6) * 0.06) + "s");
    });

    if(!("IntersectionObserver" in window)){
      els.forEach(el=> el.classList.add("in-view"));
      return;
    }

    const io = new IntersectionObserver((entries, obs)=>{
      entries.forEach(entry=>{
        if(entry.isIntersecting){
          entry.target.classList.add("in-view");
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });

    els.forEach(el=> io.observe(el));
  }

  // Init
  applyConfig();
  setupPageTransitions();
  setupClickAnimations();
  setupLangSelector();
  setupMobileNav();

  const lang = getLang();
  setLang(lang, true);

  setupScrollReveal();
  setupContactForm();
    setupPlanPicker();
})();
