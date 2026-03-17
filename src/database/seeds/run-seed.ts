import { NestFactory } from '@nestjs/core';
import { RoleSeedService } from './role/role-seed.service';
import { AdminUserSeedService } from './admin/admin-user-seed.service';
import { SeedModule } from './seed.module';
import { PermissionSeedService } from './permission/permission-seed.service';

const runSeed = async () => {
    const app = await NestFactory.create(SeedModule);
    // run seeds in order
    // console.log('Seeding roles...');
    // await app.get(RoleSeedService).run();

    console.log('Seeding admin user...');
    await app.get(AdminUserSeedService).run();

    // console.log('Seeding permission...')
    // await app.get(PermissionSeedService).run();

    console.log('Seeding completed successfully!');
    await app.close();
};

void runSeed();
