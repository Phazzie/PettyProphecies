# 🔮 Passive-Aggressive Tarot

A sassy Next.js application that delivers hilariously passive-aggressive tarot readings. Because sometimes the universe needs to tell you things with a bit of attitude.

[![CI/CD](https://github.com/your-repo/PettyProphecies/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/your-repo/PettyProphecies/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## ✨ Features

- **🎭 Six Hilarious Tarot Spreads** - From "Maybe It's Not Them, It's You" to "Your Plant Parent Journey Needs Intervention"
- **🔐 Secure Authentication** - JWT-based user authentication with bcrypt password hashing
- **📊 Reading History** - Save and rate your past readings
- **⭐ Star Ratings** - Rate readings from 1-5 stars
- **🎨 Modern UI** - Built with Tailwind CSS and Radix UI components
- **🌙 Dark Mode Support** - Easy on the eyes, hard on your feelings
- **📱 Responsive Design** - Works on all devices
- **🐳 Docker Ready** - Containerized for easy deployment
- **🔄 CI/CD Pipeline** - Automated testing and deployment

## 🚀 Quick Start

### Prerequisites

- Node.js 20.x or higher
- MongoDB (local or Atlas)
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/your-repo/PettyProphecies.git
cd PettyProphecies

# Install dependencies
npm install --legacy-peer-deps

# Copy environment variables
cp .env.example .env.local

# Edit .env.local with your values
# MONGODB_URI=your-mongodb-connection-string
# JWT_SECRET=your-secret-key
```

### Development

```bash
# Start development server
npm run dev

# Open http://localhost:3000
```

### Production Build

```bash
# Build the application
npm run build

# Start production server
npm start
```

## 🐳 Docker Deployment

### Quick Start with Docker Compose

```bash
# Start all services (app + MongoDB + Mongo Express)
docker-compose up -d

# Access the app
# App: http://localhost:3000
# Mongo Express: http://localhost:8081 (admin/admin123)

# Stop services
docker-compose down
```

### Build Docker Image

```bash
docker build -t passive-aggressive-tarot:latest .
docker run -p 3000:3000 -e MONGODB_URI=your-uri -e JWT_SECRET=your-secret passive-aggressive-tarot:latest
```

## 📦 Tech Stack

**Frontend:**
- Next.js 14 (App Router)
- React 18
- TypeScript
- Tailwind CSS
- Radix UI Components
- Sonner (Toast Notifications)

**Backend:**
- Next.js API Routes
- MongoDB with Mongoose
- JWT Authentication
- Bcrypt Password Hashing

**DevOps:**
- Docker & Docker Compose
- GitHub Actions CI/CD
- Vercel-ready
- ESLint & TypeScript

**Testing:**
- Jest
- React Testing Library

## 📁 Project Structure

```
/PettyProphecies
├── app/                    # Next.js App Router pages
│   ├── layout.tsx         # Root layout with providers
│   └── page.tsx           # Home page
├── components/            # React components
│   ├── HomePage.tsx       # Main app component
│   ├── ui/               # Radix UI components
│   └── SentryProvider.tsx # Error tracking
├── src/
│   ├── components/        # Feature components
│   │   ├── Login.tsx
│   │   ├── Register.tsx
│   │   ├── TarotReading.tsx
│   │   └── UserDashboard.tsx
│   ├── hooks/            # Custom React hooks
│   ├── middleware/       # API middleware
│   ├── models/           # Mongoose models
│   ├── pages/api/        # API routes
│   ├── utils/            # Utility functions
│   └── data/             # Tarot cards & spreads
├── .github/workflows/    # CI/CD pipelines
├── __tests__/           # Test files
├── Dockerfile           # Docker configuration
├── docker-compose.yml   # Multi-container setup
└── vercel.json          # Vercel deployment config
```

## 🌐 Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy!

[Detailed deployment guide](./DEPLOYMENT.md)

### Other Platforms

- **Docker**: Use provided Dockerfile
- **AWS/GCP/Azure**: Deploy as container
- **Self-hosted**: Use PM2 + Nginx

See [DEPLOYMENT.md](./DEPLOYMENT.md) for comprehensive instructions.

## 🔒 Environment Variables

Required environment variables:

```env
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/dbname
JWT_SECRET=generate-a-secure-random-string-min-32-chars
NODE_ENV=production
```

Optional:

```env
NEXT_PUBLIC_SENTRY_DSN=your-sentry-dsn
LOG_LEVEL=info
```

Generate JWT secret:
```bash
openssl rand -base64 32
```

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test

# Run tests in CI mode
npm run test:ci

# Lint code
npm run lint
```

## 🤖 AI-Powered CI Automation

This project uses **Claude Code** for advanced CI automation:

### Available Commands

Comment on PRs or issues to trigger automated workflows:

- **`/auto-fix`** - Automatically fix simple issues from code reviews (typos, formatting, linting)
- **`/create-issues`** - Convert review comments into properly categorized GitHub issues
- **`/generate-tests`** - Generate comprehensive tests for untested code
- **`@claude`** - Get general AI assistance on issues and PRs

### Automated Workflows

The following run automatically:

- **PR Code Review** - Reviews every PR for code quality, security, and best practices
- **Technical Debt Tracking** - Auto-updates TECHNICAL_DEBT.md when PRs merge
- **Weekly Debt Audit** - Scans codebase for new technical debt every Sunday

### Learn More

See [.github/CLAUDE_CODE_CI_AUTOMATION.md](.github/CLAUDE_CODE_CI_AUTOMATION.md) for:
- Detailed automation strategy
- 10 innovative Claude Code use cases
- Implementation guides
- ROI analysis and metrics

## 📊 API Endpoints

**Authentication:**
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/logout` - Logout user

**Tarot Readings:**
- `POST /api/tarot-reading` - Get new reading (requires auth)
- `PUT /api/tarot-reading` - Rate a reading (requires auth)

**User:**
- `GET /api/user/readings?page=1` - Get user's past readings (requires auth)

## 🎨 Available Tarot Spreads

1. **"Maybe It's Not Them, It's You"** - Self-reflection on relationships
2. **"I'm Sure You're Doing Your Best"** - Encouragement (with sarcasm)
3. **"Your Quarter-Life Crisis Isn't Special"** - Perspective on struggles
4. **"Your Self-Care Routine Is Just Avoidance"** - Challenges wellness excuses
5. **"Your Podcast Idea Isn't Revolutionary"** - Creative project evaluation
6. **"Your Plant Parent Journey Needs Intervention"** - Plant care reality check

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- UI components from [Radix UI](https://www.radix-ui.com/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)
- Icons from [Lucide](https://lucide.dev/)

## 📧 Contact

For issues, questions, or passive-aggressive feedback:
- GitHub Issues: [Create an issue](https://github.com/your-repo/issues)
- Email: your-email@example.com

---

**Made with 💜 and a healthy dose of sass**
