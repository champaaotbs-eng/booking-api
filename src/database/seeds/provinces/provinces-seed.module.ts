import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ProvinceEntity } from "modules/provinces/entities/province.entity";
import { WardEntity } from "modules/provinces/entities/ward.entity";
import { ProvincesSeedService } from "./provinces-seed.service";

@Module({
    imports: [TypeOrmModule.forFeature([ProvinceEntity, WardEntity])],
    providers: [ProvincesSeedService],
    exports: [ProvincesSeedService]
})

export class ProvincesSeedModule { }