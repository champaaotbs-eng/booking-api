export type AppConfig = {
    nodeEnv?: string;
    name: string;
    adminPortalDomain?: string;
    customerPortalDomain?: string;
    backendDomain: string;
    port: number;
    timeZone: string;
    cacheTTL: number;
};
