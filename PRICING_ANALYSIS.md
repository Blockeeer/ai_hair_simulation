# AI Hair Simulation - Pricing & Profit Analysis

## Credit Package Pricing (Your Revenue)

| Package | Credits | Price (USD) | Price per Credit |
|---------|---------|-------------|------------------|
| Starter | 10 | $1.99 | $0.199 |
| Popular | 30 | $4.99 | $0.166 |
| Pro      | 75 | $9.99 | $0.133 |
| Mega | 200 | $19.99 | $0.100 |

**Average Revenue per Credit: ~$0.15**

---

## AI Model API Costs (Your Expenses)

### 1. Replicate - flux-kontext-apps/change-haircut

| Metric | Value |
|--------|-------|
| Model | flux-kontext-apps/change-haircut |
| Pricing Type | Per prediction |
| **Cost per Run** | **~$0.02 - $0.05** |
| Average | ~$0.035 per generation |

*Note: Replicate charges based on GPU compute time. The flux-kontext model typically takes 5-15 seconds per run.*

### 2. Google Gemini 2.5 Flash Image

| Metric | Value |
|--------|-------|
| Model | gemini-2.5-flash-image |
| Input (image) | ~$0.00025 per image |
| Output (image) | ~$0.00075 per image |
| **Total per Run** | **~$0.001** |

*Note: Gemini 2.5 Flash is significantly cheaper for image generation.*

---

## Profit Analysis Per Generation

### Using Replicate (Primary Model)

| Credit Package | Revenue/Credit | Cost/Generation | **Profit/Generation** | **Margin** |
|----------------|----------------|-----------------|----------------------|------------|
| Starter ($0.199) | $0.199 | $0.035 | **$0.164** | 82.4% |
| Popular ($0.166) | $0.166 | $0.035 | **$0.131** | 78.9% |
| Pro ($0.133) | $0.133 | $0.035 | **$0.098** | 73.7% |
| Mega ($0.100) | $0.100 | $0.035 | **$0.065** | 65.0% |

### Using Gemini (Alternative Model)

| Credit Package | Revenue/Credit | Cost/Generation | **Profit/Generation** | **Margin** |
|----------------|----------------|-----------------|----------------------|------------|
| Starter ($0.199) | $0.199 | $0.001 | **$0.198** | 99.5% |
| Popular ($0.166) | $0.166 | $0.001 | **$0.165** | 99.4% |
| Pro ($0.133) | $0.133 | $0.001 | **$0.132** | 99.2% |
| Mega ($0.100) | $0.100 | $0.001 | **$0.099** | 99.0% |

---

## Monthly Profit Projections

### Scenario: 1,000 paying users

| Users Buying | Package | Revenue | API Cost (Replicate) | **Net Profit** |
|--------------|---------|---------|---------------------|----------------|
| 500 | Starter (10 credits) | $995 | $175 | **$820** |
| 300 | Popular (30 credits) | $1,497 | $315 | **$1,182** |
| 150 | Pro (75 credits) | $1,499 | $394 | **$1,105** |
| 50 | Mega (200 credits) | $1,000 | $350 | **$650** |
| **TOTAL** | | **$4,991** | **$1,234** | **$3,757** |

*Monthly margin: 75.3%*

### Scenario: 5,000 paying users

| Users Buying | Package | Revenue | API Cost (Replicate) | **Net Profit** |
|--------------|---------|---------|---------------------|----------------|
| 2,500 | Starter | $4,975 | $875 | **$4,100** |
| 1,500 | Popular | $7,485 | $1,575 | **$5,910** |
| 750 | Pro | $7,493 | $1,969 | **$5,524** |
| 250 | Mega | $4,998 | $1,750 | **$3,248** |
| **TOTAL** | | **$24,951** | **$6,169** | **$18,782** |

*Monthly margin: 75.3%*

---

## Break-Even Analysis

### Fixed Costs (Estimated Monthly)

| Expense | Cost |
|---------|------|
| Hosting (Vercel/Railway/etc) | ~$20-50 |
| Database (MongoDB Atlas) | ~$0-57 |
| Domain | ~$1 |
| Stripe Fees (2.9% + $0.30) | Variable |
| **Total Fixed** | **~$25-110** |

### Break-Even Point

To cover $100/month fixed costs:
- **Starter packages:** 51 sales ($1.99 × 51 = $101.49)
- **Popular packages:** 21 sales ($4.99 × 21 = $104.79)
- **Pro packages:** 11 sales ($9.99 × 11 = $109.89)
- **Mega packages:** 5 sales ($19.99 × 5 = $99.95)

---

## Key Insights

### Profit Maximizers

1. **Gemini model has ~99% margin** vs Replicate's ~75%
   - Consider using Gemini as primary for cost savings
   - Use Replicate for higher quality when needed

2. **Starter pack has highest margin** (82.4% with Replicate)
   - But lowest absolute profit per sale
   - Good for customer acquisition

3. **Volume is key**
   - With 1,000 active paying users: ~$3,750/month profit
   - With 5,000 active paying users: ~$18,780/month profit

### Recommendations

1. **Pricing is solid** - Good margins across all packages
2. **Consider Gemini-first approach** - Much cheaper with similar quality
3. **Free tier (3 generations)** - Great for conversion funnel
4. **Upsell to larger packages** - Higher absolute profit per user

---

## Stripe Payment Processing Fees

Remember to account for Stripe fees:

| Package | Price | Stripe Fee (2.9% + $0.30) | Net After Stripe |
|---------|-------|---------------------------|------------------|
| Starter | $1.99 | $0.36 | $1.63 |
| Popular | $4.99 | $0.44 | $4.55 |
| Pro | $9.99 | $0.59 | $9.40 |
| Mega | $19.99 | $0.88 | $19.11 |

### Adjusted Profit (After Stripe Fees)

| Package | Net Revenue | API Cost | **Final Profit/Sale** | **True Margin** |
|---------|-------------|----------|----------------------|-----------------|
| Starter | $1.63 | $0.35 | **$1.28** | 64.3% |
| Popular | $4.55 | $1.05 | **$3.50** | 70.1% |
| Pro | $9.40 | $2.63 | **$6.77** | 67.8% |
| Mega | $19.11 | $7.00 | **$12.11** | 60.6% |

---

## Summary

| Metric | Value |
|--------|-------|
| **Average Profit Margin** | ~65-70% (after all fees) |
| **Best Value Package** | Popular (70.1% margin) |
| **Break-even** | ~25-50 sales/month |
| **1K users projection** | ~$3,000-3,500/month profit |
| **5K users projection** | ~$15,000-17,500/month profit |

**This is a highly profitable SaaS model with excellent margins!**
