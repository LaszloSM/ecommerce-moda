@AGENTS.md

# MODAVIDA — Tienda Única E-commerce (Colombia)

## Arquitectura
- Tienda única, NO marketplace. Roles: `buyer` | `admin` (sin `seller`)
- Admin accede en `/panel/**` (NO `/dashboard` ni `/admin`)
- Next.js 16: usa `proxy.ts` — NUNCA crear `middleware.ts` (rompe el build)
- Tailwind CSS v4: config en `globals.css` con `@theme inline` — NO `tailwind.config.js`
- Params en Next.js 16 son async: `const { id } = await params`

## Supabase
- Cliente servidor: `src/lib/supabase/server.ts` | cliente admin (bypasa RLS): `src/lib/supabase/admin.ts`
- Usar `(supabase as any).from(...)` para queries con joins o columnas sin tipos exactos
- `.select('role').single()` devuelve `never` — castear: `as { data: { role: string } | null }`
- `moddatetime` extension no disponible — usar función custom `set_updated_at()`
- RLS activo en todas las tablas; acciones admin usan `createAdminClient()` si el trigger falla

## Acciones del servidor
- Todas las acciones admin en: `src/features/admin/actions.ts`
- Inline server actions en Server Components: `'use server'` debe ser primer statement dentro de la función
- Siempre llamar `revalidatePath()` después de mutaciones

## Variables de entorno requeridas
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`,
`NEXT_PUBLIC_WOMPI_PUBLIC_KEY`, `WOMPI_PRIVATE_KEY`, `RESEND_API_KEY`, `NEXT_PUBLIC_APP_URL`

## Build / Deploy
- Verificar build: `npm run build` (debe terminar sin errores TypeScript)
- Limpiar cache si hay código obsoleto: `rm -rf .next`
- `SUPABASE_SERVICE_ROLE_KEY` va en Vercel como variable de servidor (NO `NEXT_PUBLIC_`)
- Desactivar Deployment Protection en Vercel si hay 401 en preview URLs

<!-- VERCEL BEST PRACTICES START -->
## Best practices for developing on Vercel

These defaults are optimized for AI coding agents (and humans) working on apps that deploy to Vercel.

- Treat Vercel Functions as stateless + ephemeral (no durable RAM/FS, no background daemons), use Blob or marketplace integrations for preserving state
- Edge Functions (standalone) are deprecated; prefer Vercel Functions
- Don't start new projects on Vercel KV/Postgres (both discontinued); use Marketplace Redis/Postgres instead
- Store secrets in Vercel Env Variables; not in git or `NEXT_PUBLIC_*`
- Provision Marketplace native integrations with `vercel integration add` (CI/agent-friendly)
- Sync env + project settings with `vercel env pull` / `vercel pull` when you need local/offline parity
- Use `waitUntil` for post-response work; avoid the deprecated Function `context` parameter
- Set Function regions near your primary data source; avoid cross-region DB/service roundtrips
- Tune Fluid Compute knobs (e.g., `maxDuration`, memory/CPU) for long I/O-heavy calls (LLMs, APIs)
- Use Runtime Cache for fast **regional** caching + tag invalidation (don't treat it as global KV)
- Use Cron Jobs for schedules; cron runs in UTC and triggers your production URL via HTTP GET
- Use Vercel Blob for uploads/media; Use Edge Config for small, globally-read config
- If Enable Deployment Protection is enabled, use a bypass secret to directly access them
- Add OpenTelemetry via `@vercel/otel` on Node; don't expect OTEL support on the Edge runtime
- Enable Web Analytics + Speed Insights early
- Use AI Gateway for model routing, set AI_GATEWAY_API_KEY, using a model string (e.g. 'anthropic/claude-sonnet-4.6'), Gateway is already default in AI SDK
  needed. Always curl https://ai-gateway.vercel.sh/v1/models first; never trust model IDs from memory
- For durable agent loops or untrusted code: use Workflow (pause/resume/state) + Sandbox; use Vercel MCP for secure infra access
<!-- VERCEL BEST PRACTICES END -->
