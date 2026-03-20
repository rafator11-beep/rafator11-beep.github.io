# Beep! - The Ultimate Party & Trivia Game

## Descripción General
Beep! es un juego multijugador web expansivo diseñado para fiestas, previas y reuniones. Combina lo mejor de los juegos clásicos de beber con trivias de cultura general, fútbol y azar puro.

## Modos de Juego Principales
1. **MegaBoard 3D (NUEVO)**: Un tablero estilo "Oca" isométrico con 100 casillas. Incluye retos, trivia, duelos, mímica, penalizaciones (trampas) y bonificaciones.
2. **Megamix**: La experiencia definitiva. Una mezcla de todas las categorías con eventos sorpresa como virus, duelos y rondas especiales de capitán.
3. **Clásico**: Retos y pruebas adaptadas a todo tipo de grupos.
4. **Yo Nunca**: El clásico juego de confesiones, con modo normal y por equipos.
5. **Picante (+18)**: Pruebas y preguntas subidas de tono.
6. **Quién es más probable / Votación**: El grupo vota quién encaja mejor en ciertas descripciones.
7. **Cultura General**: Preguntas tipo Trivial para los más listos, actualizadas a 2024-2025.
8. **Trivia Fútbol**: Para los expertos y fanáticos del deporte rey.
9. **España Nostálgica / Pacovers**: Referencias puramente españolas, memes clásicos, televisión de los 2000s y cultura pop ibérica.
10. **En la cama y...**: Modo para completar la frase.

## Minijuegos Integrados
- **Tres en Raya (TicTacToe)**: Para resolver empates o apuestas.
- **Poker Texas Hold'em**: Modo de cartas multijugador completo.
- **Parchís**: Tablero tradicional de parchís.

## Stack Tecnológico
- **Frontend**: React 18, Vite, TypeScript
- **Estilos**: Tailwind CSS, Shadcn UI, Framer Motion (animaciones 3D/2D)
- **Estado/Gestión**: Hooks nativos, LocalStorage para rankings offline y sesiones
- **Íconos**: Lucide React
- **Multimedia**: canvas-confetti, screen sharing via WebRTC/Browser API

## Funcionalidades Clave
- **Algoritmo Fisher-Yates & Session Tracking**: Garantiza que no se repitan pruebas ni preguntas durante toda una sesión de juego.
- **Rankings Locales**: Lleva el recuento de qué jugador ha ganado más rondas o modos.
- **Transmisión (Chromecast Screen Share)**: Función nativa para proyectar el juego a una Smart TV o Chromecast.
- **Modo Capitán**: Participación activa en Megamix sin comerse "spoilers" de sus propios retos.
