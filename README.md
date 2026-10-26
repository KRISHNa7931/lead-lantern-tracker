# Lead Lantern Tracker

Build a mobile-first "Lead Manager" web app for a sales team using React, TypeScript, Tailwind and shadcn/ui, with Supabase for database and auth. Use a clean, modern, professional look (white/slate background, one accent color, rounded cards). Name the app "Lead Manager".

make sure, (1) Supabase project is created, (2) the leads table SQL and seed SQL from PRD.md have been run, (3) "Confirm email" is turned OFF in Supabase Auth, (4) Lovable is connected to that Supabase project.

IMPORTANT RULES
The Supabase table public.leads ALREADY EXISTS with Row Level Security and policies. Do NOT create, alter or drop tables, and do NOT create any migrations. Do NOT create any Supabase Edge Functions.
Columns of leads: id (uuid), name (text), mobile (text, 10 digits), business_name (text), city (text), service (text), status (text, default 'New'), notes (text), follow_up_date (date, nullable, ignore it in the UI for now), created_by (uuid), created_at (timestamptz), updated_at (timestamptz).
Allowed service values (exact strings): "WhatsApp Bulk", "RCS SMS", "Social Media Management", "WhatsApp AI Agent".
Allowed status values (exact strings): "New", "Contacted", "Interested", "Closed", "Not Interested".
Never put any AI API key in the frontend. The AI call goes to my own endpoint POST /api/generate-followup (I will add that backend file myself later). Just call it with fetch as described below.
Use the Supabase client only with the public URL and anon key from the Supabase integration.
Authentication
Email + password login using Supabase Auth, on a /auth page with two tabs: "Log in" and "Sign up". No email confirmation step: after sign-up the user is logged in directly.
Show clear error messages (wrong password, email already used, password too short; min 6 chars).
/ (main page) is protected: logged-out users are redirected to /auth. Logged-in users visiting /auth go to /.
Header shows the app name, the logged-in email and a "Log out" button.
This is a TEAM app: every logged-in user sees and edits ALL leads. Do not filter by user.
Main page layout (top to bottom)
Dashboard cards: "Total Leads" plus one card each for New, Contacted, Interested, Closed, Not Interested, each showing a count. Always count ALL leads, ignoring search and filters. Layout: 2 columns on phones, 6 across on desktop. Each card has a small colored status badge/color. The counts must update immediately when a lead's status changes or a lead is added or deleted (compute them from the in-memory leads list).
Toolbar: a search input (placeholder "Search by name or mobile"), a Status filter dropdown (All + 5 statuses), a Service filter dropdown (All + 4 services), a "Clear filters" button, and an "Add lead" button. On phones make "Add lead" a floating action button at the bottom right.
Lead list, sorted by created_at descending (newest first):
Desktop (768px and up): a table with columns Name, Mobile, Business, City, Service, Status, Created (date), Actions.
Phone (below 768px): a card per lead showing name, mobile, business, city, service, notes (truncated), status dropdown, and two buttons. No horizontal scrolling anywhere.
Status is an inline dropdown on every lead. Changing it updates Supabase immediately (optimistic update; if it fails, revert and show an error toast).
Actions per lead: an "AI Follow-up" button and a "Delete" button (confirm dialog before deleting).
Load all leads once with Supabase (select * order by created_at desc) and do the search and filters in the browser. Search matches name (case-insensitive, partial) OR mobile (partial). Search, status filter and service filter combine with AND.
States (important, do all of them)
Loading: skeleton rows/cards while leads load.
Empty: if there are no leads at all, show "No leads yet. Add your first lead." with an Add button. If filters match nothing, show "No leads match your filters" with a Clear filters button.
Error: if loading fails, show an error message with a Retry button.
Success/error toasts for add, status change, delete and AI actions.
Buttons show spinners and are disabled while saving.
Add lead form (modal dialog; full-screen on phones)

Fields: Name (required), Mobile number (required), Business name, City, Service interested in (dropdown of the 4 services, required, with placeholder "Select service"), Notes (textarea). Validation with inline error messages:

