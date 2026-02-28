# TODO — Kısa Vadeli Yapılacaklar

Aktif sprint / yakın gelecekte yapılacak işler.
Uzun vadeli plan için bkz. [ROADMAP.md](ROADMAP.md)

## Öncelikli

- [x] Veritabanı yedekleme — Admin panelinden manuel + startup'ta otomatik backup
- [ ] Input validation — ISBN 10/13 format kontrolü (frontend + backend)
- [ ] Ayarlanabilir ödünç süresi — Settings'e `loan_duration_days` ekle (üye tipine göre)
- [x] Soft delete — Üye/kitap silme yerine `deleted_at` işaretleme

## Sonraki

- [ ] CSV import — Toplu kitap yükleme (şablon dosya + upload endpoint)
- [ ] Ödünç yenileme — `PUT /api/loans/{id}/renew` endpoint
- [ ] Yazdırılabilir gecikme bildirimi
- [ ] Print CSS — Rapor ve liste sayfaları için yazdırma stili
