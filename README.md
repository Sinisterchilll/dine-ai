# 🌿 DineAI — AI-Powered Restaurant Assistant

An AI dining companion that helps restaurant customers explore the menu, get personalized recommendations, and place orders through a conversational interface.

## Features

- **Phone + OTP Login** (demo mode — any 4 digits work)
- **AI Chat** powered by Claude — knows the full menu, handles dietary needs, allergens, multilingual support (Hindi/Kannada/English)
- **Full Menu Browser** with category filters, veg-only toggle, spice levels, calories
- **Cart & Ordering** with GST calculation and order history
- **User Memory** — remembers past orders and personalizes recommendations for returning customers
- **Reorder** past meals with one tap

## Quick Deploy to Vercel (3 minutes)

### Step 1: Push to GitHub

```bash
cd dine-ai
git init
git add .
git commit -m "Initial commit"
gh repo create dine-ai --public --push
```

Or create a repo manually on GitHub and push.

### Step 2: Deploy on Vercel

1. Go to [vercel.com](https://vercel.com) → **Add New Project**
2. Import your GitHub repo
3. In **Environment Variables**, add:
   - `ANTHROPIC_API_KEY` = your Anthropic API key (get one at [console.anthropic.com](https://console.anthropic.com))
4. Click **Deploy**

### Step 3: Share the URL!

Vercel gives you a URL like `dine-ai-xyz.vercel.app` — share it with your friends.

## Project Structure

```
dine-ai/
├── api/
│   └── chat.js          # Serverless function (proxies Claude API)
├── public/
│   └── index.html       # Complete frontend (React via CDN)
├── vercel.json          # Routing config
├── package.json
└── README.md
```

## How It Works

- **Frontend**: Single HTML file with React 18 loaded via CDN. No build step needed.
- **Backend**: One serverless function (`/api/chat`) that proxies requests to the Anthropic Claude API. This avoids exposing your API key in the browser.
- **Storage**: Uses `localStorage` for user sessions and order history. Data persists on each user's device.

## Customizing the Menu

Edit the `RESTAURANT` object in `public/index.html` to change:
- Restaurant name, tagline
- Menu items (name, price, category, description, allergens, calories, spice level)
- Today's specials
- Out of stock items

## Cost Estimate

- **Vercel hosting**: Free tier covers ~100K requests/month
- **Claude API**: ~₹0.50-1.00 per conversation (using Claude Sonnet). For 100 conversations/day ≈ ₹1,500-3,000/month

## License

MIT
