# Email-Makers

A secured web application that generates email templates using AI-powered content creation and design automation.

## 🚀 Features

- **AI-Powered Content Generation**: Generate compelling email content using LLM orchestration
- **Design System Integration**: Seamlessly extract and apply Figma design tokens
- **Email Standard Compliance**: Generate HTML that works across all major email clients
- **Quality Assurance**: Automated testing and validation pipeline
- **Secure Authentication**: JWT-based authentication with bcrypt password hashing

## 🏗️ Architecture

This project follows Domain-Driven Design (DDD) principles with the following bounded contexts:

- **Authentication Context**: User management and security
- **Email Marketing Context**: Email campaigns and templates
- **Content Generation Context**: AI-powered content creation
- **Design System Context**: Figma integration and design tokens
- **Template Processing Context**: MJML compilation and optimization
- **Quality Assurance Context**: Testing and validation

## 🛠️ Tech Stack

### Frontend
- Next.js 14.0.4 with App Router
- TypeScript 5.6.3
- Tailwind CSS
- React Query (TanStack Query)

### Backend
- Next.js API Routes
- PostgreSQL with Drizzle ORM
- JWT Authentication
- bcrypt for password hashing

### External Integrations
- OpenAI GPT-4o mini / Anthropic Claude
- Figma API
- MJML Engine
- Litmus Testing API

## 📦 Installation

1. Clone the repository:
```bash
git clone https://github.com/rtuzov/emailmakers.git
cd emailmakers
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

Edit `.env.local` with your configuration:
```env
DATABASE_URL=postgresql://username:password@localhost:5432/email_makers
JWT_SECRET=your-32-character-secret-key-here
ENCRYPTION_KEY=your-32-character-encryption-key
OPENAI_API_KEY=your-openai-api-key
FIGMA_ACCESS_TOKEN=your-figma-access-token
```

4. Set up the database:
```bash
npm run db:generate
npm run db:migrate
```

5. Start the development server:
```bash
npm run dev
```

## 🧪 Testing

Run the test suite:
```bash
npm test
```

Run tests in watch mode:
```bash
npm run test:watch
```

Generate coverage report:
```bash
npm run test:coverage
```

## 📋 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues
- `npm run format` - Format code with Prettier
- `npm run type-check` - Run TypeScript type checking
- `npm run db:generate` - Generate database migrations
- `npm run db:migrate` - Run database migrations
- `npm run db:studio` - Open Drizzle Studio

## 🏛️ Project Structure

```
src/
├── domains/                 # Domain-driven design contexts
│   ├── auth/               # Authentication domain
│   ├── email-marketing/    # Email marketing domain
│   ├── content-generation/ # Content generation domain
│   ├── design-system/      # Design system domain
│   ├── template-processing/# Template processing domain
│   └── quality-assurance/  # Quality assurance domain
├── shared/                 # Shared infrastructure
│   ├── infrastructure/     # Database, external APIs
│   ├── utils/             # Common utilities
│   └── types/             # Shared TypeScript types
├── api/                   # API routes and middleware
│   ├── routes/            # API endpoints
│   ├── middleware/        # Authentication, validation
│   └── controllers/       # Request handlers
└── ui/                    # User interface components
    ├── components/        # React components
    ├── pages/            # Next.js pages
    └── hooks/            # Custom React hooks
```

## 🔐 Security

- JWT tokens with 24-hour expiration
- bcrypt password hashing with 12 salt rounds
- API key encryption for external services
- Input validation with Zod schemas
- Rate limiting and CORS protection

## 🚀 Deployment

The application is designed for deployment on Vercel or similar platforms. Ensure all environment variables are configured in your deployment environment.

## 📝 API Documentation

### Authentication Endpoints

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user info

### Request/Response Examples

#### Register User
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123!",
    "firstName": "John",
    "lastName": "Doe"
  }'
```

#### Login User
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123!"
  }'
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🔗 Links

- [Project Documentation](./memory-bank/)
- [Phase 1 Implementation Guide](./memory-bank/phase-1-foundation.md)
- [System Architecture](./memory-bank/systemPatterns.md)
