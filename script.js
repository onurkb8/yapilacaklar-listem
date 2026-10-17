// Sayfadaki öğeleri seçiyoruz
const form = document.getElementById("gorev-formu");
const giris = document.getElementById("gorev-girisi");
const tarihGirisi = document.getElementById("tarih-girisi");
const liste = document.getElementById("gorev-listesi");
const bilgi = document.getElementById("bilgi");
const yaklasanIcerik = document.getElementById("yaklasan-icerik");

// Kayıtlı görevleri yükle (eski görevlerde tarih yoksa sorun çıkmaz)
let gorevler = [];
try {
  gorevler = JSON.parse(localStorage.getItem("gorevler")) || [];
} catch (hata) {
  gorevler = [];
}

// Görevleri tarayıcıya kaydeder
function kaydet() {
  localStorage.setItem("gorevler", JSON.stringify(gorevler));
}

// "2026-10-17" metnini gün başlangıcına ait bir tarih nesnesine çevirir
function tarihNesnesi(tarihMetni) {
  const parcalar = tarihMetni.split("-");
  return new Date(
    Number(parcalar[0]),
    Number(parcalar[1]) - 1,
    Number(parcalar[2])
  );
}

// "2026-10-17" biçimindeki tarihi "17 Ekim 2026" biçimine çevirir
function tarihiGuzelYaz(tarihMetni) {
  return tarihNesnesi(tarihMetni).toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric"
  });
}

// Bugünün başlangıcı
function bugunuAl() {
  const bugun = new Date();
  bugun.setHours(0, 0, 0, 0);
  return bugun;
}

// Görevin tarihine kaç gün kaldığını verir (bugün = 0, dün = -1, yarın = 1)
function gunFarki(tarihMetni) {
  const fark = tarihNesnesi(tarihMetni) - bugunuAl();
  return Math.round(fark / (1000 * 60 * 60 * 24));
}

// Tarih bugünden önce mi?
function tarihGecmisMi(tarihMetni) {
  return gunFarki(tarihMetni) < 0;
}

// Yaklaşan görevlerde gösterilecek kısa zaman yazısı
function zamanYazisi(fark) {
  if (fark < 0) {
    return Math.abs(fark) + " gün gecikti";
  }
  if (fark === 0) {
    return "Bugün";
  }
  if (fark === 1) {
    return "Yarın";
  }
  return fark + " gün sonra";
}

// Görevleri sıralar: en yakın tarih önce, tarihsizler en sonda
// (orijinal listeyi bozmaz, sıralı bir kopya döndürür)
function siraliGorevler() {
  return gorevler.slice().sort(function (a, b) {
    if (a.tarih && b.tarih) {
      if (a.tarih < b.tarih) return -1;
      if (a.tarih > b.tarih) return 1;
      return a.id - b.id; // aynı tarihte önce eklenen önce gelir
    }
    if (a.tarih) return -1; // sadece a'nın tarihi var, a önce
    if (b.tarih) return 1;  // sadece b'nin tarihi var, b önce
    return a.id - b.id;     // ikisinin de tarihi yok
  });
}

// Yaklaşan görevler bölümünün içindeki bir grubu oluşturur
function grupOlustur(sinif, baslik, gorevListesi) {
  const grup = document.createElement("div");
  grup.className = "yaklasan-grup " + sinif;

  const baslikEleman = document.createElement("h3");
  baslikEleman.className = "grup-baslik";
  baslikEleman.textContent = baslik + " ";

  const sayi = document.createElement("span");
  sayi.className = "grup-sayi";
  sayi.textContent = gorevListesi.length;
  baslikEleman.appendChild(sayi);

  const ul = document.createElement("ul");
  ul.className = "yaklasan-liste";

  gorevListesi.forEach(function (gorev) {
    const li = document.createElement("li");
    li.className = "yaklasan-oge";

    const metin = document.createElement("span");
    metin.className = "yaklasan-metin";
    metin.textContent = gorev.metin;

    const zaman = document.createElement("span");
    zaman.className = "yaklasan-zaman";
    zaman.textContent = zamanYazisi(gunFarki(gorev.tarih));

    li.append(metin, zaman);
    ul.appendChild(li);
  });

  grup.append(baslikEleman, ul);
  return grup;
}

