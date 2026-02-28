# 📚 e-Kutuphane / e-Library

Okul kütüphaneleri için ücretsiz, açık kaynaklı takip sistemi.
Free and open-source library management system for schools.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Docker](https://img.shields.io/badge/docker-ready-blue)

---

## 🇹🇷 Türkçe

### Özellikler
- 📖 Kitap ekleme, düzenleme, silme (ISBN/barkod desteği)
- 👥 Üye yönetimi (öğrenci, öğretmen, personel)
- 🔄 Ödünç verme ve iade takibi
- ⏰ Gecikme uyarıları ve raporlar
- 📊 İstatistik dashboard
- 🔐 Kullanıcı yetkilendirme (Admin / Operatör / Kullanıcı)
- 🏫 Kurum markalaması (isim ve logo özelleştirme)
- 📱 USB barkod okuyucu desteği
- 🌍 Çok dilli arayüz (Türkçe, İngilizce, Arapça)
- 🐳 Docker ile tek komutla kurulum

### Gereksinimler
Sadece **Docker** yeterli. Başka hiçbir şey kurmanıza gerek yok.

### Kurulum
```bash
# 1. Projeyi indirin
git clone https://github.com/Mustafa-Colak/library-tracker.git
cd library-tracker

# 2. Ayar dosyasını kopyalayın
cp .env.example .env

# 3. Başlatın
docker-compose up -d
```

Tarayıcınızda `http://localhost:3000` adresini açın.

### Varsayılan Giriş
| Kullanıcı Adı | Şifre | Rol |
|---|---|---|
| `admin` | `admin123` | Yönetici |

> ⚠️ İlk girişten sonra şifreyi değiştirmeniz önerilir.

### Kullanıcı Rolleri
| Rol | Yetkiler |
|---|---|
| **Yönetici** | Tüm işlemler, kullanıcı yönetimi, ayarlar |
| **Operatör** | Kitap/üye CRUD, ödünç işlemleri, raporlar |
| **Kullanıcı** | Kitap arama, kendi ödünçlerini görüntüleme |

### Durdurma
```bash
docker-compose down
```

### Güncelleme
```bash
git pull
docker-compose up -d --build
```

---

## 🇬🇧 English

### Features
- 📖 Book management with ISBN/barcode support
- 👥 Member management (students, teachers, staff)
- 🔄 Loan and return tracking
- ⏰ Overdue alerts and reports
- 📊 Statistics dashboard
- 🔐 User authentication (Admin / Operator / User roles)
- 🏫 Organization branding (custom name and logo)
- 📱 USB barcode scanner support
- 🌍 Multi-language interface (Turkish, English, Arabic)
- 🐳 One-command Docker setup

### Requirements
Only **Docker** is required. Nothing else to install.

### Installation
```bash
# 1. Clone the repository
git clone https://github.com/Mustafa-Colak/library-tracker.git
cd library-tracker

# 2. Copy the environment file
cp .env.example .env

# 3. Start
docker-compose up -d
```

Open `http://localhost:3000` in your browser.

### Default Login
| Username | Password | Role |
|---|---|---|
| `admin` | `admin123` | Administrator |

> ⚠️ Change the default password after first login.

### User Roles
| Role | Permissions |
|---|---|
| **Admin** | Full access, user management, settings |
| **Operator** | Book/member CRUD, loan operations, reports |
| **User** | Browse books, view own loans |

---

## 🏗️ Tech Stack
- **Backend:** Python 3.11, FastAPI, SQLAlchemy, SQLite
- **Frontend:** Vanilla HTML/CSS/JavaScript (no build step)
- **Auth:** JWT (python-jose + passlib/bcrypt)
- **Container:** Docker + docker-compose
- **Proxy:** Nginx

## 📁 Project Structure
```
library-tracker/
├── backend/           # FastAPI application
│   ├── models/        # SQLAlchemy models
│   ├── schemas/       # Pydantic schemas
│   ├── routers/       # API endpoints
│   └── services/      # Business logic
├── frontend/          # Static HTML/CSS/JS
│   ├── js/            # JavaScript modules
│   ├── css/           # Styles
│   └── locales/       # i18n translations (tr, en, ar)
├── data/              # SQLite database (Docker volume)
└── docker-compose.yml
```

## 📜 API Documentation
Backend runs on port 8000 with auto-generated docs:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

---

## Lisans / License
MIT — Özgürce kullanın, dağıtın, değiştirin. / Free to use, distribute, and modify.
