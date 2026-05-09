# Semeton — Project overview

## In one minute

**Semeton** is an AI trip planner built around Bali. Travellers chat in plain language; the assistant answers with itineraries, driving or riding times between stops, and current weather when it matters. The point isn’t a generic travel bot—it’s plans grounded in **real routes** and **live conditions**, so “how long is this leg?” and “what’s it like this week?” get concrete answers instead of guesses.

## What people actually see

The home page is a simple chat: you type, the reply **streams in** as it’s generated, and the assistant uses rich formatting—headings, lists, links. When it shares a Google Maps directions link, the app can show an **embedded map** so you don’t have to leave the page. Weather for key stops shows up as a compact strip when the model asks for it. It feels like messaging a knowledgeable local, with maps and weather folded into the thread.

## How we built it (still readable for non-engineers)

At the center is a **Next.js** web app: fast pages, clear structure, room to grow. The interface is **React** with **Tailwind** for styling—modern, responsive, and easy to iterate on.

The “brain” is an **OpenAI** model wired for **tool calling**: it doesn’t only talk; it can invoke backend capabilities when needed. Two tools matter most:

- **Travel time between places** — powered by **Google Routes** on the server, so ETAs match what navigation would use, including modes like drive or two-wheeler.
- **Weather** — server-side helpers look up conditions for named places so packing and timing advice can reflect what’s happening now.

There’s also **Supabase** in the repo: clients for browser and server are ready for sign-in, saved trips, or anything you want to persist later. Today, the chat experience itself doesn’t depend on Supabase; it’s scaffolding for the next step.

Supporting pieces: **Google Maps Embed** (with a separate, referrer-friendly key) for previews, and **markdown** in the chat so itineraries stay scannable.

## Where things live in the repo

If you’re walking someone through the codebase in a demo:

- **`app/page.tsx`** — landing copy and the chat panel; there’s an optional auto-prompt so a first visit can show a sample Bali itinerary.
- **`components/chat-panel.tsx`** — the chat experience: send history, stream the reply, render markdown and embeds.
- **`app/api/chat/route.ts`** — the server “orchestrator”: system instructions, planner context from **`docs/plan-guide.md`**, and the loop that runs the model and tools.
- **`lib/google-routes/`** and **`lib/weather/`** — the real routing and weather logic the tools call into.
- **`app/api/weather/`** — HTTP endpoint the UI can use for weather, alongside what the chat tool does internally.

The **`docs/plan-guide.md`** file is worth mentioning in talks: it’s the long-form playbook we inject for the model—how itineraries should be structured and how to behave—without hardcoding all of that in code.

## Getting it running

Copy **`.env.example`** to **`.env.local`** and fill in what you need:

- **OpenAI** and **Google Routes** keys are required if you want full chat with real ETAs.
- **Maps Embed** and **Supabase** are optional for a minimal demo; add them when you want embeds or auth/data.

Keep anything secret (OpenAI, Routes) on the **server** only—don’t prefix those with `NEXT_PUBLIC_`.

Then:

```bash
npm install
npm run dev
```

Open `http://localhost:3000` and try a multi-stop day or a simple “how long from A to B?” question to see tools and UI together.

## If you’re presenting to stakeholders

**Cost and limits** — Each conversation uses model tokens plus map and weather lookups when the assistant calls tools. The chat route already caps how much history, how long each message can be, and how many tool rounds run in one shot, so runaway loops are less likely—but production traffic still deserves monitoring and sensible API quotas.

**Security** — Treat keys like production secrets: lock down Google Cloud APIs (Routes, Embed) to your hosts or IPs where you can, and never ship server keys to the browser.

---

*This doc is the high-level story; **`docs/plan-guide.md`** is the detailed instruction set we give the model at runtime.*
