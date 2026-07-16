# CLAUDE.md

Este archivo proporciona orientación a Claude Code (claude.ai/code) cuando trabaja con el código de este repositorio.

## Descripción del proyecto

**PAW FINDER** es una plataforma comunitaria para reportar mascotas perdidas/encontradas, campañas de vacunación y clínicas veterinarias, enfocada en la ciudad de **Puno, Perú**. Usa Firebase para autenticación y PostgreSQL para la persistencia de datos.

---

## Comandos de desarrollo

### Frontend (React + Vite)
```bash
cd frontend
npm run dev        # Servidor de desarrollo en http://localhost:5173
npm run build      # Build de producción
npm run lint       # ESLint
npm run preview    # Vista previa del build de producción
```

### Backend Node.js (backend activo principal)
```bash
cd backend-node
node index.js      # Inicia el servidor API en el puerto 3000 (por defecto)
```
Requiere un archivo `.env` en `backend-node/.env` con:
```
DB_HOST=
DB_PORT=
DB_NAME=
DB_USER=
DB_PASSWORD=
APISPERU_TOKEN=    # Para consulta de RUC vía https://dniruc.apisperu.com
```

### Backend Python (legacy — solo logging)
```bash
cd backend
.\venv\Scripts\Activate.ps1   # PowerShell
uvicorn main:app --reload      # Inicia en el puerto 8000
```
El backend Python solo escribe en `backend/logs/system_logs.txt`. El backend Node también escribe en ese mismo archivo directamente. **Las nuevas funcionalidades van en el backend Node.**

---

## Arquitectura

### Estructura de tres capas

```
frontend/          ← SPA React (Vite + Tailwind 4)
backend-node/      ← Express.js v5 API (activo, puerto 3000)
backend/           ← FastAPI (legacy, puerto 8000 — solo logging)
```

### Comunicación Frontend → Backend

- El frontend lee `import.meta.env.VITE_API_URL` (definido en `frontend/.env`) y llama a `http://localhost:3000` por defecto.
- `frontend/src/services/api.js` exporta una instancia de Axios apuntando a `http://127.0.0.1:8000` (resto del backend Python — no se usa actualmente, las páginas usan `VITE_API_URL` con `fetch`).
- El estado de Firebase Auth se consume globalmente via `auth.onAuthStateChanged`. Tras el login en Firebase, el frontend sincroniza al usuario en PostgreSQL vía `POST /api/auth/sync`.

### Flujo de autenticación

1. Firebase gestiona el auth (email/contraseña, popup de Google, redirect de Facebook).
2. Al autenticar correctamente, `syncUsuario()` en [Login.jsx](frontend/src/pages/Login.jsx) hace POST a `/api/auth/sync` para hacer upsert del usuario en PostgreSQL.
3. El Navbar obtiene el perfil desde `/api/auth/usuario/:firebase_uid` para mostrar nombre y foto.
4. Las actualizaciones de perfil emiten un `CustomEvent` llamado `perfilActualizado` en `window` para que el Navbar se actualice sin recargar la página.

### Rutas del backend Node

| Ruta | Descripción |
|---|---|
| `GET/PUT /api/auth/usuario/:uid` | Obtener/actualizar usuario por Firebase UID |
| `POST /api/auth/sync` | Upsert del usuario Firebase en PostgreSQL |
| `PUT /api/auth/actualizar` | Actualizar nombre y URL de foto |
| `GET/POST/DELETE /api/campanas` | Campañas de vacunación (archiva automáticamente las vencidas) |
| `POST /api/campanas/:id/like` | Alternar like; usa tabla join `campana_likes` |
| `GET/POST/PUT/DELETE /api/veterinarias` | Clínicas veterinarias; GET soporta `?lat=&lng=&radio=` para búsqueda por geolocalización usando la fórmula de Haversine |
| `GET /api/ruc/:ruc` | Validación de RUC vía APISPerú (11 dígitos) |

### Tablas de la base de datos (PostgreSQL)

- `usuarios` — firebase_uid (UNIQUE), nombre, email, foto_url
- `campanas` — campañas de vacunación con fecha_inicio/fecha_fin, flag archivada, contador de likes
- `campana_likes` — tabla join many-to-many (campana_id, usuario_id)
- `veterinarias` — clínicas veterinarias con coordenadas lat/lng
- `veterinaria_imagenes` — imágenes de las veterinarias (veterinaria_id, url, orden)

### Páginas del frontend

| Ruta | Archivo | Notas |
|---|---|---|
| `/` | [Home.jsx](frontend/src/pages/Home.jsx) | Landing con carrusel, estadísticas y comentarios |
| `/dashboard` | [Dashboard.jsx](frontend/src/pages/Dashboard.jsx) | Estadísticas de resumen |
| `/Reportes` | [Reportes.jsx](frontend/src/pages/Reportes.jsx) | Reportar mascotas — **usa datos mock hardcodeados**, no persiste en DB |
| `/mapa` | [Mapa.jsx](frontend/src/pages/Mapa.jsx) | Mapa Leaflet de reportes — **también usa datos mock hardcodeados** |
| `/campanas` | [Campanas.jsx](frontend/src/pages/Campanas.jsx) | Campañas de vacunación — lee/escribe desde la API |
| `/veterinarias` | [Veterinarias.jsx](frontend/src/pages/Veterinarias.jsx) | Directorio de veterinarias — lee/escribe desde la API |
| `/login` | [Login.jsx](frontend/src/pages/Login.jsx) | Autenticación (email, Google, Facebook) |
| `/mi-cuenta` | Componente `MiCuenta` en [App.jsx](frontend/src/App.jsx) | Gestión del perfil de usuario |

### Librerías clave

- **Leaflet / react-leaflet** — renderizado del mapa (página Mapa). Los íconos por defecto de Leaflet deben parchearse manualmente (ya hecho en Mapa.jsx).
- **Three.js / @react-three/fiber / @react-three/drei** — renderizado 3D (usado en algunas páginas).
- **Framer Motion** — animaciones.
- **Tailwind CSS v4** — clases utilitarias; configurado vía plugin `@tailwindcss/vite`. Muchos componentes también usan props `style` inline para la paleta de colores de la marca.
- **FontAwesome** — íconos vía `@fortawesome/react-fontawesome`.

### Convenciones de estilos

El proyecto define una paleta de colores consistente como objeto plano en cada componente de página (ej. `const colors = { azulOscuro: "#384d51", naranjaPrincipal: "#eda51f", ... }`). Los estilos globales de los botones con forma de hueso del Navbar y la fuente Montserrat se inyectan mediante una etiqueta `<style>` en el componente `Navbar` dentro de [App.jsx](frontend/src/App.jsx).

### Problemas conocidos / TODOs

- `Reportes.jsx` y `Mapa.jsx` usan datos iniciales hardcodeados — aún no están conectados a la persistencia del backend.
- `frontend/src/services/api.js` apunta a `http://127.0.0.1:8000` (backend Python). Actualmente ninguna página lo usa; las páginas llaman a `VITE_API_URL` directamente.
- El `Navbar` en `App.jsx` tiene `useEffect` duplicados/placeholder de desarrollo (los que tienen comentarios `// ... este es el primero, no lo toques`) que pueden limpiarse.
