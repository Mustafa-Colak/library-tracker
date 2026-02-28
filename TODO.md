# TODO — Kısa Vadeli Yapılacaklar

Aktif sprint / yakın gelecekte yapılacak işler.
Uzun vadeli plan için bkz. [ROADMAP.md](ROADMAP.md)

## Öncelikli

- [x] Veritabanı yedekleme — Admin panelinden manuel + startup'ta otomatik backup
- [x] Soft delete — Üye/kitap silme yerine `deleted_at` işaretleme
- [x] Ayarlar sekme sistemi — Genel / Veri Yönetimi / Yedekleme
- [x] Metadata yönetim UI — Yazar/Yayınevi/Kategori CRUD arayüzü
- [x] Sidebar profil düzenleme — İsim değiştirme
- [x] Input validation — ISBN 10/13 format kontrolü (frontend + backend)
- [x] Ayarlanabilir ödünç süresi — Üye tipine göre farklı ödünç süreleri (Ayarlar UI + backend)

## Sonraki

- [ ] CSV import — Toplu kitap yükleme (şablon dosya + upload endpoint)
- [ ] Ödünç yenileme — `PUT /api/loans/{id}/renew` endpoint
- [ ] Yazdırılabilir gecikme bildirimi
- [ ] Print CSS — Rapor ve liste sayfaları için yazdırma stili
