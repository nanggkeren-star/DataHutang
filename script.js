/* =======================
      THEME SYSTEM
=======================*/
const themeSelector = document.getElementById("themeSelector");

function applyTheme(name){
  document.body.className = "";
  document.body.classList.add(`theme-${name}`);

  const logo = document.getElementById("logo");
  const accent = getComputedStyle(document.body).getPropertyValue("--accent");
  const logoText = getComputedStyle(document.body).getPropertyValue("--logo-text");
  logo.style.background = accent ? accent.trim() : "";
  logo.style.color = logoText ? logoText.trim() : "";
}

themeSelector.addEventListener("change", e=>{
  const v = e.target.value;
  localStorage.setItem("hutang_theme", v);
  applyTheme(v);
});

(function initTheme(){
  // default ke "midnight" (hitam-putih) sesuai permintaan
  const saved = localStorage.getItem("hutang_theme") || "midnight";
  themeSelector.value = saved;
  applyTheme(saved);
})();

/* =======================
      CSV FETCH
=======================*/
const SHEET_ID = "1MQPeUwTCtkZ1GDUtO920c2XivHAkZ2BMFUJroUNlMCM";
const GVIZ_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&tq=select%20*&_=${Date.now()}`;

const tbody = document.getElementById("tbody");
const totalHutangEl = document.getElementById("totalHutang");
const totalPiutangEl = document.getElementById("totalPiutang");
const countBelumEl = document.getElementById("countBelum");
const countLunasEl = document.getElementById("countLunas");

function formatRupiah(n) {
  return "Rp " + parseInt(n).toLocaleString("id-ID", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });
}

fetch(GVIZ_URL, { cache: "no-store" })
  .then(r => r.text())
  .then(txt => {
    const json = JSON.parse(txt.substring(47, txt.length - 2));
    const rows = json.table.rows;

    let totalHutang = 0;
    let totalPiutang = 0;
    let countBelum = 0;
    let countLunas = 0;

    tbody.innerHTML = ""; // reset

    rows.forEach(r => {
      const [
        id,
        nama,
        type,
        nominal,
        tanggal,
        keterangan,
        sisa,
        status
      ] = r.c.map(c => c ? c.v : "");

      // hitung
      let nominalNum = Math.floor(Number(String(nominal).replace(/\./g, "").replace(",", ".")));
      let sisaNum = Math.floor(Number(String(sisa).replace(/\./g, "").replace(",", ".")));

      if (type === "Hutang") totalHutang += sisaNum;
      if (type === "Piutang") totalPiutang += sisaNum;

      if (status === "Belum Lunas") countBelum++;
      if (status === "Lunas") countLunas++;

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${id}</td>
        <td>${nama}</td>
        <td>${type}</td>
        <td>${formatRupiah(nominalNum)}</td>
        <td>${fmtDate(tanggal)}</td>
        <td>${keterangan}</td>
        <td>${formatRupiah(sisaNum)}</td>
        <td class="${status === "Lunas" ? "text-green" : "text-red"}">${status}</td>
      `;
      tbody.appendChild(tr);
    });

    // update UI
    totalHutangEl.textContent = formatRupiah(totalHutang);
    totalPiutangEl.textContent = formatRupiah(totalPiutang);
    countBelumEl.textContent = countBelum;
    countLunasEl.textContent = countLunas;
  })
  .catch(err => console.error("ERROR:", err));

/* normalize numeric strings: remove thousand separators (.) and spaces, convert comma->dot if needed */
function toNumberFromSheet(val){
  if (val === null || val === undefined) return 0;
  let s = String(val).trim();
  if (s === "") return 0;
  s = s.replace(/\s/g, "");
  if (s.indexOf(".") !== -1) {
    const parts = s.split(".");
    const last = parts[parts.length - 1];
    if (last.length === 3) {
      s = parts.join("");
    }
  }
  if (s.indexOf(",") !== -1 && s.indexOf(".") === -1) {
    s = s.replace(",", ".");
  } else {
    s = s.replace(/,/g, "");
  }
  const n = Number(s);
  return isNaN(n) ? 0 : n;
}

function fmtNum(n){
  const x = Number(n||0);
  return x.toLocaleString("id-ID");
}
function fmtCur(n){ return "Rp " + fmtNum(n); }
function fmtDate(d){
  if(!d) return "-";
  const t = new Date(d);
  if(t.toString()==="Invalid Date") return d;
  return t.toLocaleDateString("id-ID",{day:"2-digit",month:"short",year:"numeric"});
}

function renderEmpty(msg){
  tbody.innerHTML = `<tr><td class="empty" colspan="7">${msg}</td></tr>`;
}

/* small helper to escape HTML */
function escapeHtml(s){ if (s===null||s===undefined) return ''; return String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"}[m])); }
function setTheme(theme) {
  const root = document.documentElement;

  // Mulai animasi fade + blur
  root.classList.add("theme-transition");

  setTimeout(() => {
    // ==========================
    //       GANTI TEMA
    // ==========================
    if (theme === "lunas") {
      root.style.setProperty("--bg", "#0f2e0f");
      root.style.setProperty("--card", "#144d14");
      root.style.setProperty("--text", "#d8ffd8");
      root.style.setProperty("--accent", "#2eff6b");

    } else if (theme === "belum") {
      root.style.setProperty("--bg", "#2e0f0f");
      root.style.setProperty("--card", "#4d1414");
      root.style.setProperty("--text", "#ffd8d8");
      root.style.setProperty("--accent", "#ff3b3b");

    } else if (theme === "default") {
      root.style.setProperty("--bg", "#000");
      root.style.setProperty("--card", "#222");
      root.style.setProperty("--text", "#fff");
      root.style.setProperty("--accent", "#ccc");
    }

    // Akhiri animasi
    root.classList.remove("theme-transition");
  }, 350); // sama kayak CSS transition
}
