## Complete Development Checklist

Below is a step-by-step checklist to guide a junior developer through building a modern CRM support system (front-end: React, Node; back-end: Supabase; deployment: AWS Amplify). This checklist is aligned with the MVP scope (auth + ticket system in two days) as well as additional features outlined in the broader requirements.

---

### Phase 1: Repository & Workspace Setup

- [x] Create a new GitHub repository for your CRM project
- [x] Initialize local project:
  - [x] Clone the repo locally
  - [x] Ensure Node.js 18+ is installed

- [x] Set up basic documentation structure:
  - [x] docs/requirements.md
  - [x] docs/TDD.md
  - [x] docs/tasks.md

- [x] Confirm .gitignore is in place to exclude:
  - [x] node_modules
  - [x] build/dist artifacts
  - [x] .env files

---

### Phase 2: Project Scaffolding & Core Framework

1. **Initialize Vite + React**  
   - [x] Confirm the project runs locally with "npm run dev" (2024-01-20 15:49 EST)

2. **Install Core Dependencies**  
   - [x] React, react-dom, react-router-dom (2024-01-20 16:30 EST)
   - [x] Zustand (for global state) (2024-01-20 16:30 EST)
   - [x] React Query (for server-state) (2024-01-20 16:30 EST)
   - [x] TailwindCSS & MUI UI (2024-01-20 16:30 EST)
   - [x] ESLint & Prettier for code quality (2024-01-20 16:30 EST)
   - [x] Vitest / React Testing Library (2024-01-20 16:30 EST)
   - [x] Supabase JS client (2024-01-20 16:30 EST)

3. **Folder Structure**  
   - [x] Create src/components, src/contexts, src/hooks, src/pages, src/lib, etc. (2024-01-20 16:35 EST)
   - [x] Add index.html (or confirm default from Vite) (2024-01-20 15:49 EST)
   - [x] Add a main entry file (e.g., src/main.jsx) (2024-01-20 15:49 EST)

4. **Configure Tailwind CSS**  
   - [x] Generate tailwind.config.js and postcss.config.js (2024-01-20 16:35 EST)
   - [x] Import Tailwind directives in src/index.css (2024-01-20 16:35 EST)

5. **ESLint & Prettier**  
   - [x] Create or update your eslint.config.js (or .eslintrc.js) (2024-01-20 16:45 EST)
   - [x] Set Prettier config so it doesn't conflict with ESLint (2024-01-20 16:45 EST)
   - [x] Confirm "npm run lint" and "npm run format" scripts work (2024-01-20 16:45 EST)

6. **Vite Configuration**  
   - [x] Review vite.config.js:
     - [x] Add any path alias you need (e.g., "@/") (2024-01-20 16:45 EST)
     - [x] Configure test environment (2024-01-20 16:45 EST)
   - [x] Ensure environment variables (like VITE_SUPABASE_URL) are set properly in .env (2024-01-20 16:45 EST)

---

### Phase 3: Supabase Setup & Database Schema

1. **Create Supabase Project**  
   - [x] Go to supabase.com and create a new project (2024-01-20 16:50 EST)
   - [x] Copy your Project URL and anon key; store them in `.env` (2024-01-20 16:50 EST)

2. **Init Supabase in Your App**  
   - [x] Create and export Supabase client in src/lib/supabase.js (2024-01-20 16:55 EST)
   - [x] Set up auth hook with session management (2024-01-20 16:55 EST)

3. **Database Schema**  
   - [x] Create core ENUM types (2024-01-20 17:00 EST):
     - [x] ticket_status
     - [x] priority_level
     - [x] article_status
     - [x] team_role
   - [x] Create core tables (2024-01-20 17:00 EST):
     - [x] teams
     - [x] user_teams (replacing profile_teams)
     - [x] categories
     - [x] tickets
     - [x] ticket_comments
     - [x] articles
     - [x] article_versions
     - [x] embeddings
   - [x] Set up foreign key relationships (2024-01-20 17:00 EST)
   - [x] Create necessary indexes (2024-01-20 17:00 EST)

4. **Auth Setup**  
   - [x] Enable email auth in the Supabase dashboard
   - [x] (Optional) Add additional providers if needed

