import { useEffect, useState } from "react";
import { useAuth } from "../contexts/auth";
import { useParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../components/App";
import { useHistory } from "../contexts/history";
import "../styles/login.css";
import ProfileSelector from "../components/ProfileSelector";
import PageError from "../components/PageError";
import { Profiles } from "../components/ProfileSelector";
import { useTheme } from "../contexts/theme";
import { useNotification } from "../contexts/notification";
import { useRef } from "react";

const MAX_WAIT_TIME = 1000; // Maximum wait time in milliseconds (e.g., 5000 ms = 5 seconds)
const POLL_INTERVAL = 100;  // Time interval to check (e.g., 100 ms)

const Login = () => {
    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [loginEmail, setLoginEmail] = useState("");
    const [loginError, setLoginError] = useState(null);
    const [loginStep, setLoginStep] = useState("login");
    const [requestData, setRequestData] = useState();
    const { updateEventPage } = useHistory();
    const [profileNum, setProfileNum] = useState(0);
    const { theme } = useTheme();
    const {notify, setNotifyLoad} = useNotification();
    const event_id = useParams().event_id;
    const { fingerprint: userFingerprint, LogIn, authed } = useAuth();
    const navigate = useNavigate();


    const fingerprintRef = useRef(userFingerprint);
    
    useEffect(() => {
        fingerprintRef.current = userFingerprint;
      }, [userFingerprint]);

      useEffect(() => {
        
        const handleAuthInit = async () => {
            
          const storedUser = JSON.parse(localStorage.getItem("user"));
          if (storedUser && event_id) {
            console.log("Trying local session auto sign in ", storedUser.email);
            await LogIn(storedUser.email, event_id); // ⬅️ optionally await if you want to wait before redirect
          }
      
          if (!event_id || event_id === "undefined") {
            console.log("event_id is undefined. Redirecting to home.");
            navigate(`/`);
            return;
          } else {
            console.log("Event ID is defined:", event_id);
          }
      
          if (authed && event_id) {
            console.log(location.pathname);
            console.log("GOING TO HOME PAGE FROM LOGIN");
            navigate(`/event/${event_id}`);
          }
          const startTime = Date.now();
          while (!fingerprintRef.current && !authed) {
            console.log("Waiting for fingerprint...");
            
            // Wait for the poll interval before checking again
            await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL));
          
            // Check if the maximum wait time has been exceeded
            if (Date.now() - startTime > MAX_WAIT_TIME) {
              console.log("Max wait time reached. Exiting fingerprint wait.");
              break; // Exit the loop after the max wait time
            }
          }
      
          fetchEventData();
          setAutoLogInEmail();
        };
      
        handleAuthInit();
      }, [event_id, authed, navigate, userFingerprint]);
      

    const setAutoLogInEmail = () => {

        if (userFingerprint && event_id) {
            // Make API call to auto-sign-in endpoint using fetch
            setNotifyLoad(true);
            console.log("Auto sign-in with fingerprint:", userFingerprint);
            fetch(`${API_BASE_URL}/users/auto-sign-in`, {
                method: 'POST', // Using POST method for sending data
                headers: {
                    'Content-Type': 'application/json', // Set content type to JSON
                },
                body: JSON.stringify({
                    event_id, // Pass the event_id
                    fingerprint: userFingerprint, // Pass the userFingerprint
                }),
            })
                .then((response) => response.json()) // Parse the response as JSON
                .then((data) => {
                    if (data.success) {
                        console.log(`Auto sign-in successful for: ${data.email}`);
                        // Handle the successful sign-in (e.g., redirect, set logged-in state)
                        setLoginEmail(data.email);
                        setNotifyLoad(false);
                    } else {
                        setNotifyLoad(false);
                        console.log('Fingerprint did not match any attendee or organiser');
                    }
                })
                .catch((error) => {
                    setNotifyLoad(false);
                    console.error('Error during auto sign-in:', error);
            });
        }
    };

    const fetchEventData = async () => {
    
        setLoginError(null);
        setLoading(true);
        try {
          const response = await fetch(`${API_BASE_URL}/events/fetch-event-title/${event_id}`, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          });
          if (!response.ok) {
            setLoginError("Event doesn't exist");
            navigate("/event/"+event_id)
            throw new Error("Event doesn't exist");
          }
          const eventData = await response.json();
          setEvent(eventData);
    
        } catch (err) {
          setLoginError(err.message);
        } finally {
          setLoading(false);
        }
        
    };

    const handleSetUsername = async (e) => {
        e.preventDefault();

        const cleanFirstName = firstName.trim().replace(/[^a-zA-Z]/g, '');
        const cleanLastName = lastName.trim().replace(/[^a-zA-Z]/g, '');
    
        // Check if the cleaned input is empty
        if (!cleanFirstName || !cleanLastName) {
          setLoginError("First name and last name cannot be empty or contain special characters.");
          return;
        }

        const username = `${firstName} ${lastName}`; // Combine first and last name to form username

        try {
            // Prepare request data
            const requestData = {
                email: loginEmail,
                username: username,
                event_id: event_id,
                time_requested: new Date().toISOString(),
                profile_pic: profileNum || 0,
            };

            // Send request to API
            const response = await fetch(`${API_BASE_URL}/attendees/request-access`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestData),
            });

            if (!response.ok) {
                throw new Error("Failed to send request.");
            }

            const result = await response.json();
            if (result.success) {
                setRequestData({
                    status: "pending",
                    email: loginEmail,
                    username: username,
                    event_id: event_id,
                    time_requested: new Date().toISOString(),
                    profile_pic: profileNum
                })
                setLoginStep("pending"); // Go back to login step
                setAutoLogInEmail();
                updateEventPage(event_id, "attendees");
            } else {
                setLoginError("Request failed.");
            }
        } catch (err) {
            setLoginError(err.message);
        }
    };

    const handleLoginSubmit = async (e) => {
        e.preventDefault();
        setLoginError(null);

        try {
            const result = await LogIn(loginEmail, event_id);

            if (result === true) {
                navigate(`/event/${event_id}`);
            }

            if (result?.promptUsername) {
                // Prompt the user to enter their username
                setFirstName(""); // Clear the input
                setLastName(""); // Clear the input
                setLoginStep("enter-username"); // Example: Handle a UI transition to ask for username
            } else if (result?.promptShowSubmitted) {
                setLoginStep("pending");
                setRequestData(result);
            }
        } catch (err) {
            setLoginError(err.message);
        }
    };


    if (loginError) return <PageError error={"Something Went Wrong"} page={"Log In"} />;

    if (loading) return <div className="loader"><p>Logging In</p><button onClick = {() => {navigate(`/event/${event_id}`)}} className="small-button">Cancel</button></div>;

    if (loginStep === "enter-username") {
        return (
            <div className="username-form">

                <div className="top-line">
                    <button className="back-button" onClick={() => {setLoginEmail(""); setLoginStep("login-form")}}>
                        {theme === "dark" ? 
                        <img src="/svgs/back-arrow-white.svg" alt="Back" /> :
                     <img src="/svgs/back-arrow.svg" alt="Back" />}
                     </button>
                    <h1>Request To Join {event.title}</h1>
                </div>

                <div>
                    <label>Profile Picture:</label>
                    <ProfileSelector index={profileNum} onSelect={(newIndex) => setProfileNum(newIndex)} />
                </div>

                <form onSubmit={handleSetUsername}>
                    <div className="one-line-input">
                        <div>
                        <label>First Name: </label>
                        <input
                            type="text"
                            value={firstName}
                            onChange={(e) => {
                                // Get the value, remove non-alphabetic characters, and limit length to 14
                                let newValue = e.target.value.replace(/[^a-zA-Z]/g, "");
            
                                // Capitalize the first letter and lowercase the rest
                                newValue = newValue.charAt(0).toUpperCase() + newValue.slice(1).toLowerCase();
            
                                // Cap length to 14 characters
                                if (newValue.length <= 14) {
                                    setFirstName(newValue);
                                }
                            }}
                            required
                        />
                        </div>
                        <div>
                            <label>Last Name: </label>
                            <input
                                type="text"
                                value={lastName}
                                onChange={(e) => {
                                    // Get the value, remove non-alphabetic characters, and limit length to 14
                                    let newValue = e.target.value.replace(/[^a-zA-Z]/g, "");
                
                                    // Capitalize the first letter and lowercase the rest
                                    newValue = newValue.charAt(0).toUpperCase() + newValue.slice(1).toLowerCase();
                
                                    // Cap length to 14 characters
                                    if (newValue.length <= 14) {
                                        setLastName(newValue);
                                    }
                                }}
                                required
                            />
                        </div>
                        <button type="submit">Request to Join</button>

                    </div>
                </form>

                {loginError && <p style={{ color: "red" }}>{loginError}</p>}
            </div>
        );
    }

    if (loginStep === "pending") {

        console.log("requestData", requestData);

        const profile = Profiles.find((profile) => profile.id === Number(requestData.profile_pic));

        return (
            <div className="pending-form page-not-found page">
                <img className="sad-cat" src={profile?.path} alt="Profile" />
                <h1>Heya, {requestData.username.split(" ")[0]}</h1>
                {requestData.status === "rejected" ? 
                <h3>Your request has been cancelled</h3> :
                <h3>Your request to join {event.title} is pending</h3>}
                <button className = "small-button" onClick={() => { setLoginStep("login")}}>Back</button>
            </div>
        );
    }

    return (
        <div className="login-form">
            <h1>Login / Sign In to {event.title}</h1>
            <form onSubmit={handleLoginSubmit}>
                <span className="login-inputs">
                    <input
                        type="email"
                        placeholder="Please input your email..."
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        required
                    />
                    <button type="submit">GO</button>
                </span>
            </form>
            {loginError && <p style={{ color: "red" }}>{loginError}</p>}
        </div>
    );
}

export default Login;
