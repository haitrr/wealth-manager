import { seed } from '../scripts/seed';

// This is the entry point for `prisma db seed` command
// It calls the seed function from scripts/seed.ts
seed()
  .then(() => {
    console.log('Seeding completed successfully');
    process.exit(0);
  })
  .catch((e) => {
    console.error('Error seeding the database:', e);
    process.exit(1);
  });