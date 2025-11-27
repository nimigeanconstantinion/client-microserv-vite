import Keycloak, { KeycloakProfile } from "keycloak-js";

export interface AuthState {
    isLoading: boolean;
    isAuthenticated: boolean;
    profile?: KeycloakProfile;
    token?: string;
    roles?: string[];
    error?: string;
}

export class KeycloakServicex {
    // Keycloak va fi inițializat în constructor sau ca proprietate
    keycloak: Keycloak;

    constructor() {
        // ❗ Asigură-te că ENV-ul VITE_KEYCLOAK_URL este încărcat corect
        if (!import.meta.env.VITE_KEYCLOAK_URL) {
            throw new Error("VITE_KEYCLOAK_URL is not defined in .env");
        }

        this.keycloak = new Keycloak({
            url: import.meta.env.VITE_KEYCLOAK_URL,
            realm: "rsk",
            clientId: "react-client", // direct string
        });
    }

    // Inițializare Keycloak
    async init(): Promise<AuthState> {
        try {
            const authenticated = await this.keycloak.init({
                onLoad: "check-sso",
                pkceMethod: "S256",
                // silentCheckSsoRedirectUri: window.location.origin + "/silent-check-sso.html",
            });

            if (!authenticated) {
                return { isLoading: false, isAuthenticated: false };
            }

            const profile = await this.keycloak.loadUserProfile();
            const tokenParsed = this.keycloak.tokenParsed as any;

            const realmRoles: string[] = tokenParsed?.realm_access?.roles || [];
            const clientRoles: string[] =
                tokenParsed?.resource_access?.[this.keycloak.clientId!]?.roles || [];

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

    // Login direct prin grant_type=password
    async loginDirect(username: string, password: string): Promise<AuthState> {
        try {
            const params = new URLSearchParams();
            params.append("grant_type", "password");
            params.append("client_id", "react-client"); // direct, nu this.keycloak.clientId
            params.append("scope", "openid email profile");
            params.append("username", username);
            params.append("password", password);

            console.log("URL:", `${import.meta.env.VITE_KEYCLOAK_URL}/realms/rsk/protocol/openid-connect/token`);
            console.log("Params:", params.toString());


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
            console.log(data)

            const decode = (token: string) => JSON.parse(atob(token.split(".")[1]));
            const tokenParsed = decode(data.access_token);
            console.log("hlkhlhlkhlhlhhlhl")
            console.log(tokenParsed)
            console.log("-----------------------------------------")

            const refreshParsed = data.refresh_token ? decode(data.refresh_token) : undefined;
            console.log(refreshParsed)

            // console.log("refreshParsed-----------------------------------------")

            // Setare manuală a token-urilor în keycloak-js
            this.keycloak.token = data.access_token;
            this.keycloak.tokenParsed = tokenParsed;
            this.keycloak.refreshToken = data.refresh_token;
            this.keycloak.refreshTokenParsed = refreshParsed;


            // const tokenParsed = this.keycloak.tokenParsed as any;

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

            // console.log("Profile built from token:", profile);
            // const profile = await this.keycloak.loadUserProfile();


            // console.log("======-----------------------------------------")

            // console.log(profile);
            // console.log("---------------========-----------------------------------")
            const realmRoles = tokenParsed?.realm_access?.roles || [];
            const clientRoles =
                tokenParsed?.resource_access?.[this.keycloak.clientId!]?.roles || [];

            const state: AuthState = {
                isLoading: false,
                isAuthenticated: true,
                profile,
                token: data.access_token,
                roles: [...realmRoles, ...clientRoles],
            };

            localStorage.setItem("authState", JSON.stringify(state));
            console.log(state);
            return state;
        } catch (err) {
            return { isLoading: false, isAuthenticated: false, error: "Login error"+err };
        }
    }
}

// Exportăm o singură instanță globală
export const keycloakServicex = new KeycloakServicex();
