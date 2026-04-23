# Technestia

Technestia is a full-stack collaboration platform for builders to create projects, form teams, track milestones, discuss work in real-time chat, and maintain activity/notification streams.

This repository uses Next.js App Router + Prisma + PostgreSQL + Socket.IO with a custom Node server.

## Tech Stack

- Frontend: Next.js 15, React 19, TypeScript, Tailwind CSS, Radix UI, SWR
- Backend: Next.js Route Handlers, custom Node HTTP server
- Database: PostgreSQL + Prisma ORM
- Auth: NextAuth (Credentials + Google + GitHub)
- Realtime: Socket.IO
- Media: Cloudinary
- Email: Resend

## Core Workflows (What Is Implemented)

### 1. Authentication and Account Lifecycle

- Sign up with email/OTP verification
- Sign in via credentials or OAuth (Google/GitHub)
- Forgot/reset password flow
- Session/JWT via NextAuth callbacks

Primary backend files:

- `src/app/api/auth/sign-up/route.ts`
- `src/app/api/auth/verify-otp/route.ts`
- `src/app/api/auth/forgot-password/route.ts`
- `src/app/api/auth/reset-password/route.ts`
- `src/app/api/auth/[...nextauth]/options.ts`

### 2. Profile System

- Public profile by username
- Own profile edit (bio/social links/image)
- Password update/set-password flow
- Account deletion

Primary files:

- `src/app/api/profile/**`
- `src/app/(dashboard)/profile/**`

### 3. Project Management

- Create project with metadata (title, description, tech stack, tags)
- Public/private project visibility
- Update general/settings/social/screenshots
- Delete project

Primary files:

- `src/app/api/project/create/route.ts`
- `src/app/api/project/update/**`
- `src/app/api/project/delete/[projectId]/route.ts`
- `src/app/(dashboard)/projects/**`
- `src/app/project/[id]/page.tsx`

### 4. Collaboration Model

- Join request flow (request -> accept/reject)
- Invite flow (invite -> accept/decline/cancel)
- Access levels: `LIMITED`, `FULL`
- Remove collaborator / leave project
- My invites and my requests pages/hooks

Primary files:

- `src/app/api/project/*collab*`
- `src/app/api/project/invites/my/route.ts`
- `src/app/api/project/requests/my/route.ts`
- `src/app/(dashboard)/collaborations/**`

### 5. Milestone Lifecycle

- Milestone CRUD (create, edit, delete)
- Completion status updates (`NOT_STARTED`, `IN_PROGRESS`, `COMPLETED`, `SKIPPED`)
- Approval workflow for status updates (`PENDING` -> `APPROVED`/`REJECTED`)
- Proof URL and milestone visibility flags

Primary files:

- `src/app/api/project/milestones/**`
- `src/components/projects/tabs/ProjectMilestonesTab.tsx`

### 6. Feedback and Reactions

- Project feedback create/list/update/delete
- Optional rating + feedback content
- Reaction system (LIKE/LOVE/LAUGH/WOW/SAD/ANGRY)

Primary files:

- `src/app/api/project/feedbacks/**`
- `src/app/api/project/feedback-reaction/**`
- `src/components/projects/tabs/ProjectFeedbacksTab.tsx`

### 7. Activity and Notifications

- Centralized activity logging helper for project actions
- Notification persistence per user
- Mark-one and mark-all read flows
- Realtime updates for new activity and notifications

Primary files:

- `src/lib/activityNotificationRealtime.ts`
- `src/app/api/notifications/my/route.ts`
- `src/app/api/notifications/read/[notificationId]/route.ts`
- `src/app/api/notifications/read-all/route.ts`
- `src/hooks/useActivityFeed.ts`
- `src/hooks/useNotifications.ts`
- `src/app/(dashboard)/activity/**`

### 8. Realtime Chat

- DM + group chat rooms
- Project team chat button from project detail
- Message send/edit/delete, mark-as-read, unread counters
- Participant add/remove/leave
- Presence/typing/seen indicators

Primary files:

- `server.js`
- `src/app/api/chat/**`
- `src/hooks/useChat*.ts`
- `src/app/(dashboard)/chat/**`

### 9. Search

- Project, milestone, and user search endpoints
- Frontend search experiences across dashboard/public areas

Primary files:

- `src/app/api/search/projects/route.ts`
- `src/app/api/search/milestones/route.ts`
- `src/app/api/search/users/route.ts`

## Realtime Event Map

Server/user channels use `user:{id}` rooms and chat channels use `chat:{roomId}`.

- `activity:new`: pushes newly created activity item
- `notification:new`: pushes new notification row
- `notification:read-sync`: sync read state across tabs/devices
- `collab:sync`: sync collaboration request/invite lifecycle changes
- `chat:room:sync`: update room-level unread/latest message state
- `chat:message:new`, `chat:message:edit`, `chat:message:delete`
- `chat:typing:start`, `chat:typing:stop`
- `chat:message:seen`
- `chat:presence:state`

## Architecture Notes

- Custom server (`server.js`) hosts Next handler and Socket.IO on same port.
- Route handlers implement domain mutations; frontend consumes via SWR hooks.
- Activity + notification creation is centralized to avoid drift across routes.
- Notifications use SWR cache as source-of-truth for multi-tab consistency.

## Local Setup

### Prerequisites

- Node.js 18+
- PostgreSQL

### Install

```bash
npm install
```

### Database

```bash
npx prisma migrate dev
```

### Run

```bash
npm run dev
```

This starts the custom server (`node server.js`) with Next.js + Socket.IO.

## Environment Variables

Required/used variables discovered from code:

```bash
# Database
DATABASE_URL=

# Auth
NEXTAUTH_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=

# URLs
NEXT_PUBLIC_SOCKET_URL=http://localhost:3000
SOCKET_CORS_ORIGIN=http://localhost:3000
NEXT_PUBLIC_API_BASE_URL=
RESET_PASSWORD_PAGE_URL=

# Cloudinary
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
FOLDER_NAME=

# Email
RESEND_API_KEY=
```

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
```

## Verified Gaps / Incomplete Areas

These are current platform gaps to prioritize before claiming production hardening:

1. Milestone assignment model is not implemented yet.

- No assignee relation/field in Prisma milestone model.

2. Search pagination/count maturity is limited.

- Search endpoints exist, but production-grade pagination/metadata needs improvement.

3. No automated test suite coverage baseline in repo.

- Critical flows should be covered with integration/E2E tests.

4. No API rate-limiting layer.

- Public/high-frequency endpoints need throttling protection.

5. No centralized observability setup.

- Structured logs/metrics/tracing are not yet integrated.

