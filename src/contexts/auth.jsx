import { createContext, useContext, useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getFingerprint } from "../services/getUserCode";
import { API_BASE_URL } from "../components/App";
import { useNotification } from "./notification";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user_id, setUser_id] = useState(null);
  const {event_id} = useParams();
  const [profile_pic, setProfile_pic] = useState(null);
  const [email, setEmail] = useState(null);
  const [name, setName] = useState(null);
  const [role, setRole] = useState(null);
  const [fingerprint, setFingerprint] = useState(null);
  const [authed, setAuthed] = useState(false);
  const [loading, setLoading] = useState(true);  // Add loading state for authentication
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const {notify} = useNotification();
  const intervalRef = useRef(null);

  const ReLogIn = async (eventId) => {
    const storedUser = JSON.parse(localStorage.getItem("user"));

    if (storedUser && eventId) {
      let result = LogIn(storedUser.email, eventId);
      return result;
    }
  }

  const startTokenExpiryInterval = () => {
    const token = sessionStorage.getItem("token");
  
    if (!token) {
      return;
    }
  
    if (intervalRef.current) {
      return;
    }
  
    const checkTokenExpiry = () => {
      const token = sessionStorage.getItem("token");
      const expiresAt = sessionStorage.getItem("expires_at");
  
      if (token && expiresAt) {
        const now = Date.now();
        if (now >= Number(expiresAt)) {
          console.log("🔒 Token expired. Signing out...");
          stopTokenExpiryInterval(); // stop FIRST
          notify("Session expired. Please log in again.", 5000);
          signOut(event_id);
        }
      }
    };
  
    checkTokenExpiry();
  
    intervalRef.current = setInterval(() => {
      checkTokenExpiry();
    }, 60 * 1000); 
  };
  

  useEffect(() => {
    return () => {
      stopTokenExpiryInterval();
    };
  }, [event_id]);
  

  const stopTokenExpiryInterval = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };
  
  
  // 🔹 Load user data from local storage
  useEffect(() => {    

    // Fetch fingerprint
    const fetchFingerprint = async () => {
      const print = await getFingerprint();
      setFingerprint(print);
    };
    fetchFingerprint();

    setLoading(false);
  }, [event_id]);  

  // 🔹 Save user data to local storage
  const saveUserToStorage = (user) => {
    localStorage.setItem("user", JSON.stringify(user));
  };

  // 🔹 Log in method
  const LogIn = async (userEmail, eventId) => {

    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/users/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: userEmail,
          fingerprint: fingerprint || getFingerprint(),
          event_id: eventId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Login failed");
      }

      const data = await response.json();

      if (data.authorized) {
        const userDetails = {
          user_id: data.user_details.user_id,
          email: data.user_details.email,
          name: data.user_details.username,
          role: data.user_details.role,
          profile_pic: data.user_details.profile_pic,
        };

        sessionStorage.setItem("token", data.token);
        sessionStorage.setItem("expires_at", Date.now() + 60 * 60 * 1000);

        setUser_id(userDetails.user_id);
        setEmail(userDetails.email);
        setName(userDetails.name);
        setRole(userDetails.role);
        setProfile_pic(userDetails.profile_pic);
        setAuthed(true);

        saveUserToStorage(userDetails); // 🔥 Save to local storage
        startTokenExpiryInterval();
        return true;
      } else if (data.status === "pending" || data.status === "rejected") {
        return {
          status: data.request_details.status,
          username: data.request_details.username,
          email: data.request_details.email,
          profile_pic: data.request_details.profile_pic,
          promptShowSubmitted: true,
        };
      } else {
        return {
          email: data.email,
          promptUsername: true,
          message: data.message,
        };
      }
    } catch (error) {
      setError(error.message);
      console.error("Login error:", error);
      notify("Failed to log in. Please try again.", 5000); // Show notification on error
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Create a new user
  const createUser = async (userEmail, userName, isOrganiser, event_id, profileNum = 0, autoSignIn = true) => {

    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/users/create-user`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: userEmail,
          name: userName,
          fingerprint: fingerprint,
          role: isOrganiser ? "organiser" : "attendee",
          event_id: event_id || null,
          profileNum: profileNum || 0,
        })
      });

      if (!response.ok) {
        throw new Error("User creation failed");
      }

      const data = await response.json();

      if (autoSignIn) {
        const newUser = {
          user_id: data.user_id,
          email: data.email,
          name: data.username,
          role: data.role,
        };

        setUser_id(newUser.user_id);
        setEmail(newUser.email);
        setName(newUser.name);
        setRole(newUser.role);
        setProfile_pic(profileNum);
        setAuthed(true);
        saveUserToStorage(newUser);
      }

      return data.user_id;
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Sign out
  const signOut = (event_id) => {
    setUser_id(null);
    setEmail(null);
    setName(null);
    setRole(null);
    setAuthed(false);
    setProfile_pic(null);
    localStorage.removeItem("user"); // 🔥 Clear local storage
    localStorage.removeItem("token"); // 🔥 Clear local storage
    stopTokenExpiryInterval();
    navigate(`/event/${event_id}/login`);
  };

  return (
    <AuthContext.Provider value={{
      user_id, LogIn, createUser, signOut, authed, email, name, fingerprint, loading, error, role, profile_pic, ReLogIn
    }}>
      {children}
    </AuthContext.Provider>
  );
};

// 🔹 Custom Hook to use Auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
