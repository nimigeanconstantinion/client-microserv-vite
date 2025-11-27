
// @ts-ignore
import Keycloak, {type KeycloakProfile } from 'keycloak-js';


interface ImportMetaEnv {
    readonly VITE_APP_API_URL: string;
    readonly VITE_KEYCLOAK_URL: string;
}


export interface AuthState {
    isLoading: boolean;
    isAuthenticated: boolean;
    profile?: KeycloakProfile;
    token?: string;
    roles?: string[];
    error?: string;
}

export class KeycloakServices {

    keycloak = new Keycloak({
        url: `${import.meta.env.VITE_KEYCLOAK_URL}`,
        realm: "rsk",
        clientId: "react-client",
    });

    async init(): Promise<AuthState> {
        try {
            const authenticated = await this.keycloak.init({
                onLoad: "check-sso",
                pkceMethod: "S256",
            });

            if (!authenticated) {
                return {isLoading: false, isAuthenticated: false};
            }

            const profile = await this.keycloak.loadUserProfile();
            // Preluăm rolurile din tokenParsed
            const tokenParsed = this.keycloak.tokenParsed as any;
            const realmRoles: string[] = tokenParsed?.realm_access?.roles || [];
            const clientRoles: string[] = tokenParsed?.resource_access?.[this.keycloak.clientId!]?.roles || [];

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
            return {isLoading: false, isAuthenticated: false, error: "Init error"};
        }
    }

    login(username?: string) {
        this.keycloak.login({loginHint: username});
    }

    /** 🟢 REGISTER cu username precompletat */
    register(loginHint?: string) {
        this.keycloak.register({loginHint});
    }

    logout() {
        localStorage.removeItem("authState");
        this.keycloak.logout();
    }


    async loginDirect(username: string, password: string): Promise<AuthState> {
        try {
            const params = new URLSearchParams();
            params.append("grant_type", "password");
            params.append("client_id", this.keycloak.clientId!);
            // params.append("client_secret", import.meta.env.VITE_KEYCLOAK_SECRET);

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

            // 🟢 Decodăm manual JWT-ul
            const decode = (token: string) =>
                JSON.parse(atob(token.split(".")[1]));

            const tokenParsed = decode(data.access_token);
            const refreshParsed = data.refresh_token ? decode(data.refresh_token) : undefined;

            // 🟢 Setăm în keycloak-js toate valorile necesare
            this.keycloak.token = data.access_token;
            this.keycloak.tokenParsed = tokenParsed;
            this.keycloak.refreshToken = data.refresh_token;
            this.keycloak.refreshTokenParsed = refreshParsed;

            // 🟢 Preluăm profilul
            const profile = await this.keycloak.loadUserProfile();

            // 🟢 Extragem rolurile
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

        } catch (err) {
            return { isLoading: false, isAuthenticated: false, error: "Login error" };
        }
    }

    // getRoles(): string[] {
    //     const parsed = this.keycloak.tokenParsed;
    //     if (!parsed) return [];
    //
    //     const realm = parsed.realm_access?.roles || [];
    //     const client = parsed.resource_access?.[this.keycloak.clientId]?.roles || [];
    //
    //     return [...realm, ...client];
    // }
    // static async loginDirect(username: string, password: string) {
    //
    // }

}

export const keycloakServices = new KeycloakServices();
