# Lead Manager

A simple web app for a sales team to save leads, track them through a pipeline, and follow up on WhatsApp with an AI-written message. I built it for the Neo Grow AI Generalist Test (Part A).

**Live app:** https://lead-lantern-tracker.vercel.app
**login:**  just sign up with any email, no verification needed)

---

## What the app does

The team gets leads for four services: **WhatsApp Bulk, RCS SMS, Social Media Management, WhatsApp AI Agent**. In this app they can:

- **Add a lead**: name, mobile, business, city, service (dropdown) and notes. The mobile number is cleaned automatically (`+91 98765-43210` and `098765 43210` both save as 10 digits). A warning shows if the same number already exists.
- **See all leads**, newest first. A table on desktop, cards on phones.
- **Change status**: New, Contacted, Interested, Closed, Not Interested. It saves instantly.
- **Search and filter**: search by name or mobile, filter by status and service, and sort (for example "Interested first").
- **Dashboard counts**: total plus one count per status. They update right after any change.
- **Generate an AI follow-up**: click "AI Follow-up" on a lead, pick English or Hinglish, and Gemini writes a short personal WhatsApp message from the lead's service, status and notes. You can edit it before sending.
- **Send on WhatsApp**: opens a `wa.me` link with the message already filled in.
- **Everything is saved** in a real database, so it stays after a refresh and on any other device.
- **Works on a phone**: no sideways scrolling, big tap targets, full-screen dialogs.

**Bonus features I added**
- **Login** with Supabase Auth. Only logged-in team members can see the leads. It is team-wide: everyone sees the same leads.
- **Follow-up date** on each lead, with "Due today" and "Overdue" counts and a filter.
- **CSV/Excel import** with a preview that marks valid, invalid and duplicate rows before importing.
- **Edit lead**, so a lead can be corrected after it is created.

---

## Tools I used and what each one did

| Tool | What I used it for |
|---|---|
| **Claude** | Acted as my senior developer: planning, the PRD, writing the prompts for Lovable, debugging, the AI server route, and this README |
| **Lovable** | Generated the app (React + TanStack Start + Tailwind + shadcn/ui) and later UI changes |
| **Supabase** | Postgres database, email/password login, and Row Level Security |
| **Gemini API** (`gemini-3.8-flash`) | Writes the follow-up messages in English or Hinglish |
| **Vercel** | Hosting. It also runs the server route that holds the Gemini key |
| **GitHub** | Source code, synced with Lovable |
| **Antigravity** | Fixing code locally, so I did not spend Lovable credits on small things |
| **SheetJS (`xlsx`)** | Reads `.csv` and `.xlsx` files in the import feature |

## How it is built

```
Browser (React app, TanStack Start)
   |-- supabase-js --------------------> Supabase (leads table, Auth, RLS)
   |-- POST /api/generate-followup  (sends the user's login token)
            |
            v
   Server route on Vercel (src/routes/api/generate-followup.ts)
      1. checks the login token with Supabase (401 if invalid)
      2. calls Gemini using GEMINI_API_KEY (server-only variable)
      3. returns { message }
   The browser shows the message in an editable box.
   "Send on WhatsApp" opens https://wa.me/91<mobile>?text=<encoded message>
```

**Security**
- The Gemini key is only in Vercel's environment variables. It is never in the frontend or in this repo.
- The AI route rejects requests without a valid login, so nobody can use my Gemini quota.
- Row Level Security is on. Only logged-in users can read or write leads, and logged-out visitors get nothing.
- The Supabase URL and publishable key are public by design (RLS protects the data).
- Known trade-off: any signed-in user can edit or delete any lead. This is intentional because the app is team-wide. Sign-up is also open so reviewers can try it. In a real company I would make it invite-only and add roles.

## Database

One table, `leads`, with checks in the database itself: the mobile must be a valid 10-digit Indian number, `service` must be one of the 4 services, `status` must be one of the 5 statuses (default `New`). RLS policies allow the `authenticated` role only. The original plan is in `PRD.md`. The AI endpoint changed after that (see Problems faced).

---

## How to run it locally