5. **Row-Level Security**  
   - [x] Turn on RLS for all tables (2024-01-20 17:00 EST)
   - [x] Create policies for (2024-01-20 17:00 EST):
     - [x] Teams (member view)
     - [x] Tickets (team and customer view)
     - [x] Comments (team and customer view)
     - [x] Articles (public view, team edit)

6. **Testing Setup**
   - [x] Create test environment configuration (2024-01-20 17:10 EST)
   - [x] Set up database test utilities (2024-01-20 17:10 EST)
   - [x] Create user management tests (2024-01-20 17:10 EST)
   - [x] Update tests for new schema (2024-01-20 17:20 EST)
   - [x] Run and verify all tests pass (2024-01-20 17:30 EST)

---

### Phase 4: Authentication System (MVP Must-Have)

1. **Create Auth Context**  
   - [x] Use Supabase's onAuthStateChange to sync user session (2024-01-20 18:05 EST)
   - [x] Provide signIn, signUp, signOut (2024-01-20 18:05 EST)
   - [x] Implement session persistence (2024-01-20 18:05 EST)
   - [x] Add loading and error states (2024-01-20 18:05 EST)

2. **Protected Routes**  
   - [x] Create ProtectedRoute component (2024-01-20 18:15 EST)
   - [x] Add role-based access control (2024-01-20 18:15 EST)
   - [x] Implement redirect logic (2024-01-20 18:15 EST)
   - [x] Update router configuration (2024-01-20 18:10 EST)

3. **Auth UI**  
   - [x] Build LoginForm with validation
   - [x] Create RegistrationForm with password requirements
   - [x] Add PasswordReset functionality
   - [x] Implement error handling and loading states

4. **Testing Auth**  
   - [x] Write AuthContext tests (2024-01-20 18:20 EST)
   - [x] Test protected routes behavior (2024-01-20 18:20 EST)
   - [x] Validate form submissions (2024-01-20 18:20 EST)
   - [x] Test error scenarios (2024-01-20 18:20 EST)

---

### Phase 5: Ticket System (MVP Must-Have, Day 2)

1. **Database Model**  
   - [ ] tickets table with columns: subject, description, status, priority, assignee_id, etc.

2. **Creating & Fetching Tickets**  
   - [ ] Create a custom React Query hook (e.g., useTickets) to fetch tickets from Supabase.  
   - [ ] Create a custom hook (e.g., useCreateTicket) to insert new tickets.

3. **Ticket Pages/Components**  
   - [ ] Ticket List Page  
     - [ ] Render tickets with status, priority, assignee.  
     - [ ] Provide filtering/sorting if possible.  
   - [ ] Ticket Detail Page  
     - [ ] Show entire conversation, metadata, tags.  
     - [ ] Add internal notes or comments if time allows.  

4. **Ticket Status & Workflow**  
   - [ ] Use an enum with statuses: new, open, pending, solved, closed.  
   - [ ] Provide UI to update ticket status.  
   - [ ] (Optional) Real-time updates with Supabase Realtime.

5. **Testing Tickets**  
   - [ ] Write unit tests for the ticket hooks.  
   - [ ] Test the ticket creation and status updates with integration tests.

---

### Phase 6: Knowledge Base (Days 3-4)

1. **Database Model**  
   - [ ] articles table with fields: title, content, category_id, author_id, etc.

2. **Knowledge Base UI**  
   - [ ] KB List Page: list all articles with basic info.  
   - [ ] KB Detail Page: show article content.  
   - [ ] Article Creation Form (for staff with the right role).

3. **Search & Categorization**  
   - [ ] Provide a simple search that queries "title" or "content."  
   - [ ] Implement categories for quick filtering (optional tagging).  

4. **Version Control / Draft-Publish**  
   - [ ] Use statuses: draft, review, published, etc.  
   - [ ] Let admins or team leads publish articles.

5. **Testing KB**  
   - [ ] Test article creation, editing, and listing.  
   - [ ] Test search functionality in integration tests.

---

### Phase 7: Communication Hub (Day 4+)

1. **Email Integration**  
   - [ ] Decide on a service (SendGrid, Postmark, or built-in Supabase).  
   - [ ] Create a function that sends an email when a ticket is created/updated.  
   - [ ] (Optional) Display email history in the UI or link it to ticket details.

