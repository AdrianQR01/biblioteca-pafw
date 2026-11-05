import express from 'express'
import cors from 'cors'
import { PrismaClient } from '@prisma/client'
import dotenv from 'dotenv'

dotenv.config()

const app = express()
const prisma = new PrismaClient()

// R6: Puerto configurable mediante process.env.PORT con valor por defecto
const PORT = Number(process.env.PORT) || 3000
const NODE_ENV = process.env.NODE_ENV || 'development'

// ---------------------------------------------------------------------------
// R7: Configuración de seguridad y variables de entorno para producción
// ---------------------------------------------------------------------------
const API_KEY = process.env.API_KEY
if (!API_KEY) {
  console.warn(
    '[ADVERTENCIA] Falta la variable API_KEY en el entorno. ' +
      'Las operaciones protegidas fallarán hasta que se configure.'
  )
}

// R7 y R8: Orígenes permitidos y CORS adaptado a producción / desarrollo
// Normalizamos FRONTEND_URL quitando barras finales sobrantes (evita fallo común de CORS en Render)
const frontendUrlConfig = (process.env.FRONTEND_URL || process.env.CORS_ORIGIN || '')
  .split(',')
  .map((url) => url.trim().replace(/\/+$/, ''))
  .filter(Boolean)

const esLocalhost = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/

const opcionesCors = {
  origin(origen, callback) {
    // Peticiones sin cabecera Origin (curl, healthchecks de Render, Postman, server-to-server)
    if (!origen) return callback(null, true)

    const origenLimpio = origen.replace(/\/+$/, '')

    // En producción (R8): ÚNICAMENTE se autoriza el FRONTEND_URL público de producción.
    if (NODE_ENV === 'production') {
      if (frontendUrlConfig.includes(origenLimpio)) {
        return callback(null, true)
      }
      return callback(
        new Error(`Origen no permitido por política CORS en producción: ${origen}`)
      )
    }

    // En desarrollo: se autoriza FRONTEND_URL configurado y cualquier puerto de localhost
    if (frontendUrlConfig.includes(origenLimpio) || esLocalhost.test(origenLimpio)) {
      return callback(null, true)
    }

    return callback(new Error(`Origen no permitido por CORS en desarrollo: ${origen}`))
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'X-Api-Key', 'x-api-key'],
  credentials: false,
  maxAge: 86400,
}

// ---------------------------------------------------------------------------
// Middleware de cabeceras de seguridad HTTP (Ampliación Nivel Excelente)
// ---------------------------------------------------------------------------
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'DENY')
  res.setHeader('X-XSS-Protection', '1; mode=block')
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
  if (NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
  }
  next()
})

app.use(cors(opcionesCors))
app.use(express.json())

// Middleware para capturar JSON mal formado sin exponer trazas
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && 'body' in err) {
    return res.status(400).json({ error: 'El cuerpo de la petición no es un JSON válido' })
  }
  if (err.message && err.message.includes('Origen no permitido por')) {
    return res.status(403).json({ error: err.message })
  }
  return next(err)
})

