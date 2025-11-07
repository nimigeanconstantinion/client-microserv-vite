import {AppConfig} from "../models/AppConfig";

interface ImportMetaEnv {
    readonly VITE_APP_API_URL: string;
    readonly VITE_KEYCLOAK_API_URL: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}

export function loadConfig(): AppConfig {
    const apiUrl = import.meta.env.VITE_APP_API_URL;
    const keycloakUrl=import.meta.env.VITE_KEYCLOAK_SERVER_API_URL;
    return {
        VITE_APP_API_URL: apiUrl,
        VITE_KEYCLOAK_SERVER_API_URL: keycloakUrl,
    };
}