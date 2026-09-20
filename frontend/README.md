# Hardman — Frontend

## Requisitos previos

- **Node.js 18+** — Descarga desde https://nodejs.org

## Instalación

```bash
cd frontend
npm install
```

## Configuración

Copia el archivo de variables de entorno:

```bash
cp .env.example .env
```

Edita `.env` y pon la URL de tu backend:

```
VITE_API_URL=https://tu-backend.onrender.com
```

Para desarrollo local con el backend corriendo:

```
VITE_API_URL=http://localhost:3001
```

## Correr localmente

```bash
npm run dev
```

Abre http://localhost:5173

## Build para producción

```bash
npm run build
```

Los archivos de producción quedan en `dist/`. Sube esa carpeta a Netlify.

## Deploy en Netlify

1. Conecta el repositorio en Netlify
2. Base directory: `frontend`
3. Build command: `npm run build`
4. Publish directory: `dist`
5. Variable de entorno: `VITE_API_URL=https://tu-backend.onrender.com`

## Imágenes de agentes

Las imágenes están en `public/agents/`. Para reemplazarlas:
- Nombra cada imagen exactamente: `valentina.jpg`, `sebastian.jpg`, `diego.jpg`, `adriana.jpg`, `rodrigo.jpg`, `camila.jpg`, `fernanda.jpg`, `marco.jpg`
- Dimensión recomendada: 400x500px, orientación vertical (retrato)
