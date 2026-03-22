# 🍻 BEEP - Plataforma Definitiva de Juegos y Previas

## 🎯 Naturaleza del Proyecto
Esta es una aplicación web progresiva diseñada para el entretenimiento en grupo (previas, fiestas y reuniones). Combina dinámicas de juegos de mesa clásicos, retos interactivos y modos de juego tanto **Offline** (un solo dispositivo pasando de mano en mano) como **Online** (multijugador en tiempo real con salas privadas).

## 🏗️ Stack Tecnológico
* **Frontend:** React + TypeScript + Vite.
* **Estilos:** Tailwind CSS (Diseño oscuro, neón, festivo y muy dinámico).
* **Backend y Base de Datos:** Supabase.
* **Lógica Multijugador:** Supabase Realtime / WebSockets (vital para sincronización de turnos y estados de partida).

## 📱 Reglas Críticas de Diseño (UI/UX)
1. **Mobile-First Estricto:** El 99% de los usuarios usarán la app en un móvil en medio de una fiesta. Los botones deben ser grandes (fat-finger friendly), los textos legibles y las animaciones fluidas pero sin sobrecargar el dispositivo.
2. **Prevención de Errores:** En una fiesta, la gente pulsa botones sin querer. Las acciones críticas (como salir de la partida o borrar puntos) deben tener confirmación o ser difíciles de pulsar por error.
3. **Gestión de Estado Centralizada:** Los juegos deben poder recuperar su estado si un usuario recarga la página por accidente (usar localStorage o la base de datos de Supabase).

## 🤖 INSTRUCCIONES ESTRICTAS PARA LA IA (Agentes y Asistentes)
1. **Límites de Lectura:** Tienes PROHIBIDO leer `node_modules`, `dist`, o carpetas de `assets`/imágenes para buscar contexto. Lee únicamente los archivos que te indique el usuario.
2. **Revisión Obligatoria:** Antes de escribir una sola línea de código para modificar un juego online o la estructura de Supabase, DETENTE. Explica tu plan lógico paso a paso y espera la aprobación del usuario.
3. **Modularidad:** Si vas a crear un minijuego nuevo, aíslalo en su propia carpeta dentro de `src/components/games/`. Un fallo en el "Juego A" nunca debe romper el "Juego B".
4. **Reglas Maestras:** Respeta siempre las directrices del archivo `.clinerules`..