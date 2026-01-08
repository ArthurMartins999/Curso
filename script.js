/**
 * ========= CONFIGURAÇÃO =========
 * 1) Defina sua senha aqui:
 */
const ACCESS_PASSWORD = "Vip2026";

/**
 * 2) Defina seu curso + módulos/aulas aqui.
 * Para YouTube, use o ID do vídeo (o que vem depois de v=).
 * Ex: https://www.youtube.com/watch?v=dQw4w9WgXcQ  -> id: "dQw4w9WgXcQ"
 */
const COURSE = {
  name: "Seu Curso",
  subtitle: "Bem-vindo(a)! Bons estudos.",
  modules: [
    {
      title: "Módulo 1 — Começando",
      lessons: [
        { title: "Aula 01 — Boas-vindas", provider: "youtube", id: "f7noTXvepQ4" },
        { title: "Aula 02 — Configuração", provider: "youtube", id: "dQw4w9WgXcQ" },
      ]
    },
    {
      title: "Módulo 2 — Parte prática",
      lessons: [
        { title: "Aula 01 — Primeira prática", provider: "youtube", id: "dQw4w9WgXcQ" },
      ]
    }
  ]
};

/**
 * ========= LÓGICA =========
 */
const LS = {
  authed: "curso_authed",
  progress: "curso_progress_v1",
  lastLesson: "curso_last_lesson_v1"
};

const $ = (id) => document.getElementById(id);

const loginView = $("loginView");
const appView = $("appView");
const pw = $("pw");
const loginBtn = $("loginBtn");
const loginError = $("loginError");
const loginOk = $("loginOk");
const logoutBtn = $("logoutBtn");
const resetProgressBtn = $("resetProgressBtn");

const modulesEl = $("modules");
const player = $("player");
const lessonTitle = $("lessonTitle");
const lessonMeta = $("lessonMeta");
const moduleChip = $("moduleChip");
const lessonChip = $("lessonChip");
const progressChip = $("progressChip");
const bar = $("bar");
const doneBtn = $("doneBtn");
const copyLinkBtn = $("copyLinkBtn");
const copyMsg = $("copyMsg");
const countInfo = $("countInfo");

$("courseName").textContent = COURSE.name;
$("courseSub").textContent = COURSE.subtitle;

function getAllLessons(){
  const all = [];
  COURSE.modules.forEach((m, mi) => {
    m.lessons.forEach((l, li) => all.push({ ...l, moduleIndex: mi, lessonIndex: li }));
  });
  return all;
}

function keyFor(mi, li){ return `m${mi}_l${li}`; }

function loadProgress(){
  try { return JSON.parse(localStorage.getItem(LS.progress) || "{}"); }
  catch { return {}; }
}
function saveProgress(obj){
  localStorage.setItem(LS.progress, JSON.stringify(obj));
}

function isAuthed(){
  return localStorage.getItem(LS.authed) === "1";
}
function setAuthed(v){
  localStorage.setItem(LS.authed, v ? "1" : "0");
}

function ytEmbed(id){
  return `https://www.youtube.com/embed/${encodeURIComponent(id)}?rel=0&modestbranding=1`;
}

function setCurrentLesson(mi, li){
  const mod = COURSE.modules[mi];
  const lesson = mod.lessons[li];
  const src = (lesson.provider === "youtube") ? ytEmbed(lesson.id) : lesson.url;

  player.src = src;

  lessonTitle.textContent = lesson.title;
  lessonMeta.textContent = `${mod.title}`;
  moduleChip.textContent = `Módulo: ${mi+1}`;
  lessonChip.textContent = `Aula: ${li+1}`;

  localStorage.setItem(LS.lastLesson, JSON.stringify({ mi, li }));
  highlightSelected(mi, li);
  updateProgressUI();
}

function highlightSelected(mi, li){
  document.querySelectorAll("[data-lesson]").forEach(el => el.style.outline = "none");
  const sel = document.querySelector(`[data-lesson="${keyFor(mi, li)}"]`);
  if(sel) sel.style.outline = "2px solid rgba(255,122,24,.55)";
}