2. **Chat System (Optional)**  
   - [ ] Set up Supabase Realtime or WebSockets for live chat.  
   - [ ] Build a minimal chat interface: message text input, conversation area.  

3. **Notifications & Alerts**  
   - [ ] Use toast notifications in the UI for new tickets or assignment changes.  
   - [ ] Integrate with your chat or ticket system to show real-time alerts.

---

### Phase 8: Analytics & Reporting (Days 4-5)

1. **Data Collection**  
   - [ ] Track key events: ticket creation, status changes, user logins.  
   - [ ] Optionally store in Supabase or a third-party (PostHog, Segment).

2. **Dashboard**  
   - [ ] Show summary counts (open tickets, average response time).  
   - [ ] If time permits, add charts using a library (e.g., Recharts, Chart.js).

3. **Performance Reports**  
   - [ ] Filter by date, role, or team.  
   - [ ] Provide CSV export if needed.

---

### Phase 9: Testing & Documentation (Day 5+)

1. **Unit Tests**  
   - [ ] Components: forms, ticket list, ticket detail.  
   - [ ] Auth flows: login, logout, protected routes.  

2. **Integration Tests**  
   - [ ] Test standard user workflows: creating tickets, updating statuses.  
   - [ ] Validate Supabase queries for errors or correctness.

3. **E2E Tests**  
   - [ ] Use Cypress (or similar) for critical paths: user login, ticket creation, knowledge base.  
   - [ ] Run these in CI/CD.

4. **Documentation Updates**  
   - [ ] Keep TDD docs updated with any changes in schema or design.  
   - [ ] Provide user guides for admin, agent, and customer flows.

---

### Phase 10: Performance & Security (Day 5+)

1. **Performance Checks**  
   - [ ] Measure page load times and optimize large dependencies.  
   - [ ] Implement Caching (React Query, browser caching).  

2. **Security Hardening**  
   - [ ] Double-check RLS (Row Level Security) policies.  
   - [ ] Validate inputs on both client (React Hook Form) and server (Supabase).  
   - [ ] Ensure HTTPS and correct CORS settings in Amplify.

3. **Rate Limiting & Logging**  
   - [ ] Implement naive rate limiting or usage rules if needed.  
   - [ ] Use error logs and user activity logs for debugging and auditing.

---

### Phase 11: Deployment & DevOps (Days 6-7)

1. **AWS Amplify Deployment**  
   - [ ] Configure Amplify hosting: link your GitHub repo to Amplify.  
   - [ ] Provide a build pipeline (amplify.yml) that installs dependencies and runs build.

2. **CI/CD Pipeline**  
   - [ ] Set up GitHub Actions to run tests, lint, and then deploy if successful.  
   - [ ] On pull requests, run tests automatically.

3. **Environment Configuration**  
   - [ ] Keep secrets out of version control.  
   - [ ] Use Amplify console or GitHub Action secrets for environment variables.

4. **Monitoring & Alerts**  
   - [ ] Use Amplify's built-in logs or AWS CloudWatch.  
   - [ ] Integrate Sentry for error tracking.

---

### Phase 12: AI/ML Enhancements (Week 2 & Beyond)

1. **Smart Routing**  
   - [ ] Integrate LangChain or GPT-4 for automatic ticket classification.  
   - [ ] Set up an Edge Function to classify tickets by category/priority.

2. **Knowledge Base AI**  
   - [ ] Use vector embeddings (pgvector) to store and search article content.  
   - [ ] Add advanced AI-assisted search for knowledge base.

3. **Analytics & Automation**  
   - [ ] Implement sentiment analysis or predictive models.  
   - [ ] Set up automated workflows (e.g., auto-escalate high-urgency tickets).

---

## Next Steps for the Junior Developer

- Focus immediately on completing Phases 2–5 to deliver the MVP on Day 2 (working auth + basic ticket system).
- After the MVP, pick up subsequent phases in order, ensuring each stage is tested and documented.
- Continue refining as new requirements or feedback appear. 

Following these steps carefully will help meet the timeline and ensure a robust, feature-rich customer support CRM. Good luck!
