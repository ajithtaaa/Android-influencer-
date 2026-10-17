# SwapReel — AI video face swap (Android + web)

Users pick a short video and a face photo, and the app swaps the face in with
Higgsfield AI. Credits are sold through **Google Play Billing** on Android and
**Stripe** on the web test link.

```
src/app/        Screens (Expo Router) — same code runs on Android and the web link
src/lib/        API client, billing (billing.ts = Google Play, billing.web.ts = Stripe), uploads
api/index.ts    The backend: one Vercel serverless function
server/         Backend logic: Higgsfield client, credits, Google Play + Stripe verification
plugins/        Expo config plugin that adds release signing from env vars
.github/        CI + the on-demand "Android build (APK + AAB)" workflow
```

## How it works

1. The app creates an anonymous account (no email or name is collected).
2. Video + photo upload straight to Higgsfield storage via a presigned URL.
3. The backend spends 1 credit and submits the swap to Higgsfield; the app
   polls until it finishes. Failed or blocked swaps refund the credit.
4. The Higgsfield key lives **only on the server**. It is never shipped in the app.

**Demo mode:** until `HF_CREDENTIALS` and `HF_SWAP_MODEL` are set, swaps
return a sample clip and purchases are simulated, so the link can be tested
without spending anything.

## Going live: setup checklist

### 1. Backend (Vercel)
Set these in Vercel → Project → Settings → Environment Variables (see `.env.example`):

| Variable | Where to get it |
|---|---|
| `APP_SECRET` | Any long random string |
| `PUBLIC_APP_URL` | Your Vercel URL |
| `HF_CREDENTIALS` | Higgsfield API console → API keys (`KEY_ID:KEY_SECRET`) |
| `HF_SWAP_MODEL` | The video face-swap model path from the Higgsfield API console |
| `KV_REST_API_URL` / `KV_REST_API_TOKEN` | Vercel → Storage → add **Upstash Redis** (free tier) |
| `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` | Stripe dashboard. Webhook URL: `https://<your-domain>/api/billing/stripe-webhook`, event `checkout.session.completed` |
| `PLAY_SERVICE_ACCOUNT_JSON` | Google Cloud service account invited in Play Console → Users & permissions |

> A database (Upstash) is **required** before real users. Without it data is
> kept in memory and is lost when the server restarts.

### 2. Google Play Console
- Create the app with package name **`com.swapreel.app`**.
- Monetize → Products → In-app products: create consumables `credits_5`, `credits_20`, `credits_60`.
- Privacy policy URL: `https://<your-domain>/privacy`
- Account deletion URL: `https://<your-domain>/delete-account`
- Content rating questionnaire: say the app generates AI content and allows sharing.
- Target audience: **18+ only**.
- Data safety form: see the table below.

### 3. Building the APK / AAB
GitHub → Actions → **Android build (APK + AAB)** → Run workflow, with the API URL set to your Vercel link.
To make an AAB that Play accepts, add these repository secrets first (one upload key, keep a backup!):
`ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD`.

## Google Play compliance: what's built in

| Requirement | How the app handles it |
|---|---|
| Target API level | `targetSdkVersion 36`, `minSdk 24`, 16 KB page-size ready (RN 0.88) |
| Payments policy | Digital credits are sold through Google Play Billing on Android. Stripe is only used on the web. |
| AI-generated content policy | In-app **Report** on every result, automatic safety filtering by Higgsfield, "AI-generated" label, rules shown at onboarding |
| Deepfake / impersonation | Consent checkbox before every swap, Terms ban non-consensual, sexual, minor and deceptive content |
| Age | 18+ confirmation at first launch |
| Account deletion | In-app (Settings → Delete my data) and web page `/delete-account` |
| Permissions | None besides Internet and Billing. Uses the system Photo Picker, so there's no storage, camera or microphone permission. `AD_ID` is blocked. |
| Data minimization | Anonymous ID only, results expire after 30 days, no ads, no analytics, no tracking SDKs |
| Secrets | Higgsfield, Stripe and Google keys are server-side only |

### Data safety form answers
| Data type | Collected | Shared | Purpose | Optional |
|---|---|---|---|---|
| Photos | Yes | Yes (Higgsfield, for processing) | App functionality | No (needed for swaps) |
| Videos | Yes | Yes (Higgsfield, for processing) | App functionality | No |
| Purchase history | Yes | No | App functionality | No |
| User IDs (random account ID) | Yes | No | App functionality, fraud prevention | No |

Encrypted in transit: **Yes**. Users can request deletion: **Yes**.

### About Stripe inside the Android app
Google Play requires its own billing for digital goods. In the US, UK and EEA, Google
now runs programs that allow alternative billing or external payment links. They require
enrolling in Play Console, showing Google's disclosure screens, reporting transactions
to Google and paying Google's fees. If you enroll, the Android app can add Stripe as a
choice next to Google Play. Until then, the Android build uses Google Play Billing only,
which is compliant everywhere.

## Local development
```
npm install
npm run dev:api        # backend on :3001 (demo mode)
EXPO_PUBLIC_API_URL=http://localhost:3001 npm run web
npm run typecheck
```
