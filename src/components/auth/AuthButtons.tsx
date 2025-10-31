// src/components/AuthButtons.tsx
import React, { useEffect, useState } from 'react';
import { KeycloakService } from './KeycloakService';

const AuthButtons: React.FC = () => {
    const [authenticated, setAuthenticated] = useState(false);
    const [userInfo, setUserInfo] = useState<any>(null);

    useEffect(() => {
        // Inițializează Keycloak la mount
        KeycloakService.init().then((auth) => {
            setAuthenticated(auth);
            setUserInfo(KeycloakService.getUserInfo());
        });
    }, []);

    const handleLogin = async () => {
        await KeycloakService.login();
    };

    const handleRegister = async () => {
        await KeycloakService.register();
    };

    const handleLogout = () => {
        KeycloakService.logout();
    };

    return (
        <div className="flex flex-col items-center gap-4 p-6">
            {!authenticated ? (
                <>
                    <button
                        onClick={handleLogin}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                    >
                        Login
                    </button>

                    <button
                        onClick={handleRegister}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
                    >
                        Register
                    </button>
                </>
            ) : (
                <>
                    <div>
                        <p className="mb-2 font-semibold">User Info:</p>
                        <pre className="bg-gray-100 p-2 rounded">{JSON.stringify(userInfo, null, 2)}</pre>
                    </div>

                    <button
                        onClick={handleLogout}
                        className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
                    >
                        Logout
                    </button>
                </>
            )}
        </div>
    );
};

export default AuthButtons;
