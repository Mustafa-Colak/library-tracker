# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.0] - 2026-02-28

### Added
- Database backup system: create, list, download, delete backups via API and Settings UI
- Automatic backup on every application startup (max 10 retained, oldest auto-deleted)
- Backup endpoints: `POST/GET /api/system/backups`, `GET .../download`, `DELETE`
- Backup i18n keys for Turkish, English, Arabic
- Soft delete for books and members: `deleted_at` column replaces hard delete
- Startup migration adds `deleted_at` column to existing databases automatically

### Changed
- Version update check now runs once at startup instead of hourly cache (simpler, no repeated GitHub API calls)
- Book deletion now sets `deleted_at` timestamp instead of removing the record
- Member deletion now sets `deleted_at` alongside `is_active=False`
- All list/search queries, reports, and loan creation filter out soft-deleted records

## [1.1.0] - 2026-02-28

### Added
- Author, Publisher, Category lookup tables (FK normalization)
- Metadata CRUD API (`/api/metadata/{authors,publishers,categories}`)
- Autocomplete for author, publisher, category fields on book form
- Default category list (Roman, Bilim, Tarih, etc.)
- ROADMAP.md with versioned development plan
- CHANGELOG.md, TODO.md for project tracking
- GitHub release for v1.1.0

### Changed
- Book model: text fields converted to FK relationships (`author_id`, `publisher_id`, `category_id`)
- API still accepts strings; backend auto-resolves via `get_or_create`
- Startup migration logic for old schema to FK schema

## [1.0.0] - 2026-02-28

### Added
- Book management (CRUD, ISBN/barcode search)
- Member management (students, teachers, staff)
- Loan and return tracking with due date calculation
- Overdue alerts and reporting
- Statistics dashboard
- USB barcode scanner support
- JWT-based authentication system
- Role-based access control (Admin, Operator, User)
- User management (admin only)
- Organization branding (custom name and logo upload)
- Multi-language support (Turkish, English, Arabic)
- RTL layout support for Arabic
- Docker containerization with docker-compose
- Nginx reverse proxy configuration
- SQLite database with automatic initialization
- Default admin account auto-creation on first run
- Responsive UI optimized for tablet and desktop
