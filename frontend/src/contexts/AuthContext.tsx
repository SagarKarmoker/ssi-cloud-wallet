import { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { authService } from '../services/authService';
import type { User, RegisterData, LoginData } from '../services/authService';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; user: User }
  | { type: 'AUTH_ERROR'; error: string }
  | { type: 'LOGOUT' }
  | { type: 'CLEAR_ERROR' };

// Helper functions for localStorage
const getUserFromStorage = (): User | null => {
  const userStr = localStorage.getItem('user');
  if (userStr) {
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }
  return null;
};

const saveUserToStorage = (user: User) => {
  localStorage.setItem('user', JSON.stringify(user));
};

const removeUserFromStorage = () => {
  localStorage.removeItem('user');
};

const initialState: AuthState = {
  user: getUserFromStorage(), // Load user from localStorage if available
  isAuthenticated: !!getUserFromStorage(), // Set authenticated if user exists in storage
  isLoading: false, // Start with false, set to true only when making API calls
  error: null,
};

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'AUTH_START':
      return { ...state, isLoading: true, error: null };
    case 'AUTH_SUCCESS':
      saveUserToStorage(action.user); // Save user to localStorage
      return {
        ...state,
        user: action.user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };
    case 'AUTH_ERROR':
      removeUserFromStorage(); // Remove user from localStorage on error
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.error,
      };
    case 'LOGOUT':
      removeUserFromStorage(); // Remove user from localStorage on logout
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    default:
      return state;
  }
}

interface AuthContextType extends AuthState {
  login: (data: LoginData) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  loadUser: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  const loadUser = useCallback(async () => {
    try {
      dispatch({ type: 'AUTH_START' });
      const user = await authService.getProfile();
      dispatch({ type: 'AUTH_SUCCESS', user });
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to load user';
      dispatch({ type: 'AUTH_ERROR', error: errorMessage });
      authService.logout(); // Clear invalid token
    }
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  useEffect(() => {
    // Check if user is already logged in on app start
    const token = authService.getToken();
    const storedUser = getUserFromStorage();
    
    if (token && storedUser) {
      // We have both token and user in storage - user is authenticated
      // Optionally, we could refresh user data in background, but for now just use stored data
      // This prevents logout on page reload if backend is temporarily unavailable
      if (!state.isAuthenticated) {
        dispatch({ type: 'AUTH_SUCCESS', user: storedUser });
      }
    } else if (token && !storedUser) {
      // We have token but no user data - try to fetch it
      loadUser();
    }
    // If no token, just keep the initial state (not authenticated, not loading)
  }, []); // Run only once on mount

  const login = async (data: LoginData) => {
    try {
      dispatch({ type: 'AUTH_START' });
      const response = await authService.login(data);
      dispatch({ type: 'AUTH_SUCCESS', user: response.user });
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Login failed';
      dispatch({ type: 'AUTH_ERROR', error: errorMessage });
      throw error;
    }
  };

  const register = async (data: RegisterData) => {
    try {
      dispatch({ type: 'AUTH_START' });
      const response = await authService.register(data);
      dispatch({ type: 'AUTH_SUCCESS', user: response.user });
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Registration failed';
      dispatch({ type: 'AUTH_ERROR', error: errorMessage });
      throw error;
    }
  };

  const logout = () => {
    authService.logout();
    dispatch({ type: 'LOGOUT' });
  };

  const contextValue: AuthContextType = {
    ...state,
    login,
    register,
    logout,
    loadUser,
    clearError,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}