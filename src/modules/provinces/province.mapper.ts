import { Province, Ward } from './province.domain';
import { ProvinceEntity } from './entities/province.entity';
import { WardEntity } from './entities/ward.entity';

export class ProvinceMapper {
    static toDomain(raw: ProvinceEntity): Province {
        const domain = new Province();
        domain.provinceId = raw.provinceId;
        domain.name = raw.name;
        domain.code = raw.code;
        domain.divisionType = raw.divisionType;
        if (raw.wards) {
            domain.wards = raw.wards.map((ward) => WardMapper.toDomain(ward));
        }
        return domain;
    }
}

export class WardMapper {
    static toDomain(raw: WardEntity): Ward {
        const domain = new Ward();
        domain.wardId = raw.wardId;
        domain.name = raw.name;
        domain.code = raw.code;
        domain.divisionType = raw.divisionType;
        domain.provinceCode = raw?.province?.code;
        return domain;
    }
}
