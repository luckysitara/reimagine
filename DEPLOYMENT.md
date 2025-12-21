# 🚀 Deployment Guide

This guide covers deploying Reimagine to production on Vercel.

## Prerequisites

- GitHub account
- Vercel account (free tier works)
- Helius API key ([Get one here](https://dev.helius.xyz/))
- Google Gemini API key ([Get one here](https://ai.google.dev/))

---

## Quick Deploy

### Option 1: Deploy with Vercel (Recommended)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fyourusername%2Freimagine)

1. Click the "Deploy with Vercel" button above
2. Connect your GitHub account if not already connected
3. Import the repository
4. Configure environment variables (see below)
5. Click "Deploy"

### Option 2: Manual Deployment

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy
vercel

# Follow the prompts
```

---

## Environment Variables Configuration

After importing the project, add these environment variables in Vercel:

### 1. Via Vercel Dashboard

1. Go to your project on Vercel
2. Click **Settings** → **Environment Variables**
3. Add the following variables:

| Variable Name | Value | Environment |
|--------------|-------|-------------|
| `NEXT_PUBLIC_HELIUS_RPC_URL` | `https://mainnet.helius-rpc.com/?api-key=YOUR_KEY` | Production, Preview, Development |
| `GOOGLE_GENERATIVE_AI_API_KEY` | `your_google_api_key` | Production, Preview, Development |
| `NEXT_PUBLIC_SOLANA_NETWORK` | `mainnet-beta` | Production |
| `NEXT_PUBLIC_SOLANA_NETWORK` | `devnet` | Preview, Development |

### 2. Via Vercel CLI

```bash
# Add production environment variables
vercel env add NEXT_PUBLIC_HELIUS_RPC_URL production
# Paste your Helius RPC URL when prompted

vercel env add GOOGLE_GENERATIVE_AI_API_KEY production
# Paste your Google API key when prompted

# Redeploy after adding variables
vercel --prod
```

---

## Post-Deployment Checklist

### ✅ Verify Deployment

1. **Test AI Copilot**
   - Visit your deployed URL
   - Try asking: "What's the price of SOL?"
   - Verify AI responds correctly

2. **Test Wallet Connection**
   - Click "Connect Wallet"
   - Connect with Phantom/Solflare
   - Verify wallet address displays

3. **Test Trading**
   - Navigate to Trading panel
   - Search for a token (e.g., USDC)
   - Get a quote (don't need to execute)

4. **Check Portfolio**
   - Connect your wallet
   - View portfolio panel
   - Verify balances load

5. **Browse NFTs**
   - Go to NFT panel
   - Connect wallet with NFTs
   - Verify NFTs display

### ⚙️ Performance Optimization

1. **Enable Edge Runtime** (Already configured in `next.config.mjs`)
2. **Configure Caching**
   ```javascript
   // Already configured in API routes
   export const runtime = 'edge'
   export const revalidate = 60 // Cache for 60 seconds
   ```

3. **Monitor Performance**
   - Use Vercel Analytics (already integrated)
   - Check **Analytics** tab in dashboard
   - Review Core Web Vitals

### 🔒 Security Checklist

- [ ] Environment variables set correctly
- [ ] API keys not exposed in client code
- [ ] CORS configured properly (already set)
- [ ] Rate limiting enabled (consider adding Upstash)
- [ ] Error logging configured

---

## Custom Domain Setup

### 1. Add Domain in Vercel

1. Go to your project settings
2. Click **Domains**
3. Add your custom domain
4. Follow DNS configuration instructions

### 2. Update DNS Records

Add the following records to your DNS provider:

**For root domain (example.com):**
```
Type: A
Name: @
Value: 76.76.21.21
```

**For www subdomain:**
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

### 3. SSL Certificate

Vercel automatically provisions SSL certificates. Wait 1-2 minutes after DNS propagation.

---

## Continuous Deployment

### Automatic Deployments

Vercel automatically deploys when you push to GitHub:

- **Production**: Pushes to `main` branch
- **Preview**: Pull requests and other branches

### Manual Deployment

```bash
# Deploy to production
vercel --prod

# Deploy to preview
vercel
```

---

## Monitoring & Debugging

### View Logs

```bash
# View real-time logs
vercel logs

# View function logs
vercel logs [deployment-url]
```

### Debug Common Issues

#### Issue: AI Copilot not responding

**Solution:**
```bash
# Check if Gemini API key is set
vercel env ls

# If missing, add it
vercel env add GOOGLE_GENERATIVE_AI_API_KEY production
vercel --prod  # Redeploy
```

#### Issue: Wallet not connecting

**Solution:**
- Ensure `NEXT_PUBLIC_HELIUS_RPC_URL` is set
- Check browser console for errors
- Verify wallet extension is installed

#### Issue: Token prices not loading

**Solution:**
- Check Helius API rate limits
- Verify RPC URL is correct
- Clear browser cache

---

## Performance Tips

### 1. Enable Vercel Speed Insights

Already integrated! View in **Analytics** → **Speed Insights**

### 2. Optimize Images

Images are already optimized via Next.js Image component:
```typescript
<Image src="/logo.png" alt="Logo" width={32} height={32} />
```

### 3. Use Edge Functions

API routes are already configured for Edge Runtime:
```typescript
export const runtime = 'edge'
```

### 4. Enable Compression

Vercel automatically compresses responses (Brotli/Gzip)

---

## Cost Optimization

### Free Tier Limits

**Vercel Free Tier:**
- 100 GB bandwidth/month
- 6,000 build minutes/month
- 100 GB-hours of serverless function execution

**Helius Free Tier:**
- 100,000 credits/day
- Sufficient for ~10,000 users/day

**Google Gemini Free Tier:**
- 60 requests/minute
- 1,500 requests/day
- Sufficient for ~100 active users

### Upgrade Recommendations

**When to upgrade Vercel:**
- > 100 GB bandwidth/month
- Need preview deployments for large teams
- Require advanced analytics

**When to upgrade Helius:**
- > 100k RPC calls/day
- Need dedicated nodes
- Require 99.9% uptime SLA

---

## Rollback

### Rollback to Previous Deployment

1. Go to Vercel Dashboard
2. Click **Deployments**
3. Find working deployment
4. Click **⋯** → **Promote to Production**

### Via CLI

```bash
# List deployments
vercel ls

# Promote specific deployment
vercel promote [deployment-url]
```

---

## Support

If you encounter issues:

1. Check [Vercel Documentation](https://vercel.com/docs)
2. Review [deployment logs](https://vercel.com/dashboard)
3. Open an issue on GitHub
4. Contact support@vercel.com (for Vercel issues)

---

## Next Steps

After successful deployment:

1. ⭐ **Update README.md**
   - Add your live URL
   - Add screenshot links
   - Update social links

2. 📊 **Create Pitch Deck**
   - Use deployed site for demos
   - Add analytics screenshots
   - Include user testimonials

3. 🎥 **Record Demo Video**
   - Show live features
   - Walk through key workflows
   - Upload to YouTube

4. 📢 **Share Your Project**
   - Post on Twitter/X
   - Share in Solana Discord
   - Submit to hackathon platform

---

**Congratulations! Your DeFi platform is now live! 🎉**
