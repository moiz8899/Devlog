# Devlog 📸

> Instagram for developers — share your builds, follow the grind.

Devlog is a developer-focused social platform where engineers share their projects, progress, and process. Think Instagram, but the feed is full of commits, demos, and deployment wins.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Database | PostgreSQL (Aiven) |
| ORM | Prisma |
| Auth | NextAuth.js + GitHub OAuth |
| Media | Cloudinary |
| Real-time | Socket.io |

---

## Features

- **GitHub OAuth** — one-click sign in, developer identity built-in
- **Developer Feed** — chronological and algorithmic posts from people you follow
- **Project Posts** — share screenshots, demos, and dev updates
- **Real-time Messaging** — DMs powered by Socket.io
- **Media Uploads** — images hosted and optimized via Cloudinary
- **Follow System** — build your dev network

---

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database (or an [Aiven](https://aiven.io) instance)
- GitHub OAuth App
- Cloudinary account

### Installation

```bash
git clone https://github.com/yourusername/devlog.git
cd devlog
npm install
```

### Environment Variables

Create a `.env` file in the root:

```env
# Database
DATABASE_URL="postgresql://user:password@host:port/devlog"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-here"

# GitHub OAuth
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"

# Cloudinary
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"

# Socket.io
SOCKET_PORT=3001
```

### Database Setup

```bash
npx prisma generate
npx prisma db push
```

### Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Project Structure

```
devlog/
├── app/                  # Next.js App Router
│   ├── (auth)/           # Auth routes
│   ├── (main)/           # Main app routes
│   └── api/              # API routes
├── components/           # React components
├── lib/                  # Utilities, db client, auth config
├── prisma/               # Schema and migrations
│   └── schema.prisma
└── public/               # Static assets
```

---

## Scripts

```bash
npm run dev          # Start development server
npm run build        # Production build
npm run start        # Start production server
npm run lint         # Run ESLint
npx prisma studio    # Open Prisma DB GUI
```

---

## Contributing

Pull requests are welcome. For major changes, open an issue first.

---

## License

MIT
