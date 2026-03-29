import Keycloak from "keycloak-js";
import type { KeycloakProfile } from "keycloak-js";

export interface AuthState {
    isLoading: boolean;
    isAuthenticated: boolean;
    profile?: KeycloakProfile;
    token?: string;
    roles?: string[];
}

// Am redenumit clasa pentru a se potrivi cu numele fișierului
export class MyKeycloakService {
    keycloak: Keycloak;
    initialized: boolean = false;

    constructor() {
        const url = import.meta.env.VITE_KEYCLOAK_URL;
        this.keycloak = new Keycloak({
            url: url,
            realm: "rsk",
            clientId: "react-client",
        });
    }

    async init(): Promise<AuthState> {
        const authenticated = await this.keycloak.init({ /* setările tale */ });

        if (authenticated) {
            const profile = await this.keycloak.loadUserProfile();
            const state = this.getCurrentState(profile);

            // AICI SALVEZI MANUAL
            localStorage.setItem("authState", JSON.stringify({
                username: profile.username,
                roles: state.roles,
                authenticated: true,
                token: state.token,
            }));

            return state;
        }
        return { isLoading: false, isAuthenticated: false };
    }
    private getCurrentState(profile?: KeycloakProfile): AuthState {
        const tokenParsed = this.keycloak.tokenParsed as any;
        return {
            isLoading: false,
            isAuthenticated: !!this.keycloak.authenticated,
            profile: profile || undefined,
            token: this.keycloak.token,
            roles: [
                ...(tokenParsed?.realm_access?.roles || []),
                ...(tokenParsed?.resource_access?.[this.keycloak.clientId!]?.roles || [])
            ],
        };
    }

    async login() {
        await this.keycloak.login({
            redirectUri: window.location.origin ,
            prompt: 'login'
        });
    }

    async register(): Promise<void> {
        const redirectUri = window.location.origin ;

        // 1. Dacă Keycloak detectează că ești deja logat în aplicație
        if (this.keycloak.authenticated) {
            console.log("Sesiune activă detectată. Forțăm logout înainte de register...");

            // Trimitem userul la logout, dar adăugăm un parametru în URL pentru revenire
            await this.keycloak.logout({
                redirectUri: redirectUri + "?doAction=register"
            });
            return;
        }

        // 2. Dacă nu ești logat, mergem direct la Register
        await this.keycloak.login({
            action: 'register',
            redirectUri: redirectUri,
            // 'login' forțează Keycloak să ignore orice sesiune "uitată" în cookies
            prompt: 'login'
        });
    }

    logout() {
        this.keycloak.logout({ redirectUri: window.location.origin + "/ui/" });
    }
}

// ACEASTA ESTE LINIA CRITICĂ: Exportăm instanța cu numele cerut de App.tsx
export const myKeycloakService = new MyKeycloakService();