You need [Bun](https://bun.sh) (the repo has a `bun.lock`) and a free [Supabase](https://supabase.com) project with the `leads` table and policies from `PRD.md`.

```bash
git clone https://github.com/KRISHNa7931/lead-lantern-tracker.git
cd lead-lantern-tracker
bun install
```

Set these environment variables (names only, never commit real secrets):

| Variable | Where it is used | Secret? |
|---|---|---|
| `VITE_SUPABASE_URL` | browser | no |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | browser | no |
| `SUPABASE_URL` | AI server route | no |
| `SUPABASE_PUBLISHABLE_KEY` | AI server route | no |
| `GEMINI_API_KEY` | AI server route | **yes** |
| `GEMINI_MODEL` | optional, defaults to `gemini-3.8-flash` | no |

```bash
 bun run dev
```

**Deploying to Vercel:** import the repo, add the variables above (only `GEMINI_API_KEY` as Sensitive) plus `NITRO_PRESET=vercel`, then deploy. Environment variable changes only take effect after a redeploy.

---

## Prompt log: my 5 most important prompts

**1. The PRD and the first big Lovable prompt**
I started by writing a full PRD with Claude (stack, database SQL, screens, business rules, security checklist) and turned it into one detailed prompt for Lovable: build a mobile-first "Lead Manager" with Supabase auth, a team-wide leads table, dashboard, search/filters, an AI follow-up dialog and a WhatsApp link. The prompt said exactly what NOT to touch ("the table already exists, do not create migrations or Edge Functions, no API key in the frontend").
*Built:* the whole base app in one go, which mattered because I only had about 10 free credits.

**2. The fix prompt: bugs plus Follow-up date / Due today**
After testing the first build I wrote one prompt, in priority order: (1) the delete confirmation stayed open after a successful delete, (2) "Clear filters" was always visible, (3) add a sort dropdown ("Interested first", "New first" and so on, where the rest of the list stays visible), then (4) the follow-up date with "Due today" and "Overdue" cards.
*Fixed/built:* the dialog now closes on success or failure, Clear filters only shows when a filter is active, sorting, and the follow-up date feature using local dates so Indian users do not get off-by-one days.

**3. The xlsx import fix**
Problem: CSV import worked, but Excel (.xlsx) import failed with Failed to resolve module specifier "xlsx".
Root cause: The import code loaded the xlsx library in a way that hid it from the build tool (Vite): the package name was built by joining strings ("xl" + "sx") and marked /* @vite-ignore */. Because of this, Vite never bundled the library. At runtime the browser received a bare import("xlsx") that it had no way to resolve.
Fix: I described the symptom to an AI coding agent in Antigravity. It replaced the hidden import with a normal import("xlsx") in import-leads-dialog.tsx and installed the package. The library is now bundled as a separate lazy-loaded chunk, so it only downloads when someone picks a file. Excel files now upload and preview.

**4. The UI redesign prompt**
I found the first UI bulky, so I wrote a single "UI-ONLY" prompt with a strict list of files and logic it must not touch. It asked for a compact dashboard in one row, a cleaner table, and a name rule: names stay on one line, and if they are longer than 18 characters only the last word moves to the second line.
*Built:* the cleaner professional look on desktop and phone, with no logic changed.

**5. Edit lead + sort cleanup**
Leads could not be edited after creation. I asked for an "Edit lead" pencil that appears only on row hover (outside the table on wide screens, inside the row on tablets, always visible on phone cards) and reuses the Add lead dialog, prefilled. The prompt also said the duplicate-mobile warning must ignore the lead being edited, and removed the confusing "Newest/Oldest" sort options.
*Built:* editing with the same validation as adding, and a sort dropdown that behaves as I wanted.

**Smaller prompts and edits:** a prompt for the CSV/Excel import with a preview, a prompt to move the delete bin to hover-only outside the table, and one to line up the Actions heading. I also wrote the AI endpoint myself with Claude and added it in Antigravity, because it was cheaper than spending credits.

---

## Problems faced and how I fixed them

**1. The AI button failed on Vercel with "401" / "Your session expired"**
The AI worked on my side but not on the deployed site. The browser showed a 401 from `/api/generate-followup`. That told me the route was running (so it was not a 404 or a missing file) and that its login check was failing. When I added the Supabase URL and publishable key to Vercel, I had marked them as **Sensitive/secret**. I asked Claude, which pointed out that these two values are public by design and belong in normal config, and that typos or quote marks in the values would break the check. I deleted both, re-added them as plain variables (no quotes, no spaces, enabled for Production), kept only `GEMINI_API_KEY` as Sensitive, and **redeployed**. The AI worked after that. I learned that an environment variable change does nothing until you redeploy.
*(I cannot be 100% sure whether the Sensitive flag or a typo was the exact cause. Re-adding them cleanly fixed it.)*

**2. Lovable generated a different framework than my plan**
My PRD assumed a plain Vite app with a Vercel `api/generate-followup.js` file. Lovable told me it had built a newer **TanStack Start** app. I checked the code in GitHub and saw that my plan would not work as written, so I rewrote the AI endpoint as a TanStack Start server route (`src/routes/api/generate-followup.ts`). The build also defaulted to a Cloudflare target, so I added `NITRO_PRESET=vercel` on Vercel. I dropped the `vercel.json` rewrite from the plan.

**3. Excel files would not import**
CSV worked, but `.xlsx` showed "Failed to resolve module specifier 'xlsx'". See prompt 3 above. I gave the exact error text and asked for the cause rather than guessing.

**4. The delete confirmation stayed open**
After a successful delete the lead disappeared and the toast showed, but the dialog stayed open. I wrote a precise fix prompt: make the dialog controlled and close it when the request finishes, success or failure.

**How I handled breakdowns with limited credits:** I tested the live site, wrote down only what actually failed, and gave Lovable one prompt per batch with strict "do not touch" rules. Anything small (a class name, alignment, an environment variable) I fixed in Antigravity for free, and I used Lovable's revert button when a change went wrong.

---

## Limitations and what I would do next

- Keep-alive for Supabase: free projects pause after about a week without use, so I check the link before a demo.
- Invite-only sign-up and roles (admin vs salesperson) for a real team.
- A rate limit on the AI route and a saved history of sent messages.

**Total time spent:** `4 hours`
