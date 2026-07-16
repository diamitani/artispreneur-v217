# Artispreneur — Budget & Unit Economics

## LLM Routing (All through AWS Bedrock DeepSeek V3)

| Metric | Value |
|--------|-------|
| Model | DeepSeek V3 (us-east-1) |
| Input cost | $0.00135 / 1K tokens |
| Output cost | $0.00405 / 1K tokens |
| Avg chat tokens | ~500 in + ~300 out = 800 total |
| Cost per chat | **$0.00189** |
| Cost per skill execution | ~$0.003 (tool calling uses more tokens) |
| Cost per bio generation | ~$0.008 (longer prompts) |

## Per-User Costs

| Tier | Monthly Chats | Bedrock Cost | Infra Cost | **Total/User** |
|------|--------------|-------------|------------|----------------|
| Free (BYOK) | 0 (user's key) | $0.00 | ~$0.05 | **$0.05** |
| Pro ($9.99) | 100 | $0.19 | ~$0.05 | **$0.24** |
| Unlimited ($19.99) | 500 | $0.95 | ~$0.05 | **$1.00** |

## Profit Margins

| Tier | Revenue | Cost | Profit | Margin |
|------|---------|------|--------|--------|
| Pro | $9.99/mo | $0.24 | $9.75 | **97.6%** |
| Unlimited | $19.99/mo | $1.00 | $18.99 | **95.0%** |

## Breakeven Analysis

| Metric | Value |
|--------|-------|
| Fixed infra cost | ~$26/month (RDS, ElastiCache) |
| Breakeven users (Pro) | **3 users** |
| At 100 Pro users | $999 revenue, $50 cost = **$949 profit/month** |
| At 500 Pro + 200 Unlimited | $8,993 revenue, $320 cost = **$8,673 profit/month** |

## Tier Features Matrix

| Feature | Free | Pro ($9.99) | Unlimited ($19.99) |
|---------|------|-------------|-------------------|
| Dashboard + Profile | ✅ | ✅ | ✅ |
| Academy (16 courses) | ✅ | ✅ | ✅ |
| Directory (74 contacts) | ✅ | ✅ | ✅ |
| Agent Chat (BYOK) | ✅ | ✅ | ✅ |
| Agent Chat (powered) | ❌ | 100 chats/mo | Unlimited |
| Skill Builder | ❌ | 5 skills/mo | Unlimited |
| PDF Generation | ❌ | 10 PDFs/mo | Unlimited |
| S3 Storage | ❌ | 100MB | 1GB |
| Priority Support | ❌ | ❌ | ✅ |
| Custom Agent Skills | ❌ | ❌ | ✅ |
| API Access | ❌ | ❌ | ✅ |
