import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const forzar = process.argv.includes('--force') || process.env.SEED_FORCE === 'true'

  const totalAutores = await prisma.autor.count()
  const totalLibros = await prisma.libro.count()

  if (totalAutores > 0 && !forzar) {
    console.log(
      `[SEED] La base de datos ya contiene datos (${totalAutores} autores, ${totalLibros} libros). ` +
        'Omitiendo seed para preservar la información (usa --force para reiniciar).'
    )
    return
  }

  if (forzar && totalAutores > 0) {
    console.log('[SEED] Limpiando datos existentes por flag --force...')
    await prisma.libro.deleteMany()
    await prisma.autor.deleteMany()
  }

  console.log('[SEED] Creando autores iniciales...')
  const autor1 = await prisma.autor.create({
    data: {
      nombre: 'Isabel Allende',
      bio: 'Escritora chilena, autora de superventas y referente de la literatura hispanoamericana contemporánea.',
    },
  })

  const autor2 = await prisma.autor.create({
    data: {
      nombre: 'Gabriel García Márquez',
      bio: 'Escritor colombiano, Premio Nobel de Literatura 1982 y máximo exponente del realismo mágico.',
    },
  })

  const autor3 = await prisma.autor.create({
    data: {
      nombre: 'Mario Vargas Llosa',
      bio: 'Escritor hispanoperuano, Premio Nobel de Literatura 2010 y miembro de la Real Academia Española.',
    },
  })

  console.log('[SEED] Creando libros iniciales...')
  await prisma.libro.createMany({
    data: [
      {
        titulo: 'La casa de los espíritus',
        descripcion: 'Novela cumbre que combina saga familiar con acontecimientos sociopolíticos en Chile.',
        anioPublicacion: 1982,
        autorId: autor1.id,
        leido: true,
        puntuacion: 9,
      },
      {
        titulo: 'Cien años de soledad',
        descripcion: 'Obra maestra del realismo mágico sobre la mítica familia Buendía en Macondo.',
        anioPublicacion: 1967,
        autorId: autor2.id,
        leido: true,
        puntuacion: 10,
      },
      {
        titulo: 'La fiesta del Chivo',
        descripcion: 'Reconstrucción de la dictadura de Rafael Leónidas Trujillo en la República Dominicana.',
        anioPublicacion: 2000,
        autorId: autor3.id,
        leido: false,
        puntuacion: 8,
      },
    ],
  })

  console.log('[SEED] Semilla repetible completada con éxito. Catálogo inicial listo para producción.')
}

main()
  .catch((e) => {
    console.error('[SEED ERROR]', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
