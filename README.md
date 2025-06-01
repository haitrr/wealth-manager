This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) to automatically optimize and load Inter, a custom Google Font.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.


## Database Schema Management

This project uses a database to store wealth management data. Follow these steps to modify the database schema:

### Prerequisites

Ensure you have the database setup completed and migrations configured.

### Making Schema Changes

1. **Create a new migration file:**
   ```bash
   # If using Prisma
   npx prisma migrate dev --name your_migration_name
   
   # If using Drizzle
   npm run db:generate
   
   # If using custom migrations
   npm run migration:create your_migration_name
   ```

2. **Edit the schema file:**
   - Update your schema definition file (e.g., `prisma/schema.prisma`, `drizzle/schema.ts`, or similar)
   - Add, modify, or remove tables, columns, indexes, or relationships as needed

3. **Run the migration:**
   ```bash
   # Apply pending migrations
   npm run db:migrate
   # or
   npm run db:push
   ```

4. **Update your application code:**
   - Modify TypeScript types/interfaces
   - Update database queries and models
   - Adjust API endpoints if needed

5. **Test the changes:**
   ```bash
   # Run tests to ensure schema changes work correctly
   npm test
   
   # Test database connection
   npm run db:test
   ```

### Best Practices

- Always backup your database before applying migrations in production
- Test schema changes in a development environment first
- Use descriptive migration names that explain the change
- Consider data migration scripts for existing data when modifying columns
- Update seed files if you have test data dependencies

### Rollback

If you need to rollback a migration:
```bash
# Rollback last migration (if supported by your ORM)
npm run db:rollback

# Or restore from backup
npm run db:restore backup_file_name
```