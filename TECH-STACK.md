# Artispreneur v217 — Tech Stack Key Sheet

```
┌─────────────────────────────────────────────────────────────────┐
│                     ARTISPRENEUR TECH STACK                       │
│                       rostragent.com                              │
├──────────────┬──────────────────────────────────────────────────┤
│ FRONTEND     │ Static HTML/CSS/JS — Vercel + CloudFront CDN      │
│              │ Design: Dark #09090b + Gold #c9a227               │
│              │ Fonts: Inter, Playfair Display, Geist Mono        │
│              │ 22 HTML pages, client-side JS, jsPDF              │
├──────────────┼──────────────────────────────────────────────────┤
│ BACKEND      │ Python 3.12 — FastAPI + Mangum (Lambda)           │
│              │ Modular: config/auth/agents/db/routes             │
│              │ 13 files, 291 lines, avg 22 lines/file            │
├──────────────┼──────────────────────────────────────────────────┤
│ AI / LLM     │ AWS Bedrock — DeepSeek V3                         │
│              │ 6 specialized agents, 30 tools                    │
│              │ Manager routes intents → specialist agents        │
├──────────────┼──────────────────────────────────────────────────┤
│ AUTH         │ AWS Cognito User Pools                            │
│              │ Email/password + Google OAuth (planned)           │
│              │ JWT tokens, RLS-ready                             │
├──────────────┼──────────────────────────────────────────────────┤
│ DATABASE     │ AWS RDS PostgreSQL 16.3 — db.t4g.micro, 20GB     │
│              │ Tables: users, sessions, actions, contacts,        │
│              │ catalog, splits, outputs, soul_docs               │
├──────────────┼──────────────────────────────────────────────────┤
│ STORAGE      │ AWS S3 — frontend assets + user outputs           │
│              │ Per-user folder: /users/{name}/outputs/           │
├──────────────┼──────────────────────────────────────────────────┤
│ CACHE        │ AWS ElastiCache Redis — session cache             │
├──────────────┼──────────────────────────────────────────────────┤
│ API          │ AWS API Gateway HTTP v2 → Lambda proxy           │
│              │ Routes: /auth, /agent, /directory, /outputs       │
├──────────────┼──────────────────────────────────────────────────┤
│ CDN/DNS      │ AWS CloudFront + Route 53 + Vercel               │
├──────────────┼──────────────────────────────────────────────────┤
│ INFRA AS CODE│ Terraform 1.7+ — single main.tf + variables.tf    │
│              │ Resources: VPC, RDS, Cognito, S3, Lambda,         │
│              │ API Gateway, CloudFront, ElastiCache, Secrets     │
├──────────────┼──────────────────────────────────────────────────┤
│ CI/CD        │ GitHub → Vercel auto-deploy on push               │
│              │ Repo: diamitani/artispreneur-v217                 │
├──────────────┼──────────────────────────────────────────────────┤
│ MONITORING   │ CloudWatch (Lambda logs, RDS metrics)             │
│              │ Vercel Analytics (frontend)                       │
├──────────────┼──────────────────────────────────────────────────┤
│ PDF GEN      │ Client: jsPDF (instant)                          │
│              │ Server: ReportLab → S3 → pre-signed URL           │
├──────────────┼──────────────────────────────────────────────────┤
│ COST         │ ~$26/month dev tier                               │
│              │ $0.001/signup (Bedrock token cost)               │
├──────────────┴──────────────────────────────────────────────────┤
│ CREDENTIALS  (session-only, not stored)                          │
│ AWS Account: 148761663702                                       │
│ Bedrock:     DeepSeek V3 via us-east-1                           │
│ Vercel Team: artispreneur                                       │
└─────────────────────────────────────────────────────────────────┘

DEPLOY COMMANDS
  Frontend:  git push → Vercel auto-deploy
  Backend:   cd terraform && terraform apply
  Domain:    vercel domains verify rostragent.com

QUICK START
  1. git clone https://github.com/diamitani/artispreneur-v217
  2. cd artispreneur-v217
  3. python3 -m http.server 8080    # local frontend
  4. cd backend && pip install -r requirements.txt
  5. python3 main.py                 # local backend (needs AWS creds)
```
