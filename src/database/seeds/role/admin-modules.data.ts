export const ADMIN_MODULES = {
    DASHBOARD: 'dashboard',
    ADMIN: 'admin',
    ROLE: 'role',
    COMPANY: 'company',
    STATION: 'station',
    TRIP: 'trip',
    BOOKING: 'booking',
    REVENUE: 'revenue',
} as const;

export const ADMIN_MODULE_PERMISSION_SEEDS = Object.values(ADMIN_MODULES).map((module) => ({
    module,
    read: true,
    write: true,
    description: `Access for ${module}`,
}));
