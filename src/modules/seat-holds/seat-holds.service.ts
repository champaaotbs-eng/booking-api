import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Observable, Subject, filter, map, startWith } from 'rxjs';
import { ConfigService } from '@nestjs/config';
import { AllConfigType } from '@/config/config.type';

type SeatHold = {
    tripId: string;
    seatId: string;
    holderId: string;
    expiresAt: number;
};

type SeatHoldEvent = {
    tripId: string;
    type: 'snapshot' | 'held' | 'released';
    seatIds: string[];
    holderId?: string;
    expiresAt?: number;
};

@Injectable()
export class SeatHoldsService {
    private readonly events = new Subject<SeatHoldEvent>();
    private readonly mutexes = new Map<string, Promise<void>>();

    constructor(
        @Inject(CACHE_MANAGER) private readonly cache: Cache,
        private readonly configService: ConfigService<AllConfigType>,
    ) { }

    private get holdTtlMs() {
        const minutes = this.configService.get('app.bookingPaymentHoldMinutes', { infer: true }) ?? 10;
        return minutes * 60 * 1000;
    }

    private holdKey(tripId: string, seatId: string) {
        return `seat-hold:${tripId}:${seatId}`;
    }

    private tripIndexKey(tripId: string) {
        return `seat-hold-index:${tripId}`;
    }

    private async withTripMutex<T>(tripId: string, callback: () => Promise<T>): Promise<T> {
        const previous = this.mutexes.get(tripId) ?? Promise.resolve();
        let release!: () => void;
        const current = new Promise<void>((resolve) => {
            release = resolve;
        });

        this.mutexes.set(tripId, previous.then(() => current));
        await previous;

        try {
            return await callback();
        } finally {
            release();
            if (this.mutexes.get(tripId) === current) {
                this.mutexes.delete(tripId);
            }
        }
    }

    private async getTripSeatIds(tripId: string): Promise<string[]> {
        return (await this.cache.get<string[]>(this.tripIndexKey(tripId))) ?? [];
    }

    private async setTripSeatIds(tripId: string, seatIds: string[]) {
        await this.cache.set(this.tripIndexKey(tripId), [...new Set(seatIds)], this.holdTtlMs);
    }

    private async getActiveHold(tripId: string, seatId: string): Promise<SeatHold | null> {
        const hold = await this.cache.get<SeatHold>(this.holdKey(tripId, seatId));
        if (!hold) return null;

        if (hold.expiresAt <= Date.now()) {
            await this.cache.del(this.holdKey(tripId, seatId));
            return null;
        }

        return hold;
    }

    async getHeldSeatIds(tripId: string, holderId?: string): Promise<string[]> {
        const seatIds = await this.getTripSeatIds(tripId);
        const activeSeatIds: string[] = [];

        for (const seatId of seatIds) {
            const hold = await this.getActiveHold(tripId, seatId);
            if (hold && hold.holderId !== holderId) {
                activeSeatIds.push(seatId);
            }
        }

        return activeSeatIds;
    }

    async holdSeats(tripId: string, seatIds: string[], holderId: string) {
        const uniqueSeatIds = [...new Set(seatIds)];
        if (!uniqueSeatIds.length) {
            return { heldSeatIds: [], expiresAt: Date.now() };
        }

        return this.withTripMutex(tripId, async () => {
            const conflictingSeatIds: string[] = [];

            for (const seatId of uniqueSeatIds) {
                const current = await this.getActiveHold(tripId, seatId);
                if (current && current.holderId !== holderId) {
                    conflictingSeatIds.push(seatId);
                }
            }

            if (conflictingSeatIds.length) {
                throw new BadRequestException({
                    message: 'seats_temporarily_held',
                    seatIds: conflictingSeatIds,
                });
            }

            const holdTtlMs = this.holdTtlMs;
            const expiresAt = Date.now() + holdTtlMs;
            for (const seatId of uniqueSeatIds) {
                await this.cache.set(this.holdKey(tripId, seatId), {
                    tripId,
                    seatId,
                    holderId,
                    expiresAt,
                }, holdTtlMs);
            }

            const indexedSeatIds = await this.getTripSeatIds(tripId);
            await this.setTripSeatIds(tripId, [...indexedSeatIds, ...uniqueSeatIds]);

            this.events.next({
                tripId,
                type: 'held',
                seatIds: uniqueSeatIds,
                holderId,
                expiresAt,
            });

            return { heldSeatIds: uniqueSeatIds, expiresAt };
        });
    }

    async releaseSeats(tripId: string, seatIds: string[], holderId?: string) {
        const uniqueSeatIds = [...new Set(seatIds)];
        if (!uniqueSeatIds.length) {
            return { releasedSeatIds: [] };
        }

        return this.withTripMutex(tripId, async () => {
            const releasedSeatIds: string[] = [];

            for (const seatId of uniqueSeatIds) {
                const current = await this.getActiveHold(tripId, seatId);
                if (!current) continue;
                if (holderId && current.holderId !== holderId) continue;

                await this.cache.del(this.holdKey(tripId, seatId));
                releasedSeatIds.push(seatId);
            }

            if (releasedSeatIds.length) {
                const indexedSeatIds = await this.getTripSeatIds(tripId);
                await this.setTripSeatIds(
                    tripId,
                    indexedSeatIds.filter((seatId) => !releasedSeatIds.includes(seatId)),
                );

                this.events.next({
                    tripId,
                    type: 'released',
                    seatIds: releasedSeatIds,
                    holderId,
                });
            }

            return { releasedSeatIds };
        });
    }

    async assertSeatsNotHeldByOther(tripId: string, seatIds: string[], holderId?: string) {
        const heldSeatIds = await this.getHeldSeatIds(tripId, holderId);
        const conflictingSeatIds = seatIds.filter((seatId) => heldSeatIds.includes(seatId));
        if (conflictingSeatIds.length) {
            throw new BadRequestException({
                message: 'seats_temporarily_held',
                seatIds: conflictingSeatIds,
            });
        }
    }

    eventsForTrip(tripId: string): Observable<{ data: SeatHoldEvent }> {
        return this.events.asObservable().pipe(
            filter((event) => event.tripId === tripId),
            map((event) => ({ data: event })),
            startWith({
                data: {
                    tripId,
                    type: 'snapshot',
                    seatIds: [],
                } satisfies SeatHoldEvent,
            }),
        );
    }
}
