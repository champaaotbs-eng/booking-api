import { InjectRepository } from "@nestjs/typeorm"
import { ProvinceEntity } from "modules/provinces/entities/province.entity"
import { WardEntity } from "modules/provinces/entities/ward.entity"
import { Repository } from "typeorm"
import { provincesData } from "./provinces-data"
import { wardsData } from "./wards-data"

export class ProvincesSeedService {
    constructor(
        @InjectRepository(ProvinceEntity)
        private readonly provinceRepository: Repository<ProvinceEntity>,
        @InjectRepository(WardEntity)
        private readonly wardRepository: Repository<WardEntity>) { }

    async run() {
        const provinces = provincesData.map((province) => {
            const provinceEntity = this.provinceRepository.create({
                name: province.name,
                code: province.code,
                divisionType: province.division_type,
                codename: province.codename,
            });
            return this.provinceRepository.save(provinceEntity);
        })

        const wards = wardsData.map((ward) => {
            const wardEntity = this.wardRepository.create({
                name: ward.name,
                code: ward.code,
                divisionType: ward.division_type,
                codename: ward.codename,
                province: { code: ward.province_code } as ProvinceEntity,
            });
            return this.wardRepository.save(wardEntity);
        })
        await Promise.all([...provinces, ...wards]);
    }
}