// ---------------------------------------------------------------------------
// R11: Ruta de salud (Health Check) para monitorización y Render keep-alive
// ---------------------------------------------------------------------------
async function healthCheckHandler(req, res) {
  try {
    await prisma.$queryRaw`SELECT 1`
    return res.status(200).json({
      status: 'ok',
      service: 'biblioteca-backend',
      environment: NODE_ENV,
      nodeVersion: process.version,
      uptimeSeconds: Math.floor(process.uptime()),
      database: 'connected',
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    return res.status(503).json({
      status: 'degraded',
      service: 'biblioteca-backend',
      environment: NODE_ENV,
      database: 'disconnected',
      error: NODE_ENV === 'production' ? 'Database unavailable' : error.message,
      timestamp: new Date().toISOString(),
    })
  }
}

app.get('/health', healthCheckHandler)
app.get('/api/health', healthCheckHandler)

// ---------------------------------------------------------------------------
// Middleware de autenticación por cabecera X-Api-Key (R7, R15)
// ---------------------------------------------------------------------------
function checkApiKey(req, res, next) {
  const apiKeyRecibida = req.headers['x-api-key'] || req.headers['X-Api-Key']

  if (!apiKeyRecibida) {
    return res.status(401).json({ error: 'Falta la cabecera X-Api-Key: operación protegida' })
  }

  if (!API_KEY || apiKeyRecibida !== API_KEY) {
    return res.status(401).json({ error: 'API key incorrecta' })
  }

  return next()
}

// ---------------------------------------------------------------------------
// Validación de datos para Libros
// ---------------------------------------------------------------------------
function validarLibro(body, { parcial = false } = {}) {
  const errores = []
  const datos = {}

  const tiene = (campo) => Object.prototype.hasOwnProperty.call(body, campo)

  if (!parcial || tiene('titulo')) {
    const titulo = typeof body.titulo === 'string' ? body.titulo.trim() : ''
    if (titulo.length < 1) errores.push('El título es obligatorio')
    else if (titulo.length > 200) errores.push('El título no puede superar 200 caracteres')
    else datos.titulo = titulo
  }

  if (tiene('descripcion')) {
    if (body.descripcion === null || body.descripcion === '') datos.descripcion = null
    else if (typeof body.descripcion !== 'string') errores.push('La descripción debe ser texto')
    else datos.descripcion = body.descripcion.trim()
  }

  if (tiene('anioPublicacion')) {
    if (body.anioPublicacion === null || body.anioPublicacion === '') {
      datos.anioPublicacion = null
    } else {
      const anio = Number(body.anioPublicacion)
      if (!Number.isInteger(anio) || anio < 0 || anio > 2100) {
        errores.push('El año de publicación debe ser un entero entre 0 y 2100')
      } else {
        datos.anioPublicacion = anio
      }
    }
  }

  if (tiene('puntuacion')) {
    if (body.puntuacion === null || body.puntuacion === '') {
      datos.puntuacion = null
    } else {
      const puntuacion = Number(body.puntuacion)
      if (!Number.isInteger(puntuacion) || puntuacion < 0 || puntuacion > 10) {
        errores.push('La puntuación debe ser un entero entre 0 y 10')
      } else {
        datos.puntuacion = puntuacion
      }
    }
  }

  if (tiene('leido')) {
    if (typeof body.leido !== 'boolean') errores.push('El campo leído debe ser booleano')
    else datos.leido = body.leido
  }

  if (!parcial || tiene('autorId')) {
    const autorId = Number(body.autorId)
    if (!Number.isInteger(autorId) || autorId <= 0) errores.push('Debes indicar un autor válido')
    else datos.autorId = autorId
  }

  return { errores, datos }
}

async function existeAutor(autorId) {
  const autor = await prisma.autor.findUnique({ where: { id: autorId } })
  return Boolean(autor)
}

// ---------------------------------------------------------------------------
// Rutas públicas — Lecturas (GET)
// ---------------------------------------------------------------------------
app.get('/api/autores', async (req, res, next) => {
  try {
    const autores = await prisma.autor.findMany({ orderBy: { nombre: 'asc' } })
    res.json(autores)
  } catch (error) {
    next(error)
  }
})

app.get('/api/libros', async (req, res, next) => {
  try {
    const libros = await prisma.libro.findMany({
      include: { autor: true },
      orderBy: { id: 'asc' },
    })
    res.json(libros)
  } catch (error) {
    next(error)
  }
})

app.get('/api/libros/:id', async (req, res, next) => {
  const id = Number(req.params.id)
  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: 'El id del libro debe ser un número entero' })
  }
  try {
    const libro = await prisma.libro.findUnique({
      where: { id },
      include: { autor: true },
    })
    if (!libro) return res.status(404).json({ error: 'Libro no encontrado' })
    return res.json(libro)
  } catch (error) {
    next(error)
  }
})

