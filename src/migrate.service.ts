import { Injectable, OnModuleInit } from '@nestjs/common';
import { execSync } from 'child_process';

@Injectable()
export class MigrateService implements OnModuleInit {
  async onModuleInit() {
    console.log('Running Prisma Migrations...');
    try {
      execSync('npx prisma migrate deploy', { stdio: 'inherit' });
      console.log('Migrations completed successfully.');
    } catch (err) {
      console.error('Migration failed:', err);
    }
  }
}
