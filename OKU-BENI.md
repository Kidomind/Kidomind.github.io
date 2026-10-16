# Kidomind PWA – Yükleme Adımları

## 1) GitHub'a yükle
Bu klasörün İÇİNDEKİ her şeyi (klasörün kendisini değil) repoya yükle. `.nojekyll` ve `.well-known` gizli dosyalardır; web arayüzünde sürükle-bırak yerine GitHub Desktop veya `git` kullan, yoksa bunlar atlanabilir.
Repo adını `KULLANICIADI.github.io` yap (alt yol olmasın). Settings > Pages > Branch: main / root.

Yayın adresin: https://KULLANICIADI.github.io/

## 2) Kontrol et
- https://KULLANICIADI.github.io/manifest.json açılıyor mu?
- https://KULLANICIADI.github.io/sw.js açılıyor mu?
- https://KULLANICIADI.github.io/gizlilik.html açılıyor mu? (Play Console'a bu adresi gizlilik politikası olarak gireceksin)
- `audio/` klasörü pakette hazır (4401 mp3 + manifest.json, ~127 MB).

## 3) PWABuilder
pwabuilder.com > URL'ni gir > Package for stores > Android.
Package ID: kalıcıdır, sonradan değişmez (örn. com.aksustudio.kidomind).
Signing key: "Create new" de, indirilen zip'teki keystore ve şifreleri YEDEKLE (GitHub'a koyma).

## 4) assetlinks.json
`.well-known/assetlinks.json` içindeki üç yeri doldur:
- package_name: PWABuilder'da verdiğin Package ID
- fingerprint 1: Play Console > Uygulama bütünlüğü > Play uygulama imzalama > SHA-256
- fingerprint 2: PWABuilder zip'indeki signing-key-info / keystore SHA-256
Sonra GitHub'a yükle. Adres çubuğu görünürse sebep neredeyse her zaman burasıdır.

## 5) Play Console
.aab dosyasını yükle. Gizlilik politikası: https://KULLANICIADI.github.io/gizlilik.html
Çocuklara yönelik uygulamaysa "Hedef kitle ve içerik" bölümünde çocuk yaş gruplarını seç; Aile politikası kuralları devreye girer (reklam yok, veri toplama yok: uygulamanın bu açıdan temiz).
Veri güvenliği formu: veri toplanmıyor / paylaşılmıyor olarak doldur (mikrofon ses tanıma notunu Play'in sorularına göre değerlendir).
Ekran görüntüleri (en az 2), 512x512 uygulama ikonu ve 1024x500 öne çıkan görsel gerekir.

## Not: 4400+ dosya
GitHub web arayüzü tek seferde 100 dosya yükleyebilir. `audio/` için GitHub Desktop veya git kullan:
    git init && git add . && git commit -m "Kidomind" && git branch -M main
    git remote add origin https://github.com/KULLANICIADI/KULLANICIADI.github.io.git && git push -u origin main
