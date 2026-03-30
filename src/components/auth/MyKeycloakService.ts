import Keycloak from "keycloak-js";
import type { KeycloakProfile } from "keycloak-js";

export interface AuthState {
    isLoading: boolean;
    isAuthenticated: boolean;
    profile?: KeycloakProfile;
    token?: string;
    roles?: string[];
}

export class MyKeycloakService {
    keycloak: Keycloak;
    initialized: boolean = false;
    // Adăugăm o promisiune pentru a gestiona cererile simultane de init
    private initPromise: Promise<AuthState> | null = null;

    constructor() {
        const url = import.meta.env.VITE_KEYCLOAK_URL;
        this.keycloak = new Keycloak({
            url: url,
            realm: "rsk",
            clientId: "react-client",
        });
    }

    async init(): Promise<AuthState> {
        // SOLUȚIE PENTRU EROAREA "initialized once":
        // Dacă deja se inițializează, returnăm promisiunea existentă
        if (this.initPromise) return this.initPromise;

        this.initPromise = (async () => {
            try {
                const authenticated = await this.keycloak.init({
                    onLoad: "check-sso",
                    pkceMethod: "S256",
                    // SOLUȚIE PENTRU EROAREA "Checking login iframe":
                    checkLoginIframe: false,
                    // Silent check sso necesită un fișier html în public,
                    // dacă nu îl ai, poți comenta linia de mai jos
                    // silentCheckSsoRedirectUri: window.location.origin + "/ui/silent-check-sso.html",
                });

                this.initialized = true;

                if (authenticated) {
                    const profile = await this.keycloak.loadUserProfile();
                    const state = this.getCurrentState(profile);

                    localStorage.setItem("authState", JSON.stringify({
                        username: profile.username,
                        roles: state.roles,
                        authenticated: true,
                        token: state.token,
                    }));

                    return state;
                }

                return { isLoading: false, isAuthenticated: false };
            } catch (error) {
                console.error("Keycloak init failure", error);
                return { isLoading: false, isAuthenticated: false };
            }
        })();

        return this.initPromise;
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
        // Folosim window.location.origin + "/ui/" ca să fim siguri că ne întoarcem unde trebuie
        await this.keycloak.login({
            redirectUri: window.location.origin + "/ui/",
            prompt: 'login'
        });
        console.log(this.keycloak.token);
    }

    async register(): Promise<void> {
        const redirectUri = window.location.origin + "/ui/";

        if (this.keycloak.authenticated) {
            await this.keycloak.logout({
                redirectUri: redirectUri + "?doAction=register"
            });
            return;
        }

        await this.keycloak.login({
            action: 'register',
            redirectUri: redirectUri,
            prompt: 'login'
        });
    }

    logout() {
        localStorage.removeItem("authState");
        this.keycloak.logout({ redirectUri: window.location.origin + "/ui/" });
    }
}

export const myKeycloakService = new MyKeycloakService();