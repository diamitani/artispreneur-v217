# Artispreneur v217 — Master Architecture

## Domain: rostragent.com
## GitHub: github.com/diamitani/artispreneur-v217
## Deployed: Vercel (frontend) + AWS (backend)

---

## 1. SYSTEM OVERVIEW

```
┌────────────────────────────────────────────────────────────┐
│                     rostragent.com                          │
│                    (Vercel + CloudFront)                    │
├────────────────────────────────────────────────────────────┤
│  FRONTEND (Static HTML + JS)                                │
│  ├── index.html          Landing + chat demo                │
│  ├── signup.html         5-step onboarding wizard            │
│  ├── login.html          Auth gateway                       │
│  ├── workspace.html      Agent dashboard (6 agents, chat)   │
│  ├── skills.html         Skill builder + PDF generator      │
│  ├── academy.html        16 courses, 307 modules            │
│  ├── directory.html      74+ contacts, searchable           │
│  ├── profile.html        Auto-generated artist profile      │
│  └── courses/*.html      16 course detail pages             │
├────────────────────────────────────────────────────────────┤
│  API GATEWAY (api.rostragent.com → Lambda)                 │
│  ├── POST /auth/signup        Cognito registration          │
│  ├── POST /auth/login         JWT token exchange            │
│  ├── POST /agent/chat         Bedrock DeepSeek V3           │
│  ├── GET  /agent/status       Agent health                  │
│  ├── GET  /directory          Contact search                │
│  ├── GET/POST /outputs        File management               │
│  └── POST /skills/generate    PDF generation → S3           │
├────────────────────────────────────────────────────────────┤
│  AWS SERVICES                                               │
│  ├── Cognito           User auth (email, Google OAuth)      │
│  ├── RDS PostgreSQL    User data, agents, catalog, contacts │
│  ├── S3                Frontend + outputs + assets          │
│  ├── Lambda            FastAPI backend (Mangum adapter)     │
│  ├── Bedrock           DeepSeek V3 LLM for agent chat       │
│  ├── CloudFront        CDN for frontend + API               │
│  ├── ElastiCache       Redis session cache                  │
│  └── Secrets Manager   Encrypted credentials                │
└────────────────────────────────────────────────────────────┘
```

## 2. DATA FLOW

### Signup Flow
```
User → signup.html (5-step wizard)
  → localStorage (profile + bio + links)
  → POST /auth/signup
    → Cognito: create user, return UserSub
    → RDS: INSERT workspace_users
    → S3: create user folder structure
    → Bedrock: generate AI bio (async)
    → Return: JWT tokens
  → Redirect: workspace.html?token=xxx
```

### Agent Chat Flow
```
User → workspace.html (chat input)
  → POST /agent/chat { message, agent_type }
    → Manager Agent: route intent
      → PRO | Distribution | Licensing | Legal | Finance
    → Bedrock: invoke_model(DeepSeek V3)
    → Return: reply + agent metadata
  → Chat UI: render response + plan/tool/artifact cards
```

### Skill Builder Flow
```
User → skills.html
  → Select tools + name + category
  → Build manifest (YAML/JSON)
  → Option A: Download as PDF (client-side jsPDF)
  → Option B: POST /skills/generate
    → Lambda: generate PDF (reportlab)
    → S3: save PDF
    → Return: pre-signed URL
```

## 3. BACKEND MODULE MAP

```
backend/
├── main.py                         Lambda handler (3 lines)
├── onboarding.py                   S3 + scraper + PAL bio
├── skills_webhook.py               PDF generation webhook
├── requirements.txt                Dependencies
└── app/
    ├── main.py                     FastAPI factory
    ├── config.py                   Frozen env config
    ├── models.py                   Pydantic schemas
    ├── auth/
    │   └── __init__.py             Cognito: sign_up, login, get_user
    ├── agents/
    │   ├── __init__.py             Bedrock chat API
    │   ├── framework.py            BaseAgent, Tool, Registry, Router
    │   ├── chat.py                 Bedrock invocation + tool calling
    │   ├── pro_agent.py            PRO Agent (5 tools)
    │   ├── distribution_agent.py   Distribution Agent (5 tools)
    │   ├── licensing_agent.py      Licensing Agent (4 tools)
    │   ├── legal_agent.py          Legal Agent (5 tools)
    │   ├── finance_agent.py        Finance Agent (5 tools)
    │   └── manager_agent.py        Manager Agent (6 tools)
    ├── db/
    │   └── __init__.py             PostgreSQL: connect, fetch, execute
    └── routes/
        ├── auth.py                 POST /auth/signup, /auth/login
        ├── agents.py               POST /agent/chat, GET /agent/status
        ├── outputs.py              GET/POST /outputs
        └── directory.py            GET /directory
```

## 4. INFRASTRUCTURE (Terraform)

```
terraform/
├── main.tf                All AWS resources (single file, clean)
│   ├── VPC + Subnets + IGW
│   ├── RDS PostgreSQL (db.t4g.micro, 20GB)
│   ├── Cognito User Pool + Client
│   ├── S3 buckets (static, outputs)
│   ├── Lambda function (Python 3.12)
│   ├── API Gateway (HTTP v2)
│   ├── CloudFront distribution
│   ├── ElastiCache Redis
│   └── Secrets Manager
└── variables.tf           Config + outputs
```

## 5. DATABASE SCHEMA

```sql
-- Core tables
workspace_users     (id, cognito_sub, username, email, first_name, last_name, 
                     artist_name, artist_type, genre, created_at)

agent_sessions      (id, user_id, agent_type, status, started_at, last_active)

agent_actions       (id, session_id, tool_name, input, output, duration_ms)

soul_docs           (id, user_id, content, compiled_at)

contacts            (id, category, name, location, url, genre, notes)

music_catalog       (id, user_id, title, isrc, bpm, key, duration, pro_status)

splits              (id, catalog_id, collaborator, role, percentage)

outputs             (id, user_id, type, title, s3_key, status, created_at)
```

## 6. KEY COSTS (Monthly, Dev Tier)

| Service | Free Tier | Est. Cost |
|---------|-----------|-----------|
| Vercel | 100GB bandwidth | $0 |
| CloudFront | 1TB transfer | $0 |
| S3 | 5GB storage | $0 |
| Lambda | 1M requests | $0 |
| API Gateway | 1M requests | $0 |
| Cognito | 50K MAU | $0 |
| RDS | db.t4g.micro | ~$12 |
| ElastiCache | cache.t3.micro | ~$12 |
| Bedrock (DeepSeek) | Pay per token | ~$2 |
| **TOTAL** | | **~$26/month** |
