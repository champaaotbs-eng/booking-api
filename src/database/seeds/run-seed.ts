import { NestFactory } from '@nestjs/core';
import { AdminUserSeedService } from './admin/admin-user-seed.service';
import { SeedModule } from './seed.module';
import { RoleSeedService } from './role/role-seed.service';
import { ProvincesSeedService } from './provinces/provinces-seed.service';

const runSeed = async () => {
    const app = await NestFactory.create(SeedModule);
    // run seeds in order
    console.log('Seeding admin modules permissions...');
    await app.get(RoleSeedService).run();

    console.log('Seeding admin user...');
    await app.get(AdminUserSeedService).run();

    console.log('Seeding provinces and ward');
    await app.get(ProvincesSeedService).run()

    console.log('Seeding completed successfully!');
    await app.close();
};

void runSeed();
