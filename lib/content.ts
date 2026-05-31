// Content library for LWS Options Lab — extracted from the production site.
// Powers the content platform half of the fused dashboard.

export type ContentTipo =
  | "articulo"
  | "directo"
  | "mentoria-grupal"
  | "qa"
  | "taller"
  | "video"

export type AccessLevel = "free" | "freemium" | "premium"

export interface ContentItem {
  id: number
  slug: string
  title: string
  excerpt: string
  tipo: ContentTipo
  access: AccessLevel
  date: string // ISO
  image?: string
}

export interface TipoMeta {
  key: ContentTipo
  label: string
  count: number
}

// Display metadata + sidebar counts (mirrors the live site)
export const TIPOS: TipoMeta[] = [
  { key: "articulo", label: "Artículos", count: 34 },
  { key: "directo", label: "Directos", count: 3 },
  { key: "mentoria-grupal", label: "Mentoría Grupal", count: 2 },
  { key: "qa", label: "Q&A", count: 6 },
  { key: "taller", label: "Talleres", count: 5 },
  { key: "video", label: "Vídeos", count: 8 },
]

export const TIPO_LABEL: Record<ContentTipo, string> = {
  articulo: "Artículos",
  directo: "Directos",
  "mentoria-grupal": "Mentoría Grupal",
  qa: "Q&A",
  taller: "Talleres",
  video: "Vídeos",
}

