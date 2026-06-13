#!/usr/bin/env tsx
/**
 * Scrapea una carpeta PÚBLICA de Google Drive (con subcarpetas) y carga sus
 * archivos en la tabla `libros`, muestreando de forma BALANCEADA entre categorías.
 *
 * La carpeta debe estar compartida como "Cualquier persona con el enlace" (lector).
 *
 * Cada subcarpeta de primer nivel se trata como una CATEGORÍA. Se toman hasta
 * `--per-category` libros de cada una y luego se reparte en round-robin hasta
 * llegar al tope `--max`, de modo que el catálogo tenga variedad.
 *
 * Uso:
 *   pnpm run scrape-libros                                   # dry-run, defaults
 *   pnpm run scrape-libros -- --max 150                      # tope total
 *   pnpm run scrape-libros -- --max 150 --per-category 10    # hasta 10 por categoría
 *   pnpm run scrape-libros -- --folder <url|id> --insert     # cargar en la base
 *
 * Por cada archivo:
 *   nombre, categoria, link_drive (vista del archivo), imagen_url (thumbnail/portada)
 *
 * Re-ejecutable: omite los libros cuyo link_drive ya existe en la tabla.
 */

import { chromium, type Page } from "playwright"
import { createClient } from "@supabase/supabase-js"
import * as dotenv from "dotenv"
import * as path from "path"

dotenv.config({ path: path.join(process.cwd(), ".env.local") })

const DEFAULT_FOLDER = "1w3tZFxOniajyfD8eVmlw-_kRTLxqIBPs"

interface LibroScrapeado {
  fileId: string
  nombre: string
  categoria: string
  link_drive: string
  imagen_url: string
}

interface Entrada {
  id: string
  nombre: string
  href: string
  esFolder: boolean
}

function parseArgs() {
  const args = process.argv.slice(2)
  const insert = args.includes("--insert")
  const get = (flag: string) => {
    const i = args.indexOf(flag)
    return i >= 0 ? args[i + 1] : undefined
  }
  return {
    insert,
    folderArg: get("--folder") ?? DEFAULT_FOLDER,
    max: Number(get("--max") ?? 150),
    perCategory: Number(get("--per-category") ?? 10),
    depth: Number(get("--depth") ?? 2),
  }
}

function extraerFolderId(input: string): string {
  const match = input.match(/folders\/([a-zA-Z0-9_-]+)/)
  return match ? match[1] : input
}

// Archivos que NO son libros y deben omitirse
const EXT_INVALIDA = /\.(ini|db|url|lnk|mp3|m4a|wav|mp4|avi|mkv|zip|rar|7z|jpe?g|png|gif|bmp|webp|svg|ico)$/i

function esArchivoValido(nombre: string): boolean {
  const n = nombre.trim()
  if (!n) return false
  if (EXT_INVALIDA.test(n)) return false
  if (/^\.?(desktop\.ini|thumbs\.db|ds[_ ]?store)$/i.test(n)) return false
  return true
}

function limpiarNombre(raw: string): string {
  let s = raw.trim()
  // Cortar metadata de archivos pirata (Anna's Archive / WeLib usan " -- " como separador)
  const dd = s.indexOf(" -- ")
  if (dd > 0) s = s.slice(0, dd)
  s = s
    .replace(/\.(pdf|epub|mobi|docx?|txt|azw3?|fb2)$/i, "") // extensión
    .replace(/^copia de\s+/i, "") // "Copia de ..."
    .replace(/\(\s*(z-?lib\.org|welib\.org|annas?\s*archive|anna’s archive)\s*\)/gi, "")
    .replace(/[_]+/g, " ")
    .replace(/^\s*-?\d+\s*[.\-)]\s*/, "") // numeración inicial: "1.", "10. ", "-4.", "8- "
    .replace(/^[\s\-–.]+/, "") // guiones/puntos sueltos al inicio
    .replace(/\s*\(\d+\)\s*$/, "") // "(1)" al final
    .replace(/\s{2,}/g, " ")
    .trim()
  return s || raw.trim()
}

