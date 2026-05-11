# Base de datos BitVault (guía breve en español)

## Dos modos: SQLite y PostgreSQL

| Modo | Cuándo usarlo | Variable |
|------|----------------|----------|
| **SQLite** (por defecto) | Desarrollo local rápido, tests (`npm run test`) | No pongas `DATABASE_URL`. Opcional: `BV_DB_PATH` para ruta del `.db`. |
| **PostgreSQL** | Producción, varias instancias del servidor, datos centralizados | `DATABASE_URL` con cadena `postgresql://…` |

No mezcles intención: si `DATABASE_URL` está definida, la aplicación trata de usar **Postgres** (después de `initDatabase()` en el arranque de Node).

## Postgres con Docker (recomendado en local)

En la raíz del repo:

```bash
docker compose up -d postgres
```

Usuario / contraseña / base (coinciden con `docker-compose.yml`):

- Usuario: `bitvault`
- Contraseña: `bitvault`
- Base: `bitvault`

En `.env.local`:

```env
DATABASE_URL=postgresql://bitvault:bitvault@127.0.0.1:5432/bitvault
```

Luego:

```bash
npm run dev
```

La primera vez que arranca el servidor Node, se aplican las migraciones SQL que vienen en **`drizzle/postgres/`** (carpeta versionada en el repositorio).

## Qué hace el proyecto por ti al arrancar (Postgres)

1. Crea el pool `pg` con `DATABASE_URL`.
2. Ejecuta **`migrate()`** de Drizzle sobre `drizzle/postgres/` (crea tablas y la tabla interna de control de migraciones).
3. El script **`prebuild`** / `npm run build` ejecuta **`scripts/seed.ts`**, que rellena datos de demo en la base activa (Postgres o SQLite).

## Cuándo tienes que generar migraciones nuevas

**Solo** cuando cambies el esquema en código: edita **`src/db/schema-pg.ts`**.

Entonces:

```bash
npm run db:generate:pg -- --name descripcion_del_cambio
```

Revisa los archivos nuevos bajo **`drizzle/postgres/`**, haz commit y sube. En despliegue, el arranque aplicará lo pendiente automáticamente.

Si **no** tocas el esquema Postgres, **no** necesitas ejecutar ese comando.

## Comandos útiles

| Comando | Uso |
|---------|-----|
| `npm run db:check:pg` | Comprueba que el journal de migraciones encaja con `schema-pg.ts` (también en CI). |
| `npm run db:verify:pg` | Con `DATABASE_URL` apuntando a un Postgres vivo: conecta, aplica migraciones en `drizzle/postgres/` y ejecuta `SELECT 1`. |
| `npm run db:studio:pg` | UI Drizzle Studio (necesita `DATABASE_URL`). |
| `npm run db:seed` | Vuelve a sembrar datos de demo en la base activa. |

## CI (GitHub Actions)

- **`build`:** `db:check:pg`, lint, tests y build **sin** Postgres en vivo (los tests siguen en SQLite).
- **`postgres-integration`:** contenedor **Postgres** + **`npm run db:verify:pg`** con `DATABASE_URL` hacia ese servicio (valida migraciones y conexión real).

## Problemas frecuentes

- **`DATABASE_URL is set but the database was not initialized`**: el servidor llamó a `getDb()` antes de `initDatabase()`; en Next eso lo hace `instrumentation.ts` en runtime Node. Si ejecutas código fuera de Next, llama antes `await initDatabase()`.
- **Error de conexión**: comprueba que el contenedor esté arriba (`docker compose ps`) y que el host sea `127.0.0.1` o `localhost` según donde corra Node.
- **Puerto 5432 ya en uso** (otro Postgres en la máquina): cambia el mapeo de puertos en `docker-compose.yml` (por ejemplo `"5433:5432"`) y usa `...@127.0.0.1:5433/...` en `DATABASE_URL`, o detén el servicio que ocupa el 5432.
- **Quieres solo SQLite**: borra `DATABASE_URL` de tu entorno y borra `.next` si cambiaste variables a mitad de sesión.

## Más detalle en inglés

Ver **`README.md`** (sección *Database & migrations* y tabla de variables).