export const content: ContentItem[] = [
  {
    id: 398,
    slug: "bitacora-options-lab-cinco-meses",
    title:
      "Bitácora Options Lab: cinco meses de excelentes resultados y la operativa de la que más orgulloso estoy",
    excerpt: "Índice del artículo de hoy: Introducción. Por qué a veces hay que parar a mirar atrás…",
    tipo: "articulo",
    access: "freemium",
    date: "2026-05-30",
  },
  {
    id: 252,
    slug: "los-tercios-y-el-malentendido-de-theta",
    title: "Los Tercios y el Malentendido de Theta: las diferentes formas de envejecer de una Opción",
    excerpt: "Los Tercios fueron la unidad militar más sofisticada de su tiempo. Carlos V los fundó…",
    tipo: "articulo",
    access: "freemium",
    date: "2026-05-22",
  },
  {
    id: 250,
    slug: "directo-con-suscriptores-mayo-2026-qa",
    title: "Directo con suscriptores – mayo 2026 – Sesión Q&A",
    excerpt: "Sesión de LWS Options Lab sobre el directo con suscriptores de mayo 2026…",
    tipo: "video",
    access: "free",
    date: "2026-05-18",
  },
  {
    id: 248,
    slug: "las-4-preguntas-venta-de-put",
    title: "Las 4 preguntas que todos me hacen sobre la venta de put",
    excerpt: "Índice del artículo de hoy: Introducción. Cómo empecé. Cuándo buscar el strike…",
    tipo: "articulo",
    access: "freemium",
    date: "2026-05-16",
  },
  {
    id: 188,
    slug: "el-sindrome-del-gaijin",
    title: "El síndrome del Gaijin: cuando cerrar duele más que perder",
    excerpt: "Antes de empezar, un apunte. LWS Options Lab ha reabierto plazas tras varios meses…",
    tipo: "articulo",
    access: "freemium",
    date: "2026-05-10",
  },
  {
    id: 187,
    slug: "taller-5-mayo-2026",
    title: "Taller #5 — Theta: utiliza el tiempo a tu favor",
    excerpt: "Taller de LWS Options Lab: formación práctica para entender el decaimiento temporal…",
    tipo: "taller",
    access: "free",
    date: "2026-05-08",
  },
  {
    id: 186,
    slug: "qa-5-mayo-2026",
    title: "Q&A #5 – Mayo 2026",
    excerpt: "Sesión de LWS Options Lab: preguntas, respuestas y análisis práctico…",
    tipo: "qa",
    access: "free",
    date: "2026-05-07",
  },
  {
    id: 185,
    slug: "dentro-del-informe-diario",
    title: "Dentro del informe diario de Options Lab: página por página",
    excerpt: "Hay quien abre TradingView cada mañana. Los suscriptores abren treinta páginas…",
    tipo: "articulo",
    access: "freemium",
    date: "2026-05-05",
  },
  {
    id: 184,
    slug: "poor-mans-covered-call-granada",
    title: "Poor Man's Covered Call: el desgrane de la Granada",
    excerpt: "Los 280 años que nadie cuenta. ¿Qué pensarías si te dijera que los reinos…",
    tipo: "articulo",
    access: "freemium",
    date: "2026-04-28",
  },
  {
    id: 183,
    slug: "the-big-lie",
    title: "The “Big Lie”",
    excerpt: "Índice del artículo de hoy: La gran mentira. El “director's cut”. Primera operación…",
    tipo: "articulo",
    access: "freemium",
    date: "2026-04-22",
  },
  {
    id: 182,
    slug: "directo-abril-2026-qa",
    title: "Directo con suscriptores – abril 2026 – Sesión Q&A",
    excerpt: "Sesión de LWS Options Lab sobre el directo con suscriptores de abril 2026…",
    tipo: "video",
    access: "free",
    date: "2026-04-20",
  },
  {
    id: 181,
    slug: "el-dilema-del-tribuno",
    title: "El Dilema del Tribuno: vender puts como acto de convicción",
    excerpt: "El poder corrompe. Este es el segundo artículo que dedico a darle cera…",
    tipo: "articulo",
    access: "freemium",
    date: "2026-04-18",
  },
  {
    id: 180,
    slug: "taller-4-leaps-pmcc",
    title: "Taller #4 – LEAPs, Poor Man's Covered Calls y otros usos",
    excerpt: "Taller de LWS Options Lab sobre LEAPs y Poor Man's Covered Calls…",
    tipo: "taller",
    access: "free",
    date: "2026-04-12",
  },
  {
    id: 179,
    slug: "qa-especial-4-abril-2026",
    title: "Q&A especial suscriptores #4 – Abril 2026",
    excerpt: "Sesión de LWS Options Lab: preguntas, respuestas y análisis práctico…",
    tipo: "qa",
    access: "free",
    date: "2026-04-08",
  },
  {
    id: 178,
    slug: "el-judoka-de-la-volatilidad",
    title: "El judoka de la volatilidad",
    excerpt: "Hay un principio en el judo: usar la fuerza del contrario a tu favor…",
    tipo: "articulo",
    access: "freemium",
    date: "2026-03-28",
  },
  {
    id: 176,
    slug: "directo-marzo-2026-qa",
    title: "Directo con suscriptores – marzo 2026 – Sesión Q&A",
    excerpt: "Sesión de LWS Options Lab sobre el directo con suscriptores de marzo 2026…",
    tipo: "qa",
    access: "free",
    date: "2026-03-20",
  },
  {
    id: 174,
    slug: "taller-3-rolar-opciones",
    title: "Taller #3 – Guía: cómo ROLAR opciones con sentido común",
    excerpt: "Taller de LWS Options Lab sobre cómo rolar opciones con sentido común…",
    tipo: "taller",
    access: "free",
    date: "2026-03-12",
  },
  {
    id: 171,
    slug: "directo-febrero-2026-qa",
    title: "Directo con suscriptores – febrero 2026 – Sesión Q&A",
    excerpt: "Sesión de LWS Options Lab sobre el directo con suscriptores de febrero 2026…",
    tipo: "video",
    access: "free",
    date: "2026-02-20",
  },
  {
    id: 168,
    slug: "mentoria-grupal-reducida-con-gon",
    title: "Mentoría grupal reducida con Gon",
    excerpt: "Sesión formativa para mejorar criterio operativo en grupo reducido…",
    tipo: "mentoria-grupal",
    access: "free",
    date: "2026-02-14",
  },
  {
    id: 167,
    slug: "qa-2-febrero-2026",
    title: "Q&A #2 – Febrero 2026",
    excerpt: "Sesión de LWS Options Lab: preguntas, respuestas y análisis práctico…",
    tipo: "qa",
    access: "free",
    date: "2026-02-10",
  },
  {
    id: 165,
    slug: "taller-2-estrategias-reparadoras",
    title: "Taller #2 – Estrategias reparadoras",
    excerpt: "Taller especial sobre estrategias reparadoras de posiciones…",
    tipo: "taller",
    access: "free",
    date: "2026-02-04",
  },
  {
    id: 161,
    slug: "directo-enero-2026-qa",
    title: "Directo con suscriptores – enero 2026 – Sesión Q&A",
    excerpt: "Sesión de LWS Options Lab sobre el directo con suscriptores de enero 2026…",
    tipo: "qa",
    access: "free",
    date: "2026-01-22",
  },
  {
    id: 159,
    slug: "onboarding-discord",
    title: "Onboarding Discord",
    excerpt: "Cómo sacar el máximo partido a la comunidad de Discord de Options Lab…",
    tipo: "video",
    access: "free",
    date: "2026-01-18",
  },
  {
    id: 158,
    slug: "taller-1-bitcoin-oro-plata-opciones",
    title: "Taller #1 – Bitcoin, oro, plata y opciones",
    excerpt: "Taller de LWS Options Lab sobre opciones aplicadas a Bitcoin, oro y plata…",
    tipo: "taller",
    access: "free",
    date: "2026-01-12",
  },
  {
    id: 157,
    slug: "cuaderno-de-bitacora-video",
    title: "Cuaderno de Bitácora",
    excerpt: "Cómo funciona el Cuaderno de Bitácora y cómo seguir las operaciones en vivo…",
    tipo: "video",
    access: "free",
    date: "2026-01-10",
  },
  {
    id: 154,
    slug: "directo-qa-enero-2026",
    title: "Directo – Q&A con suscriptores – Enero 2026",
    excerpt: "Resuelve tus dudas en directo con la comunidad de Options Lab…",
    tipo: "directo",
    access: "free",
    date: "2026-01-08",
  },
  {
    id: 147,
    slug: "onboarding-lws-options-lab",
    title: "Onboarding LWS Options Lab",
    excerpt: "Primeros pasos en la plataforma: cómo orientarte y por dónde empezar…",
    tipo: "video",
    access: "free",
    date: "2025-12-20",
  },
  {
    id: 144,
    slug: "lws-options-lab-mentoria",
    title: "LWS Options Lab — sesión de mentoría",
    excerpt: "Sesión formativa para mejorar criterio operativo…",
    tipo: "mentoria-grupal",
    access: "free",
    date: "2025-12-15",
  },
  {
    id: 134,
    slug: "directo-presentacion",
    title: "Directo Presentación",
    excerpt: "Presentación de LWS Options Lab: qué encontrarás y cómo aprovecharlo…",
    tipo: "directo",
    access: "free",
    date: "2025-12-10",
  },
]

