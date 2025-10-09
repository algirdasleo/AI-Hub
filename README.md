# AI Hub

AI Hub is a platform that allows users to interact with multiple AI models, compare their performance, manage projects, and track usage in a centralized interface.

## Main Pages

### 1. Chat

- Ask questions and receive answers from multiple AI models, such as: ChatGPT, Claude, and others.

### 2. Comparison

- Select multiple different models, run the same prompt and compare their responses.
- Compare tone, speed, and output accuracy and pick the best result.

### 3. Projects - upcoming

- Create and manage AI projects.
- Store and organize content such as documents, images, or other context for AI generation.
- Generate outputs based on project-specific data.

### 4. Tracking - upcoming

- Monitor AI usage, token consumption, and spending.
- Dive into detailed metrics per page, per project, and per AI model.

### 5. Static Content / Guides - upcoming

- Access tutorials, guides, and documentation to help users navigate and make the most of AI Hub.

---

# Tech stack

| Layer          | Tech                | Chosen, because                                                                |
| -------------- | ------------------- | ------------------------------------------------------------------------------ |
| Language       | TypeScript          | Strong typing across frontend, backend, and shared code                        |
| Backend        | Express REST        | Full control over multi-LLM orchestration, RAG, token/cost tracking            |
| Database       | Supabase PostgreSQL | Stores users, projects, usage, and metadata; managed DB simplifies maintenance |
| Auth           | Supabase Auth       | Easy OAuth/JWT login, integrates with PostgreSQL                               |
| File Storage   | Supabase Storage    | Stores PDFs, images, and project files                                         |
| Vector DB      | Pinecone            | Efficient storage & retrieval for embeddings                                   |
| Frontend       | React + Next.js     | Pages for chat, comparison, projects, and tracking                             |
| Static Content | Payload CMS         | Guides, tutorials, and marketing content separated from app logic              |
| Monorepo       | Turborepo           | Organizes frontend, backend, shared code, and types                            |
| Validation     | Zod                 | Ensures schema validation + type safety                                        |
| Code Quality   | ESLint + Prettier   | Maintains consistent style                                                     |
| Testing        | Vitest              | Unit & integration tests                                                       |

# Installation

1. Run `npm install` to install dependencies.

2. Create .env files in both `backend` and `frontend` folders based on the provided `.env.example` files.

3. To setup Supabase database, create a free account at [supabase.com](https://supabase.com) and create a new project. Then copy the supabase database URL and secret key to '.env' file. In order for the auth providers to work, connect them by navigating to Dashboard -> Authentication -> Sign In/Providers.

4. To setup Supabase CLI access, run:
   - Install Supabase CLI by following instructions [here](https://supabase.com/docs/guides/local-development/cli/getting-started?queryGroups=platform&platform=macos#installing-the-supabase-cli)
   - `supabase login` in the terminal and follow the instructions to login via browser.
   - After logging in, run `supabase link` to link your local project to the one you created in Supabase.
   - Finally, run `supabase db push` to create the necessary tables in your database.

5. Launch the project in development mode by running `npm run dev` in the root folder.
