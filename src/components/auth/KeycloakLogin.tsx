// src/components/KeycloakLogin.tsx
import React, { useState } from 'react';
import { KeycloakService, initKeycloak } from './KeycloakService';

const KeycloakLogin: React.FC = () => {
    const [authenticated, setAuthenticated] = useState<boolean>(false);

    const handleLogin = async () => {

        const initialized = await initKeycloak();
        alert(authenticated);
        if (initialized && !KeycloakService.isAuthenticated()) {
            await KeycloakService.login();
        } else if (KeycloakService.isAuthenticated()) {
            setAuthenticated(true);
        }
    };

    const handleLogout = async () => {
        await KeycloakService.logout();
        setAuthenticated(false);
    };

    return (
        <div className="flex flex-col items-center justify-center p-6">
            {!authenticated ? (
                <button
                    onClick={handleLogin}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow-md hover:bg-blue-700 transition"
                >
                    Login cu Keycloak
                </button>
            ) : (
                <button
                    onClick={handleLogout}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg shadow-md hover:bg-red-700 transition"
                >
                    Logout
                </button>
            )}
        </div>
    );
};

export default KeycloakLogin;
