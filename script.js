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
/* Ganti CSV_URL kalau perlu; ini URL publish CSV yang kamu pakai */
const CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQjeiMuhEDZSi97kWRld8LvBgFeq4MiHHKmm1areOT_8uVHlkK5G2L3wFDkcGTm7YG5_aNoY2PTh2jI/pub?gid=0&single=true&output=csv";

const tbody = document.getElementById("tbody");
const totalHutangEl = document.getElementById("totalHutang");
const totalPiutangEl = document.getElementById("totalPiutang");
const countBelumEl = document.getElementById("countBelum");
const countLunasEl = document.getElementById("countLunas");

/* parse CSV naive (ok for your sheet). returns array of rows (arrays) */
function parseCSV(text){
  return text.trim().split("\n").map(r => r.split(","));
}

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

/* =======================
   LOAD + RENDER (ANTI CACHE FIX)
=======================*/
function loadAndRender(){
  renderEmpty('Memuat data dari Google Sheet...');

  fetch(CSV_URL + "&time=" + Date.now())
    .then(r=>r.text())
    .then(csv=>{
      const rows = parseCSV(csv);
      // assume header first row
      rows.shift();

      if(!rows.length){
        renderEmpty('Tidak ada data.');
        return;
      }

      tbody.innerHTML = "";
      let totalHutang=0, totalPiutang=0, countBelum=0, countLunas=0;

      rows.forEach(raw => {
        // destructure defensively (some rows may have fewer columns)
        const [id='', nama='', tipe='', nominalRaw='', tanggal='', catatan='', sisaRaw='', statusRaw=''] = raw.concat(Array(8 - raw.length).fill(''));

        // normalize numbers
        const nominal = toNumberFromSheet(nominalRaw);
        const sisa = toNumberFromSheet(sisaRaw);

        // STATUS detection: check 'belum' first, then 'lunas'
        const sLow = (String(statusRaw || "")).toLowerCase();
        let status = (statusRaw || "").trim();
        let isLunas = false;
        let isBelum = false;
        if (sLow.indexOf("belum") !== -1) {
          status = "Belum Lunas";
          isBelum = true;
        } else if (sLow.indexOf("lunas") !== -1) {
          status = "Lunas";
          isLunas = true;
        } else {
          // unknown -> treat as Belum Lunas (safe)
          status = status || "Belum Lunas";
          isBelum = !isLunas;
        }

        // sums
        if ((String(tipe || "").toLowerCase()).includes("hutang")) totalHutang += nominal;
        if ((String(tipe || "").toLowerCase()).includes("piutang")) totalPiutang += nominal;
        if (isLunas) countLunas++; else countBelum++;

        const pillClass = isLunas ? "lunas" : "belum";

        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${escapeHtml(nama)}</td>
          <td style="min-width:100px">${escapeHtml(tipe)}</td>
          <td style="text-align:right">${fmtCur(nominal)}</td>
          <td>${fmtDate(tanggal)}</td>
          <td>${escapeHtml(catatan)}</td>
          <td style="text-align:right">${fmtCur(sisa)}</td>
          <td><span class="pill ${pillClass}">${escapeHtml(status)}</span></td>
        `;
        tbody.appendChild(tr);
      });

      // update summary
      totalHutangEl.textContent = fmtCur(totalHutang);
      totalPiutangEl.textContent = fmtCur(totalPiutang);
      countBelumEl.textContent = countBelum;
      countLunasEl.textContent = countLunas;
    })
    .catch(err=>{
      console.error(err);
      renderEmpty('Gagal mengambil data — pastikan Sheet sudah dipublish.');
    });
}

/* AUTO RELOAD 60 DETIK */
setInterval(() => {
  console.log("Auto reload jalan...");
  loadAndRender();
}, 60000);

/* FIRST LOAD */
loadAndRender();

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
