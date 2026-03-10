import Keycloak, { KeycloakProfile } from "keycloak-js";
import User from "../../models/User";

export interface AuthState {
    isLoading: boolean;
    isAuthenticated: boolean;
    profile?: KeycloakProfile;
    token?: string;
    roles?: string[];
    error?: string;
}

export class KeycloakServicex {
    keycloak: Keycloak;
    initialized: boolean = false;

    constructor() {
        if (!import.meta.env.VITE_KEYCLOAK_URL) {
            throw new Error("VITE_KEYCLOAK_URL is not defined in .env");
        }

        this.keycloak = new Keycloak({
            url: import.meta.env.VITE_KEYCLOAK_URL,
            realm: "rsk",
            clientId: "react-client",
        });
    }

    // Inițializare Keycloak
    async init(): Promise<AuthState> {
        if (this.initialized) {
            const tokenParsed = this.keycloak.tokenParsed as any;
            return {
                isLoading: false,
                isAuthenticated: !!this.keycloak.authenticated,
                profile: tokenParsed ? { username: tokenParsed.preferred_username } as KeycloakProfile : undefined,
                token: this.keycloak.token,
                roles: tokenParsed?.realm_access?.roles || [],
            };
        }

        try {
            const authenticated = await this.keycloak.init({
                onLoad: "check-sso",
                pkceMethod: "S256",
            });

            this.initialized = true;

            if (!authenticated) {
                return { isLoading: false, isAuthenticated: false };
            }

            const profile = await this.keycloak.loadUserProfile();
            const tokenParsed = this.keycloak.tokenParsed as any;
            const realmRoles = tokenParsed?.realm_access?.roles || [];
            const clientRoles = tokenParsed?.resource_access?.[this.keycloak.clientId!]?.roles || [];

            const state: AuthState = {
                isLoading: false,
                isAuthenticated: true,
                profile,
                token: this.keycloak.token,
                roles: [...realmRoles, ...clientRoles],
            };

            localStorage.setItem("authState", JSON.stringify(state));
            return state;
        } catch (err) {
            return { isLoading: false, isAuthenticated: false, error: "Init error" };
        }
    }

    // Login direct cu grant_type=password
    async loginDirect(username: string, password: string): Promise<AuthState> {
        try {
            const params = new URLSearchParams();
            params.append("grant_type", "password");
            params.append("client_id", "react-client");
            params.append("scope", "openid email profile");
            params.append("username", username);
            params.append("password", password);

            const response = await fetch(
                `${import.meta.env.VITE_KEYCLOAK_URL}/realms/rsk/protocol/openid-connect/token`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/x-www-form-urlencoded" },
                    body: params,
                }
            );

            if (!response.ok) {
                return { isLoading: false, isAuthenticated: false, error: "Login failed" };
            }

            const data = await response.json();
            const decode = (token: string) => JSON.parse(atob(token.split(".")[1]));
            const tokenParsed = decode(data.access_token);
            const refreshParsed = data.refresh_token ? decode(data.refresh_token) : undefined;

            // Setare manuală token-uri în KeycloakJS
            this.keycloak.token = data.access_token;
            this.keycloak.tokenParsed = tokenParsed;
            this.keycloak.refreshToken = data.refresh_token;
            this.keycloak.refreshTokenParsed = refreshParsed;

            const profile = {
                username: tokenParsed.preferred_username,
                email: tokenParsed.email,
                firstName: tokenParsed.given_name,
                lastName: tokenParsed.family_name,
                roles: [
                    ...(tokenParsed.realm_access?.roles || []),
                    ...(tokenParsed.resource_access?.[this.keycloak.clientId!]?.roles || [])
                ]
            };
            const realmRoles = tokenParsed?.realm_access?.roles || [];
            const clientRoles = tokenParsed?.resource_access?.[this.keycloak.clientId!]?.roles || [];

            const state: AuthState = {
                isLoading: false,
                isAuthenticated: true,
                profile,
                token: data.access_token,
                roles: [...realmRoles, ...clientRoles],
            };

            localStorage.setItem("authState", JSON.stringify(state));
            return state;
        } catch (err: any) {
            return { isLoading: false, isAuthenticated: false, error: "Login error: " + err.message };
        }
    }

    // Redirect către pagina de register Keycloak
    registerWithRedirect(username:string,email:string): void {
        if (!this.initialized) {
            console.error("Keycloak must be initialized before register");
            return;
        }

        if (this.keycloak.authenticated) {
            // Logout și redirect către homepage
            this.keycloak.logout({ redirectUri: window.location.origin });
            return;
        }

        const redirectUri = "http://localhost:3000/ui";


        // Redirect către pagina de register
        this.keycloak.login({
            action: "register",
            redirectUri,
            // @ts-ignore

            extraQueryParams: {
                username,
                email
            }

        });
    }
}

// Export instanță globală
export const keycloakServicex = new KeycloakServicex();
