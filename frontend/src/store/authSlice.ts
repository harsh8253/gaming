import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { PublicUser } from '../types/api';
import { getStoredToken, setStoredToken } from '../api/client';

type AuthState = {
  token: string | null;
  user: PublicUser | null;
  bootstrapped: boolean;
};

const initialState: AuthState = {
  token: getStoredToken(),
  user: null,
  bootstrapped: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setSession(
      state,
      action: PayloadAction<{ token: string; user: PublicUser }>,
    ) {
      state.token = action.payload.token;
      state.user = action.payload.user;
      state.bootstrapped = true;
      setStoredToken(action.payload.token);
    },
    setUser(state, action: PayloadAction<PublicUser | null>) {
      state.user = action.payload;
      state.bootstrapped = true;
    },
    clearSession(state) {
      state.token = null;
      state.user = null;
      state.bootstrapped = true;
      setStoredToken(null);
    },
    markBootstrapped(state) {
      state.bootstrapped = true;
    },
  },
});

export const { setSession, setUser, clearSession, markBootstrapped } =
  authSlice.actions;
export default authSlice.reducer;
