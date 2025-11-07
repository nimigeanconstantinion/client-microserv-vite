//@ts-ignore
import Keycloak from "keycloak-js";


const keycloak = new Keycloak({
    url: `http://keycloak:8085/`,
    realm: "rsk",
    clientId: "react-client",
});

export const KeycloakService = {
    keycloak,

    init: async () => {
        try {
            const authenticated = await keycloak.init({
                onLoad: "check-sso",
                checkLoginIframe: false,
            });
            console.log("Keycloak initialized. Authenticated:", authenticated);
            return authenticated;
        } catch (err) {
            console.error("Failed to initialize Keycloak", err);
            return false;
        }
    },

    loginDirect: async (username: string, password: string): Promise<string | null> => {
        try {
            const params = new URLSearchParams();
            params.append("grant_type", "password");
            params.append("client_id", "react-client");
            params.append("username", username);
            params.append("password", password);

            const response = await fetch("http://localhost:8085/realms/rsk/protocol/openid-connect/token", {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: params,
            });

            if (!response.ok) {
                console.warn("Login failed with status", response.status);
                return null;
            }

            const data = await response.json();
            localStorage.setItem("kc_token", data.access_token);
            return data.access_token;
        } catch (error) {
            console.error("Login request failed:", error);
            return null;
        }
    },

    registerUser: async (username: string, password: string, email: string): Promise<boolean> => {
        try {
            // Token de admin (de obicei folosit doar în backend, dar pentru demo îl punem aici)
            const adminParams = new URLSearchParams();
            adminParams.append("client_id", "admin-cli");
            adminParams.append("grant_type", "password");
            adminParams.append("username", "admin");
            adminParams.append("password", "admin"); // pune parola reală de admin

            const adminTokenResp = await fetch("http://localhost:8085/realms/master/protocol/openid-connect/token", {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: adminParams,
            });

            if (!adminTokenResp.ok) {
                console.error("Failed to get admin token");
                return false;
            }

            const { access_token } = await adminTokenResp.json();

            // Creare utilizator nou
            const createResp = await fetch("http://localhost:8085/admin/realms/rsk/users", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${access_token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    username,
                    email,
                    enabled: true,
                    credentials: [{ type: "password", value: password, temporary: false }],
                }),
            });

            if (createResp.ok) {
                console.log("User created successfully");
                return true;
            } else {
                console.error("Failed to create user", await createResp.text());
                return false;
            }
        } catch (err) {
            console.error("Error registering user", err);
            return false;
        }
    },

    logout: async () => {
        localStorage.removeItem("kc_token");
        window.location.href =
            "http://localhost:8085/realms/rsk/protocol/openid-connect/logout?redirect_uri=http://localhost:5175/ui";
    },
};
