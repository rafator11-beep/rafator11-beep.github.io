# Guía de Compilación, Despliegue y Pruebas

## 🛠 Entorno de Desarrollo Local
Para trabajar en el juego en tu máquina:

1. **Instalar dependencias**:
   ```bash
   npm install
   ```
2. **Levantar el servidor de desarrollo local**:
   ```bash
   npm run dev
   ```
   *Esto abrirá el juego en `http://localhost:5173`. Las actualizaciones de código se reflejarán instantáneamente.*

## 🧪 Pruebas (Testing)
El proyecto utiliza **Vitest** para garantizar que la lógica de aleatoriedad y el contenido son correctos y no tienen errores fatales.

- Ejecutar la suite de pruebas:
  ```bash
  npm run test
  ```
  *(Verifica la existencia de preguntas, previene arreglos vacíos de contenido, prueba Fisher-Yates).*

## 📦 Compilación de Producción
Para generar los archivos listos para subir a cualquier hosting o a GitHub Pages:

1. Ejecuta el comando de compilación:
   ```bash
   npm run build
   ```
2. Esto generará una carpeta llamada `dist/` en el directorio de la aplicación.
3. El contenido de la carpeta `dist/` es puramente estático (HTML, CSS, JS) y puede subirse a cualquier servidor.

## 🚀 Despliegue

### Opciones de Hosting Recomendadas
1. **GitHub Pages** (Gratis) - Permite hostear el juego directamente desde el repositorio de código empujando la carpeta `dist` u operando con un workflow de GitHub Actions. O cambiando la ruta de salida en `vite.config.ts` a `docs/` y desplegando desde ahí (configuración ya preparada parcialmente para eso si es solicitada).
2. **Netlify / Vercel** (Gratis y Automático) - La mejor opción. Simplemente vinculas el repositorio de GitHub y cada vez que hagas un commit a la rama principal (main), la web se actualizará sola. No requiere servidores especiales.
3. **Servidor Propio (Apache/Nginx)** - Sube los archivos de `dist/` a tu servidor por FTP.

**Aviso sobre Rutas**: Vite está configurado con `base: './'` para asegurar que los assets carguen correctamente desde subdirectorios o dominios planos.

## 📱 Compartir Pantalla a TV (Chromecast)
Se ha implementado una función de Screen Share mediante la **Screen Capture API** del navegador.
- En la barra superior derecha de las pantallas de juego hay un icono de "Compartir".
- Al pulsarlo, el navegador preguntará qué pantalla o pestaña capturar. Se recomienda elegir la "Pestaña" del juego.
- Si el ordenador/móvil está conectado a la misma red WiFi que un Chromecast o Smart TV que soporta Cast/AirPlay del navegador, puedes proyectar la pestaña para que todos los jueguen mirando a la TV.
