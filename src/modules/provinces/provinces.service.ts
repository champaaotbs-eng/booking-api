import { Injectable, NotFoundException } from '@nestjs/common';
import { ProvincesRepository } from './provinces.repository';
import { QueryDto } from '@/utils/types/query.dto';
import { FilterProvinceDto, FilterWardDto, SortProvinceDto, SortWardDto } from './dto/query-province.dto';
import { CreateProvinceDto, CreateWardDto, UpdateProvinceDto, UpdateWardDto } from './dto/create-province.dto';

@Injectable()
export class ProvincesService {
    constructor(private readonly provincesRepository: ProvincesRepository) { }

    findAllProvinces(query: QueryDto<FilterProvinceDto, SortProvinceDto>) {
        return this.provincesRepository.findManyProvinces({
            filterOptions: query.filters,
            sortOptions: query.sort,
            paginationOptions: { page: query.page || 1, limit: query.limit || 10 },
        });
    }

    async findOneProvince(id: string) {
        const province = await this.provincesRepository.findProvinceById(id);
        if (!province) throw new NotFoundException('province_not_found');
        return province;
    }

    createProvince(dto: CreateProvinceDto) {
        return this.provincesRepository.createProvince(dto);
    }

    async updateProvince(id: string, dto: UpdateProvinceDto) {
        await this.findOneProvince(id);
        return this.provincesRepository.updateProvince(id, dto);
    }

    async removeProvince(id: string) {
        await this.findOneProvince(id);
        return this.provincesRepository.removeProvince(id);
    }

    findAllWards(query: QueryDto<FilterWardDto, SortWardDto>) {
        return this.provincesRepository.findManyWards({
            filterOptions: query.filters,
            sortOptions: query.sort,
            paginationOptions: { page: query.page || 1, limit: query.limit || 10 },
        });
    }

    async findOneWard(id: string) {
        const ward = await this.provincesRepository.findWardById(id);
        if (!ward) throw new NotFoundException('ward_not_found');
        return ward;
    }

    createWard(dto: CreateWardDto) {
        return this.provincesRepository.createWard(dto);
    }

    async updateWard(id: string, dto: UpdateWardDto) {
        await this.findOneWard(id);
        return this.provincesRepository.updateWard(id, dto);
    }

    async removeWard(id: string) {
        await this.findOneWard(id);
        return this.provincesRepository.removeWard(id);
    }
}
