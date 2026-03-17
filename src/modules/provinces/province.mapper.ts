import { Province, Ward } from './province.domain';
import { ProvinceEntity } from './entities/province.entity';
import { WardEntity } from './entities/ward.entity';

export class ProvinceMapper {
    static toDomain(raw: ProvinceEntity): Province {
        const domain = new Province();
        domain.id = raw.id;
        domain.name = raw.name;
        domain.code = raw.code;
        domain.divisionType = raw.divisionType;
        return domain;
    }
}

export class WardMapper {
    static toDomain(raw: WardEntity): Ward {
        const domain = new Ward();
        domain.id = raw.id;
        domain.name = raw.name;
        domain.code = raw.code;
        domain.divisionType = raw.divisionType;
        domain.provinceId = raw.provinceId;
        return domain;
    }
}
