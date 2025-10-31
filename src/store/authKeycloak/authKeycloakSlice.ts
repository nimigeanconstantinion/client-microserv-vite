import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UserInfo {
    preferred_username: string;
    email?: string;
    realm_access?: {
        roles: string[];
    };
    [key: string]: any;
}

interface AuthState {
    token: string | null;
    user: UserInfo | null;
    isAuthenticated: boolean;
}

const initialState: AuthState = {
    token: null,
    user: null,
    isAuthenticated: false,
};

const authKeycloakSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        loginSuccess: (state, action: PayloadAction<{ token: string; user: UserInfo }>) => {
            state.token = action.payload.token;
            state.user = action.payload.user;
            state.isAuthenticated = true;
        },
        logout: (state) => {
            state.token = null;
            state.user = null;
            state.isAuthenticated = false;
            localStorage.removeItem('token');
            localStorage.removeItem('user');
        },
        restoreSession: (state) => {
            const token = localStorage.getItem('token');
            const user = localStorage.getItem('user');
            if (token && user) {
                state.token = token;
                state.user = JSON.parse(user);
                state.isAuthenticated = true;
            }
        },
    },
});

export const { loginSuccess, logout, restoreSession } = authKeycloakSlice.actions;
export default authKeycloakSlice.reducer;