Name: required.
Mobile: normalize first, then validate. Normalization function: remove every non-digit character; remove leading zeros; if the result is 12 digits and starts with "91", remove the "91". The final value must match /^[6-9]\d{9}$/ (a valid 10-digit Indian mobile). Save only the clean 10 digits. So "+91 98765-43210", "098765 43210" and "9876543210" all save as 10 digits. Otherwise show "Enter a valid 10-digit mobile number".
Service: required. Duplicate warning: before inserting, check the loaded leads for the same 10-digit mobile. If found, show a confirm dialog: "A lead with this number already exists (<existing name>). Save anyway?" with Cancel and "Save anyway". Do not block saving. After a successful insert, close the modal, add the lead to the top of the list, and show a success toast.
AI Follow-up modal (full-screen on phones, centered dialog on desktop)

Opens when the user clicks "AI Follow-up" on a lead. Contents:

Header with the lead's name, service and a status badge.
A language toggle with two options: "English" and "Hinglish" (default "Hinglish").
A primary button "Generate with AI" (label changes to "Regenerate" after the first message). Shows a spinner while loading.
A multi-line editable textarea showing the generated message so the user can tweak it. Placeholder: "Click Generate with AI to write a message".
A green button "Send on WhatsApp" (WhatsApp icon), disabled while the textarea is empty. On click it opens this URL in a new tab with rel="noopener noreferrer": https://wa.me/91${lead.mobile}?text=${encodeURIComponent(textareaValue)} (lead.mobile is already 10 clean digits.) When the user clicks "Generate with AI", call:
const { data: { session } } = await supabase.auth.getSession();
const res = await fetch("/api/generate-followup", {
  method: "POST",
  headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.access_token}` },
  body: JSON.stringify({ name, businessName, city, service, status, notes, language }),
});

where language is "English" or "Hinglish" and the other values come from the lead. The response JSON is { message: string } on success or { error: string } on failure. Put message into the textarea. Error handling inside the modal (show as a friendly inline message, not a crash):

HTTP 404: "AI is available only on the deployed site."
HTTP 401: "Your session expired. Please log in again."
Any other failure or network error: "Could not generate a message. Please try again." Do NOT call Gemini, OpenAI or any AI service directly from the frontend, and do NOT create an AI backend inside Supabase.
Responsiveness and polish
Mobile first. Test mentally at 360px width: no horizontal scroll, tap targets at least 44px high, readable text, dropdowns and modals usable with a thumb.
Use the shadcn/ui components (Table, Card, Dialog, Select, Input, Textarea, Button, Badge, Toast/Sonner, Skeleton, AlertDialog).
Status badge colors: New = blue, Contacted = amber, Interested = purple, Closed = green, Not Interested = gray/red.
Use TanStack Query (or equivalent) for data fetching and state so updates are instant.
Keep the code simple and well organized: separate files for the Auth page, the main page, the AddLeadDialog, the FollowUpDialog, a lib/phone.ts file with the mobile normalization and the wa.me link helper, and a lib/constants.ts file with the SERVICES and STATUSES arrays so they are easy to change.
Add a vercel.json-friendly setup: no server-side code in this project; it is a pure client-side Vite app.

Build all of this now in one go.

After Lovable finishes: quick check before spending more credits
Log in with the demo user and confirm you see the 10 seed leads.
Add a lead, change a status, search, filter, delete.
Open AI Follow-up (the "deployed site only" message is expected in the preview).
Connect GitHub from Lovable, then continue with the Vercel steps in PRD.md (section 11).
Follow-up prompts to keep in your back pocket (use only if needed, each costs a credit)
"Fix: the dashboard counts do not update right after changing a status. Compute them from the same leads state used by the list."
"Fix: on phones the lead card overflows horizontally. Make all content wrap and remove horizontal scrolling."
"The AI Follow-up modal should be full screen on screens below 768px."

if anything needs to be done by my side you if you need anything else from me just ask me...

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/2b804134-c1b2-4da2-a79f-957934cf1c9e).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