function renderModules(){
  modulesEl.innerHTML = "";
  const all = getAllLessons();
  countInfo.textContent = `${all.length} aulas`;

  const progress = loadProgress();

  COURSE.modules.forEach((m, mi) => {
    const details = document.createElement("details");
    details.className = "module";
    details.open = mi === 0;

    const doneCount = m.lessons.filter((_, li) => progress[keyFor(mi, li)]).length;

    const summary = document.createElement("summary");
    summary.innerHTML = `
      <div class="module-title">
        <b>${m.title}</b>
        <span>${m.lessons.length} aulas • ${doneCount} concluídas</span>
      </div>
      <span class="pill">${doneCount}/${m.lessons.length}</span>
    `;

    details.appendChild(summary);

    m.lessons.forEach((l, li) => {
      const row = document.createElement("div");
      row.className = "lesson";
      row.dataset.lesson = keyFor(mi, li);

      const done = !!progress[keyFor(mi, li)];

      row.innerHTML = `
        <div class="lesson-left">
          <div class="t">${l.title}</div>
          <div class="m">Clique para assistir</div>
        </div>
        <div class="lesson-right">
          <div class="dot ${done ? "done" : ""}"></div>
        </div>
      `;

      row.addEventListener("click", () => setCurrentLesson(mi, li));
      details.appendChild(row);
    });

    modulesEl.appendChild(details);
  });
}

function updateProgressUI(){
  const all = getAllLessons();
  const progress = loadProgress();
  const done = all.filter(l => progress[keyFor(l.moduleIndex, l.lessonIndex)]).length;
  const pct = all.length ? Math.round((done / all.length) * 100) : 0;
  progressChip.textContent = `Progresso: ${pct}%`;
  bar.style.width = pct + "%";

  // Re-render dots and module counts
  document.querySelectorAll("[data-lesson]").forEach(el => {
    const k = el.dataset.lesson;
    const dot = el.querySelector(".dot");
    if(dot) dot.classList.toggle("done", !!progress[k]);
  });

  // Update module badges text (quick approach: rerender headers)
  document.querySelectorAll(".module").forEach((modEl, mi) => {
    const m = COURSE.modules[mi];
    const doneCount = m.lessons.filter((_, li) => progress[keyFor(mi, li)]).length;
    const span = modEl.querySelector(".pill");
    const sub = modEl.querySelector(".module-title span");
    if(span) span.textContent = `${doneCount}/${m.lessons.length}`;
    if(sub) sub.textContent = `${m.lessons.length} aulas • ${doneCount} concluídas`;
  });
}

function showApp(){
  loginView.classList.add("hidden");
  appView.classList.remove("hidden");
  renderModules();

  // abre aula do link (?aula=m0_l0) se existir
  const params = new URLSearchParams(location.search);
  const aula = params.get("aula");
  if(aula){
    const match = aula.match(/^m(\d+)_l(\d+)$/);
    if(match){
      const mi = Number(match[1]), li = Number(match[2]);
      if(COURSE.modules[mi] && COURSE.modules[mi].lessons[li]){
        setCurrentLesson(mi, li);
        return;
      }
    }
  }

  // senão, última aula vista
  const last = localStorage.getItem(LS.lastLesson);
  if(last){
    try{
      const { mi, li } = JSON.parse(last);
      if(COURSE.modules[mi] && COURSE.modules[mi].lessons[li]){
        setCurrentLesson(mi, li);
        return;
      }
    }catch{}
  }

  // padrão
  setCurrentLesson(0, 0);
}

function showLogin(){
  loginView.classList.remove("hidden");
  appView.classList.add("hidden");
  pw.value = "";
}

loginBtn.addEventListener("click", () => {
  loginError.style.display = "none";
  loginOk.style.display = "none";

  if(pw.value === ACCESS_PASSWORD){
    setAuthed(true);
    loginOk.style.display = "block";
    showApp();
  }else{
    loginError.style.display = "block";
  }
});

pw.addEventListener("keydown", (e) => {
  if(e.key === "Enter") loginBtn.click();
});

pw.addEventListener("keyup", (e) => {
  $("capsHint").style.display = e.getModifierState && e.getModifierState("CapsLock") ? "inline" : "none";
});

logoutBtn.addEventListener("click", () => {
  setAuthed(false);
  showLogin();
});

resetProgressBtn.addEventListener("click", () => {
  localStorage.removeItem(LS.progress);
  updateProgressUI();
  renderModules();
});

doneBtn.addEventListener("click", () => {
  const last = localStorage.getItem(LS.lastLesson);
  if(!last) return;
  const { mi, li } = JSON.parse(last);
  const k = keyFor(mi, li);
  const progress = loadProgress();
  progress[k] = true;
  saveProgress(progress);
  updateProgressUI();
});

copyLinkBtn.addEventListener("click", async () => {
  const last = localStorage.getItem(LS.lastLesson);
  if(!last) return;

  const { mi, li } = JSON.parse(last);
  const url = new URL(location.href);
  url.searchParams.set("aula", keyFor(mi, li));

  try{
    await navigator.clipboard.writeText(url.toString());
    copyMsg.textContent = "Link copiado ✅";
  }catch{
    copyMsg.textContent = "Não consegui copiar (bloqueado pelo navegador).";
  }
  setTimeout(()=> copyMsg.textContent="", 2000);
});

(function init(){
  if(isAuthed()){
    showApp();
  }else{
    showLogin();
  }
})();