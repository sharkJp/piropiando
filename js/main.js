function online() {
  return navigator.onLine;
}




/* ===== FILTRO ===== */
const reemplazos = {
  "puta": "traviesa",
  "puto": "atrevido",
  "culo": "encanto",
  "tetas": "curvas",
  "verga": "locura",
  "pendeja": "audaz",
  "mierda": "💩",
  "coño": "caramba",
  "caliente": "enamorado 💖",
  "sexo": "magia",
  "coger": "encontrarnos",
  "follar": "perdernos",
  "mamar": "provocar",
  "chupar": "saborear",
  "marica": "MK"
};

function suavizarPiropo(texto) {
  let resultado = texto;
  Object.entries(reemplazos).forEach(([palabra, reemplazo]) => {
    const regex = new RegExp(`\\b${palabra}\\b`, "gi");
    resultado = resultado.replace(regex, reemplazo);
  });
  return resultado;
}

/* ===== SUPABASE ===== */
const SUPABASE_URL = "https://solflkibujbnggilebbz.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_80IpJB38Wk7FV7diSVh9kw_qyv0_86G";

const supabaseClient = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

const feed = document.getElementById("piropos-feed");

/* ===== UI ===== */
function mostrarPiropo(data, arriba = true) {
  const card = document.createElement("div");
  card.className = "piropo-card";

  card.innerHTML = `
    <p class="piropo-text">"${data.content}"</p>
    <p class="piropo-author">— ${data.author || "Anónimo"}</p>

    <div class="reactions" data-id="${data.id}">
      <button class="react-btn" data-emoji="❤️">❤️ <span>0</span></button>
      <button class="react-btn" data-emoji="😏">😏 <span>0</span></button>
      <button class="react-btn" data-emoji="🔥">🔥 <span>0</span></button>
    </div>
  `;

  arriba ? feed.prepend(card) : feed.appendChild(card);
  cargarReacciones(data.id, card.querySelector(".reactions"));
}

/* ===== INIT ===== */
async function inicializar() {
  const { data } = await supabaseClient
    .from("guinos")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(20);

  data?.forEach(p => mostrarPiropo(p, false));
}

inicializar();

/* ===== SEND ===== */
const form = document.getElementById("form-guino");
const sendBtn = document.getElementById("send-btn");
const feedback = document.getElementById("feedback");

if (form) {
  form.addEventListener("submit", async e => {
    e.preventDefault();

    let content = document.getElementById("content").value.trim();
    const author = document.getElementById("author").value || "Anónimo";

    if (!content) return alert("Escribe algo 😌");

    sendBtn.classList.add("sending");
    const formCard = document.querySelector(".form-card");
    formCard.classList.add("sending");
    lanzarCorazonDesdeForm();

    const original = content;
    content = suavizarPiropo(content);

    const { error } = await supabaseClient
      .from("guinos")
      .insert([{ content, author }]);

    sendBtn.classList.remove("sending");
    formCard.classList.remove("sending");


    if (!error) {
      document.getElementById("content").value = "";
      vibrar(40); // 💖 vibración romántica
      if (original !== content) {
        feedback.classList.add("show");
        setTimeout(() => feedback.classList.remove("show"), 2500);
      }
    } else {
      alert("Ups… algo falló 💔");
      console.error(error);
    }
  });
}

/* ===== REACCIONES ===== */
feed.addEventListener("click", async e => {
  const btn = e.target.closest(".react-btn");
  if (!btn) return;

  const emoji = btn.dataset.emoji;
  const reactionsBox = btn.closest(".reactions");
  const guinoId = reactionsBox.dataset.id;

  const key = `reaction_${guinoId}_${emoji}`;
  if (localStorage.getItem(key)) {
    btn.classList.add("shake");
    vibrar(60);
    setTimeout(() => btn.classList.remove("shake"), 400);
    return;
  }


  // const { error } = await supabaseClient
  //   .from("reactions")
  //   .insert([{ guino_id: guinoId, emoji }]);

  let error = null;

  if (online()) {
    const res = await supabaseClient
      .from("reactions")
      .insert([{ guino_id: guinoId, emoji }]);

    error = res.error;
  } else {
    guardarReaccionOffline(guinoId, emoji);
  }


  if (!error) {
    localStorage.setItem(key, "true");

    const span = btn.querySelector("span");
    span.textContent = Number(span.textContent) + 1;

    span.classList.remove("bump");
    void span.offsetWidth; // 👈 reset animación
    span.classList.add("bump");
    vibrar(20);
    floatEmoji(emoji, btn);
  }
});

/* ===== CARGAR REACCIONES ===== */
async function cargarReacciones(guinoId, container) {
  const { data } = await supabaseClient
    .from("reactions")
    .select("emoji")
    .eq("guino_id", guinoId);

  data?.forEach(r => {
    const span = container.querySelector(
      `button[data-emoji="${r.emoji}"] span`
    );
    if (span) span.textContent++;
  });
}

/* ===== REALTIME ===== */
supabaseClient
  .channel("public:guinos")
  .on(
    "postgres_changes",
    { event: "INSERT", schema: "public", table: "guinos" },
    payload => mostrarPiropo(payload.new, true)
  )
  .subscribe();

/* ===== MODO ULTRA ===== */
const toggle = document.getElementById("mode-toggle");
if (toggle) {
  if (localStorage.getItem("romanticMode") === "ultra") {
    document.body.classList.add("ultra");
    toggle.textContent = "💖";
  }

  toggle.addEventListener("click", () => {
    document.body.classList.toggle("ultra");
    const ultra = document.body.classList.contains("ultra");
    toggle.textContent = ultra ? "💖" : "🌙";
    localStorage.setItem("romanticMode", ultra ? "ultra" : "normal");
  });
}

/* ===== EMOJI FLOAT ===== */
function floatEmoji(emoji, button) {
  const float = document.createElement("span");
  float.className = "float-emoji";
  float.textContent = emoji;

  const rect = button.getBoundingClientRect();
  float.style.left = rect.left + rect.width / 2 + "px";
  float.style.top = rect.top + "px";

  document.body.appendChild(float);
  setTimeout(() => float.remove(), 1200);
}
function vibrar(ms = 30) {
  if ("vibrate" in navigator) {
    navigator.vibrate(ms);
  }
}
function guardarReaccionOffline(guinoId, emoji) {
  const pendientes =
    JSON.parse(localStorage.getItem("offlineReactions")) || [];

  pendientes.push({
    guinoId,
    emoji,
    date: Date.now()
  });

  localStorage.setItem(
    "offlineReactions",
    JSON.stringify(pendientes)
  );
}
window.addEventListener("online", async () => {
  const pendientes =
    JSON.parse(localStorage.getItem("offlineReactions")) || [];

  if (!pendientes.length) return;

  for (const r of pendientes) {
    await supabaseClient
      .from("reactions")
      .insert([
        { guino_id: r.guinoId, emoji: r.emoji }
      ]);
  }

  localStorage.removeItem("offlineReactions");
  console.log("💌 Reacciones offline sincronizadas");
});
function lanzarCorazonDesdeForm() {
  const heart = document.createElement("span");
  heart.className = "float-heart";
  heart.textContent = "💖";

  const form = document.querySelector(".form-card");
  const rect = form.getBoundingClientRect();

  heart.style.left = rect.left + rect.width / 2 + "px";
  heart.style.top = rect.top + "px";

  document.body.appendChild(heart);
  setTimeout(() => heart.remove(), 1400);
}
