# Artispreneur v217 — Post-Build PRD

## Product: Artispreneur OS
**URL**: rostragent.com  
**Built**: June–July 2026  
**Status**: v2.17 — Deployed, functional, ready for users

---

## 1. WHAT WE BUILT

Artispreneur is the first AI agent operating system for independent music artists. It replaces what a record label does — PRO registration, distribution, licensing, legal, finance, and management — with 6 specialized AI agents that work through a chat interface.

### Core Value Proposition
"You make the music. We handle the rest."
- An artist signs up in 5 minutes
- AI interviews them, scrapes their links, builds their profile
- 6 agents handle every business task: royalties, playlists, sync licensing, LLC formation, taxes, strategy
- Everything in one dark, premium, Claude Code-level workspace

## 2. WHAT USERS CAN DO

| Action | Flow |
|--------|------|
| **Sign Up** | 5-step wizard → captures identity, story, situation, experience, goals + links |
| **Login** | Email/password → checks stored profile → JWT → workspace |
| **Chat with Agents** | Type any music business question → agent routes to specialist → Bedrock AI responds |
| **Plan Execution** | Agent produces stepped plans with progress indicators |
| **Tool Execution** | Agent runs tools (register song, find playlists, form LLC) → shows results |
| **Skill Builder** | Create custom agent skills → export as YAML → download as PDF |
| **Generate PDFs** | EPK, splitsheet, producer agreement, release plan — instant download |
| **Browse Academy** | 16 courses, 307 modules, filter by category |
| **Search Directory** | 74+ music industry contacts, paginated, filterable |
| **View Profile** | Auto-generated bio from onboarding + scraped links |

## 3. AGENT CAPABILITIES

| Agent | Tools | Example Commands |
|-------|-------|-----------------|
| ♩ **PRO** | 5 tools | "Register my new song with BMI", "Create splitsheet for my EP" |
| ↗ **Distribution** | 5 tools | "Find R&B playlists", "Compare UnitedMasters vs DistroKid" |
| ⚡ **Licensing** | 4 tools | "Find sync opportunities for my track", "Submit to Musicbed" |
| § **Legal** | 5 tools | "Set up an LLC in Illinois", "Generate a producer agreement" |
| $ **Finance** | 5 tools | "Estimate my Q3 taxes", "Show me music tax deductions" |
| ◎ **Manager** | 6 tools | "Create a release plan", "Daily briefing", routes to specialists |

## 4. TECH STACK

| Layer | Technology | Version |
|-------|-----------|---------|
| **Frontend** | HTML5, CSS3, Vanilla JS | — |
| **CDN** | Vercel + CloudFront | — |
| **Backend** | Python 3.12, FastAPI, Mangum | 0.110+ |
| **LLM** | AWS Bedrock — DeepSeek V3 | latest |
| **Auth** | AWS Cognito | — |
| **Database** | AWS RDS PostgreSQL 16.3 | db.t4g.micro |
| **Storage** | AWS S3 | Standard |
| **Cache** | AWS ElastiCache Redis | cache.t3.micro |
| **API Gateway** | AWS API Gateway HTTP v2 | — |
| **DNS** | AWS Route 53 | — |
| **IaC** | Terraform 1.7+ | HCL |
| **CI/CD** | GitHub + Vercel auto-deploy | — |
| **PDF Generation** | jsPDF (client), ReportLab (server) | 2.5+ |
| **Fonts** | Inter, Playfair Display, Geist Mono | Google Fonts |
| **Design System** | Dark (#09090b) + Gold (#c9a227) | Custom |

## 5. OPEN SOURCE DEPENDENCIES

- **Hermes Agent** (Nous Research) — agent framework inspiration
- **ROSTR Framework** — PAL compilation + NPAO orchestration
- **Signal/Wire** — planned messaging integration
- **Curriculum-OS** — course ingestion pipeline

## 6. WHAT'S NEXT (v2.18+)

| Priority | Feature | Effort |
|----------|---------|--------|
| P0 | Live Bedrock integration in chat | 2 days |
| P0 | Cognito auth live (replace localStorage) | 1 day |
| P1 | Google OAuth | 1 day |
| P1 | Stripe payments for Pro/BYOK tiers | 3 days |
| P1 | Terraform deploy to production AWS | 1 day |
| P2 | Real link scraping (Spotify API, IG API) | 3 days |
| P2 | Email verification flow | 1 day |
| P2 | Mobile responsive polish | 2 days |
| P3 | Signal/Wire messaging integration | 5 days |
| P3 | Multi-tenant agent isolation | 5 days |

## 7. KEY METRICS

- **Pages**: 22 HTML files
- **Backend modules**: 13 Python files, 291 lines, avg 22 lines/file
- **Agents**: 6 agents, 30 tools
- **Courses**: 16 courses, 307 modules
- **Directory**: 74+ contacts, 6 categories
- **Cost/signup**: ~$0.001
- **Monthly infra cost**: ~$26 (dev tier)
- **Time from idea to deployed**: ~2 weeks
