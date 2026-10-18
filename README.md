# Pack Playroom · P&G Hair Care

Internal prototype for Head & Shoulders, Pantene and Herbal Essences packaging. Not an official P&G website.

A unified packaging platform for shampoo and conditioner: design a pack in 3D, score it, put it on a retail shelf, then backtrack to how your plants would make it.

**Idea → Playroom → Coach → Shelf → Production backtrack → Stage gate**

It runs entirely in the browser (React + Three.js), so it deploys to GitHub Pages with no server. Work is saved in the browser and can be exported/imported as a JSON file.

## Put it on the web (GitHub Pages)

1. Create an empty repository on GitHub, e.g. `pack-playroom`.
2. From this folder:
   ```bash
   git init -b main
   git add .
   git commit -m "Pack Playroom v0.1"
   git remote add origin https://github.com/<your-user>/pack-playroom.git
   git push -u origin main
   ```
3. On GitHub: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
4. The workflow in `.github/workflows/deploy.yml` builds and publishes on every push to `main`. After about a minute the site is at
   `https://<your-user>.github.io/pack-playroom/` (the link also appears on the **Actions** run).

The build uses relative paths and hash routing, so it works under any repository name.

## Run it locally

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production build into dist/
```

Requires Node 20 or newer.

## What is in it

| Module | What you can do |
| --- | --- |
| **Component library** | Bottles, closures, pumps and decorations with geometry, cost, MOQ, lead time, tooling, grams, PCR and market approvals. Edit any part, create a new bottle shape from a family and volume, attach a CAD reference. |
| **Playroom** | Real-time 3D configurator. Snap bottle + closure + decoration (only compatible neck finishes mate), reshape height/width/depth/shoulder/waist, add ribs, pick colours and finishes (gloss, matte, soft-touch, pearl, frosted, clear PET, metallic), write the label (brand, variant, claim, layout, coverage), open the cap or press the pump, turntable, range view, branch versions, save an image, download a `.glb` for AR on a phone. |
| **Design Coach** | 100-point Pack Score across 10 lenses: shelf standout, findability, brand codes, communication, price-tier cues, ergonomics, sustainability, cost, manufacturability, compliance. Specific fixes with their effect, one-click apply or apply on a branch, and generated alternative directions inside brand guardrails. |
| **Global and local menus** | Locked vs flexible elements per brand and market, global and local parts menus, harmonisation score, complexity tracker with tail parts, size ladder check, local vs global sourcing, deviation requests with approve/reject. The top-bar menu switch (Global / Mix / Local) filters the Playroom. |
| **Shelf simulator** | Hypermarket, US mass retail, pharmacy and kirana fixtures in 3D with a competitor set; facings, shelf, position and range blocking; aisle, close-up and walk-around cameras; an attention test (visual-saliency heatmap, attention share vs shelf share, estimated time to find); e-commerce thumbnail test on a phone grid. |
| **Production backtrack** | Ranks your lines green/amber/red. Machine-by-machine fit against envelopes (height, width, depth, neck finish, closure type, decoration, fill range), change parts with cost and lead time, predicted speed and bottleneck, changeover and OEE effect. Manufacturing route and critical path, draft **centerline sheet** built from the closest running SKU (editable, lockable, CSV export), qualification plan generated from what changed, and a business case with capex and payback. Line profiles are editable. |
| **Stage gates** | Board from Idea to Launch with thumbnails, scores, line verdicts and cost. Gate criteria are checked automatically; decisions and notes are logged. |
| **Settings and data** | Rename the demo brands, set their colours and locked shapes, edit market assumptions (FX, resin prices, PCR supply, legal copy area, size ladder), export / import / reset data. |

## Make it yours

Brand names are the three starting brands; brand colours are approximate. Costs, lines, suppliers and the shelf competitor set are demo values. All of it lives in `src/data/`:

- `components.ts` – your bottles, closures, decorations, suppliers and costs
- `lines.ts` – your plants, lines, machines, envelopes, change-part formats and running SKUs
- `markets.ts` – markets, currencies, resin prices, legal copy needs, and your brands
- `retail.ts` – retail formats and the competitor set used on shelf

You can also edit most of this in the app and use **Settings → Export all data** to share a dataset with your team.

## Pack photos

Upload your own approved pack shots in the Playroom (Reference photo) and in the Component library (Part photo). Photos are resized and stored in your browser only; they are not committed to this repository or published with the site. Export data from Settings to share them with a colleague.

## How the numbers are made (and their limits)

- **Pack Score** is a transparent rules engine (`src/domain/coach.ts`). Each lens shows its reasoning; calibrate weights and thresholds against your own consumer tests and sell-out.
- **Attention test** is a lightweight saliency model (colour and luminance contrast with a centre bias) computed from the rendered shelf. It is a directional screening tool, not eye-tracking.
- **Line fit and centerlines** (`src/domain/linefit.ts`) use the envelopes and formats you enter. Setpoints are a draft for engineers to review, not machine settings to run unreviewed.
- **Costs** (`src/domain/cost.ts`) are should-cost estimates from grams, resin price, conversion, closure, label area and filling.
- CAD files are referenced by name; server-side STEP→glTF conversion, photoreal rendering, PLM/ERP/MES integrations and shared multi-user storage are the next phases in the platform plan.

## Project structure

```
src/
  domain/      types, cost and sustainability, coach (Pack Score), line fit + centerlines, menus
  data/        seed library, markets and brands, retail formats, production lines
  three/       parametric bottle geometry, label textures, 3D pack model, studio, shelf scene
  pages/       Library, Playroom, Coach, Menus, Shelf, Production, Gates, Settings
  store.ts     app state (persisted in the browser)
```
