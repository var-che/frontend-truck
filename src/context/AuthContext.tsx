import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

const EXTENSION_ID =
  process.env.REACT_APP_EXTENSION_ID || "dglpcheabojkebkoninofbpgnilkaeek";

const NETLIFY_BASE =
  process.env.REACT_APP_NETLIFY_URL || "https://truckaroosie-dev.netlify.app";

export interface AuthState {
  gmailToken: string | null;
  userEmail: string | null;
  userName: string | null;
  trialDaysLeft: number;
  emailsRemaining: number;
  canSendEmail: boolean;
  subscriptionStatus: string;
  isAuthenticated: boolean;
  loading: boolean;
}

export interface AuthContextValue extends AuthState {
  refreshStatus: () => Promise<void>;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const INITIAL_STATE: AuthState = {
  gmailToken: null,
  userEmail: null,
  userName: null,
  trialDaysLeft: 14,
  emailsRemaining: 50,
  canSendEmail: true,
  subscriptionStatus: "trial",
  isAuthenticated: false,
  loading: true,
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [state, setState] = useState<AuthState>(INITIAL_STATE);
  const retryTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const tokenRef = useRef<string | null>(null);

  const fetchStatus = useCallback(async (token: string) => {
    try {
      const res = await fetch(
        `${NETLIFY_BASE}/.netlify/functions/get-user-status`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ gmailToken: token }),
        }
      );
      if (!res.ok) {
        setState((s) => ({ ...s, loading: false, isAuthenticated: false }));
        return;
      }
      const data = await res.json();
      setState({
        gmailToken: token,
        userEmail: data.email || null,
        userName: data.name || null,
        trialDaysLeft: data.trialDaysLeft ?? 14,
        emailsRemaining: data.emailsRemaining ?? 50,
        canSendEmail: data.canSendEmail ?? true,
        subscriptionStatus: data.subscriptionStatus || "trial",
        isAuthenticated: true,
        loading: false,
      });
    } catch {
      setState((s) => ({ ...s, loading: false, isAuthenticated: false }));
    }
  }, []);

  const tryGetToken = useCallback(() => {
    if (
      typeof chrome === "undefined" ||
      !chrome.runtime?.sendMessage
    ) {
      // Not in extension context — stop loading so UI shows "Not connected"
      setState((s) => ({ ...s, loading: false }));
      return;
    }
    chrome.runtime.sendMessage(
      EXTENSION_ID,
      { type: "GMAIL_GET_TOKEN", interactive: false },
      (response) => {
        if (chrome.runtime.lastError) {
          // Extension not reachable — stop loading
          setState((s) => ({ ...s, loading: false }));
          return;
        }
        if (response?.token) {
          tokenRef.current = response.token;
          if (retryTimerRef.current) {
            clearInterval(retryTimerRef.current);
            retryTimerRef.current = null;
          }
          fetchStatus(response.token);
        } else {
          // Extension reachable but no cached token — stop loading
          setState((s) => ({ ...s, loading: false }));
        }
      }
    );
  }, [fetchStatus]);

  useEffect(() => {
    // Try immediately on mount
    tryGetToken();

    // Retry every 15 s until the extension provides a token
    retryTimerRef.current = setInterval(() => {
      if (!tokenRef.current) {
        tryGetToken();
      } else {
        if (retryTimerRef.current) clearInterval(retryTimerRef.current);
      }
    }, 15_000);

    return () => {
      if (retryTimerRef.current) clearInterval(retryTimerRef.current);
    };
  }, [tryGetToken]);

  /** Re-fetch trial status with the stored token — call after a successful send */
  const refreshStatus = useCallback(async () => {
    if (tokenRef.current) {
      await fetchStatus(tokenRef.current);
    }
  }, [fetchStatus]);

  /** Trigger interactive OAuth popup to connect Gmail */
  const connect = useCallback(async () => {
    if (typeof chrome === "undefined" || !chrome.runtime?.sendMessage) return;
    setState((s) => ({ ...s, loading: true }));
    await new Promise<void>((resolve) => {
      chrome.runtime.sendMessage(
        EXTENSION_ID,
        { type: "GMAIL_GET_TOKEN", interactive: true },
        (response) => {
          if (chrome.runtime.lastError || !response?.token) {
            setState((s) => ({ ...s, loading: false }));
            resolve();
            return;
          }
          tokenRef.current = response.token;
          if (retryTimerRef.current) {
            clearInterval(retryTimerRef.current);
            retryTimerRef.current = null;
          }
          fetchStatus(response.token).then(resolve);
        }
      );
    });
  }, [fetchStatus]);

  /** Disconnect Gmail — revoke token and clear state */
  const disconnect = useCallback(async () => {
    const token = tokenRef.current;
    tokenRef.current = null;
    setState({ ...INITIAL_STATE, loading: false });
    if (!token || typeof chrome === "undefined" || !chrome.runtime?.sendMessage) return;
    chrome.runtime.sendMessage(EXTENSION_ID, { type: "GMAIL_REMOVE_TOKEN", token }, () => {});
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, refreshStatus, connect, disconnect }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside <AuthProvider>");
  }
  return ctx;
}
