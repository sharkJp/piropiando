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
  "marica":"MK"
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
  `;
  arriba ? feed.prepend(card) : feed.appendChild(card);
}

/* ===== INIT ===== */
async function inicializar() {
  const { data } = await supabaseClient
    .from("guinos")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(10);

  data?.forEach(p => mostrarPiropo(p, false));
}
inicializar();

/* ===== SEND ===== */
const sendBtn = document.getElementById("send-btn");
const feedback = document.getElementById("feedback");

sendBtn.onclick = async () => {
  let content = document.getElementById("content").value.trim();
  const author = document.getElementById("author").value || "Anónimo";

  if (!content) {
    alert("Escribe algo 😌");
    return;
  }

  // Animación del botón
  sendBtn.classList.add("sending");

  const original = content;
  content = suavizarPiropo(content);

  const { error } = await supabaseClient
    .from("guinos")
    .insert([{ content, author }]);

  // Quitar animación
  setTimeout(() => sendBtn.classList.remove("sending"), 600);

  if (!error) {
    document.getElementById("content").value = "";

   if (original !== content) {
  feedback.classList.add("show");
  setTimeout(() => feedback.classList.remove("show"), 2500);
}
  } else {
    alert("Ups… algo falló 💔");
    console.error(error);
  }
};


/* ===== REALTIME ===== */
supabaseClient
  .channel("public:guinos")
  .on(
    "postgres_changes",
    { event: "INSERT", schema: "public", table: "guinos" },
    payload => mostrarPiropo(payload.new, true)
  )
  .subscribe();

  if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .register("/sw.js")
    .then(() => console.log("💖 Guiño está offline-ready"))
    .catch(err => console.error("SW error", err));
}
