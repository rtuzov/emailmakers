# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Email-Makers is an enterprise-grade web application that generates email templates using AI-powered content creation and design automation. It follows Domain-Driven Design (DDD) principles and delivers production-ready email templates with comprehensive quality assurance.

## Essential Development Commands

### Core Development Workflow
```bash
# Start development server
npm run dev

# Type checking (run before any code changes)
npm run type-check

# Build for production
npm run build

# Code formatting and linting
npm run lint:fix
npm run format
```

### Database Operations
```bash
# Generate database migrations
npm run db:generate

# Apply database migrations
npm run db:migrate

# Open Drizzle Studio (database GUI)
npm run db:studio

# Reset database completely (development only)
npm run db:reset
```

### Testing Commands
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report (target: 80%+)
npm run test:coverage

# Run E2E tests with Cypress
npx cypress open
```

### Setup and Validation
```bash
# Check API key configuration
npm run check:api-keys

# Complete setup validation
npm run setup
```

## Architecture Overview

### Domain-Driven Design Structure

The project is organized into 7 bounded contexts following DDD principles:

1. **Authentication Context** (`/src/domains/auth/`)
   - JWT-based authentication with bcrypt password hashing
   - User management and session handling
   - API key encryption for external services

2. **Email Marketing Context** (`/src/domains/email-marketing/`)
   - Email template and campaign management
   - Brand guidelines integration
   - Template generation orchestration

3. **Content Generation Context** (`/src/domains/content-generation/`)
   - AI-powered content creation using OpenAI GPT-4o mini and Anthropic Claude
   - LLM orchestration with fallback mechanisms
   - Content validation and optimization

4. **Design System Context** (`/src/domains/design-system/`)
   - Figma API integration for design token extraction
   - Component mapping and asset management
   - Design system consistency enforcement

5. **Template Processing Context** (`/src/domains/template-processing/`)
   - MJML compilation to HTML
   - CSS inlining for email client compatibility
   - Dark mode and responsive design implementation

6. **Quality Assurance Context** (`/src/domains/quality-assurance/`)
   - Cross-client compatibility testing
   - HTML validation and accessibility testing
   - Performance optimization and file size validation

7. **Render Testing Context** (`/src/domains/render-testing/`)
   - Browser automation for screenshot capture
   - Multi-client email rendering verification
   - Queue-based job processing with priority handling

### Technical Stack

**Frontend:**
- Next.js 14.0.4 with App Router and TypeScript 5.6.3 (strict mode)
- Tailwind CSS with shadcn/ui components
- React Query for state management

**Backend:**
- Next.js API Routes with PostgreSQL and Drizzle ORM
- JWT authentication with 24-hour expiration
- AES-256-GCM encryption for sensitive data

**External Integrations:**
- OpenAI GPT-4o mini (primary) and Anthropic Claude (fallback)
- Figma API for design token extraction
- MJML engine for email HTML generation

## Database Schema

Complete PostgreSQL schema with Drizzle ORM including:
- **Core tables:** users, sessions, api_keys, email_templates, brands, content_briefs
- **QA tables:** quality_test_results
- **Render testing tables:** render_jobs, render_results, email_clients, screenshots

Use `npm run db:studio` to explore the schema visually.

## Email HTML Standards

### Critical Requirements
- **DOCTYPE:** `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN">`
- **Layout:** Table-based layout only (no flexbox/grid)
- **CSS:** Inline styles for critical rendering paths
- **Width:** 600-640px maximum
- **File Size:** <100KB total to avoid Gmail clipping
- **Compatibility:** Gmail, Outlook 2016+, Apple Mail, Yahoo Mail

### Email Client Compatibility
All generated templates must pass cross-client testing with 95%+ compatibility rate across major email clients.

## Environment Configuration

### Required Environment Variables
```bash
# Core Application
DATABASE_URL=postgresql://username:password@localhost:5432/email_makers
JWT_SECRET=your-32-character-secret-key-here
ENCRYPTION_KEY=your-32-character-encryption-key

# AI Services (Required)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# Optional Integrations
FIGMA_ACCESS_TOKEN=figd_...
AWS_ACCESS_KEY_ID=...
REDIS_URL=redis://...
```

Use `npm run check:api-keys` to validate configuration.

## Development Patterns

### File Organization
- **Entities:** Core business objects with identity
- **Value Objects:** Immutable objects without identity  
- **Services:** Domain logic orchestration
- **Repositories:** Data access abstraction
- **Interfaces:** Contract definitions for external dependencies

### Naming Conventions
- Files: kebab-case (`user-service.ts`)
- Classes: PascalCase (`UserService`)
- Functions: camelCase (`generateContent`)
- Constants: SCREAMING_SNAKE_CASE (`MAX_FILE_SIZE`)

### Code Quality Standards
- TypeScript strict mode with zero compilation errors
- Minimum 80% test coverage
- ESLint and Prettier formatting
- SOLID principles and dependency injection

## Testing Strategy

- **Jest:** Unit testing with comprehensive domain coverage
- **Cypress:** E2E testing for critical user workflows
- **Testing Library:** Component testing utilities
- **Accessibility:** axe-core integration for WCAG AA compliance

## AI Agent Integration

### OpenAI Agents SDK
- Agent: `kupibilet-email-generator-v2`
- Model: GPT-4o mini with 10 custom tools
- 8-step email generation pipeline with intelligent fallbacks

### Tools Available
- Date manipulation and route correction
- Figma asset selection with emotional context
- Dynamic pricing integration
- MJML compilation and validation
- Visual regression testing with Percy
- Cross-client render testing

## Performance Requirements

- **API Response:** <2s average
- **Template Generation:** <30s end-to-end
- **Database Queries:** <100ms average
- **File Size:** <100KB HTML output

## Memory Bank System

The project uses a comprehensive Memory Bank system for context preservation:

```
memory-bank/
├── projectbrief.md         # Foundation document
├── productContext.md       # User needs and project purpose
├── activeContext.md        # Current work focus
├── systemPatterns.md       # Architecture decisions
├── techContext.md          # Technology constraints
├── progress.md             # What works, what's left
└── tasks.md                # Implementation plan
```

Always consult Memory Bank files when making architectural decisions or understanding project context.

## Security Considerations

- JWT tokens with 24-hour expiration and refresh mechanism
- bcrypt password hashing with 12+ rounds
- API key encryption using AES-256-GCM
- Input validation with Zod schemas
- CORS protection and security headers

## Deployment

- Multi-stage Docker builds for production optimization
- Health checks at `/api/health`
- Prometheus metrics integration
- Structured logging with Pino

## Common Troubleshooting

### Type Errors
Run `npm run type-check` - project maintains zero TypeScript errors

### Database Issues
Use `npm run db:reset` for clean state in development

### API Key Problems
Check `docs/API_SETUP_GUIDE.md` and run `npm run check:api-keys`

### Docker Issues
Use `docker-compose up -d` for local PostgreSQL service

## Development Best Practices

1. **Start with Memory Bank:** Always read relevant memory bank files first
2. **Domain-First:** New features should fit existing bounded contexts
3. **Database-First:** Use Drizzle schema-first approach
4. **Test Coverage:** Maintain 80%+ coverage with both unit and integration tests
5. **Security:** Never commit secrets, always encrypt sensitive data
6. **Email Standards:** Follow strict HTML email compatibility requirements

This project prioritizes email template quality, cross-client compatibility, and enterprise-grade security while maintaining excellent developer experience.