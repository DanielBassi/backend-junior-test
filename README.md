# Backend Junior Test

API REST en **Node.js** y **Express** que consume una API pública de usuarios, transforma la respuesta, la persiste en **Azure SQL** con **TypeORM** y expone los datos en un endpoint protegido con **JWT**.

---

## Tabla de contenidos

1. [Características](#características)
2. [Stack tecnológico](#stack-tecnológico)
3. [Requisitos previos](#requisitos-previos)
4. [Instalación y arranque](#instalación-y-arranque)
5. [Variables de entorno](#variables-de-entorno)
6. [Base de datos y scripts](#base-de-datos-y-scripts)
7. [Usuario de pruebas (seed)](#usuario-de-pruebas-seed)
8. [Autenticación](#autenticación)
9. [Referencia de la API](#referencia-de-la-api)
10. [Ejemplos con cURL](#ejemplos-con-curl)
11. [Errores](#errores)
12. [Tests](#tests)
13. [Docker](#docker)
14. [CI/CD y despliegue en Azure](#cicd-y-despliegue-en-azure)
15. [Estructura del proyecto](#estructura-del-proyecto)
16. [Seguridad](#seguridad)
17. [Licencia](#licencia)

---

## Características

- **Salud del servicio**: `GET /health` responde `{ "status": "ok" }` (el arranque de la app conecta antes a Azure SQL).
- **Registro e inicio de sesión**: contraseñas almacenadas con **bcrypt**; sesiones mediante **JWT**.
- **Datos externos**: obtención desde JSONPlaceholder (configurable por URL), transformación y guardado en tabla `external_items`.
- **Protección de rutas**: `GET /external-data` exige cabecera `Authorization: Bearer <token>`.
- **Modelo de datos**: entidades definidas con `EntitySchema` de TypeORM (`User`, `ExternalItem`).

---

## Stack tecnológico

| Área | Tecnología |
|------|------------|
| Runtime | Node.js (recomendado: LTS, p. ej. 20.x o superior) |
| Framework HTTP | Express 5 |
| ORM | TypeORM 0.3 |
| Base de datos | Azure SQL (driver `mssql`, conexión cifrada `encrypt: true`) |
| Autenticación | JWT (`jsonwebtoken`), contraseñas con `bcrypt` |
| Cliente HTTP | `axios` (API externa) |
| Tests | Jest, Supertest |

---

## Requisitos previos

- **Node.js** y **npm** instalados.
- Una instancia de **Azure SQL Database** creada y accesible desde tu red o desde **Azure App Service** (firewall / reglas de conexión configuradas).
- Archivo **`.env`** en la raíz del proyecto (partir de **`.env.example`** y completar valores reales; no subir `.env` al repositorio).

---

## Instalación y arranque

```bash
git clone <url-del-repositorio>
cd backend-junior-test
npm install
```

1. Copia **`.env.example`** a **`.env`** y configura todas las variables obligatorias (ver sección siguiente).
2. Primera vez en la base de datos (crear esquema y usuario de prueba):

   ```bash
   npm run db:setup
   ```

3. Arranque en producción:

   ```bash
   npm start
   ```

4. Arranque en desarrollo (reinicia el proceso al guardar cambios):

   ```bash
   npm run dev
   ```

Por defecto la API escucha en el puerto definido por **`PORT`** (3000 si no se indica otra cosa).

---

## Variables de entorno

Todas se cargan desde **`.env`** en el arranque (`require("dotenv").config()` en `src/main.js`; los scripts en `scripts/` también cargan dotenv).

### Aplicación y JWT

| Variable | Obligatoria | Descripción |
|----------|-------------|-------------|
| `PORT` | No | Puerto HTTP (por defecto `3000`). |
| `EXTERNAL_API_URL` | No | URL de la API de usuarios (por defecto JSONPlaceholder). |
| `JWT_SECRET` | **Sí** (login y rutas protegidas) | Secreto para firmar y verificar JWT. Debe ser largo y aleatorio en producción. |
| `JWT_EXPIRES_IN` | No | Caducidad del token (formato compatible con `jsonwebtoken`, p. ej. `24h`). Por defecto `24h`. |

### Azure SQL

No uses la variable de sistema `USER` del SO para el login SQL. Usa **`DB_USER`** (o `DB_USERNAME`, `MSSQL_USER`, `SQL_USER`).

| Variable | Obligatoria | Descripción |
|----------|-------------|-------------|
| `HOST` o `DB_HOST` o `AZURE_SQL_SERVER` | **Sí** | Servidor (p. ej. `tu-servidor.database.windows.net`). |
| `DB_USER` / `DB_USERNAME` / … | **Sí** | Usuario de la base de datos. |
| `PASSWORD` o `DB_PASSWORD` | **Sí** | Contraseña del usuario SQL. |
| `DATABASE` o `DB_NAME` | **Sí** | Nombre de la base de datos. |
| `DB_PORT` o `SQL_PORT` | No | Puerto (por defecto `1433`). |
| `DB_TRUST_SERVER_CERTIFICATE` | No | Si vale `true`, equivale a confiar en el certificado del servidor (solo si tu entorno lo requiere). |
| `TYPEORM_SYNC` | No | Si es `false`, desactiva `synchronize` de TypeORM (útil si pasas a migraciones en producción). Por defecto sincronización activa. |
| `TYPEORM_LOGGING` | No | Si es `true`, activa logs SQL de TypeORM. |

### Seed del usuario de prueba

| Variable | Obligatoria | Descripción |
|----------|-------------|-------------|
| `TEST_USER_NAME` | No | Nombre de usuario a crear o actualizar (por defecto `testuser`). |
| `TEST_USER_PASSWORD` | No | Contraseña en claro solo para el script; en BD se guarda el hash. Si no se define, se usa la contraseña por defecto documentada en [Usuario de pruebas](#usuario-de-pruebas-seed). |

---

## Base de datos y scripts

La aplicación usa **una sola conexión TypeORM** a **Azure SQL** (`src/config/database.js`). Las tablas se generan o actualizan con **`synchronize`** salvo que `TYPEORM_SYNC=false`.

| Script npm | Comando | Descripción |
|------------|---------|-------------|
| `db:create-tables` | `node scripts/create-tables.js` | Inicializa TypeORM y sincroniza el esquema (`users`, `external_items`). Cierra la conexión al terminar. |
| `db:seed` | `node scripts/seed-test-user.js` | Crea o actualiza el usuario de pruebas con contraseña hasheada (**bcrypt**). |
| `db:setup` | `db:create-tables` seguido de `db:seed` | Primera configuración recomendada. |

Orden recomendado la primera vez: **`npm run db:setup`** antes de **`npm start`**.

---

## Usuario de pruebas (seed)

Tras ejecutar **`npm run db:seed`** (o **`db:setup`**):

- **Usuario por defecto**: `testuser`
- **Contraseña por defecto** (si no defines `TEST_USER_PASSWORD`): `PruebasJunior2026!`

En la tabla **`users`** solo se almacena el **hash** de la contraseña, nunca el texto plano.

---

## Autenticación

1. Obtén un token con **`POST /auth/login`** (o regístrate con **`POST /auth/register`**).
2. Incluye en las peticiones protegidas la cabecera:

   ```http
   Authorization: Bearer <accessToken>
   ```

El middleware (`src/common/middlewares/auth.middleware.js`) valida el JWT con `JWT_SECRET` y rellena **`req.user`** con `id` y `username` extraídos del payload.

---

## Referencia de la API

Base URL local: `http://localhost:<PORT>` (sustituye `<PORT>` por el valor de `PORT`).

### `GET /health`

Comprueba que el proceso responde.

- **Autenticación**: no.
- **Respuesta 200**:

```json
{ "status": "ok" }
```

---

### `POST /auth/register`

Registra un nuevo usuario.

- **Autenticación**: no.
- **Cuerpo (JSON)**:

```json
{
  "username": "string",
  "password": "string"
}
```

- **Respuestas**:
  - **201**: `{ "id": number, "username": "string" }`
  - **400**: datos faltantes o inválidos.
  - **409**: nombre de usuario ya existente.

---

### `POST /auth/login`

Devuelve un JWT si las credenciales son correctas.

- **Autenticación**: no.
- **Cuerpo (JSON)**:

```json
{
  "username": "string",
  "password": "string"
}
```

- **Respuesta 200**:

```json
{
  "accessToken": "string",
  "tokenType": "Bearer",
  "expiresIn": "24h"
}
```

(`expiresIn` sigue el valor de `JWT_EXPIRES_IN`.)

- **Errores**: **400** (campos requeridos), **401** (credenciales inválidas), **500** si falta `JWT_SECRET` en el servidor.

---

### `GET /external-data`

Devuelve la lista de usuarios transformada desde la API externa; intenta persistir en `external_items` y leer desde la base.

- **Autenticación**: **sí**, `Authorization: Bearer <token>`.
- **Respuesta 200**: array de objetos:

```json
[
  {
    "id": 1,
    "name": "Nombre",
    "email": "correo@ejemplo.com",
    "company": "Empresa"
  }
]
```

- **Errores**: **401** sin token o token inválido; **502** si falla la API externa (mensaje propagado como `AppError`).

---

## Ejemplos con cURL

Sustituye `TOKEN` por el valor de `accessToken` devuelto por el login.

```bash
# Salud
curl -s http://localhost:3000/health

# Registro
curl -s -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"miusuario\",\"password\":\"micontraseña\"}"

# Login
curl -s -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"testuser\",\"password\":\"PruebasJunior2026!\"}"

# Datos externos (protegido)
curl -s http://localhost:3000/external-data \
  -H "Authorization: Bearer TOKEN"
```

---

## Errores

Los errores controlados devuelven JSON con la forma:

```json
{ "error": "Mensaje descriptivo" }
```

El código HTTP coincide con el tipo de error (400, 401, 409, 500, 502, etc.). Los errores no previstos responden **500** con un mensaje genérico.

---

## Tests

```bash
npm test
```

- Usa **Jest** en un solo proceso (`--runInBand`) y **Supertest** contra la aplicación creada con `createApp()`.
- Las pruebas cargan **`.env`**. Si faltan las variables necesarias para **Azure SQL**, el bloque de tests de integración se **omite** para que el pipeline no falle solo por credenciales.
- Tras los tests se cierra la conexión a la base (`closeDataSource`) para evitar handles abiertos.

Para que las pruebas de integración se ejecuten en CI, configura los secretos o variables de entorno equivalentes a tu `.env` en el sistema de integración continua.

---

## Docker

```bash
docker build -t backend-junior-test .
docker run -p 3000:3000 --env-file .env backend-junior-test
```

La imagen ejecuta `npm start`. Asegúrate de que el contenedor pueda alcanzar **Azure SQL** (firewall / red virtual según tu despliegue).

---

## CI/CD y despliegue en Azure

### GitHub Actions

En **`.github/workflows/main_backend-junior-test.yml`** el flujo:

1. Instala dependencias y ejecuta tests (`npm test` si existe).
2. Publica el artefacto y despliega en **Azure Web App** (`azure/webapps-deploy`) usando login con OIDC y secretos de suscripción.

Debes tener configurados en el repositorio los secretos que referencia el workflow (identificadores de aplicación, tenant y suscripción de Azure) y la aplicación **`backend-junior-test`** creada en Azure.

### Azure DevOps

Existe un **`azure-pipelines.yml`** de ejemplo (instalación de Node y pasos de npm). Ajústalo a tu organización (por ejemplo añadir `npm test`, artefactos y etapa de despliegue).

### Aplicación y Azure SQL

En **Azure App Service → Configuration → Application settings** define las mismas variables que en **`.env`** (JWT, cadena de conexión lógica mediante `HOST`, `DB_USER`, `PASSWORD`, `DATABASE`, `DB_PORT`, etc.). Permite que el plan de App Service o los “Allow Azure services” puedan conectar al servidor SQL si aplica.

URL típica tras el despliegue:

`https://<nombre-app>.azurewebsites.net`

---

## Estructura del proyecto

```
backend-junior-test/
├── scripts/
│   ├── create-tables.js    # Sincroniza tablas TypeORM
│   └── seed-test-user.js   # Usuario de prueba (bcrypt)
├── src/
│   ├── auth/               # Registro, login, servicio JWT
│   ├── config/
│   │   └── database.js     # DataSource Azure SQL
│   ├── external-data/      # Consumo API externa, entidad external_items
│   ├── users/entities/     # Entidad User
│   ├── common/             # Middlewares, errores
│   ├── app.js              # Factory Express + rutas
│   ├── app.module.js       # Registro de módulos
│   └── main.js             # Punto de entrada
├── tests/
│   └── api.test.js
├── .env.example
├── Dockerfile
├── package.json
└── README.md
```

---

## Seguridad

- No commitees **`.env`** ni credenciales.
- Usa un **`JWT_SECRET`** fuerte y único en cada entorno.
- Revisa reglas de firewall de **Azure SQL** y el principio de mínimo privilegio en el usuario de base de datos.
- En producción, valora desactivar **`synchronize`** (`TYPEORM_SYNC=false`) y gestionar cambios de esquema con migraciones.

---

## Licencia

ISC (ver **`package.json`**).
