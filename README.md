# AI Transcreation (Shopify App)

Embedded Shopify Admin app (Remix + Polaris) for **AI-assisted transcreation**: it helps merchants create better translations per **language** and per **market** (where wording/messaging differs even within the same language).

The app provides a “Localize” editor across many Shopify resource types, lets you switch **locale** and **market**, and can generate draft translations via an external AI translation service.

## What this app does

- **Side-by-side localization editor** for Shopify translatable content.
- **Market-aware translations**: switch markets (e.g. US vs UK) while editing a locale.
- **AI-assisted “Auto-translate”**: generates draft translations and fills untranslated fields (currently implemented for product content + product options/option values).
- **Search translations** (stored locally) to quickly find existing translated phrases.
- **Sync tooling** to bring translation content into the local DB for search/indexing.

## Supported localization sections (UI navigation)

The main editor route is `localize.$section` and the section menu is defined in `app/api/data.tsx`.

- **Products**: Collections, Products
- **Online Store**: Blog posts, Blog titles, Filters, Metaobjects, Pages, Policies, Store metadata
- **Content**: Menu
- **Theme**: App embeds, Default theme content, Section groups, Static sections, Templates, Theme settings
- **Settings**: Notifications

## How the “AI transcreation” flow works

1. Merchant chooses a **section** (e.g. Products → Products).
2. Merchant picks a **locale** (`shopLocale` query param) and optionally a **market** (`market` query param).
3. The app loads translatable content via Shopify Admin GraphQL (server route `app/routes/api._index/route.tsx`, action handlers like `product_read`, `resource_list`, etc.).
4. Clicking **Auto-translate** (currently wired in `app/routes/localize.$section/route.tsx`) builds a prompt containing:
   - The target language (from the selected locale)
   - The current product fields + option names + option value names
5. The prompt is sent to the server endpoint `POST /api/translate` (`app/routes/api.translate/route.ts`), which forwards the request to your configured external AI translation API.
6. The UI parses the returned JSON and fills draft translations for fields that are not “confirmed”.

## Key routes / endpoints

- **App UI**
  - `GET /` home page and section navigation
  - `GET /localize/:section` localization editor for a section
  - `GET /translation/:action` utility actions
- **Server API**
  - `POST /api` (Remix route `app/routes/api._index/route.tsx`)
    - Handles most app data actions (listing resources, reading/writing translations, searching, sync helpers, image helpers, etc.)
  - `POST /api/translate` (Remix route `app/routes/api.translate/route.ts`)
    - Proxies translation requests to your external AI translation service

## Data storage (Prisma)

Prisma uses SQLite by default (see `prisma/schema.prisma`):

- **`Session`**: Shopify session storage (OAuth/session)
- **`Translations`**: cached translations used for search and resource titles
- **`SyncTranslations` / `SyncProcess`**: tracks background sync work
- **`TranslationState`**: per-field status tracking (e.g. confirmed vs edited)

## Shopify configuration (CLI)

App metadata and scopes live in `shopify.app.toml`:

- **App name**: “AI Transcreation”
- **Scopes**: includes `read_translations`, `write_translations`, `read_markets`, `read_locales`, and other content/theme scopes required to read/write localized content across resources.

## Environment variables

The Shopify CLI will provide most Shopify variables during `shopify app dev`.
In addition, **AI translation requires these server env vars** (used by `POST /api/translate`):

- `TRANSLATION_API_URL`: URL of your AI translation endpoint
- `TRANSLATION_API_AUTH_HEADER`: value placed into the `Authorization` header
- `TRANSLATION_API_REFERER`: value placed into the `Referer` header

Common Shopify app variables (used by `app/shopify.server.ts`):

- `SHOPIFY_API_KEY`
- `SHOPIFY_API_SECRET`
- `SCOPES` (comma-separated)
- `SHOPIFY_APP_URL`

## Local development

### Prerequisites

- Node.js (see `package.json` engines; Node 18.20+ recommended)
- Shopify Partner account + dev store
- Shopify CLI

### Install

```bash
npm install
```

### Run (Shopify CLI dev)

```bash
npm run dev
```

### Database setup

If you see Prisma/SQLite errors, run:

```bash
npm run setup
```

## Useful scripts

- `npm run dev`: start via Shopify CLI
- `npm run build`: build Remix app
- `npm run start`: run built server
- `npm run setup`: Prisma generate + db push
- `npm run deploy`: deploy via Shopify CLI
- `npm run lint`: eslint

## Webhooks

Configured in `app/shopify.server.ts` (registered after auth):

- `APP_UNINSTALLED`
- `APP_SCOPES_UPDATE`
- `CUSTOMERS_DATA_REQUEST` / `CUSTOMERS_REDACT` (GDPR)
- `PRODUCTS_UPDATE` (used for content change awareness)

## Troubleshooting

### Prisma tables don’t exist

Run:

```bash
npm run setup
```

### Embedded navigation issues

This is an embedded app; navigation should use Remix + App Bridge friendly patterns (no raw `<a>` tags for in-app navigation).

### `POST /api/translate` returns 500

Verify the translation proxy env vars are set:

- `TRANSLATION_API_URL`
- `TRANSLATION_API_AUTH_HEADER`
- `TRANSLATION_API_REFERER`
