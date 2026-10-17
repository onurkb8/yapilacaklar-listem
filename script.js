// Supabase bağlantısı
const SUPABASE_URL = "https://cjvaxbpmqsysurfvivyy.supabase.co/rest/v1/";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_mvLkF_d5wm4jLwcawNJ3JQ_FJ8au4m2";

const supabase = window.supabase.createClient(
  // Sayfadaki alanlar
const girisAlani = document.getElementById("giris-alani");
const uygulamaAlani = document.getElementById("uygulama-alani");

const girisFormu = document.getElementById("giris-formu");
const epostaAlani = document.getElementById("eposta");
const sifreAlani = document.getElementById("sifre");
const kayitButonu = document.getElementById("kayit-butonu");
const girisMesaji = document.getElementById("giris-mesaji");

const form = document.getElementById("gorev-formu");
const gorevGirisi = document.getElementById("gorev-girisi");
const tarihGirisi = document.getElementById("tarih-girisi");
const liste = document.getElementById("gorev-listesi");
const bilgi = document.getElementById("bilgi");
const yaklasanIcerik = document.getElementById("yaklasan-icerik");

let gorevler = [];
let kullanici = null;

// Çıkış düğmesini oluştur
const cikisButonu = document.createElement("button");
cikisButonu.type = "button";
cikisButonu.textContent = "Çıkış Yap";
cikisButonu.id = "cikis-butonu";
cikisButonu.hidden = true;
girisAlani.appendChild(cikisButonu);

// Giriş yapılmadan görevleri gösterme
uygulamaAlani.hidden = true;

// Tarih yardımcıları
function bugunuAl() {
  const bugun = new Date();
  const yil = bugun.getFullYear();
  const ay = String(bugun.getMonth() + 1).padStart(2, "0");
  const gun = String(bugun.getDate()).padStart(2, "0");
  return `${yil}-${ay}-${gun}`;
}

function tarihiGuzelYaz(tarih) {
  if (!tarih) return "";
  const parcalar = tarih.split("-");
  return `${parcalar[2]}.${parcalar[1]}.${parcalar[0]}`;
}

function gunFarki(tarih) {
  const bugun = new Date(`${bugunuAl()}T00:00:00`);
  const hedef = new Date(`${tarih}T00:00:00`);
  return Math.round((hedef - bugun) / 86400000);
}

function siraliGorevler() {
  return [...gorevler].sort((a, b) => {
    if (a.tarih && b.tarih) {
      const fark = a.tarih.localeCompare(b.tarih);
      if (fark !== 0) return fark;
    } else if (a.tarih) {
      return -1;
    } else if (b.tarih) {
      return 1;
    }

    return (a.olusturma || "").localeCompare(b.olusturma || "");
  });
}

// Görevleri buluttan yükle
async function gorevleriYukle() {
  if (!kullanici) return;

  bilgi.textContent = "Görevler yükleniyor...";

  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) {
    bilgi.textContent = "Görevler yüklenemedi: " + error.message;
    return;
  }

  gorevler = data.map((satir) => ({
    id: satir.id,
    metin: satir.title,
    tarih: satir.due_date || "",
    tamamlandi: satir.completed,
    olusturma: satir.created_at
  }));

  ekranaCiz();
}

// Yaklaşan görevleri çiz
function yaklasanlariCiz() {
  yaklasanIcerik.replaceChildren();

  const yaklasanlar = siraliGorevler().filter((gorev) => {
    if (!gorev.tarih || gorev.tamamlandi) return false;
    const fark = gunFarki(gorev.tarih);
    return fark <= 7;
  });

  if (yaklasanlar.length === 0) {
    yaklasanIcerik.textContent = "Yaklaşan görev yok.";
    return;
  }

  yaklasanlar.forEach((gorev) => {
    const satir = document.createElement("p");
    const fark = gunFarki(gorev.tarih);

    let zaman = tarihiGuzelYaz(gorev.tarih);
    if (fark < 0) zaman += " — Gecikmiş";
    else if (fark === 0) zaman += " — Bugün";
    else if (fark === 1) zaman += " — Yarın";

    satir.textContent = `${gorev.metin} — ${zaman}`;
    yaklasanIcerik.appendChild(satir);
  });
}

// Tüm görevleri çiz
function listeyiCiz() {
  liste.replaceChildren();

  siraliGorevler().forEach((gorev) => {
    const satir = document.createElement("li");
    const kutu = document.createElement("input");
    kutu.type = "checkbox";
    kutu.checked = gorev.tamamlandi;
    kutu.setAttribute("aria-label", `${gorev.metin} tamamlandı`);

    const metin = document.createElement("span");
    metin.textContent = gorev.metin;

    if (gorev.tamamlandi) {
      metin.style.textDecoration = "line-through";
    }

    satir.appendChild(kutu);
    satir.appendChild(metin);

    if (gorev.tarih) {
      const tarih = document.createElement("small");
      tarih.textContent = " " + tarihiGuzelYaz(gorev.tarih);
      satir.appendChild(tarih);
    }

    const silButonu = document.createElement("button");
    silButonu.type = "button";
    silButonu.textContent = "Sil";
    silButonu.setAttribute("aria-label", `${gorev.metin} görevini sil`);

    kutu.addEventListener("change", async () => {
      const { error } = await supabase
        .from("tasks")
        .update({ completed: kutu.checked })
        .eq("id", gorev.id)
        .eq("user_id", kullanici.id);

      if (error) {
        alert("Görev güncellenemedi: " + error.message);
        await gorevleriYukle();
        return;
      }

      gorev.tamamlandi = kutu.checked;
      ekranaCiz();
    });

    silButonu.addEventListener("click", async () => {
      if (!confirm("Bu görevi silmek istiyor musun?")) return;

      const { error } = await supabase
        .from("tasks")
        .delete()
        .eq("id", gorev.id)
        .eq("user_id", kullanici.id);

      if (error) {
        alert("Görev silinemedi: " + error.message);
        return;
      }

      gorevler = gorevler.filter((g) => g.id !== gorev.id);
      ekranaCiz();
    });

    satir.appendChild(silButonu);
    liste.appendChild(satir);
  });
}

