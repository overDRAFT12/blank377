<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

## Project rules
- Keep page-specific titles, descriptions and social metadata in each content route's head, not the root, so share previews describe the actual page without inherited generic copy.
- Local-first: PDF parsing, data extraction and .docx/.zip generation run only in the browser (pdfjs-dist, docx, jszip); never send personal data to a server or store it (no DB, no localStorage) — the product promise is that data never leaves the device.
- Heavy browser libraries are dynamically imported and preloaded from `__root` (`preloadOfflineTools`) together with the wizard route, so the wizard works offline after the first page load.
- Preload both Vite's local PDF worker URL and the bundled main-thread handler; verify the worker handshake before using its port and fall back to the in-memory handler with the original startup error logged, so offline worker failures never trigger a remote import.
- Statement wording lives in one pure module (`src/lib/statement.ts`) shared by .docx, email and copy actions; the NBKI parser (`src/lib/nbki-parser.ts`) is pure and covered by tests in `src/test/`.
- NBKI parser reads contracts only inside the obligations section and stops at «Обращения / Запросы / Информационная часть» headings, grouping all fragments of one UID into one contract — request sections also carry UIDs and page headers repeat them, which inflated counts.
- Supplementary NBKI opening/source field extraction stays in a pure helper without changing identity or section grouping, to protect existing creditor/date/UID parsing.
- Subject passport/identity field readers stay in a separate pure helper, bounded before obligations and previous documents; use only the first identity document and never fall back to creditor data, to keep personal and contract parsing independent.
- Keep the existing holiday basis key for unsecured loans and a separate secured-vehicle key; all document and email paths use the same basis predicate, to prevent divergent outputs.
- Optional document fields remain in tab memory when disabled and are excluded by statement builders, so toggling does not lose edits or leak disabled data into downloads.
- Additional creditor references carry public source URLs and remain bundled offline; never fetch creditors at runtime, to keep personal report data on-device.
- Cache only same-origin public page shells and static assets with the offline worker; never cache API requests or submitted data, so offline reloads preserve privacy.
- Bundle font files locally to retain the design without mandatory external CDN requests.
- Omit unfilled optional contract and enforcement identifiers in the shared statement builder rather than inserting placeholders; required identity fields retain printable blanks.
