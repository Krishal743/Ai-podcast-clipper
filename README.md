# 🎙️ AI Podcast Clipper — SaaS

Turn full-length podcasts into **viral short-form clips** ready for TikTok and YouTube Shorts.

Upload a podcast episode and the system automatically:

1. **Transcribes** the audio (`whisperX`)
2. **Detects the most engaging moments** (stories, questions, reactions) using an LLM (`Gemini`)
3. **Tracks the active speaker** with lip/audio active-speaker detection (`LR-ASD`)
4. **Renders vertical clips** cropped to the speaker's face with **auto-generated subtitles**

Built as a production-style SaaS with authentication, a **credit-based billing system**, and a **background job queue**.

---

## ✨ Features

- 🎬 Auto-detection of viral moments in podcasts (stories, questions, reactions)
- 🔉 Transcriptions with `m-bain/whisperx`
- 🎯 Active-speaker detection for smart video cropping — `Junhua-Liao/LR-ASD`
- 📱 Vertical 1080×1920 clips with **burned-in subtitles**
- 🧠 LLM-powered moment selection (Gemini)
- 🎞️ GPU-accelerated rendering with `ffmpegcv` on **Modal** (NVIDIA L40S)
- ⚡ Background queue with **Inngest** for long-running jobs
- 💳 Credit-based billing with **Stripe** (or built-in **mock mode** — no Stripe account needed)
- 👤 Auth with email + password (`Auth.js` / NextAuth v5)
- 🗄️ Prisma + SQLite for storage, **S3** for video uploads/clips
- 📊 Dashboard to upload podcasts, track processing status, and watch your clips

---

## 🧱 Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | Next.js 15, React 19, TypeScript, Tailwind CSS, shadcn/ui |
| Backend | Python, FastAPI, Modal (serverless GPU) |
| Models | whisperX (transcription), LR-ASD (active speaker detection), Gemini (moment ID) |
| Queues | Inngest |
| Auth | Auth.js (NextAuth v5) — credentials |
| Database | Prisma ORM + SQLite |
| Storage | AWS S3 (presigned uploads + clips) |
| Payments | Stripe Checkout (+ mock mode for demos) |

---

## 🗂️ Project Structure

```
ai-podcast-clipper/
├── ai-podcast-backend/            # Python + Modal serverless GPU app
│   ├── main.py                    # FastAPI endpoint: transcribe → detect → render clips
│   ├── needed.txt                 # Python dependencies
│   └── LR-ASD/                    # Active-speaker detection (git submodule)
└── ai-podcast-clipper-frontend/   # Next.js web app
    ├── src/
    │   ├── actions/               # Server actions (auth, s3, stripe, generation)
    │   ├── app/                   # App router pages + API routes
    │   ├── components/            # UI components
    │   ├── inngest/               # Inngest client + process-video function
    │   └── server/                # Auth config + Prisma client
    └── prisma/schema.prisma       # Database schema
```

---

## 🔄 How It Works

```
[User uploads MP4]
      │  (S3 presigned URL → file stored as {uuid}/original.mp4)
      ▼
[Inngest "process-video-events" function]
      │  1. checks user credits
      │  2. sets status → "processing"
      ▼
[M o d a l  /  FastAPI  (GPU)]
      │  1. downloads from S3
      │  2. transcribes with whisperX
      │  3. Gemini finds the viral moments (timestamps)
      │  4. LR-ASD tracks the active speaker
      │  5. renders 1080×1920 clips with subtitles
      │  6. uploads clips back to S3
      ▼
[Inngest continues]
      │  creates Clip records, deducts credits, sets status → "processed"
      ▼
[Dashboard] → watch & download your clips
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js 20+** and npm
- **Python 3.12**
- **Docker** (required by the Inngest CLI dev server)
- An **AWS** account (S3 bucket + IAM user)
- A **Modal** account (for the GPU backend)
- A **Google AI (Gemini)** API key

### 1. Clone (with submodules)

The active-speaker detection model is a git submodule:

```bash
git clone --recurse-submodules https://github.com/<your-user>/<your-repo>.git
cd ai-podcast-clipper
```

If you already cloned without `--recurse-submodules`:

```bash
git submodule update --init --recursive
```

### 2. Deploy the backend to Modal

```bash
cd ai-podcast-backend
python -m venv .venv && source .venv/bin/activate
pip install -r needed.txt

