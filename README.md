# AI Hub

AI Hub is a comprehensive full-stack monorepo application built with TypeScript that enables users to interact with multiple AI models through a centralized, user-friendly interface. The platform integrates with leading AI providers (OpenAI, Anthropic, Google) to provide chat functionality, model comparison capabilities, project management, and usage tracking.

## 🌟 Features

### 1. Chat

- Interact with multiple AI models in a conversational interface
- Switch between different AI providers seamlessly
- Ask questions and receive responses from models such as ChatGPT, Claude, Gemini, and others

### 2. Comparison

- Run identical prompts across multiple AI models simultaneously
- Compare responses side-by-side
- Evaluate differences in tone, speed, and output quality to choose the best result

### 3. Projects

- Create and manage projects with custom document collections
- Upload documents to projects and chat with them using AI models
- Each project maintains its own set of documents for isolated, context-specific conversations

## 🏗️ Tech Stack

### Frontend

- **Next.js 16** - React framework with server-side rendering
- **React 19** - Modern UI library
- **Tailwind CSS** - Utility-first CSS framework
- **Radix UI / Shadcn** - Component libraries
- **Playwright** - End-to-end testing

### Backend

- **Express.js** - Node.js web framework
- **TypeScript** - Type-safe JavaScript
- **Supabase** - PostgreSQL database and authentication
- **Vercel AI SDK** - Unified AI model integration

### Tools & Infrastructure

- **Turbo** - Monorepo build system
- **Docker & Docker Compose** - Container orchestration
- **Vitest** - Unit testing framework
- **ESLint & Prettier** - Code quality and formatting

## 📋 Installation

### Prerequisites

- Node.js 18+ and npm
- Git
- Docker (for running the full stack locally)
- Supabase account (free tier available at [supabase.com](https://supabase.com))

### Step 1: Clone and Install Dependencies

```bash
git clone <repository-url>
cd AI-Hub
npm install
```

This installs dependencies for the entire monorepo, including the client (Next.js), server (Express), and shared packages.

### Step 2: Set Up Environment Variables

Create `.env.local` files for the client and server with the necessary configuration:

- **Client** (`client/.env.local`):
  - API endpoints for backend communication
  - Authentication configuration
  - Refer to `client/.env.example` for required variables

- **Server** (`server/.env.local`):
  - Database credentials
  - API keys for AI model providers (OpenAI, Anthropic, etc.)
  - Supabase configuration
  - JWT secret for authentication
  - Refer to `server/.env.example` for required variables

### Step 3: Set Up Supabase

1. Create a free account at [supabase.com](https://supabase.com) and create a new project
2. Copy your Supabase project URL and anon/service role keys to your `.env.local` file
3. Configure authentication providers:
   - Navigate to **Dashboard → Authentication → Sign In/Providers**
   - Enable OAuth providers (Google, GitHub, etc.) as needed
   - Add provider credentials to complete the setup

### Step 4: Set Up Local Database

Install and configure the Supabase CLI:

```bash
# Install Supabase CLI (follow instructions for your OS)
# Refer to https://supabase.com/docs/guides/cli

# Login to your Supabase account
supabase login

# Link your local project to your Supabase project
supabase link --project-ref <your-project-ref>

# Push database migrations to set up tables and schema
supabase db push
```

### Step 5: Configure AI Model Keys

Add API keys for the AI models you want to support:

- OpenAI (ChatGPT)
- Anthropic (Claude)
- Other providers as needed

Store these securely in your `.env.local` file in the server directory.

### Step 6: Start Development Server

From the root directory, run:

```bash
npm run dev
```

This starts both the client (Next.js on `http://localhost:3000`) and server (Express on `http://localhost:3001`) in development mode using Turbo.

## 📁 Project Structure

```
AI-Hub/
├── client/                  # Next.js frontend application
│   ├── src/
│   │   ├── app/            # Next.js app directory
│   │   ├── components/     # React components (auth, dashboard, layout, ui)
│   │   ├── context/        # React context (AuthContext)
│   │   ├── hooks/          # Custom React hooks
│   │   ├── lib/            # Utility functions and helpers
│   │   └── services/       # API service layer
│   └── e2e/                # Playwright end-to-end tests
├── server/                  # Express.js backend application
│   ├── src/
│   │   ├── app.ts          # Express app setup
│   │   ├── db/             # Database configuration (Supabase)
│   │   ├── middleware/     # Express middleware
│   │   ├── modules/        # Feature modules (auth, chat, etc.)
│   │   ├── lib/            # AI SDK integration and utilities
│   │   └── utils/          # Helper functions
│   └── tests/              # Unit tests
├── shared/                  # Shared types and utilities
│   ├── config/             # Configuration and model schemas
│   ├── types/              # TypeScript type definitions
│   └── utils/              # Shared utility functions
├── docker-compose.yml      # Docker services configuration
└── turbo.json              # Turbo configuration
```

## 🚀 Available Scripts

### Root Level Commands

```bash
npm run dev       # Start development servers for client and server
npm run build     # Build all packages
npm run lint      # Run ESLint across the monorepo
npm run test      # Run tests across all packages
npm run format    # Format code with Prettier
```

### Client Commands

```bash
cd client
npm run dev                # Start Next.js dev server
npm run build              # Build Next.js application
npm run start              # Start production server
npm run test               # Run Playwright e2e tests
npm run test:headed        # Run tests with browser visible
npm run test:ui            # Run tests with Playwright UI
```

### Server Commands

```bash
cd server
npm run dev       # Start Express server in watch mode
npm run build     # Build TypeScript to JavaScript
npm run start     # Start production server
npm run test      # Run unit tests with Vitest
```

## 🔐 Environment Configuration

### Client Environment Variables

Create `client/.env.local`:

```env
NEXT_PUBLIC_SERVER_URL=http://localhost:3001
```

### Server Environment Variables

Create `server/.env.local`:

```env
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# JWT Configuration
JWT_SECRET=your-jwt-secret

# AI Provider API Keys
OPENAI_API_KEY=your-openai-key
ANTHROPIC_API_KEY=your-anthropic-key
GOOGLE_API_KEY=your-google-key

# Server Configuration
PORT=3001
NODE_ENV=development
```

## 🧪 Testing

### End-to-End Tests (Client)

```bash
cd client
npm run test              # Run all e2e tests
npm run test:headed       # Run with visible browser
npm run test:ui           # Interactive test runner
```

### Unit Tests (Server)

```bash
cd server
npm run test              # Run all unit tests
```

## 📚 API Documentation

The backend provides REST API endpoints for:

- **Authentication** - User sign-in/sign-up via OAuth
- **Chat** - Send messages and receive AI responses
- **Comparison** - Compare outputs from multiple models
- **Projects** - Create and manage projects
- **Conversations** - Manage chat conversations

For detailed API documentation, refer to the server module implementations in `server/src/modules/`.

## 🔄 Database Migrations

To manage database schema changes:

```bash
# Push pending migrations to Supabase
supabase db push

# View migration status
supabase migration list
```
