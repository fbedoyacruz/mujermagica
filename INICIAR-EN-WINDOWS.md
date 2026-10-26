# Iniciar en otro equipo Windows

1. Clona el repositorio desde GitHub.
2. Instala Node.js 18 o posterior, Python 3 y MySQL Server.
3. En MySQL, crea la base de datos `mujermagicabd` y configura un usuario con permisos sobre ella. El backend crea las tablas al iniciar, pero no crea la base de datos.
4. Haz doble clic en `Iniciar-Sistema.bat`. La primera vez solicita los datos de conexión y crea `backend-node/.env`; también instala las dependencias de Node si hacen falta.
5. Mantén abiertas las ventanas del backend y del frontend. Abre `http://localhost:5500/sistema-completo.html`.

El archivo `.env` contiene la contraseña de MySQL y no se incluye en Git. Los datos de productos, clientes, ventas y compras también viven en MySQL: clonar el código no los copia. Para conservarlos, respalda la base de datos del equipo anterior y restáurala en el nuevo equipo antes de iniciar el sistema.

Si un puerto 4000 o 5500 ya está ocupado, el lanzador muestra qué proceso lo usa y pregunta antes de cerrarlo.