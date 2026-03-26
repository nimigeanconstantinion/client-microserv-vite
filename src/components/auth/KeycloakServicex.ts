// import Keycloak, { Key?cloakProfile } from "keycloak-js";
import User from "../../models/User";
import Keycloak from "keycloak-js";
import type { KeycloakProfile } from "keycloak-js"; // Profile rămâne cu acolade dacă e tip

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
        console.log("URL"+import.meta.env.VITE_KEYCLOAK_URL)
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
                silentCheckSsoRedirectUri: window.location.origin + "/ui/silent-check-sso.html",
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

    forceLogoutAndRegister = (): void => {
        const realm = "rsk";
        const clientId = "react-client";

        // Calculăm URL-ul direct aici pentru a fi siguri că nu e undefined
        const currentOrigin = window.location.origin; // ex: http://localhost:3000
        const finalRedirect = currentOrigin + "/ui/";

        // Construim URL-ul de logout
        const logoutUrl = `${import.meta.env.VITE_KEYCLOAK_URL}/realms/${realm}/protocol/openid-connect/logout?client_id=${clientId}&post_logout_redirect_uri=${encodeURIComponent(finalRedirect)}`;

        console.log("Redirecting to:", logoutUrl); // Verifică în consolă dacă acum e corect!

        localStorage.removeItem("authState");
        this.initialized = false;

        window.location.href = logoutUrl;
    };

    /**
     * Metoda principală de înregistrare
     */
    register = async (): Promise<void> => {
        console.log("Stare înainte de orice:", this.initialized);

        // 1. DACĂ NU ESTE INIȚIALIZAT, ÎL INIȚIALIZĂM ACUM
        if (!this.initialized) {
            console.log("Keycloak nu e gata. Inițializez acum...");
            try {
                await this.init(); // Aceasta va seta this.initialized = true
            } catch (e) {
                console.error("Inițializarea a eșuat în interiorul register:", e);
                return;
            }
        }

        // 2. ACUM PUTEM VERIFICA DACĂ E AUTENTIFICAT
        if (this.keycloak.authenticated) {
            console.warn("Utilizator logat. Curățăm sesiunea...");
            // Folosim direct window.location pentru a evita alte erori de context
            const redirect = window.location.origin + "/ui/";
            await this.keycloak.logout({ redirectUri: redirect });
            return;
        }

        // 3. LANSARE FORMULAR (Acum this.keycloak.login VA EXISTA sigur)
        try {
            console.log("Lansăm formularul de înregistrare oficial...");
            const finalRedirectUri = window.location.origin + "/ui/";

            await this.keycloak.login({
                action: 'register',
                redirectUri: finalRedirectUri,
                prompt: 'login'
            });
        } catch (error) {
            console.error("Eroare la apelul login:", error);
        }
    }
}

// Export instanță globală
export const keycloakServicex = new KeycloakServicex();
