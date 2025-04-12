import { createContext, useContext, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getFingerprint } from "../services/getUserCode";
import { API_BASE_URL } from "../components/App";

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
      console.log("TEST")

      if (data.authorized) {
        console.log("GOOOD")
        const userDetails = {
          user_id: data.user_details.user_id,
          email: data.user_details.email,
          name: data.user_details.username,
          role: data.user_details.role,
          profile_pic: data.user_details.profile_pic,
        };

        setUser_id(userDetails.user_id);
        setEmail(userDetails.email);
        setName(userDetails.name);
        setRole(userDetails.role);
        setProfile_pic(userDetails.profile_pic);
        setAuthed(true);

        console.log("User details: ", name);

        saveUserToStorage(userDetails); // 🔥 Save to local storage
        return true;
      } else if (data.status === "pending") {
        return {
          status: data.request_details.status,
          username: data.request_details.username,
          email: data.request_details.email,
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
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Create a new user
  const createUser = async (userEmail, userName, isOrganiser, event_id, profileNum = 0, autoSignIn = true) => {
    console.log("Creaint user profile num ", profileNum);

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
        }),
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
    navigate(`/event/${event_id}/login`);
  };

  return (
    <AuthContext.Provider value={{
      user_id, LogIn, createUser, signOut, authed, email, name, fingerprint, loading, error, role, profile_pic
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