// ---------------------------------------------------------------------------
// Rutas protegidas — Escrituras (POST, PATCH, DELETE)
// ---------------------------------------------------------------------------
app.post('/api/libros', checkApiKey, async (req, res, next) => {
  const { errores, datos } = validarLibro(req.body || {})
  if (errores.length > 0) return res.status(400).json({ error: errores.join('. ') })

  try {
    if (!(await existeAutor(datos.autorId))) {
      return res.status(400).json({ error: 'El autor indicado no existe' })
    }
    const libro = await prisma.libro.create({
      data: datos,
      include: { autor: true },
    })
    return res.status(201).json(libro)
  } catch (error) {
    next(error)
  }
})

app.patch('/api/libros/:id', checkApiKey, async (req, res, next) => {
  const id = Number(req.params.id)
  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: 'El id del libro debe ser un número entero' })
  }

  const { errores, datos } = validarLibro(req.body || {}, { parcial: true })
  if (errores.length > 0) return res.status(400).json({ error: errores.join('. ') })
  if (Object.keys(datos).length === 0) {
    return res.status(400).json({ error: 'No se ha enviado ningún campo para actualizar' })
  }

  try {
    if (datos.autorId && !(await existeAutor(datos.autorId))) {
      return res.status(400).json({ error: 'El autor indicado no existe' })
    }
    const libro = await prisma.libro.update({
      where: { id },
      data: datos,
      include: { autor: true },
    })
    return res.json(libro)
  } catch (error) {
    if (error.code === 'P2025') return res.status(404).json({ error: 'Libro no encontrado' })
    next(error)
  }
})

app.delete('/api/libros/:id', checkApiKey, async (req, res, next) => {
  const id = Number(req.params.id)
  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: 'El id del libro debe ser un número entero' })
  }
  try {
    await prisma.libro.delete({ where: { id } })
    return res.json({ message: 'Libro eliminado', id })
  } catch (error) {
    if (error.code === 'P2025') return res.status(404).json({ error: 'Libro no encontrado' })
    next(error)
  }
})

// Rutas no encontradas (404) en formato JSON
app.use((req, res) => {
  res.status(404).json({ error: `Ruta no encontrada: ${req.method} ${req.originalUrl}` })
})

// ---------------------------------------------------------------------------
// R11: Manejador global de errores: NUNCA expone trazas (stack traces) en producción
// ---------------------------------------------------------------------------
app.use((err, req, res, next) => {
  // Siempre registramos el detalle del error en la consola del servidor para diagnóstico en logs (R17)
  console.error(`[ERROR] [${new Date().toISOString()}] ${req.method} ${req.originalUrl}:`, err)

  if (res.headersSent) {
    return next(err)
  }

  const statusCode = err.status || err.statusCode || 500

  if (NODE_ENV === 'production') {
    return res.status(statusCode).json({
      error: 'Ha ocurrido un error interno en el servidor. Por favor, inténtelo más tarde.',
    })
  }

  // En desarrollo se expone el mensaje y stack trace para depuración
  return res.status(statusCode).json({
    error: err.message || 'Error interno',
    stack: err.stack,
  })
})

export { app }

// Escuchamos en 0.0.0.0 para compatibilidad universal con entornos de contenedores en Render
const servidor = app.listen(PORT, '0.0.0.0', () => {
  console.log(`[BIBLIOTECA BACKEND] Servidor escuchando en http://0.0.0.0:${PORT} (${NODE_ENV})`)
})

// Cierre ordenado de conexiones
for (const senal of ['SIGINT', 'SIGTERM']) {
  process.on(senal, async () => {
    console.log(`\nRecibida señal ${senal}. Cerrando servidor y desconectando Prisma...`)
    servidor.close()
    await prisma.$disconnect()
    process.exit(0)
  })
}
