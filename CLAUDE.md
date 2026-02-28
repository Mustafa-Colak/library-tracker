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
- **Çok dilli:** i18n JSON dosyaları (tr.json, en.json, ar.json)
- **Auth:** JWT (python-jose) + bcrypt (passlib), 3 rol: admin/operator/user

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
│   │   ├── book.py              # Book modeli (FK: author_id, publisher_id, category_id)
│   │   ├── member.py            # Member modeli
│   │   ├── loan.py              # Loan modeli
│   │   ├── user.py              # User modeli (auth)
│   │   ├── setting.py           # Setting modeli
│   │   ├── author.py            # Author lookup tablosu
│   │   ├── publisher.py         # Publisher lookup tablosu
│   │   └── category.py          # Category lookup tablosu
│   ├── schemas/
│   │   ├── __init__.py
│   │   ├── book.py              # Pydantic schemas
│   │   ├── member.py
│   │   ├── loan.py
│   │   ├── auth.py              # Auth schemas
│   │   └── metadata.py          # Metadata CRUD schemas
│   ├── routers/
│   │   ├── __init__.py
│   │   ├── books.py             # /api/books endpoints
│   │   ├── members.py           # /api/members endpoints
│   │   ├── loans.py             # /api/loans endpoints
│   │   ├── reports.py           # /api/reports endpoints
│   │   ├── auth.py              # /api/auth endpoints
│   │   ├── settings.py          # /api/settings endpoints
│   │   ├── system.py            # /api/system endpoints
│   │   └── metadata.py          # /api/metadata endpoints
│   └── services/
│       ├── __init__.py
│       ├── book_service.py
│       ├── member_service.py
│       ├── loan_service.py
│       ├── auth_service.py
│       └── metadata_service.py  # Author/Publisher/Category CRUD
├── frontend/
│   ├── index.html               # Ana sayfa / dashboard
│   ├── books.html               # Kitap yönetimi
│   ├── members.html             # Üye yönetimi
│   ├── loans.html               # Ödünç işlemleri
│   ├── reports.html             # Raporlar
│   ├── css/
│   │   └── style.css            # Tüm stiller
│   ├── js/
│   │   ├── api.js               # Fetch wrapper, base URL, JWT auth
│   │   ├── auth.js              # Login, role check, token yönetimi
│   │   ├── i18n.js              # Çok dilli sistem
│   │   ├── barcode.js           # USB okuyucu input yönetimi
│   │   ├── books.js             # Autocomplete destekli kitap yönetimi
│   │   ├── members.js
│   │   ├── loans.js
│   │   ├── users.js             # Admin kullanıcı yönetimi
│   │   └── reports.js
│   └── locales/
│       ├── tr.json
│       ├── en.json
│       └── ar.json
└── data/                        # Docker volume (gitignore'da)
    └── .gitkeep
```

## Veritabanı Modelleri

### Author (lookup)
```
id, name (unique)
```

### Publisher (lookup)
```
id, name (unique)
```

### Category (lookup)
```
id, name (unique)
```

### Book
```
id, isbn (unique), title,
author_id (FK → authors), publisher_id (FK → publishers), category_id (FK → categories),
year, shelf_location, total_copies, available_copies,
created_at, updated_at
```
> **Not:** Book modeli `@property` ile `author`, `publisher`, `category` string döner (API uyumluluğu).
> Kitap eklerken/güncellerken API hâlâ string kabul eder, backend otomatik `get_or_create` yapar.

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

### User
```
id, username (unique), full_name, hashed_password,
role (admin/operator/user), is_active, created_at
```

### Setting
```
id, key (unique), value
```

## API Endpoints

### Auth
- POST   /api/auth/login            — giriş (public)
- GET    /api/auth/me               — mevcut kullanıcı bilgisi
- PUT    /api/auth/me/password      — şifre değiştir
- GET    /api/auth/users            — kullanıcı listesi (admin)
- POST   /api/auth/users            — kullanıcı ekle (admin)
- PUT    /api/auth/users/{id}       — kullanıcı güncelle (admin)
- DELETE /api/auth/users/{id}       — kullanıcı sil (admin)

### Books
- GET    /api/books              — liste (search, category, page parametreleri)
- GET    /api/books/{id}         — detay
- POST   /api/books              — yeni kitap (admin/operator)
- PUT    /api/books/{id}         — güncelle (admin/operator)
- DELETE /api/books/{id}         — sil (admin)
- GET    /api/books/barcode/{isbn} — ISBN/barkod ile ara
- GET    /api/books/suggestions  — autocomplete önerileri (authors, publishers, categories)

### Metadata (Author/Publisher/Category CRUD)
- GET    /api/metadata/{entity_type}           — listeleme
- POST   /api/metadata/{entity_type}           — yeni ekle (admin/operator)
- PUT    /api/metadata/{entity_type}/{item_id} — güncelle (admin/operator)
- DELETE /api/metadata/{entity_type}/{item_id} — sil (admin, kullanılmıyorsa)

> `entity_type`: `authors`, `publishers`, `categories`

### Members
- GET    /api/members            — liste (search, type, page)
- GET    /api/members/{id}       — detay
- POST   /api/members            — yeni üye (admin/operator)
- PUT    /api/members/{id}       — güncelle (admin/operator)
- DELETE /api/members/{id}       — sil (admin, soft delete)
- GET    /api/members/barcode/{member_no} — kart barkodu ile ara

### Loans
- GET    /api/loans              — liste (status, member_id, book_id, page)
- POST   /api/loans              — kitap ver (admin/operator)
- PUT    /api/loans/{id}/return  — kitap iade al (admin/operator)
- GET    /api/loans/overdue      — gecikmiş iadeler

### Reports
- GET    /api/reports/summary        — genel istatistik
- GET    /api/reports/popular-books  — en çok ödünç alınan kitaplar
- GET    /api/reports/active-loans   — aktif ödünç listesi
- GET    /api/reports/overdue        — gecikmiş iadeler raporu

### Settings
- GET    /api/settings               — ayarları getir
- PUT    /api/settings               — ayarları güncelle (admin)
- POST   /api/settings/logo          — logo yükle (admin)
- DELETE /api/settings/logo          — logo sil (admin)

### System
- GET    /api/system/version         — versiyon bilgisi
- GET    /api/health                 — sağlık kontrolü

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

### Autocomplete Sistemi (books.js)
- Yazar, yayınevi, kategori alanları autocomplete destekli
- `/api/books/suggestions` endpointinden veri çeker
- Varsayılan kategori listesi: Roman, Bilim, Tarih, Çocuk, Ders Kitabı, Şiir, Ansiklopedi, Hikaye, Biyografi, Diğer
- Klavye navigasyonu (ok tuşları, Enter, Escape) + fare tıklama
- Eşleşen metin `<mark>` ile vurgulanır

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
