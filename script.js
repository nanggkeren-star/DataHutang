/* =======================
      THEME SYSTEM
=======================*/
const themeSelector = document.getElementById("themeSelector");

function applyTheme(name) {
  document.body.className = "";
  document.body.classList.add(`theme-${name}`);

  const logo = document.getElementById("logo");
  const accent = getComputedStyle(document.body).getPropertyValue("--accent");
  const logoText = getComputedStyle(document.body).getPropertyValue("--logo-text");

  logo.style.background = accent.trim();
  logo.style.color = logoText.trim();
}

themeSelector.addEventListener("change", e => {
  const v = e.target.value;
  localStorage.setItem("hutang_theme", v);
  applyTheme(v);
});

(function initTheme() {
  const saved = localStorage.getItem("hutang_theme") || "lautan";
  themeSelector.value = saved;
  applyTheme(saved);
})();


/* =======================
      GOOGLE SHEET FETCH
=======================*/
const SHEET_ID = "1MQPeUwTCtkZ1GDUtO920c2XivHAkZ2BMFUJroUNlMCM";
const GVIZ_URL =
  `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&tq=select%20*&_=${Date.now()}`;

const tbody = document.getElementById("tbody");
const totalHutangEl = document.getElementById("totalHutang");
const totalPiutangEl = document.getElementById("totalPiutang");
const countBelumEl = document.getElementById("countBelum");
const countLunasEl = document.getElementById("countLunas");


/* =======================
      FORMAT HELPERS
=======================*/

// Format Rupiah tanpa desimal
function formatRupiah(n) {
  return "Rp " + Number(n).toLocaleString("id-ID", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });
}

// Fix tanggal Google Sheets → "12 Nov 2025"
function fixDate(d) {
  if (!d) return "-";

  if (typeof d === "string" && d.startsWith("Date(")) {
    const nums = d.match(/\d+/g).map(Number);
    const dateObj = new Date(nums[0], nums[1], nums[2]);

    return dateObj.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
  }

  return d;
}


/* =======================
      LOAD DATA
=======================*/
fetch(GVIZ_URL, { cache: "no-store" })
  .then(r => r.text())
  .then(txt => {
    const json = JSON.parse(txt.substring(47, txt.length - 2));
    const rows = json.table.rows;

    tbody.innerHTML = "";

    let totalHutang = 0;
    let totalPiutang = 0;
    let countBelum = 0;
    let countLunas = 0;

    rows.forEach(r => {
      const [id, nama, type, nominal, tanggal, ket, sisa, status] =
        r.c.map(c => c ? c.v : "");

      // convert nominal & sisa
      const nominalNum = Number(String(nominal).replace(/\D/g, ""));
      const sisaNum = Number(String(sisa).replace(/\D/g, ""));

      // hitungan summary
      if (type === "Hutang") totalHutang += sisaNum;
      if (type === "Piutang") totalPiutang += sisaNum;

      if (status === "Lunas") countLunas++;
      else countBelum++;

      // row render
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${id}</td>
        <td>${nama}</td>
        <td>${type}</td>
        <td style="text-align:right">${formatRupiah(nominalNum)}</td>
        <td>${fixDate(tanggal)}</td>
        <td>${ket}</td>
        <td style="text-align:right">${formatRupiah(sisaNum)}</td>
        <td class="${status === "Lunas" ? "text-green" : "text-red"}">${status}</td>
      `;
      tbody.appendChild(tr);
    });

    // update summary UI
    totalHutangEl.textContent = formatRupiah(totalHutang);
    totalPiutangEl.textContent = formatRupiah(totalPiutang);
    countBelumEl.textContent = countBelum;
    countLunasEl.textContent = countLunas;
  })
  