// ── Special reports (Informes) ────────────────────────────────────────────
export interface Informe {
  id: string
  slug: string
  ticker?: string
  tickerColor?: string
  title: string
  cat: string
  excerpt?: string
  date: string // ISO
  access: AccessLevel
}

export const informes: Informe[] = [
  {
    id: "ibex-may",
    slug: "ibex-market-report-mayo-2026",
    ticker: "IBEX",
    tickerColor: "#e11d48",
    title: "IBEX 35® — Mayo 2026",
    cat: "Informe BME",
    excerpt: "Informe mensual de mercado de opciones sobre IBEX 35® correspondiente a mayo de 2026.",
    date: "2026-05-28",
    access: "premium",
  },
  {
    id: "mandato-bitacora",
    slug: "mandato-bitacora-carteras-pequenas",
    title: "Mandato Bitácora <10k",
    cat: "Informe",
    excerpt: "Operativa modelo para carteras pequeñas, paso a paso.",
    date: "2026-05-01",
    access: "premium",
  },
  {
    id: "ibex-mar",
    slug: "ibex-market-report-marzo-2026",
    ticker: "IBEX",
    tickerColor: "#e11d48",
    title: "IBEX 35® — Marzo 2026",
    cat: "Informe BME",
    date: "2026-04-21",
    access: "premium",
  },
  {
    id: "ibex-feb",
    slug: "ibex-market-report-febrero-2026",
    ticker: "IBEX",
    tickerColor: "#e11d48",
    title: "IBEX 35® — Febrero 2026",
    cat: "Informe BME",
    date: "2026-04-20",
    access: "premium",
  },
  {
    id: "ibex-ene",
    slug: "ibex-market-report-enero-2026",
    ticker: "IBEX",
    tickerColor: "#e11d48",
    title: "IBEX 35® — Enero 2026",
    cat: "Informe BME",
    date: "2026-04-19",
    access: "premium",
  },
  {
    id: "nflx-iv",
    slug: "nflx-volatilidad-implicita-earnings",
    ticker: "NFLX",
    tickerColor: "#e50914",
    title: "NFLX: Volatilidad Implícita vs Earnings",
    cat: "Análisis",
    excerpt: "Cómo se comporta la IV de Netflix alrededor de sus resultados.",
    date: "2026-04-17",
    access: "premium",
  },
  {
    id: "asts-iv",
    slug: "asts-lanzamientos-vs-iv",
    ticker: "ASTS",
    tickerColor: "#00c4ff",
    title: "ASTS: Lanzamientos vs IV",
    cat: "Análisis",
    excerpt: "Eventos de lanzamiento y su impacto en la volatilidad implícita.",
    date: "2026-04-14",
    access: "premium",
  },
]

export const USER = {
  name: "Toni Iglesias",
  tier: "premium" as AccessLevel,
}

export function getContentBySlug(slug: string): ContentItem | undefined {
  return content.find((c) => c.slug === slug)
}

export function getInformeBySlug(slug: string): Informe | undefined {
  return informes.find((i) => i.slug === slug)
}

export const ACCESS_LABEL: Record<AccessLevel, string> = {
  free: "Gratis",
  freemium: "Freemium",
  premium: "Premium",
}

export function formatDateEs(iso: string): string {
  const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]
  const d = new Date(iso + "T00:00:00")
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`
}
