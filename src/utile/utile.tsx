import {AppConfig} from "../models/AppConfig";

interface ImportMetaEnv {
    readonly VITE_API_URL: string;
    readonly VITE_KEYCLOAK_URL: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}

export function loadConfig(): AppConfig {
    const apiUrl = import.meta.env.VITE_API_URL;
    const keycloakUrl=import.meta.env.VITE_KEYCLOAK_URL;
    return {
        VITE_API_URL: apiUrl,
        VITE_KEYCLOAK_URL: keycloakUrl,
    };
}