// Yaklaşan görevler bölümünü çizer
function yaklasanlariCiz() {
  yaklasanIcerik.innerHTML = "";

  // Sadece tarihi olan ve tamamlanmamış görevler
  const aktifler = siraliGorevler().filter(function (g) {
    return g.tarih && !g.tamamlandi;
  });

  const gecikmis = aktifler.filter(function (g) {
    return gunFarki(g.tarih) < 0;
  });
  const bugun = aktifler.filter(function (g) {
    return gunFarki(g.tarih) === 0;
  });
  const hafta = aktifler.filter(function (g) {
    const fark = gunFarki(g.tarih);
    return fark >= 1 && fark <= 7;
  });

  if (gecikmis.length === 0 && bugun.length === 0 && hafta.length === 0) {
    const bos = document.createElement("p");
    bos.className = "yaklasan-bos";
    bos.textContent = "Yaklaşan görev yok. Rahat bir hafta seni bekliyor 🎉";
    yaklasanIcerik.appendChild(bos);
    return;
  }

  if (gecikmis.length > 0) {
    yaklasanIcerik.appendChild(
      grupOlustur("grup-gecikmis", "⚠️ Gecikmiş", gecikmis)
    );
  }
  if (bugun.length > 0) {
    yaklasanIcerik.appendChild(
      grupOlustur("grup-bugun", "📌 Bugün", bugun)
    );
  }
  if (hafta.length > 0) {
    yaklasanIcerik.appendChild(
      grupOlustur("grup-hafta", "🗓️ Önümüzdeki 7 gün", hafta)
    );
  }
}

// Ana listeyi ekrana çizer
function listeyiCiz() {
  liste.innerHTML = "";

  if (gorevler.length === 0) {
    const bos = document.createElement("li");
    bos.className = "bos-mesaj";
    bos.textContent = "Henüz görev yok. Yukarıdan bir tane ekle!";
    liste.appendChild(bos);
  }

  siraliGorevler().forEach(function (gorev) {
    const gecikmis =
      gorev.tarih && !gorev.tamamlandi && tarihGecmisMi(gorev.tarih);

    const li = document.createElement("li");
    li.className =
      "gorev" +
      (gorev.tamamlandi ? " tamamlandi" : "") +
      (gecikmis ? " gecikmis" : "");

    // Tamamlandı kutucuğu
    const kutu = document.createElement("input");
    kutu.type = "checkbox";
    kutu.checked = gorev.tamamlandi;
    kutu.addEventListener("change", function () {
      gorev.tamamlandi = kutu.checked;
      kaydet();
      ekranaCiz();
    });

    // Görev yazısı ve tarihi
    const icerik = document.createElement("div");
    icerik.className = "gorev-icerik";

    const yazi = document.createElement("span");
    yazi.className = "gorev-metin";
    yazi.textContent = gorev.metin;
    icerik.appendChild(yazi);

    if (gorev.tarih) {
      const tarihEtiketi = document.createElement("span");
      tarihEtiketi.className = "gorev-tarih";
      if (gecikmis) {
        tarihEtiketi.classList.add("gecmis");
      }
      tarihEtiketi.textContent = "📅 " + tarihiGuzelYaz(gorev.tarih);
      icerik.appendChild(tarihEtiketi);
    }

    // Silme butonu
    const silButonu = document.createElement("button");
    silButonu.className = "sil-butonu";
    silButonu.textContent = "Sil";
    silButonu.addEventListener("click", function () {
      gorevler = gorevler.filter(function (g) {
        return g.id !== gorev.id;
      });
      kaydet();
      ekranaCiz();
    });

    li.append(kutu, icerik, silButonu);
    liste.appendChild(li);
  });
}

// Üstteki bilgi cümlesini günceller
function bilgiyiYaz() {
  const kalan = gorevler.filter(function (g) {
    return !g.tamamlandi;
  }).length;

  if (gorevler.length === 0) {
    bilgi.textContent = "Bugün için planın boş";
  } else {
    bilgi.textContent = kalan + " görev kaldı, toplam " + gorevler.length;
  }
}

// Her şeyi tek seferde yeniler
function ekranaCiz() {
  yaklasanlariCiz();
  listeyiCiz();
  bilgiyiYaz();
}

// Form gönderilince yeni görev ekle
form.addEventListener("submit", function (olay) {
  olay.preventDefault();

  const metin = giris.value.trim();
  if (metin === "") return;

  gorevler.push({
    id: Date.now(),
    metin: metin,
    tarih: tarihGirisi.value, // seçilmediyse boş metin ("") olur
    tamamlandi: false
  });

  giris.value = "";
  tarihGirisi.value = "";
  kaydet();
  ekranaCiz();
  giris.focus();
});

// Sayfa ilk açıldığında listeyi çiz
ekranaCiz();