function limpiarCategoria(raw: string): string {
  return raw.replace(/^\s*\d+\.?\s*/, "").trim() || raw.trim()
}

/** Lee todas las entradas (archivos y subcarpetas) de una carpeta de Drive. */
async function leerCarpeta(page: Page, folderId: string): Promise<Entrada[]> {
  const url = `https://drive.google.com/embeddedfolderview?id=${folderId}#list`
  await page.goto(url, { waitUntil: "networkidle", timeout: 30000 })
  try {
    await page.waitForSelector(".flip-entry", { timeout: 8000 })
  } catch {
    return []
  }

  let prevCount = 0
  let estable = 0
  for (let i = 0; i < 60 && estable < 3; i++) {
    const count = await page.locator(".flip-entry").count()
    if (count === prevCount) estable++
    else {
      estable = 0
      prevCount = count
    }
    await page.mouse.wheel(0, 4000)
    await page.waitForTimeout(500)
  }

  return page.$$eval(".flip-entry", (nodes) =>
    nodes.map((n) => {
      const id = (n.getAttribute("id") || "").replace(/^entry-/, "")
      const href = n.querySelector("a")?.getAttribute("href") || ""
      const nombre = n.querySelector(".flip-entry-title")?.textContent?.trim() || ""
      return { id, nombre, href, esFolder: href.includes("/folders/") }
    }),
  )
}

/** Junta hasta `limite` archivos dentro de una categoría (recorre subcarpetas, con corte temprano). */
async function muestrearCategoria(
  page: Page,
  categoryId: string,
  categoria: string,
  maxDepth: number,
  limite: number,
): Promise<LibroScrapeado[]> {
  const out: LibroScrapeado[] = []
  const cola: { id: string; depth: number }[] = [{ id: categoryId, depth: 0 }]

  while (cola.length > 0 && out.length < limite) {
    const { id, depth } = cola.shift()!
    const entradas = await leerCarpeta(page, id)

    for (const e of entradas) {
      if (out.length >= limite) break
      if (!e.esFolder && e.id && e.nombre && esArchivoValido(e.nombre)) {
        out.push({
          fileId: e.id,
          nombre: limpiarNombre(e.nombre),
          categoria,
          link_drive: e.href || `https://drive.google.com/file/d/${e.id}/view`,
          imagen_url: `https://drive.google.com/thumbnail?id=${e.id}&sz=w400`,
        })
      }
    }

    if (depth < maxDepth && out.length < limite) {
      for (const e of entradas) {
        if (e.esFolder && e.id) cola.push({ id: e.id, depth: depth + 1 })
      }
    }
  }

  return out
}

/** Round-robin: intercala libros de cada categoría hasta llegar al tope total. */
function repartir(porCategoria: Map<string, LibroScrapeado[]>, max: number): LibroScrapeado[] {
  const listas = [...porCategoria.values()]
  const out: LibroScrapeado[] = []
  let idx = 0
  while (out.length < max && listas.some((l) => l.length > 0)) {
    const lista = listas[idx % listas.length]
    const libro = lista.shift()
    if (libro) out.push(libro)
    idx++
  }
  return out
}

