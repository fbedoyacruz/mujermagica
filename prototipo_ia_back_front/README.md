# Prototipo IA Back Front (RaaS)

Este directorio contiene un prototipo de referencia para evolucionar el sistema hacia:
- Backend: Java + Spring Boot
- Frontend: Angular
- Base de datos: MySQL

Sin Docker (servidor embebido de Spring Boot).

## Estructura

- `backend-springboot`: API REST con JWT, Spring Security, JPA y Flyway.
- `frontend-angular`: cliente Angular standalone con login y CRUD basico.

## Estado actual

- Sprint 1 completado:
  - Base backend Spring Boot.
  - Base frontend Angular.
  - Login con JWT.
  - Configuracion MySQL + Flyway.
- Sprint 2 completado:
  - CRUD Productos.
  - CRUD Proveedores.
  - CRUD Clientes.
  - Filtros de busqueda y paginacion backend.

Sprint 3 no iniciado (pendiente autorizacion).

## Requisitos

- Java 21 (o al menos Java 17 para Spring Boot 3).
- Maven 3.9+
- Node 18+
- NPM 9+
- MySQL 8

## Configuracion de base de datos

Crear base de datos:

```sql
CREATE DATABASE inventario;
```

Configurar credenciales en `backend-springboot/src/main/resources/application.properties`.

## Ejecutar backend

```bash
cd prototipo_ia_back_front/backend-springboot
mvn spring-boot:run
```

Endpoints principales:
- `POST /api/v1/auth/login`
- `GET|POST|PUT|DELETE /api/v1/products`
- `GET|POST|PUT|DELETE /api/v1/providers`
- `GET|POST|PUT|DELETE /api/v1/customers`
- `GET /api/v1/health`

Usuario inicial:
- usuario: `admin`
- clave: `admin123`

## Ejecutar frontend

```bash
cd prototipo_ia_back_front/frontend-angular
npm install
npm start
```

URL:
- `http://localhost:4200`

## Nota importante del entorno actual

Si `mvn -v` muestra Java 8, Spring Boot 3 no compilara.
Debes apuntar Maven a Java 21/17 antes de correr backend.
