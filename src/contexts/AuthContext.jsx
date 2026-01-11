import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [isGuestMode, setIsGuestMode] = useState(false);

  // Check for disclaimer acceptance on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hasAcceptedDisclaimer = localStorage.getItem("careerbot_disclaimer_accepted");
      if (!hasAcceptedDisclaimer) {
        setShowDisclaimer(true);
      }
    }
  }, []);

  // Check for authentication on mount (cookies are handled automatically)
  useEffect(() => {
    // Verify authentication status by calling /me endpoint
    fetch("/api/auth/me", {
      credentials: 'include', // Important for sending cookies
    })
      .then((res) => {
        const contentType = res.headers.get("content-type");
        if (res.ok && contentType && contentType.includes("application/json")) {
          return res.json();
        }
        throw new Error("Not authenticated");
      })
      .then((data) => {
        setUser(data.user);
      })
      .catch((error) => {
        console.error("Auth check error:", error);
        // User is not authenticated, clear any local state
        setUser(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const login = async (email, password) => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: 'include', // Important for receiving cookies
      body: JSON.stringify({ email, password }),
    });

    const contentType = res.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      throw new Error("Server error: Invalid response format");
    }

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Login failed");
    }

    setUser(data.user);
    return data;
  };

  const signup = async (email, password) => {
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: 'include', // Important for receiving cookies
      body: JSON.stringify({ email, password }),
    });

    const contentType = res.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      throw new Error("Server error: Invalid response format. Make sure the server is running.");
    }

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Signup failed");
    }

    setUser(data.user);
    return data;
  };

  const updateUser = async (userData) => {
    const headers = {};
    let body = userData;
    if (!(userData instanceof FormData)) {
      headers["Content-Type"] = "application/json";
      body = JSON.stringify(userData);
    }
    const res = await fetch("/api/auth/me", {
      method: "PUT",
      credentials: 'include', // Important for sending cookies
      headers,
      body,
    });

    const contentType = res.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      throw new Error("Server error: Invalid response format");
    }

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Update failed");
    }

    setUser(data.user);
    return data;
  };

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: 'include', // Important for sending cookies
      });
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setUser(null);
    }
  };

  const handleDisclaimerAccept = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem("careerbot_disclaimer_accepted", "true");
    }
    setShowDisclaimer(false);
  };

  const handleDisclaimerDecline = () => {
    if (typeof window !== 'undefined') {
      window.location.href = "about:blank";
    }
  };

  const enterGuestMode = () => {
    setIsGuestMode(true);
    setUser(null);
    setLoading(false);
  };

  const exitGuestMode = () => {
    setIsGuestMode(false);
  };

  const value = {
    user,
    loading,
    login,
    signup,
    updateUser,
    logout,
    isAuthenticated: !!user,
    isGuestMode,
    enterGuestMode,
    exitGuestMode,
    showDisclaimer,
    handleDisclaimerAccept,
    handleDisclaimerDecline,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}

