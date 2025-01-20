```markdown
# Step-by-Step Guide to Building the CRM (Junior Developer Friendly)

The following instructions are inspired by the structure in [@TASKS_EXAMPLE.md](#) and expanded to cover both the MVP and full feature set for a modern customer support system. The overarching goal is to help you build a working CRM using React, Supabase, and AWS Amplify for deployment.

---

## 1. INITIAL SETUP

### 1.1 Create the Project
1. Ensure you have Node.js (LTS or latest) installed.
2. Create a new Vite React+TS project:
   ```bash
   npm create vite@latest customer-experience-app -- --template react-ts
   cd customer-experience-app
   ```
3. Initialize a Git repository (optional but recommended):
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   ```

### 1.2 Install Dependencies
Install your core and dev dependencies (adjust versions as needed):
```bash
# Core
npm install @tanstack/react-query @supabase/supabase-js @emotion/react @emotion/styled react-router-dom zustand

# UI libraries (optional; choose your preferred UI framework)
npm install @mui/material @mui/icons-material @mui/lab

# Development / Tools
npm install -D tailwindcss postcss autoprefixer
npm install -D @testing-library/react @testing-library/jest-dom @testing-library/user-event
npm install -D vitest jsdom @vitejs/plugin-react
npm install -D prettier eslint-config-prettier eslint-plugin-prettier
```

### 1.3 Configure Tailwind CSS (Optional but Recommended)
1. Initialize Tailwind CSS:
   ```bash
   npx tailwindcss init -p
   ```
2. Update `tailwind.config.js`:
   ```js
   /** @type {import('tailwindcss').Config} */
   export default {
     content: [
       "./index.html",
       "./src/**/*.{js,ts,jsx,tsx}"
     ],
     theme: {
       extend: {},
     },
     plugins: [],
   }
   ```
3. In `src/index.css` (or `App.css`), add the Tailwind directives:
   ```css
   @tailwind base;
   @tailwind components;
   @tailwind utilities;
   ```

### 1.4 TypeScript Configuration
Create or update `tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src"]
}
```

### 1.5 Vite Configuration
Create or update `vite.config.ts`:
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts'
  }
})
```

### 1.6 Environment Variables
Create a `.env` file in the root of your project (never commit secrets to source control):
```bash
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

---

## 2. SUPABASE SETUP

### 2.1 Create & Configure Supabase Project
1. Go to [https://supabase.com](https://supabase.com) and create a new project.
2. Retrieve the project URL and anon key from your project settings.
3. In the **Authentication** section, enable Email Provider (and any other providers you may need later).
4. Optionally, create an initial database schema in Supabase’s SQL Editor.

### 2.2 Setup Supabase Client
Create `src/lib/supabase.ts`:
```typescript
import { createClient } from '@supabase/supabase-js'

// Optional: Define types for your database
// import { Database } from '@/types/supabase'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// If you have "Database" types, use createClient<Database>(...)
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

---

## 3. AUTHENTICATION SETUP (MVP)

### 3.1 Auth Context
Create `src/contexts/AuthContext.tsx`:
```typescript
import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'

interface AuthContextType {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) throw error
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
      {!loading && children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
```

### 3.2 Login Form
Create `src/components/auth/LoginForm.tsx`:
```typescript
import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'

export function LoginForm() {
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await signIn(email, password)
    } catch (err: any) {
      setError(err.message)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <label htmlFor="email">Email</label>
      <input
        id="email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />

      <label htmlFor="password">Password</label>
      <input
        id="password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />

      <button type="submit">Sign In</button>
    </form>
  )
}
```

---

## 4. BASIC TICKETING SYSTEM (MVP)

### 4.1 Ticket Database Setup
1. In Supabase, create a `tickets` table (via the SQL Editor or Table Editor):
   ```sql
   create table if not exists tickets (
     id bigint generated always as identity primary key,
     title text not null,
     description text,
     status text not null default 'open',
     priority text not null default 'medium',
     created_at timestamp with time zone default now(),
     updated_at timestamp with time zone
   );
   ```
2. Add any additional fields you need for the MVP.

### 4.2 React Query Setup
Create `src/lib/queryClient.ts`:
```typescript
import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      cacheTime: 1000 * 60 * 30, // 30 minutes
      retry: 1,
      refetchOnWindowFocus: false
    }
  }
})
```

### 4.3 Ticket Hooks
Create `src/hooks/useTickets.ts`:
```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export function useTickets() {
  return useQuery(['tickets'], async () => {
    const { data, error } = await supabase
      .from('tickets')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) throw error
    return data
  })
}

export function useCreateTicket() {
  const queryClient = useQueryClient()
  return useMutation(
    async (newTicket: { title: string; description?: string; priority?: string }) => {
      const { data, error } = await supabase
        .from('tickets')
        .insert(newTicket)
        .select()
        .single()
      if (error) throw error
      return data
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['tickets'])
      }
    }
  )
}
```

### 4.4 Ticket Components
Create `src/components/tickets/TicketList.tsx`:
```typescript
import { useTickets } from '@/hooks/useTickets'

export function TicketList() {
  const { data: tickets, isLoading, isError, error } = useTickets()

  if (isLoading) return <p>Loading tickets...</p>
  if (isError) return <p>Error: {(error as Error).message}</p>

  return (
    <ul>
      {tickets?.map((ticket: any) => (
        <li key={ticket.id}>
          {ticket.title} - {ticket.status} - {ticket.priority}
        </li>
      ))}
    </ul>
  )
}
```

Create `src/components/tickets/TicketForm.tsx`:
```typescript
import { useState } from 'react'
import { useCreateTicket } from '@/hooks/useTickets'

