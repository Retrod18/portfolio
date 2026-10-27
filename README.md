# dhruv.ai: portfolio

Personal portfolio for Dhruv Sharma, AI/ML Engineer. Static site: no build step, no framework. Three.js is loaded from a CDN.

## Run locally

```bash
python -m http.server 5500
```

Then open http://localhost:5500.

## Edit content

Everything you see comes from [`js/data.js`](js/data.js): experience, projects, skills, education, links, and the knowledge-base chunks the "Ask my resume" widget searches. Change it there and every widget updates.

## What's inside

| File | What it does |
| --- | --- |
| `js/scene.js` | 3D latent space: 1,800 points that morph between sphere / cluster / helix / knot / wave per section, a glass icosahedron core, kNN edges, cursor repulsion |
| `js/rag.js` | In-browser RAG: TF-IDF embeddings, cosine retrieval, title re-rank, streamed grounded answer |
| `js/skills.js` | Rotatable 3D skill embedding map; clicking a skill filters experience/projects site-wide |
| `js/palette.js` | `Ctrl/⌘ K` or `/` command palette (navigate, morph, filter, ask) |
| `js/cursor.js` | Custom cursor, gradient trail, magnetic buttons, card tilt, glass spotlights, text scramble |
| `js/main.js` | Renders content and wires the widgets together through a small event bus (`js/core.js`) |

## Deploy

Push the folder to GitHub and import it in Vercel (framework: "Other"), or enable GitHub Pages on the repo root.
