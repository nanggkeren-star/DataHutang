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
  logo.style.background = accent.trim();
  logo.style.color = logoText.trim();
}

themeSelector.addEventListener("change", e=>{
  const v = e.target.value;
  localStorage.setItem("hutang_theme", v);
  applyTheme(v);
});

(function initTheme(){
  const saved = localStorage.getItem("hutang_theme") || "lautan";
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
  return "Rp " + Number(n).toLocaleString("id-ID", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });
}

fetch(GVIZ_URL)
  .then(r => r.text())
  .then(txt => {
    const json = JSON.parse(txt.substring(47, txt.length - 2));
    const rows = json.table.rows;

    tbody.innerHTML = "";

    let totalHutang=0, totalPiutang=0, countBelum=0, countLunas=0;

    rows.forEach(r => {
      const [id,nama,type,nominal,tanggal,keterangan,sisa,status] =
        r.c.map(c => c ? c.v : "");

      let nominalNum = Number(String(nominal).replace(/\./g, "").replace(",", "."));
      let sisaNum = Number(String(sisa).replace(/\./g, "").replace(",", "."));

      if(type === "Hutang") totalHutang += sisaNum;
      if(type === "Piutang") totalPiutang += sisaNum;

      if(status === "Belum Lunas") countBelum++;
      if(status === "Lunas") countLunas++;

      const tr = document.createElement("tr");

      tr.innerHTML = `
        <td>${id}</td>
        <td>${nama}</td>
        <td>${type}</td>
        <td style="text-align:right">${formatRupiah(nominalNum)}</td>
        <td>${fixDate(tanggal)}</td>
        <td>${keterangan}</td>
        <td style="text-align:right">${formatRupiah(sisaNum)}</td>
        <td><span class="pill ${status === "Lunas" ? "lunas" : "belum"}">${status}</span></td>
      `;

      tbody.appendChild(tr);
    });

    totalHutangEl.textContent = formatRupiah(totalHutang);
    totalPiutangEl.textContent = formatRupiah(totalPiutang);
    countBelumEl.textContent = countBelum;
    countLunasEl.textContent = countLunas;
  });
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