export function TicketForm() {
  const { mutate: createTicket } = useCreateTicket()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createTicket({ title, description })
    setTitle('')
    setDescription('')
  }

  return (
    <form onSubmit={handleSubmit}>
      <label htmlFor="ticketTitle">Title</label>
      <input
        id="ticketTitle"
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
      />

      <label htmlFor="ticketDescription">Description</label>
      <textarea
        id="ticketDescription"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />

      <button type="submit">Create Ticket</button>
    </form>
  )
}
```

---

## 5. ROUTING SETUP

### 5.1 Create Router
Create `src/router.tsx`:
```typescript
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { LoginForm } from '@/components/auth/LoginForm'
import { MainLayout } from '@/components/layout/MainLayout'
import { TicketList } from '@/components/tickets/TicketList'
import { TicketForm } from '@/components/tickets/TicketForm'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    children: [
      { index: true, element: <Navigate to="/tickets" replace /> },
      { path: 'tickets', element: <TicketList /> },
      { path: 'new-ticket', element: <TicketForm /> }
    ]
  },
  {
    path: '/login',
    element: <LoginForm />
  }
])
```

Create a simple `MainLayout` in `src/components/layout/MainLayout.tsx`:
```typescript
import { Outlet } from 'react-router-dom'

export function MainLayout() {
  return (
    <div style={{ padding: '1rem' }}>
      <h1>My CRM App</h1>
      <Outlet />
    </div>
  )
}
```

---

## 6. APP ENTRY POINT

### 6.1 Update src/App.tsx
```typescript
import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from 'react-router-dom'
import { queryClient } from '@/lib/queryClient'
import { AuthProvider } from '@/contexts/AuthContext'
import { router } from '@/router'

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </QueryClientProvider>
  )
}

export default App
```

### 6.2 Update main entry (main.tsx or main.jsx)
```typescript
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
```

---

## 7. TESTING SETUP

### 7.1 Test Environment Setup
Create `src/test/setup.ts`:
```typescript
import '@testing-library/jest-dom'
import { expect, afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'
import matchers from '@testing-library/jest-dom/matchers'

expect.extend(matchers)

afterEach(() => {
  cleanup()
})
```

### 7.2 Package Scripts
Update `package.json`:
```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "lint": "eslint src --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "preview": "vite preview",
    "format": "prettier --write \"src/**/*.{ts,tsx}\""
  }
}
```

---

## 8. AWS AMPLIFY DEPLOYMENT (OPTIONAL)

### 8.1 Amplify Initialization
1. Install Amplify CLI:
   ```bash
   npm install -g @aws-amplify/cli
   ```
2. Configure Amplify:
   ```bash
   amplify configure
   ```
3. Initialize in project:
   ```bash
   amplify init
   ```

### 8.2 Amplify Build Configuration
Create `amplify.yml`:
```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm ci
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: dist
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
```

---

## 9. FROM MVP TO FULL FEATURE SET

The above steps give you a functional MVP: 
• Authentication (sign in, sign up)  
• Ticket creation and listing  
• Basic routing  

Below are recommended enhancements to match the broader requirements outlined in your project brief:

1. **Dynamic Status Tracking**  
   - Extend the `tickets` table with more statuses (e.g., `open`, `in_progress`, `closed`) or create a separate `ticket_status` table.
2. **Priority Levels**  
   - Add a `priority` dropdown with values like `low`, `medium`, `high`.
3. **Custom Fields**  
   - Implement a separate `ticket_fields` or `ticket_attributes` table for flexible fields.
4. **Tags**  
   - Create a many-to-many relationship (`ticket_tags`, `tags`).
5. **Internal Notes**  
   - Add a `notes` table or a field in the `tickets` table to store internal comments (only visible to agents).
6. **Full Conversation History**  
   - Implement a `conversations` table with references to each `ticket` ID and store messages.
7. **API-First Design**  
   - Create additional endpoints or Supabase Edge Functions for external integrations.
8. **Advanced Queue Management**  
   - Build filtering (by priority, status, agent assignment) and real-time updates (using Supabase Realtime or WebSockets).
9. **Collaboration Tools**  
   - Add mention systems, share conversation references, etc.
10. **Team Management**  
   - Define roles (admin, agent, etc.). Store in Supabase and manage permissions accordingly.
11. **Routing Intelligence**  
   - Use custom logic to assign tickets to the right agent or team.
12. **Knowledge Base**  
   - Build an additional schema and pages for articles, categories, and a search interface.
13. **AI/ML Features**  
   - Add classification or auto-tagging using a separate service or custom ML model, if required.
14. **Analytics & Metrics**  
   - Track agent performance, number of tickets closed, average resolution time, etc.
15. **Deployment & Monitoring**  
   - Use AWS Amplify (or other services) for production environment, set up CI/CD, error tracking, and performance monitoring.

---

## 10. NEXT STEPS & BEST PRACTICES

1. **Continuous Integration/Continuous Deployment**  
   - Configure GitHub Actions or other pipelines to run tests and automatically build/deploy.
2. **Validation & Security**  
   - Add server-side validations, rate limiting, and further security layers (XSS, CSRF).
3. **Performance Optimization**  
   - Use caching strategies, optimize queries, and consider code splitting in large React apps.
4. **Documentation**  
   - Keep a detailed technical doc for the API, data models, and architecture.  
   - Provide user guides and admin guides to help others navigate the application.
5. **Refactor & Modularize**  
   - Continually refine your folder structure, break large components into smaller, more maintainable ones.

---

## CONCLUSION

Following these steps, you’ll have a working foundation for a modern CRM-like system with tickets, authentication, basic routing, and readiness for advanced features. Progress gradually from the MVP to full-scale production features, ensuring that each layer is well-documented and tested.