function ekranaCiz() {
  listeyiCiz();
  yaklasanlariCiz();

  const kalan = gorevler.filter((g) => !g.tamamlandi).length;
  bilgi.textContent = `Tamamlanmamış görev: ${kalan}`;
}

// Yeni görevi buluta ekle
form.addEventListener("submit", async (olay) => {
  olay.preventDefault();

  if (!kullanici) return;

  const metin = gorevGirisi.value.trim();
  if (!metin) return;

  const { data, error } = await supabase
    .from("tasks")
    .insert({
      user_id: kullanici.id,
      title: metin,
      due_date: tarihGirisi.value || null
    })
    .select()
    .single();

  if (error) {
    alert("Görev kaydedilemedi: " + error.message);
    return;
  }

  gorevler.push({
    id: data.id,
    metin: data.title,
    tarih: data.due_date || "",
    tamamlandi: data.completed,
    olusturma: data.created_at
  });

  form.reset();
  ekranaCiz();
  gorevGirisi.focus();
});

// E-posta ve şifre ile giriş
girisFormu.addEventListener("submit", async (olay) => {
  olay.preventDefault();
  girisMesaji.textContent = "Giriş yapılıyor...";

  const { error } = await supabase.auth.signInWithPassword({
    email: epostaAlani.value.trim(),
    password: sifreAlani.value
  });

  if (error) {
    girisMesaji.textContent = "Giriş yapılamadı: " + error.message;
  }
});

// Yeni hesap oluştur
kayitButonu.addEventListener("click", async () => {
  const eposta = epostaAlani.value.trim();
  const sifre = sifreAlani.value;

  if (!eposta || !sifre) {
    girisMesaji.textContent = "Lütfen e-posta ve şifreni yaz.";
    return;
  }

  girisMesaji.textContent = "Hesap oluşturuluyor...";

  const { data, error } = await supabase.auth.signUp({
    email: eposta,
    password: sifre
  });

  if (error) {
    girisMesaji.textContent = "Kayıt yapılamadı: " + error.message;
    return;
  }

  girisMesaji.textContent = data.session
    ? "Hesabın oluşturuldu!"
    : "Kayıt başarılı. E-postana gelen doğrulama bağlantısına tıkla.";
});

// Çıkış yap
cikisButonu.addEventListener("click", async () => {
  const { error } = await supabase.auth.signOut();

  if (error) {
    girisMesaji.textContent = "Çıkış yapılamadı: " + error.message;
  }
});

// Giriş durumuna göre ekranı yönet
async function oturumuUygula(oturum) {
  kullanici = oturum?.user || null;

  if (!kullanici) {
    gorevler = [];
    uygulamaAlani.hidden = true;
    girisAlani.hidden = false;
    cikisButonu.hidden = true;
    liste.replaceChildren();
    yaklasanIcerik.replaceChildren();
    bilgi.textContent = "";
    return;
  }

  girisAlani.hidden = false;
  uygulamaAlani.hidden = false;
  cikisButonu.hidden = false;
  girisMesaji.textContent = "Giriş yapıldı.";

  await gorevleriYukle();
}

// Daha önce giriş yapılmışsa oturumu geri yükle
supabase.auth.onAuthStateChange((_olay, oturum) => {
  setTimeout(() => {
    oturumuUygula(oturum);
  }, 0);
});

supabase.auth.getSession().then(({ data, error }) => {
  if (error) {
    girisMesaji.textContent = "Oturum kontrol edilemedi.";
    return;
  }

  oturumuUygula(data.session);
});
);
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
// Giriş ve kayıt alanları
const girisFormu = document.getElementById("giris-formu");
const epostaAlani = document.getElementById("eposta");
const sifreAlani = document.getElementById("sifre");
const kayitButonu = document.getElementById("kayit-butonu");
const girisMesaji = document.getElementById("giris-mesaji");

girisFormu.addEventListener("submit", async function (olay) {
  olay.preventDefault();

  const { error } = await supabase.auth.signInWithPassword({
    email: epostaAlani.value.trim(),
    password: sifreAlani.value
  });

  if (error) {
    girisMesaji.textContent = "Giriş yapılamadı: " + error.message;
    return;
  }

  girisMesaji.textContent = "Giriş başarılı!";
});

kayitButonu.addEventListener("click", async function () {
  const { data, error } = await supabase.auth.signUp({
    email: epostaAlani.value.trim(),
    password: sifreAlani.value
  });

  if (error) {
    girisMesaji.textContent = "Kayıt yapılamadı: " + error.message;
    return;
  }

  girisMesaji.textContent = data.session
    ? "Hesabın oluşturuldu!"
    : "Hesabın oluşturuldu. E-postanı kontrol edip adresini doğrula.";
});

// Sayfa ilk açıldığında listeyi çiz
ekranaCiz();
