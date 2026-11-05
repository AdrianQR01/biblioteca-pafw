# 📚 Proyecto Biblioteca — Sistema de Gestión Bibliográfica

[![CI Status](https://github.com/AdrianQR01/biblioteca-pafw/actions/workflows/ci.yml/badge.svg)](https://github.com/AdrianQR01/biblioteca-pafw/actions)
[![Node.js](https://img.shields.io/badge/Node.js-20.18.0-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.18-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![Prisma](https://img.shields.io/badge/Prisma-6.19-2D3748?logo=prisma&logoColor=white)](https://www.prisma.io/)
[![React](https://img.shields.io/badge/React-18.2-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5.0-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Render](https://img.shields.io/badge/Deploy-Render-46E3B7?logo=render&logoColor=white)](https://render.com/)

**Asignatura:** Programación de Aplicaciones Utilizando Frameworks (PAFW) · 2.º DAW  
**Autor:** Adrián Quenard (Adrian QR)  
**Entrega:** FASE 3 — BLOQUE 3: DESPLIEGUE · Git + GitHub + Render  

---

## 🌐 URLs Públicas en Producción (Render)

| Servicio | Tipo en Render | URL Pública | Estado / Health Check |
|---|---|---|---|
| **Frontend** | Static Site (Vite SPA) | [https://biblioteca-frontend-adrian.onrender.com](https://biblioteca-frontend-adrian.onrender.com) | `200 OK` (Vite Build) |
| **Backend API** | Web Service (Node.js) | [https://biblioteca-backend-adrian.onrender.com](https://biblioteca-backend-adrian.onrender.com) | [`/health`](https://biblioteca-backend-adrian.onrender.com/health) |

> ⚠️ **Nota sobre el arranque en frío (Cold Start):**  
> Al estar alojado en el plan gratuito (*Free Tier*) de Render, el backend entra en suspensión tras 15 minutos de inactividad. La primera petición puede demorarse entre 40 y 60 segundos mientras el contenedor se reactiva. Una vez despierto, el rendimiento es instantáneo.

---

## 🏗️ 1. Arquitectura del Proyecto

El proyecto sigue una arquitectura desacoplada cliente-servidor comunicada mediante HTTPS y JSON con cabeceras de seguridad y control estricto de CORS:

```
┌────────────────────────────────────────────────────────┐
│                   NAVEGADOR CLIENTE                    │
│      Frontend React 18 + Vite (Static Site en Render)  │
│         https://biblioteca-frontend-adrian.onrender.com│
└──────────────────────────┬─────────────────────────────┘
                           │
             HTTPS / JSON  │ Cabeceras:
             Fetch API     │ • Content-Type: application/json
                           │ • X-Api-Key: [sessionStorage]
                           ▼
┌────────────────────────────────────────────────────────┐
│                    BACKEND EXPRESS                     │
│         Web Service Node.js 20.x (Render Container)    │
│          https://biblioteca-backend-adrian.onrender.com │
├────────────────────────────────────────────────────────┤
│  [Middleware Seguridad] Helmet headers + CORS estricto │
│  [Middleware Auth] Verificación X-Api-Key (POST/PATCH) │
│  [API Endpoints] /api/autores, /api/libros, /health    │
│  [Error Handler] Trazas ocultas en producción          │
└──────────────────────────┬─────────────────────────────┘
                           │
             Prisma Client │ Relación 1:N (Autor -> Libros)
                           ▼
┌────────────────────────────────────────────────────────┐
│                   ALMACENAMIENTO                       │
│      SQLite dev.db (Disco efímero en contenedor)       │
│      Semilla repetible e idempotente al arrancar       │
└────────────────────────────────────────────────────────┘
```

---

## 📁 2. Estructura del Repositorio

El repositorio está organizado como una estructura de raíz única (*monorepo* limpio) sin repositorios anidados:

```
biblioteca/
├── .github/
│   └── workflows/
│       └── ci.yml               # Workflow de integración continua (GitHub Actions)
├── backend/
│   ├── docs/
│   │   └── evidencias-api.txt   # Trazas y evidencias de respuesta de la API
│   ├── prisma/
│   │   └── schema.prisma        # Modelo de datos Prisma (Autor 1:N Libro)
│   ├── src/
│   │   ├── index.js             # Servidor Express, CORS condicional, /health y rutas
│   │   └── seed.js              # Semilla idempotente y repetible
│   ├── .env.example             # Plantilla de variables para backend
│   ├── .gitignore               # Exclusiones de node_modules, .env y SQLite
│   └── package.json             # Dependencias de Express, Prisma y engines
├── frontend/
│   ├── public/
│   │   └── _redirects           # Regla SPA para Render Static Site (/* -> /index.html 200)
│   ├── src/
│   │   ├── components/
│   │   │   ├── AutorSelect.jsx      # Desplegable reactivo de autores
│   │   │   ├── LibroFiltros.jsx     # Filtro en memoria por texto, autor y estado
│   │   │   ├── LibroFormulario.jsx  # Formulario controlado de alta y edición
│   │   │   └── LibroLista.jsx       # Tarjetas del catálogo con key=libro.id
│   │   ├── services/
│   │   │   ├── api.js           # Capa de abstracción fetch y sessionStorage
│   │   │   └── api.test.js      # Pruebas unitarias del servicio
│   │   ├── App.jsx              # Contenedor principal y gestión de estado
│   │   ├── App.test.jsx         # 8 pruebas de integración de interfaz con Vitest
│   │   ├── index.css            # Estilos y diseño adaptativo
│   │   └── main.jsx             # Punto de entrada ReactDOM
│   ├── .env.example             # Plantilla de variables para frontend
│   ├── .gitignore               # Exclusiones de dist/ y node_modules
│   ├── eslint.config.js         # Configuración de ESLint sin warnings
│   ├── index.html               # Plantilla HTML con montaje #root
│   ├── package.json             # Dependencias de React 18, Vite y scripts
│   └── vite.config.js           # Configuración de Vite y Vitest
├── .gitignore                   # Exclusiones globales de Git
├── .node-version                # Versión de Node.js fijada (20.18.0)
├── render.yaml                  # Blueprint de infraestructura como código (IaC)
└── README.md                    # Documentación del proyecto
```

---

## ⚙️ 3. Variables de Entorno

### Backend (`backend/.env` / Panel de Render)

| Variable | Descripción | Valor en Local | Valor en Producción (Render) | ¿Secreto? |
|---|---|---|---|:---:|
| `PORT` | Puerto de escucha de Express | `3000` | Inyectado por Render (ej. `10000`) | No |
| `NODE_ENV` | Entorno de ejecución (`development` / `production`) | `development` | `production` | No |
| `DATABASE_URL` | Cadena de conexión para Prisma SQLite | `file:./dev.db` | `file:./dev.db` | No |
| `API_KEY` | Clave para rutas de escritura (`POST`, `PATCH`, `DELETE`) | `[definida en backend/.env]` | `[definida en el panel de Render]` | **SÍ** |
| `FRONTEND_URL` | Origen permitido por la política estricta de CORS | `http://localhost:5173` | `https://biblioteca-frontend-adrian.onrender.com` | No |

> ⚠️ **Regla de oro sobre `FRONTEND_URL`:** No debe incluir barra final (`/`). Si se introduce con barra final, la comparación contra la cabecera `Origin` del navegador fallará y provocará un bloqueo CORS.

### Frontend (`frontend/.env` / Panel de Render)

| Variable | Descripción | Valor en Local | Valor en Producción (Render) | ¿Secreto? |
|---|---|---|---|:---:|
| `VITE_API_URL` | URL base de la API consumida por el cliente | `http://localhost:3000/api` | `https://biblioteca-backend-adrian.onrender.com/api` | No |

> 🔒 **Seguridad de la API Key en el Frontend:**  
> La `API_KEY` **NUNCA** se introduce en variables `VITE_*` ni se versiona en el repositorio. En el Frontend, la clave la introduce el usuario desde la interfaz y se almacena exclusivamente en `sessionStorage` (`biblioteca.apiKey`), enviándose en la cabecera `X-Api-Key`. Al cerrar la pestaña del navegador, la clave se destruye automáticamente.

---

## 🚀 4. Puesta en Marcha en Entorno Local

### Requisitos previos
- Node.js versión `>= 20.0.0`
- Gestor de paquetes `npm`

### Paso 1: Clonar el repositorio
```bash
git clone https://github.com/AdrianQR01/biblioteca-pafw.git
cd biblioteca-pafw
```

### Paso 2: Configurar y arrancar el Backend
```bash
cd backend
cp .env.example .env
npm install
npm run setup   # Genera Prisma Client, sincroniza el esquema SQLite y ejecuta el seed
npm run dev     # Arranca en modo watch en http://localhost:3000
```

Puedes verificar el estado del backend accediendo a:
- Estado del servicio: `http://localhost:3000/health`
- Catálogo de autores: `http://localhost:3000/api/autores`
- Catálogo de libros: `http://localhost:3000/api/libros`

### Paso 3: Configurar y arrancar el Frontend (en otra terminal)
```bash
cd frontend
cp .env.example .env
npm install
npm run test    # Ejecuta los 12 tests unitarios e integrados
npm run dev     # Arranca el servidor Vite en http://localhost:5173
```

Abre tu navegador en `http://localhost:5173`. Para crear, modificar o eliminar libros, introduce la clave configurada en `backend/.env` en el bloque "Clave de sesión". Su valor no se documenta: solo vive en el entorno local y en el panel de Render.

---

## ☁️ 5. Despliegue en Render

El despliegue puede realizarse de forma automática mediante el archivo `render.yaml` (Blueprint) o manualmente creando los servicios en el panel de control:

### Opción A: Despliegue mediante Blueprint (`render.yaml`)
1. Inicia sesión en [Render Dashboard](https://dashboard.render.com/).
2. Haz clic en **Blueprints** → **New Blueprint Instance**.
3. Selecciona tu repositorio de GitHub `AdrianQR01/biblioteca-pafw`.
4. Render leerá el archivo `render.yaml`, provisionará automáticamente el Web Service y el Static Site, y vinculará los parámetros requeridos.

### Opción B: Despliegue manual paso a paso

#### 1. Backend (Web Service)
- **Name:** `biblioteca-backend`
- **Runtime:** `Node`
- **Region:** `Frankfurt (EU Central)`
- **Branch:** `main`
- **Root Directory:** `backend`
- **Build Command:** `npm install && npm run build && npx prisma db push && node src/seed.js`
- **Start Command:** `npm start`
- **Health Check Path:** `/health`
- **Environment Variables:**
  - `NODE_VERSION` = `20.18.0`
  - `NODE_ENV` = `production`
  - `DATABASE_URL` = `file:./dev.db`
  - `API_KEY` = `[Generar clave secreta aleatoria]`
  - `FRONTEND_URL` = `https://biblioteca-frontend-adrian.onrender.com`

#### 2. Frontend (Static Site)
- **Name:** `biblioteca-frontend`
- **Branch:** `main`
- **Root Directory:** `frontend`
- **Build Command:** `npm install && npm run build`
- **Publish Directory:** `dist`
- **Redirects / Rewrites:** `/*` → `/index.html` (Rewrite, HTTP 200)
- **Environment Variables:**
  - `NODE_VERSION` = `20.18.0`
  - `VITE_API_URL` = `https://biblioteca-backend-adrian.onrender.com/api`

---

## 🔄 6. Despliegue Continuo (CI/CD y Autodeploy)

- **GitHub Actions (CI):** En cada `push` o `pull_request` a la rama `main`, se ejecutan automáticamente las comprobaciones de linting, la suite de 12 pruebas automatizadas y el build estático.
- **Render Autodeploy:** Render está conectado mediante webhooks al repositorio de GitHub. Cuando un commit llega a la rama `main`, Render dispara automáticamente el proceso de construcción y despliegue sin intervención manual.

---

## 💡 7. Persistencia y Limitaciones de SQLite en Render Free

- **Limitación:** Las instancias gratuitas de Render operan sobre contenedores Docker con **sistema de ficheros efímero** (*ephemeral storage*). Cuando el servicio entra en reposo por inactividad o cuando se produce un nuevo despliegue, el contenedor se destruye y se levanta uno limpio. En consecuencia, cualquier modificación en `dev.db` realizada en tiempo de ejecución se pierde y se reinicia con la semilla.
- **Semilla idempotente:** El script `src/seed.js` implementa comprobaciones defensivas para poblar el catálogo de autores y libros únicamente si la base de datos está vacía, evitando colisiones de datos.
- **Solución para producción real:** Para una persistencia permanente en producción, la solución estándar consiste en sustituir SQLite por un servidor de bases de datos gestionado con almacenamiento en red persistente (por ejemplo, **PostgreSQL en Render**, **Supabase** o **Neon**), actualizando únicamente el proveedor en `schema.prisma` a `provider = "postgresql"` y la variable `DATABASE_URL`.

---

## 🧪 8. Pruebas y Calidad de Código

```bash
# Frontend: 12 pruebas unitarias y de integración
cd frontend && npm test

# Frontend: Análisis estático de código
cd frontend && npm run lint

# Backend: Inicialización y verificación de base de datos
cd backend && npm run setup
```

---

## 📜 Licencia
Proyecto educativo desarrollado para el módulo PAFW del ciclo formativo de grado superior en Desarrollo de Aplicaciones Web (DAW).
