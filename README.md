# Финансовый помощник

Веб-приложение для учёта личных финансов, построения аналитики и получения советов по экономии.

## Стек технологий

- **Frontend:** React 18 + TypeScript + Vite + Tailwind CSS + Recharts
- **Backend:** Django 4.2 + Django REST Framework + JWT + WhiteNoise
- **База данных:** PostgreSQL (на Railway) / SQLite (локально)

## Локальный запуск

### 1. Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver 8000
```

### 2. Frontend

В новом терминале:

```bash
cd frontend
npm install
npm run dev
```

### 3. Запуск backend и frontend одной командой

```bash
cd frontend
npm run dev:all
```

Приложение будет доступно по адресу: http://localhost:5173/

## Деплой на Railway

### Подготовка

Проект уже настроен для деплоя на Railway как один сервис:
- `Dockerfile` — многоступенчатая сборка frontend + backend
- `railway.json` — настройки деплоя
- `backend/config/settings.py` — production-настройки
- `backend/config/urls.py` — SPA-роутинг

### Шаги

1. **Создайте репозиторий на GitHub** и запушьте проект:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/ВАШ_НИК/finance-helper.git
git push -u origin main
```

2. **Зарегистрируйтесь на Railway**: https://railway.app

3. **Создайте проект**: New Project → Deploy from GitHub repo → выберите свой репозиторий.

4. **Добавьте PostgreSQL**: New → Database → Add PostgreSQL. Railway автоматически подставит `DATABASE_URL`.

5. **Настройте переменные окружения** в Dashboard → Variables:

| Переменная | Значение |
|------------|----------|
| `SECRET_KEY` | сгенерируйте длинный случайный ключ |
| `DEBUG` | `False` |
| `ALLOWED_HOSTS` | `*.up.railway.app` |
| `CORS_ALLOWED_ORIGINS` | `https://ВАШ-ДОМЕН.up.railway.app` |

6. **Задеплойте**: Railway автоматически соберёт Dockerfile и запустит приложение.

7. **Проверьте URL**, который Railway выдаст после деплоя.

### После деплоя

Создайте суперпользователя через Railway Shell:

```bash
cd backend
python manage.py createsuperuser
```

## Возможности MVP

- Регистрация и вход по email
- Учёт доходов и расходов по категориям
- Управление статьями доходов/расходов
- Накопительные фонды (цели) с прогрессом
- Дашборд с графиками и советами
- Импорт операций из CSV
- Экспорт операций в CSV

## API endpoints

- `POST /api/auth/register/`
- `POST /api/auth/login/`
- `GET /api/auth/profile/`
- `GET/POST /api/directories/`
- `GET/POST /api/transactions/`
- `GET/POST /api/funds/`
- `GET /api/analytics/dashboard/`
- `GET /api/analytics/advice/`
- `POST /api/imports/csv/`
