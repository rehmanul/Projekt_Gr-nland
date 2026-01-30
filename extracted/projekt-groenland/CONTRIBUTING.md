# Contributing to Project Grönland

## Development Workflow

1. Create feature branch: `git checkout -b feature/your-feature`
2. Make changes and test thoroughly
3. Commit with clear messages
4. Push and create pull request
5. Wait for code review

## Code Standards

- TypeScript strict mode
- ESLint + Prettier formatting
- 80%+ test coverage
- All tests must pass

## Testing

```bash
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report
```

## Database Migrations

```bash
# Create migration
node-pg-migrate create migration_name

# Run migrations
npm run migrate
```
