import { useEffect } from 'react';
import { api, ApiError } from '../api/client';
import {
  clearSession,
  markBootstrapped,
  setUser,
} from '../store/authSlice';
import { useAppDispatch, useAppSelector } from '../store';

export function useAuthBootstrap() {
  const dispatch = useAppDispatch();
  const token = useAppSelector((state) => state.auth.token);
  const bootstrapped = useAppSelector((state) => state.auth.bootstrapped);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!token) {
        dispatch(markBootstrapped());
        return;
      }
      try {
        const user = await api.me(token);
        if (!cancelled) {
          dispatch(setUser(user));
        }
      } catch (error) {
        if (!cancelled) {
          if (error instanceof ApiError && error.status === 401) {
            dispatch(clearSession());
          } else {
            dispatch(markBootstrapped());
          }
        }
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [dispatch, token]);

  return bootstrapped;
}
