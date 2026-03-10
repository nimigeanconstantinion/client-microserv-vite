export interface KeycloakUser {
    username: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    enabled?: boolean;
    emailVerified?: boolean;
    attributes?: Record<string, string[]>;
    credentials?: Array<{
        type: string;
        value: string;
        temporary?: boolean;
    }>;
}
