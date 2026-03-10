# Deploying Devlog with WebSocket on Render + Vercel

## Overview

This guide explains how to deploy Devlog with real-time WebSocket support using **Option 2**: Deploy WebSocket on Render FIRST, then deploy the main Next.js app on Vercel.

## Architecture

- **Render**: WebSocket Server (Socket.io) + PostgreSQL Database
- **Vercel**: Next.js Main Application

## Important: WebSocket on Render

**⚠️ WebSocket requires a paid plan on Render!**

- **Free tier**: 60-second request timeout - WebSocket connections will be disconnected
- **Starter plan** ($7/month): Required for persistent WebSocket connections

---

## Step 1: Deploy WebSocket Server on Render (FIRST)

### 1.1 Push Code to GitHub
```bash
git add .
git commit -m "Add WebSocket deployment config"
git push origin main
```

### 1.2 Create PostgreSQL Database on Render
1. Go to https://dashboard.render.com/
2. Click "New" → "PostgreSQL"
3. Configure:
   - Name: `devlog-db`
   - Region: Oregon (or your preference)
   - Plan: Free (or Starter for WebSocket)
4. Wait for creation and note the **Internal Database URL**

### 1.3 Deploy WebSocket Server on Render
1. Click "New" → "Web Service"
2. Connect to your GitHub repo
3. Configure:
   - Name: `devlog-websocket`
   - Region: Oregon
   - Branch: main
   - Runtime: Node
   - Build Command: `npm run build`
   - Start Command: `npm run start`
4. Add Environment Variables:
   - `DATABASE_URL`: The PostgreSQL connection string from step 1.2
   - `NEXTAUTH_URL`: `https://devlog-websocket.onrender.com`
   - `NEXTAUTH_SECRET`: Generate with `openssl rand -base64 32`
   - `GITHUB_CLIENT_ID`: Your GitHub OAuth client ID
   - `GITHUB_CLIENT_SECRET`: Your GitHub OAuth client secret
   - `NODE_ENV`: `production`
   - `CLOUDINARY_CLOUD_NAME`: Your Cloudinary cloud name (optional)
   - `CLOUDINARY_API_KEY`: Your Cloudinary API key (optional)
   - `CLOUDINARY_API_SECRET`: Your Cloudinary API secret (optional)
5. Click "Create Web Service"
6. Wait for deployment (several minutes)

### 1.4 Verify WebSocket Server
1. Note your Render WebSocket URL: `https://devlog-websocket.onrender.com`
2. Test health endpoint: `https://devlog-websocket.onrender.com/api/health`

---

## Step 2: Deploy Main App on Vercel

### 2.1 Prepare for Vercel Deployment
Your Next.js app needs to know where to connect for WebSocket. Set the environment variable in Vercel to point to your Render WebSocket server.

### 2.2 Deploy to Vercel
1. Go to https://vercel.com/
2. Click "Add New..." → "Project"
3. Import your GitHub repo
4. Configure Environment Variables:
   - `DATABASE_URL`: The PostgreSQL connection string from Render
   - `NEXTAUTH_URL`: Your Vercel URL (e.g., `https://your-app.vercel.app`)
   - `NEXTAUTH_SECRET`: Same secret as used on Render
   - `NEXTAUTH_SECRET`: Generate with `openssl rand -base64 32`
   - `GITHUB_CLIENT_ID`: Your GitHub OAuth client ID
   - `GITHUB_CLIENT_SECRET`: Your GitHub OAuth client secret
   - `NEXT_PUBLIC_SOCKET_URL`: `https://devlog-websocket.onrender.com` ← **Important!**
   - `CLOUDINARY_CLOUD_NAME`: Your Cloudinary cloud name
   - `CLOUDINARY_API_KEY`: Your Cloudinary API key
   - `CLOUDINARY_API_SECRET`: Your Cloudinary API secret
5. Click "Deploy"

### 2.3 Set Up GitHub OAuth
1. Go to your GitHub OAuth app settings
2. Add callback URL: `https://your-vercel-app.vercel.app/api/auth/callback/github`

---

## Step 3: Run Database Migrations

### Option A: Run on Render
1. Go to your Render WebSocket service
2. Click "Shell"
3. Run: `npx prisma migrate deploy`

### Option B: Run locally with production DB
```bash
DATABASE_URL="your-render-db-url" npx prisma migrate deploy
```

---

## Environment Variables Summary

### Render (WebSocket Server)
| Variable | Required | Value |
|----------|----------|-------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `NEXTAUTH_URL` | Yes | `https://devlog-websocket.onrender.com` |
| `NEXTAUTH_SECRET` | Yes | Generated secret |
| `GITHUB_CLIENT_ID` | Yes | Your GitHub OAuth client ID |
| `GITHUB_CLIENT_SECRET` | Yes | Your GitHub OAuth client secret |
| `NODE_ENV` | Yes | `production` |

### Vercel (Main App)
| Variable | Required | Value |
|----------|----------|-------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `NEXTAUTH_URL` | Yes | `https://your-app.vercel.app` |
| `NEXTAUTH_SECRET` | Yes | Same as Render |
| `GITHUB_CLIENT_ID` | Yes | Your GitHub OAuth client ID |
| `GITHUB_CLIENT_SECRET` | Yes | Your GitHub OAuth client secret |
| `NEXT_PUBLIC_SOCKET_URL` | Yes | `https://devlog-websocket.onrender.com` |

---

## Verifying the Deployment

1. Open your Vercel app in a browser
2. Log in with GitHub
3. Open two browser windows
4. Navigate to `/messages`
5. Send a message - it should appear instantly in the other window (real-time via Render WebSocket)

---

## Troubleshooting

### WebSocket Connection Errors
- Make sure Render is on Starter plan ($7/month) or higher
- Verify `NEXT_PUBLIC_SOCKET_URL` is correctly set in Vercel
- Check that CORS_ORIGIN includes your Vercel domain in Render

### Database Connection Issues
- Ensure `DATABASE_URL` is correctly set in both Render and Vercel
- Run migrations: `npx prisma migrate deploy`

### Build Failures
- Check that all required environment variables are set
- Ensure Node.js version compatibility (18.x recommended)

---

## Files Created for Deployment

- `Dockerfile` - Multi-stage build for production
- `Procfile` - Process type definition for Render
- `render.yaml` - Render Blueprint configuration
- `server.ts` - Updated CORS for production
- `lib/socket.ts` - Dynamic WebSocket URL support
- `next.config.js` - Standalone output and WebSocket headers
- `.env.production.example` - Environment variable template


