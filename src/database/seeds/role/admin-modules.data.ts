export const ADMIN_MODULES = {
    DASHBOARD: 'dashboard',
    USER: 'user',
    ROLE: 'role',
    COMPANY: 'company',
    ROUTE: 'route',
    LOCATION: 'location',
    BOOKING: 'booking',
    REPORT: 'report',
    REVENUE: 'revenue',
} as const;

export const ADMIN_MODULE_PERMISSION_SEEDS = Object.values(ADMIN_MODULES).map((module) => ({
    module,
    read: true,
    write: true,
    description: `Access for ${module}`,
}));
