# Tire tool — Phase 2 roadmap

**Context for Cursor:** Firebase + Vite/React portal (this repo). Production may also use **Cloud Run** (`skedaddle-os-api`) for some APIs — keep this doc and `TACTICAL-OS-FLEET-ALERTS.md` in sync with what is actually deployed.

**Goal right now:** Verify **Slack notification works end-to-end in production** before building interactivity or new UI.

---

## Resolved: Step 1 open questions (this repository)

These are answered by inspecting `skedaddle-portal` as of this doc:

| Question | Answer |
| :--- | :--- |
| **Which endpoint does the UI call?** | **Firebase Callable** `sendTireSaleSms` — not a raw `fetch` to Cloud Run from `index.html`. Call site: `src/components/tires/SaleMessenger.jsx` (`httpsCallable(functions, 'sendTireSaleSms')`). The built app is bundled into JS by Vite; there is no separate tire logic in static `index.html`. |
| **Webhook env var name?** | Code reads **`NOTIFY_WEBHOOK_URL`** (the Slack `https://hooks.slack.com/...` URL) and **`NOTIFY_WEBHOOK_STYLE`** = literal **`slack`** \| **`discord`** \| **`generic`** — never put the webhook URL in `NOTIFY_WEBHOOK_STYLE`. See [CLOUD-RUN-NOTIFY-ENV-FIX.md](./CLOUD-RUN-NOTIFY-ENV-FIX.md) if Cloud Run had the URL under the wrong variable. |
| **Current Slack message format?** | **Plain text** via Slack incoming webhook: JSON body `{ "text": "<multiline string>" }`. **Not** Block Kit yet — no `blocks` / buttons until Step 4. |

---

## Step 1 — Verify end-to-end Slack notification (do this first)

**What exists:** Callable **`sendTireSaleSms`** in `functions/index.js`, invoked from **`SaleMessenger`** after sign-in.

**What to do:**

1. Confirm call site: open `src/components/tires/SaleMessenger.jsx` — `httpsCallable(functions, 'sendTireSaleSms')`.
2. (Optional) Add a temporary **“Test Slack”** control (e.g. on Tires header or hidden dev-only) that calls the same callable with a **minimal valid payload** (valid `mspn`, `quantity`, etc.) or add a **separate callable** `testSlackWebhook` that only posts a fixed string — then remove after green.
3. Ensure **`NOTIFY_WEBHOOK_URL`** (and `NOTIFY_WEBHOOK_STYLE=slack` if needed) is set on the **deployed** function (Firebase Console → Functions → configuration, or GCP for 2nd gen). If production uses **Cloud Run** instead, set the equivalent there and confirm the **UI actually hits that path** (see Step 2).
4. Submit from production UI → message appears in **`#fleet-ops`** (or your webhook channel).
5. Remove any temporary test UI.

**Done when:** A real call from **production** lands in Slack with correct formatting.

---

## Step 2 — Unify the notify path

**Decision:** Is production using **only** Firebase Callable, **only** Cloud Run, or both? The portal today is **Callable-only**.

**Why it matters:** Slack interactivity needs **one** clear inbound URL for Slack to POST `payload` to. Two outbound paths double confusion and env drift.

**What to do:**

- **If Cloud Run is canonical:** Change the client to `fetch(CLOUD_RUN_URL/...)` (with Firebase ID token or your auth scheme), retire or proxy the callable.
- **If Callable is canonical:** Keep `httpsCallable`; ensure Cloud Run duplicate is removed or is a thin proxy only.

**Done when:** One outbound notify implementation, one place for webhook env vars, documented in `TACTICAL-OS-FLEET-ALERTS.md`.

---

## Step 3 — Firestore `orders` model

**Schema (suggested):** `orders/{id}`

- `status`: `"pending"` \| `"ready"` \| `"sold"` (extend as needed)
- `mspn`: string
- `assignedTo`: string (uid or display name)
- `createdAt`, `updatedAt`: Firestore timestamps

**What to do:**

1. On successful tire-sale notify (callable or Run), **create** `orders/{id}` with `status: "pending"` (use Admin SDK in backend).
2. Add **`firestore.rules`** for `orders` (read for authed portal users; writes only from backend/Admin unless you design client rules carefully).
3. Portal: **`onSnapshot`** query on `orders` (filtered as needed) and a small **Orders** strip or table on `/tires` or dashboard.

**Done when:** Submitting a sale creates a doc and the UI updates without full page reload.

---

## Step 4 — Slack interactivity (“Mark ready”)

**Build:** HTTPS endpoint (Cloud Run **`/slack/actions`** or Firebase `onRequest`) that:

1. Accepts Slack **`payload`** (form-urlencoded or JSON per Slack docs).
2. Verifies **`X-Slack-Signature`** with **`SLACK_SIGNING_SECRET`** (env on the same service).
3. Handles **`action_id`** `mark_ready` only initially.
4. Updates matching **`orders/{id}`** (`status: "ready"`, `updatedAt`).
5. Returns **200** within **3s** (defer non-critical work if needed).

**Outbound message upgrade:** Today the code sends `{ "text": "..." }`. Many Slack **incoming webhooks** also accept a **`blocks`** array (Block Kit) in the same POST — try that first for a **Mark ready** button; if your workspace rejects it or interactivity still fails, switch to **`chat.postMessage`** with a **bot token** + channel ID.

Interactivity (button clicks) **always** needs a separate **Request URL** endpoint with signing secret — the webhook URL only receives outbound posts from you, not button events from Slack.

**Env:** `SLACK_SIGNING_SECRET`, plus either webhook-only flow or **`SLACK_BOT_TOKEN`** + channel as needed for Block Kit.

**Done when:** Clicking **Mark ready** in Slack updates Firestore and the portal reflects it.

---

## Deferred (do not build yet)

- CSV export from tire table  
- Bulk CTS edit  
- Saved filter presets  
- People Systems `registeredUsers` automation  
- Git + GitHub Actions CI  

---

## Related docs

- [TACTICAL-OS-FLEET-ALERTS.md](./TACTICAL-OS-FLEET-ALERTS.md) — Slack vs Functions vs Cloud Run alignment  
- `functions/.env.example` — local env names for webhooks  
