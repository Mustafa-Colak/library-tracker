# Library Tracker - Claude Code Rehberi

## Proje Hakkında
Okul kütüphaneleri için ücretsiz, açık kaynaklı kütüphane takip sistemi.
Docker ile tek komutla kurulum: `docker-compose up -d`
Hedef kullanıcı: Teknik bilgisi olmayan okul personeli.

## Teknoloji Stack
- **Backend:** Python 3.11 + FastAPI + SQLAlchemy (ORM) + SQLite
- **Frontend:** Vanilla HTML/CSS/JavaScript (framework yok, build adımı yok)
- **Veritabanı:** SQLite (./data/library.db — volume ile persist)
- **Container:** Docker + docker-compose
- **Çok dilli:** i18n JSON dosyaları (tr.json, en.json)

## Dizin Yapısı
```
library-tracker/
├── CLAUDE.md
├── README.md
├── docker-compose.yml
├── .env.example
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── main.py                  # FastAPI app, router kayıtları
│   ├── database.py              # SQLAlchemy engine, session
│   ├── models/
│   │   ├── __init__.py
│   │   ├── book.py              # Book modeli
│   │   ├── member.py            # Member modeli
│   │   └── loan.py              # Loan modeli
│   ├── schemas/
│   │   ├── __init__.py
│   │   ├── book.py              # Pydantic schemas
│   │   ├── member.py
│   │   └── loan.py
│   ├── routers/
│   │   ├── __init__.py
│   │   ├── books.py             # /api/books endpoints
│   │   ├── members.py           # /api/members endpoints
│   │   ├── loans.py             # /api/loans endpoints
│   │   └── reports.py           # /api/reports endpoints
│   └── services/
│       ├── __init__.py
│       ├── book_service.py
│       ├── member_service.py
│       └── loan_service.py
├── frontend/
│   ├── index.html               # Ana sayfa / dashboard
│   ├── books.html               # Kitap yönetimi
│   ├── members.html             # Üye yönetimi
│   ├── loans.html               # Ödünç işlemleri
│   ├── reports.html             # Raporlar
│   ├── css/
│   │   └── style.css            # Tüm stiller
│   ├── js/
│   │   ├── api.js               # Fetch wrapper, base URL
│   │   ├── i18n.js              # Çok dilli sistem
│   │   ├── barcode.js           # USB okuyucu input yönetimi
│   │   ├── books.js
│   │   ├── members.js
│   │   ├── loans.js
│   │   └── reports.js
│   └── locales/
│       ├── tr.json
│       └── en.json
└── data/                        # Docker volume (gitignore'da)
    └── .gitkeep
```

## Veritabanı Modelleri

### Book
```
id, isbn (unique), title, author, publisher, year, category, 
shelf_location, total_copies, available_copies, 
created_at, updated_at
```

### Member
```
id, member_no (unique), name, surname, member_type (student/teacher/staff),
class_grade, email, phone, is_active, created_at
```

### Loan
```
id, book_id (FK), member_id (FK), 
borrowed_at, due_date (default: borrowed_at + 15 gün),
returned_at (null ise aktif ödünç),
status (active/returned/overdue)
```

## API Endpoints

### Books
- GET    /api/books              — liste (search, category, page parametreleri)
- GET    /api/books/{id}         — detay
- POST   /api/books              — yeni kitap
- PUT    /api/books/{id}         — güncelle
- DELETE /api/books/{id}         — sil
- GET    /api/books/barcode/{isbn} — ISBN/barkod ile ara

### Members
- GET    /api/members            — liste (search, type, page)
- GET    /api/members/{id}       — detay
- POST   /api/members            — yeni üye
- PUT    /api/members/{id}       — güncelle
- DELETE /api/members/{id}       — sil (soft delete, is_active=false)
- GET    /api/members/barcode/{member_no} — kart barkodu ile ara

### Loans
- GET    /api/loans              — liste (status, member_id, book_id, page)
- POST   /api/loans              — kitap ver
- PUT    /api/loans/{id}/return  — kitap iade al
- GET    /api/loans/overdue      — gecikmiş iadeler

### Reports
- GET    /api/reports/summary        — genel istatistik
- GET    /api/reports/popular-books  — en çok ödünç alınan kitaplar
- GET    /api/reports/active-loans   — aktif ödünç listesi
- GET    /api/reports/overdue        — gecikmiş iadeler raporu

## Önemli Kurallar

### Backend
- Tüm endpoint'ler JSON döner
- Hata mesajları `{"detail": "mesaj"}` formatında
- Pagination: `?page=1&limit=20`
- Arama: `?search=kelime` (title, author, isbn'de arar)
- CORS tüm originlere açık (local network kullanımı için)
- SQLite dosyası: `/app/data/library.db`
- FastAPI otomatik docs: `http://localhost:8000/docs`

### Frontend
- API base URL: `http://localhost:8000` — api.js'de tek yerden yönetilir
- i18n: Tüm metinler `t('key')` ile çağrılır, hard-coded Türkçe/İngilizce yok
- Barkod okuyucu: USB okuyucu Enter ile bitirir — input focus yönetimi barcode.js'de
- Bildirimler: Sade toast mesajları (kütüphane kullanma, vanilla JS ile)
- Modal: Native `<dialog>` elementi kullan
- Responsive: Tablet ve masaüstü için optimize (mobil ikincil)
- Renk paleti: Sade, profesyonel — mavi/beyaz/gri

### i18n Yapısı (i18n.js)
```javascript
// Dil dosyasını yükle, window.t fonksiyonunu oluştur
// t('book.add') → "Kitap Ekle"
// Dil tercihi localStorage'da sakla
// Sayfa yüklenince tüm data-i18n attribute'larını çevir
```

### Barkod Yönetimi (barcode.js)
```javascript
// USB barkod okuyucu klavye gibi hızlı karakter gönderir, Enter ile bitirir
// Input alanı focus'taysa normal input gibi çalışır
// Loans sayfasında: önce üye kartı okut, sonra kitap barkodu
// Okuma tamamlanınca otomatik API çağrısı yap
```

## Docker Yapısı

### docker-compose.yml
```yaml
services:
  backend:
    build: ./backend
    ports:
      - "8000:8000"
    volumes:
      - ./data:/app/data
    environment:
      - DATABASE_URL=sqlite:////app/data/library.db
    restart: unless-stopped

  frontend:
    image: nginx:alpine
    ports:
      - "3000:80"
    volumes:
      - ./frontend:/usr/share/nginx/html:ro
    depends_on:
      - backend
    restart: unless-stopped
```

### backend/Dockerfile
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
RUN mkdir -p /app/data
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

## Geliştirme Sırası
1. docker-compose.yml ve Dockerfile'ları yaz
2. Backend: database.py → models → schemas → routers → main.py
3. Frontend: i18n.js → api.js → barcode.js → her sayfa sırayla
4. locales/tr.json ve en.json — tüm key'ler eksiksiz olmalı
5. README.md — kurulum adımları Türkçe ve İngilizce

## README.md İçeriği
- Proje açıklaması (TR + EN)
- Gereksinimler: sadece Docker
- Kurulum: 3 adım (clone, .env kopyala, docker-compose up)
- Ekran görüntüleri placeholder'ı
- Özellikler listesi
- Lisans: MIT

## Kalite Kontrol
- Her API endpoint çalışmalı, hata durumlarını handle etmeli
- Frontend'de hiçbir hard-coded Türkçe/İngilizce metin olmamalı
- Docker build hatasız çalışmalı
- `docker-compose up -d` sonrası localhost:3000 açılmalı ve kullanılabilir olmalı
