# LWS Options Lab — Dashboard

Plataforma de opciones financieras que **fusiona el contenido** (artículos, vídeos, Q&A,
talleres, informes, favoritos, Cuaderno de Bitácora) con tu **tracker de operativa**
(P&L, calendario, operaciones), en una sola app Next.js con estilo navy + ámbar.

## ▶ Cómo abrir el dashboard (la forma más sencilla)

Necesitas tener instalado [Node.js 18.17+](https://nodejs.org) (recomendado Node 20 o 22).

Abre una terminal en esta carpeta y ejecuta **un solo comando**:

```bash
npm run go
```

Esto instala todo (solo la primera vez) y arranca el servidor. Cuando veas
`Ready`, abre el navegador en:

### 👉 http://localhost:3000

> En Mac/Linux también puedes usar `./start.sh` (la primera vez: `chmod +x start.sh`).

Para detenerlo: pulsa `Ctrl + C` en la terminal.

## Otras opciones

| Comando | Para qué |
|---------|----------|
| `npm run dev` | Desarrollo con recarga automática (si ya instalaste dependencias) |
| `npm run build && npm start` | Modo producción (más rápido) |

## Secciones

- `/` — Vista general (portada)
- `/contenido` — Biblioteca de contenido (con tabs por tipo)
- `/informes` — Informes especiales
- `/favoritos` — Tus favoritos (guardados en el navegador)
- `/bitacora` — Cuaderno de Bitácora con notas editables
- `/operativa` — Tracker de operaciones