modal setup            # log in once
modal deploy main.py   # deploy the GPU endpoint
```

The deployed app prints a URL like:
`https://<you>--ai-podacast-clipper-....modal.run`

> **Modal secrets:** the app reads `GEMINI_API_KEY` and your AWS credentials from a
> Modal secret named `ai-podcast-clipper-secret`. Create it in the Modal dashboard:
> `GEMINI_API_KEY`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`.

### 3. Set up the frontend

```bash
cd ai-podcast-clipper-frontend
cp .env.example .env
npm install
```

Fill in `.env` (see [Environment Variables](#-environment-variables)).

**Important:** `.env` is gitignored — never commit it. Only `.env.example` (placeholders) goes to the repo.

### 4. Prepare the database

```bash
npm run db:generate   # generate the Prisma client
npm run db:push       # create the SQLite schema
```

### 5. Run

```bash
npm run dev          # Next.js at http://localhost:3000
npm run inngest-dev  # Inngest queue dev server (new terminal)
```

Sign up at `/signup`, then upload a podcast from the dashboard. New users start with **10 free credits**.

---

## 💳 Payments — Mock vs Live Stripe

> **Heads up:** Stripe isn't available in India. This project includes a **mock
> payments mode** so the full billing flow (buy pack → checkout → credits added)
> works end-to-end for demos **without a Stripe account**.

Set `STRIPE_MODE` in `.env`:

| Mode | `STRIPE_MODE` | Behaviour |
| --- | --- | --- |
| **Mock (default)** | `mock` | "Buy credits" opens a simulated checkout page. No Stripe API is called, no real charge; credits are added instantly. A "Test mode" badge is shown. |
| **Live Stripe** | `live` | Real Stripe Checkout. Requires valid keys + products. |

**Live mode still uses the real Stripe integration** (customer creation at signup,
checkout sessions, and the `checkout.session.completed` webhook), so you can flip to
live whenever a Stripe account is available.

### Prices & credit packs

| Pack | Price | Credits |
| --- | --- | --- |
| Small | $9.99 | 50 |
| Medium | $24.99 | 150 |
| Large | $69.99 | 500 |

1 credit ≈ 1 minute of podcast processed.

---

## 🧾 Environment Variables

### Frontend (`.env`)

| Variable | Description |
| --- | --- |
| `AUTH_SECRET` | NextAuth secret — generate with `npx auth secret` |
| `DATABASE_URL` | Prisma connection string (`file:./db.sqlite` for local) |
| `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` | IAM user keys with S3 access |
| `AWS_REGION` | e.g. `us-east-1` |
| `S3_BUCKET_NAME` | Your S3 bucket |
| `PROCESS_VIDEO_ENDPOINT` | URL of the deployed Modal endpoint |
| `PROCESS_VIDEO_ENDPOINT_AUTH` | Bearer token for the Modal endpoint |
| `BASE_URL` | App URL for redirects (`http://localhost:3000`) |
| `STRIPE_MODE` | `mock` (default) or `live` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key (live mode) |
| `STRIPE_SECRET_KEY` | Stripe secret key (live mode) |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret (live mode) |
| `STRIPE_SMALL/MEDIUM/LARGE_CREDIT_PACK` | Stripe Price IDs (live mode) |

### Backend (Modal secrets)

`GEMINI_API_KEY`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`

---

## 🪣 AWS Setup

Create an S3 bucket, then configure CORS (required for browser uploads):

```json
[
  {
    "AllowedHeaders": ["Content-Type", "Content-Length", "Authorization"],
    "AllowedMethods": ["PUT"],
    "AllowedOrigins": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

IAM policy for the app's user (list, upload, download):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:ListBucket"],
      "Resource": "arn:aws:s3:::YOUR_BUCKET"
    },
    {
      "Effect": "Allow",
      "Action": ["s3:GetObject", "s3:PutObject"],
      "Resource": "arn:aws:s3:::YOUR_BUCKET/*"
    }
  ]
}
```

---

## 🔒 Security Notes

- `.env` files are **gitignored** — secrets never enter the repository.
- If you ever shared a real key (e.g. the AWS access key in this project), **rotate it** in IAM before pushing to a public repo.
- The Modal endpoint is protected by a bearer token (`PROCESS_VIDEO_ENDPOINT_AUTH`).

---

## 📄 License

This project is for demonstration/learning purposes. See `LICENSE.MD` for details.
The `LR-ASD` submodule and `whisperX`/`Gemini` components remain under their respective licenses.
