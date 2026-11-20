# ✅ Verificación de requisitos — PAFW Fase 3 (Bloque 3: Despliegue)

**Proyecto:** Biblioteca (Express + Prisma + SQLite · React 18 + Vite)
**Repositorio:** https://github.com/AdrianQR01/biblioteca-pafw
**Frontend:** https://biblioteca-frontend-adrian.onrender.com
**Backend:** https://biblioteca-backend-adrian.onrender.com
**Fecha de verificación:** 20 de noviembre de 2026

---

## 1. Estado global

| Comprobación | Resultado |
|---|---|
| Backend público `GET /health` | `200 OK` (cold start de 22,5 s al despertar) |
| Backend público `GET /api/libros` | `200 OK`, devuelve el catálogo (3 autores / 3 libros) |
| Frontend público | `200 OK` (Static Site) |
| Tests frontend (Vitest) | 12/12 pasan |
| Lint frontend (ESLint `--max-warnings=0`) | Sin errores ni warnings |
| Build frontend (`vite build`) | Correcto (153,67 kB → 49,43 kB gzip) |
| Build backend (`prisma generate`) | Correcto |
| Commits en `main` | 14 |
| Repositorios Git anidados | Ninguno |
| `.env` / `*.db` versionados | Ninguno |
| Secreto activo en el árbol de trabajo | Ninguno |

---

## 2. Checklist R1–R19

### Git y GitHub

| ID | Requisito | Estado | Evidencia |
|---|---|:---:|---|
| R1 | Backend y Frontend funcionando en local | ✅ | `npm run build` (backend), `npm test`, `npm run lint`, `npm run build` (frontend) ejecutados con éxito el 20/11/2026 |
| R2 | Repositorio Git en la raíz, sin repos anidados | ✅ | Un único `.git` en `biblioteca/`; `backend/` y `frontend/` son carpetas normales |
| R3 | `.gitignore` excluye `node_modules`, `.env`, BD y artefactos | ✅ | `.gitignore` raíz + uno por subproyecto; `git ls-files` no muestra `.env` ni `*.db` |
| R4 | ≥ 8 commits comprensibles por hitos | ✅ | 14 commits con convención `feat/fix/chore/ci/docs/test` |
| R5 | GitHub con rama `main`, README y `.env.example` en ambos | ✅ | `main` es rama por defecto; `README.md`, `backend/.env.example`, `frontend/.env.example` |

### Preparación para producción

| ID | Requisito | Estado | Evidencia |
|---|---|:---:|---|
| R6 | Backend preparado para `process.env.PORT` | ✅ | `const PORT = Number(process.env.PORT) \|\| 3000` + `listen(PORT, '0.0.0.0')` |
| R7 | Configuración por variables (`API_KEY`, `DATABASE_URL`, `FRONTEND_URL`) | ✅ | `backend/src/index.js` + panel de Render / `render.yaml` |
| R8 | CORS limitado al Frontend de producción | ✅ | Middleware CORS condicional por `NODE_ENV`. Verificado en producción: `Origin: https://evil.example.com` → `403`; `Origin: https://biblioteca-frontend-adrian.onrender.com` → `200` |
| R9 | Versión de Node fijada | ✅ | `.node-version` = `20.18.0` (raíz, backend y frontend) + `NODE_VERSION` en Render + `engines` |
| R10 | BD creada al arrancar y semilla repetible | ✅ | Build: `prisma db push` + `node src/seed.js`; semilla idempotente con `autor.count()` |
| R11 | Errores sin trazas en producción + ruta de salud | ✅ | Handler global con `NODE_ENV === 'production'`; `GET /health` y `/api/health` |

### Despliegue

| ID | Requisito | Estado | Evidencia |
|---|---|:---:|---|
| R12 | Backend como Web Service con comandos correctos | ✅ | Root `backend`; build `npm install && npm run build && npx prisma db push && node src/seed.js`; start `npm start`; health `/health` |
| R13 | Frontend construido con Vite como Static Site | ✅ | Root `frontend`; build `npm install && npm run build`; publish `dist`; rewrite `/* → /index.html` |
| R14 | `VITE_API_URL` apuntando al backend HTTPS | ✅ | `https://biblioteca-backend-adrian.onrender.com/api` |
| R15 | Secretos fuera de repo, memoria y capturas | ✅* | Sin `.env` versionado; clave rotada tras la fuga del commit `863ba99` (el valor antiguo devuelve `401`) |
| R16 | CRUD completo desde la URL pública | ✅ | Rutas `GET`/`POST`/`PATCH`/`DELETE` sobre `/api/libros` con `X-Api-Key`; en producción se ha verificado que las rutas protegidas exigen clave (`401` sin clave o con clave inválida) y que el CRUD se opera desde la interfaz pública |

### Operación

| ID | Requisito | Estado | Evidencia |
|---|---|:---:|---|
| R17 | Logs usados para diagnosticar una incidencia | ✅ | Incidencia CORS por barra final en `FRONTEND_URL` (sección 12 de la memoria) |
| R18 | Autodeploy comprobado (commit + push → deploy → cambio visible) | ✅ | Footer `v1.0.1-fase3` desplegado tras `git push` en `main` |
| R19 | Limitación de SQLite en Free + alternativa conceptual | ✅ | Sección 13 de la memoria: disco efímero, cold start y migración a PostgreSQL/Supabase/Neon |

\* R15 requiere una acción manual pendiente: **purgar la clave antigua del historial de Git** (ver apartado 3). El valor está muerto (401), pero sigue siendo visible en el historial público.

---

## 3. Incidencias abiertas y acciones recomendadas

1. **Clave antigua en el historial (R15).** El commit `863ba99` eliminó del README la clave `API_KEY` de producción, pero el valor permanece en el historial. La clave ya está rotada en Render (verificado: `PATCH` con ese valor → `401`; con la clave vigente → operación válida). Para dejarlo impecable:
   - Rotar de nuevo la clave en Render y actualizar el Web Service.
   - Reescribir el historial (`git filter-repo` o `git filter-branch`) + `git push --force-with-lease`.
   - Alternativa: dejar constancia en la memoria (ya documentado en la sección 9).
2. **Cold start.** Documentado; abrir `/health` un minuto antes de la defensa.
3. **Persistencia.** SQLite se reinicia en cada deploy; el seed repuebla el catálogo.

---

## 4. Cómo reproducir esta verificación

```bash
# API pública
curl -i https://biblioteca-backend-adrian.onrender.com/health
curl -s https://biblioteca-backend-adrian.onrender.com/api/libros | head

# Frontend público
curl -I https://biblioteca-frontend-adrian.onrender.com/

# Local
cd backend  && npm run build
cd frontend && npm test && npm run lint && npm run build

# Repositorio
git log --oneline
git ls-files | grep -E '\.env$|\.db$' || echo "sin secretos ni BD versionados"
```
