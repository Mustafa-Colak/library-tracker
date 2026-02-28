# Library Tracker - Roadmap

## v1.2.x — Veri Güvenliği & Temel İyileştirmeler

- [x] **Veritabanı yedekleme** — Startup'ta otomatik backup, admin panelinden manuel yedek alma/indirme/silme (max 10)
- [x] **Soft delete** — Üye/kitap silindiğinde `deleted_at` ile işaretleme (audit için geri dönülebilir)
- [ ] **Input validation** — ISBN format kontrolü, telefon/e-posta doğrulama (frontend + backend)
- [ ] **Ayarlanabilir ödünç süresi** — Öğrenci/öğretmen/personel için farklı süreler (şu an 15 gün hardcoded)

## v1.3.0 — Ayarlar & Metadata Yönetimi

- [x] **Ayarlar sekme sistemi** — Genel, Veri Yönetimi, Yedekleme sekmeleri
- [x] **Metadata yönetim arayüzü** — Yazar/Yayınevi/Kategori CRUD (alt sekmeler, arama, sayaç)
- [x] **Sidebar profil düzenleme** — İsim değiştirme doğrudan sidebar'dan (tıkla → düzenle)
- [x] **Son yedek koruma** — Tek kalan yedek silinemez (backend + frontend)
- [x] **Profil güncelleme API** — `PUT /api/auth/me/profile` endpoint

## v1.4.0 — Operasyonel Verimlilik

- [ ] **Toplu kitap/üye aktarımı (CSV import)** — Yüzlerce kitabı tek seferde yükleme
- [ ] **Ödünç yenileme** — İade etmeden süre uzatma butonu
- [ ] **Gecikme bildirimi** — Yazdırılabilir uyarı mektubu oluşturma
- [ ] **Yazdırılabilir görünümler** — Rapor, ödünç fişi, üye kartı için print-friendly CSS

## v1.5.0 — UX İyileştirmeleri

- [ ] **Yükleniyor göstergesi** — Form gönderirken spinner, çift tıklama önleme
- [ ] **Gelişmiş filtreleme** — Birden fazla alan ile arama (yıl + kategori + yazar)
- [ ] **Karanlık mod** — Uzun süre ekran başında çalışan personel için
- [ ] **Klavye kısayolları** — `Ctrl+K` arama, `Ctrl+N` yeni kayıt

## v2.0.0 — Gelişmiş Özellikler

- [ ] **Rezervasyon sistemi** — Kitap müsait olmadığında bekleme listesine ekleme
- [ ] **Audit log** — Kim ne zaman ne yaptı kaydı (admin için)
- [ ] **E-posta bildirimleri** — İade tarihi yaklaşan/geçen üyelere otomatik uyarı
- [ ] **Raporlama geliştirmeleri** — Kategoriye göre dolaşım, dönemsel istatistikler

## Backlog

- [ ] Çok dilli hata mesajları (backend hataları locale'a göre)
- [ ] Docker health check tanımları
- [ ] Unit/integration testler
- [ ] CSV/Excel export (raporlar ve listeler için)
- [ ] Ceza/para cezası sistemi (gecikmiş iadeler)
