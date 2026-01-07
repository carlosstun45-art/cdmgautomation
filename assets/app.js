
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
const translations={
 en:{nav_home:"Home",nav_services:"Services",nav_about:"About",nav_contact:"Contact",nav_privacy:"Privacy",
     nav_platform:"Platform",nav_build:"Build",nav_library:"Library",nav_premium:"Premium",nav_insights:"Insights",nav_hub:"Hub",
     cta_book:"Book a free automation call",
     hero_kicker:"ALL SYSTEMS OPERATIONAL • READY 24/7",hero_title_1:"Automate your business.",hero_title_2:"Scale without effort.",
     hero_sub:"We design automation systems that save time, reduce costs, and keep your operations running 24/7.",
     hero_cta_primary:"Book a free automation call",hero_cta_secondary:"See how it works",
     sec_what_title:"What we automate",sec_what_lead:"We don’t sell tools. We build systems that work for you.",
     chat_title:"Support Console",chat_hint:"Ask what’s included, onboarding, or what automation fits your business."},
 nl:{nav_home:"Home",nav_services:"Services",nav_about:"Over",nav_contact:"Contact",nav_privacy:"Privacy",
     nav_platform:"Platform",nav_build:"Build",nav_library:"Library",nav_premium:"Premium",nav_insights:"Insights",nav_hub:"Hub",
     cta_book:"Boek een gratis automation call",
     hero_kicker:"ALLE SYSTEMEN OPERATIONEEL • 24/7 KLAAR",hero_title_1:"Automatiseer je bedrijf.",hero_title_2:"Schaal zonder moeite.",
     hero_sub:"Wij bouwen automation systemen die tijd besparen, kosten verlagen en jouw operatie 24/7 laten draaien.",
     hero_cta_primary:"Boek een gratis automation call",hero_cta_secondary:"Zie hoe het werkt",
     sec_what_title:"Wat we automatiseren",sec_what_lead:"We verkopen geen tools. We bouwen systemen die voor jou werken.",
     chat_title:"Support Console",chat_hint:"Vraag wat inbegrepen is, onboarding, of welke automation past."},
 es:{nav_home:"Inicio",nav_services:"Servicios",nav_about:"Sobre",nav_contact:"Contacto",nav_privacy:"Privacidad",
     nav_platform:"Plataforma",nav_build:"Build",nav_library:"Librería",nav_premium:"Premium",nav_insights:"Insights",nav_hub:"Hub",
     cta_book:"Reserva una llamada gratis",
     hero_kicker:"SISTEMAS OPERATIVOS • LISTO 24/7",hero_title_1:"Automatiza tu negocio.",hero_title_2:"Escala sin esfuerzo.",
     hero_sub:"Diseñamos sistemas de automatización que ahorran tiempo, reducen costes y mantienen tu operación funcionando 24/7.",
     hero_cta_primary:"Reserva una llamada gratis",hero_cta_secondary:"Ver cómo funciona",
     sec_what_title:"Qué automatizamos",sec_what_lead:"No vendemos herramientas. Construimos sistemas que trabajan por ti.",
     chat_title:"Consola de Soporte",chat_hint:"Pregunta qué incluye, onboarding o qué automation conviene."},
 fr:{nav_home:"Accueil",nav_services:"Services",nav_about:"À propos",nav_contact:"Contact",nav_privacy:"Confidentialité",
     nav_platform:"Plateforme",nav_build:"Build",nav_library:"Bibliothèque",nav_premium:"Premium",nav_insights:"Insights",nav_hub:"Hub",
     cta_book:"Réserver un appel gratuit",
     hero_kicker:"TOUS SYSTÈMES OPÉRATIONNELS • PRÊT 24/7",hero_title_1:"Automatisez votre business.",hero_title_2:"Évoluez sans effort.",
     hero_sub:"Nous concevons des systèmes d’automatisation qui font gagner du temps, réduisent les coûts et gardent vos opérations actives 24/7.",
     hero_cta_primary:"Réserver un appel gratuit",hero_cta_secondary:"Voir comment ça marche",
     sec_what_title:"Ce que nous automatisons",sec_what_lead:"Nous ne vendons pas d’outils. Nous construisons des systèmes qui travaillent pour vous.",
     chat_title:"Console Support",chat_hint:"Demandez ce qui est inclus, l’onboarding, ou l’automatisation idéale."},
};
function setText(k,v){$$(`[data-i18n='${k}']`).forEach(el=>el.textContent=v);}
function setLang(lang){
  const t=translations[lang]||translations.en;
  localStorage.setItem("lang",lang);
  $$("#langSelect").forEach(sel=>sel.value=lang);
  ["nav_home","nav_services","nav_about","nav_contact","nav_privacy","nav_platform","nav_build","nav_library","nav_premium",
   "cta_book","hero_kicker","hero_title_1","hero_title_2","hero_sub","hero_cta_primary","hero_cta_secondary","sec_what_title","sec_what_lead",
   "chat_title","chat_hint"].forEach(key=>{ if(t[key]!==undefined) setText(key,t[key]);});
}
function initLang(){
  const saved=localStorage.getItem("lang");
  const browser=(navigator.language||"en").slice(0,2).toLowerCase();
  const lang=saved||(translations[browser]?browser:"en");
  setLang(lang);
  $$("#langSelect").forEach(sel=>sel.addEventListener("change",e=>setLang(e.target.value)));
}
function initStatus(){
  const el=$("#liveStatus"); if(!el) return;
  const states=["LIVE STATUS • SYNCING…","LIVE STATUS • ROUTING…","LIVE STATUS • STANDBY…","LIVE STATUS • GUARDIAN CHECK…"];
  let i=0; setInterval(()=>{i=(i+1)%states.length; el.textContent=states[i];},1800);
}
function animateNumber(el,to,d=900){
  const from=Number(el.getAttribute("data-from")||"0"), start=performance.now();
  function tick(now){
    const p=Math.min(1,(now-start)/d);
    const val=Math.round(from+(to-from)*(1-Math.pow(1-p,3)));
    el.textContent=(el.getAttribute("data-prefix")||"")+val.toLocaleString();
    if(p<1) requestAnimationFrame(tick);
  } requestAnimationFrame(tick);
}
function initCounters(){ $$(".count").forEach(el=>animateNumber(el,Number(el.getAttribute("data-to")||"0"),1200)); }
const faq=[
  {q:/prijs|pricing|kosten|cost/i,a:"We werken met 3 opties: project (fixed), retainer (maandelijks) of een ‘system pack’. Zeg je tools + doel, dan schat ik in."},
  {q:/onboarding|start|beginnen|audit/i,a:"Onboarding: (1) gratis audit, (2) design + KPI’s, (3) build + test, (4) launch + optimalisatie. Meestal 1–3 weken."},
  {q:/whatsapp|email|crm|lead/i,a:"Populaire flows: lead intake → kwalificatie → afspraak → CRM update → factuur/reminders → weekly report."},
  {q:/veilig|privacy|gdpr/i,a:"Security by design: least-privilege, audit logs, toestemming, manual approvals voor gevoelige acties."},
];
function openChat(o=true){const p=$("#chatPanel"); if(p) p.classList.toggle("open",o);}
function appendBubble(text,who="ai"){
  const b=$("#chatBody"); if(!b) return;
  const d=document.createElement("div"); d.className=`bubble ${who}`; d.textContent=text;
  b.appendChild(d); b.scrollTop=b.scrollHeight;
}
async function askAI(message){
  try{
    const res=await fetch("/.netlify/functions/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({message})});
    if(res.ok){const data=await res.json(); if(data?.reply) return data.reply;}
  }catch(e){}
  const hit=faq.find(x=>x.q.test(message)); if(hit) return hit.a;
  return "Vertel me: (1) welke tools je gebruikt, (2) wat je wil automatiseren, (3) hoeveel volume. Dan maak ik een plan.";
}
function initChat(){
  $("#chatFab")?.addEventListener("click",()=>openChat(true));
  $("#chatClose")?.addEventListener("click",()=>openChat(false));
  const form=$("#chatForm"), input=$("#chatText");
  if(form&&input){
    form.addEventListener("submit",async e=>{
      e.preventDefault();
      const msg=input.value.trim(); if(!msg) return;
      input.value=""; appendBubble(msg,"me"); appendBubble("…","ai");
      const placeholder=$("#chatBody").lastElementChild;
      placeholder.textContent=await askAI(msg);
    });
  }
  if(!sessionStorage.getItem("chat_greeted")){
    appendBubble("Hi! Ik ben je automation-assistent. Waar wil je vandaag tijd besparen?","ai");
    sessionStorage.setItem("chat_greeted","1");
  }
}
function initActiveNav(){
  const path=(location.pathname.split("/").pop()||"index.html").toLowerCase();
  $$(".nav-links a.pill").forEach(a=>{
    const href=(a.getAttribute("href")||"").toLowerCase();
    if(href===path || (path==="" && href==="index.html")) a.classList.add("active");
  });
}
function initDrawer(){
  const drawer=$("#drawer"); if(!drawer) return;
  $("#menuOpen")?.addEventListener("click",()=>drawer.classList.add("open"));
  $("#menuClose")?.addEventListener("click",()=>drawer.classList.remove("open"));
  drawer.addEventListener("click",e=>{if(e.target===drawer) drawer.classList.remove("open");});
}
document.addEventListener("DOMContentLoaded",()=>{initLang();initStatus();initCounters();initChat();initActiveNav();initDrawer();});