async function main() {
  const { insert, folderArg, max, perCategory, depth } = parseArgs()
  const folderId = extraerFolderId(folderArg)

  console.log(`📚 Scraper de libros de Drive — carpeta ${folderId}`)
  console.log(insert ? "⚙️  Modo: INSERTAR en la base" : "👀 Modo: DRY-RUN (no toca la base)")
  console.log(`   tope total: ${max}, por categoría: ${perCategory}, profundidad: ${depth}\n`)

  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()
  const porCategoria = new Map<string, LibroScrapeado[]>()

  try {
    const raiz = await leerCarpeta(page, folderId)
    const categorias = raiz.filter((e) => e.esFolder && e.id && e.nombre)
    const archivosRaiz = raiz.filter((e) => !e.esFolder && e.id && e.nombre && esArchivoValido(e.nombre))

    if (archivosRaiz.length > 0) {
      porCategoria.set(
        "General",
        archivosRaiz.slice(0, perCategory).map((e) => ({
          fileId: e.id,
          nombre: limpiarNombre(e.nombre),
          categoria: "General",
          link_drive: e.href || `https://drive.google.com/file/d/${e.id}/view`,
          imagen_url: `https://drive.google.com/thumbnail?id=${e.id}&sz=w400`,
        })),
      )
    }

    console.log(`📁 ${categorias.length} categorías encontradas. Muestreando...\n`)
    for (const cat of categorias) {
      const nombreCat = limpiarCategoria(cat.nombre)
      process.stdout.write(`   ${nombreCat} ... `)
      const libros = await muestrearCategoria(page, cat.id, nombreCat, depth, perCategory)
      porCategoria.set(nombreCat, libros)
      console.log(`${libros.length}`)
      // Corte temprano: si ya juntamos de sobra para el tope, paramos de crawlear más categorías
      const totalJuntado = [...porCategoria.values()].reduce((s, l) => s + l.length, 0)
      if (totalJuntado >= max * 3 && porCategoria.size >= Math.min(categorias.length, 20)) {
        console.log("   (suficiente muestra, corto el crawl)")
        break
      }
    }
  } finally {
    await browser.close()
  }

  const libros = repartir(porCategoria, max)

  if (libros.length === 0) {
    console.error("\n❌ No se encontraron archivos. ¿La carpeta es pública (cualquiera con el enlace)?")
    process.exit(1)
  }

  console.log(`\n✅ Seleccionados ${libros.length} libros (de ${porCategoria.size} categorías)\n`)
  libros.forEach((l, i) =>
    console.log(`  ${String(i + 1).padStart(3)}. [${l.categoria}] ${l.nombre}`),
  )

  if (!insert) {
    console.log("\n👉 Revisá la lista. Para cargarlos agregá --insert al comando.")
    return
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  if (!supabaseUrl || !supabaseKey) {
    console.error("❌ Faltan NEXT_PUBLIC_SUPABASE_URL y/o la key de Supabase en .env.local")
    process.exit(1)
  }
  const supabase = createClient(supabaseUrl, supabaseKey)

  const { data: existentes } = await supabase.from("libros").select("link_drive")
  const yaCargados = new Set((existentes ?? []).map((r) => r.link_drive))

  const { data: maxOrdenRow } = await supabase
    .from("libros")
    .select("orden")
    .order("orden", { ascending: false })
    .limit(1)
  let orden = (maxOrdenRow?.[0]?.orden ?? -1) + 1

  const aInsertar = libros
    .filter((l) => !yaCargados.has(l.link_drive))
    .map((l) => ({
      nombre: l.nombre,
      descripcion: null,
      categoria: l.categoria,
      imagen_url: l.imagen_url,
      link_drive: l.link_drive,
      orden: orden++,
    }))

  const omitidos = libros.length - aInsertar.length
  if (omitidos > 0) console.log(`\n⏭️  ${omitidos} ya estaban cargados, se omiten.`)

  if (aInsertar.length === 0) {
    console.log("✨ Nada nuevo para insertar.")
    return
  }

  for (let i = 0; i < aInsertar.length; i += 500) {
    const { error } = await supabase.from("libros").insert(aInsertar.slice(i, i + 500))
    if (error) {
      console.error("❌ Error insertando lote:", error.message)
      process.exit(1)
    }
  }

  console.log(`\n🎉 Insertados ${aInsertar.length} libros nuevos en la tabla \`libros\`.`)
}

main().catch((err) => {
  console.error("❌ Error inesperado:", err instanceof Error ? err.message : err)
  process.exit(1)
})
