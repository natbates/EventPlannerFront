import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../contexts/auth";
import { useNotification } from "../contexts/notification";
import { API_BASE_URL } from "../components/App";
import { useRef } from "react";

const useFetchEventData = (endpoint) => {
    const { event_id } = useParams();
    const [data, setData] = useState(null);
    const [event, setEvent] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);
    const [loggin, setLoggingIn] = useState(false);

    const { authed, loading: authLoading, ReLogIn} = useAuth(); // 👈 renamed loading to authLoading
    const navigate = useNavigate();
    const { notify } = useNotification();

    useEffect(() => {
        const checkAuth = async () => {
            setLoggingIn(true);
            if (authLoading) return; // Wait until auth check is done
    
            if (!authed) {
                const result = await ReLogIn(event_id);
                
                console.log("ReLogIn result: ", result);
                console.log("Authed after ReLogIn: ", authed);
                setLoggingIn(false);
                // If user is now authed after ReLogIn, skip redirect
                if (!result && !authed) {
                    console.log("Going to login page from useFetchEventData");
                    navigate(`/event/${event_id}/login`);
                }
            } else
            {
                setLoggingIn(false);
            }
        };
    
        checkAuth();
    }, [authed, authLoading, event_id, navigate]);
    

    // 🔹 Fetch event status before fetching other data
    const fetchEventStatus = async () => {
        if (!event_id || !authedRef.current) {
            console.log("Skipping fetchEventStatus — event_id or auth missing", { event_id, authed: authedRef.current });
            return;
        }
        try {
            const response = await fetch(`${API_BASE_URL}/events/fetch-event/${event_id}`, {
                method: "GET",
                headers: { "Content-Type": "application/json" },
            });

            if (!response.ok) throw new Error("Failed to fetch event status");

            const eventData = await response.json();
            setEvent(eventData);

            // 🔥 Redirect if event is canceled or confirmed
            if (eventData.status === "confirmed" || eventData.status === "canceled") {
                console.log("GOING TO HOME PAGE");
                navigate(`/event/${event_id}`);
                return null; // Stop fetching additional data
            }

            return eventData; // Proceed to fetch other data
        } catch (err) {
            notify("Error fetching event status");
            setError(err.message);
            return null;
        }
    };

    const authedRef = useRef(authed);
    const logginRef = useRef(loggin);

    useEffect(() => {
        authedRef.current = authed;
    }, [authed]);
      
    useEffect(() => {
        logginRef.current = loggin;
    }, [loggin]);
      


    // 🔹 Fetch endpoint data only if event is valid
    const fetchData = async (refetch = false) => {
        console.log("Fetching data for endpoint: ", endpoint);
        
        const timeoutDuration = 5000; // Timeout after 5 seconds (adjust as needed)
        
        const waitForAuth = new Promise((resolve, reject) => {
          const interval = setInterval(() => {
            console.log("Waiting... Authed?", authedRef.current, "Logging in?", logginRef.current);
            
            if (!logginRef.current && authedRef.current) {
              clearInterval(interval);
              resolve();
            }
          }, 100);
          
          setTimeout(() => {
            clearInterval(interval);
            reject(new Error("Authentication timed out"));
          }, timeoutDuration);
        });
      
        try {
          // Wait for either successful authentication or timeout
          await waitForAuth;
          console.log("Authed and not logging in, proceeding to fetch data.");
          
          if (!event_id || !authedRef.current) {
            console.log("No event_id or not authenticated, stopping fetchData.");
            return;
          }
          
          const eventData = await fetchEventStatus();
          
          if (!eventData) {
            console.log("Event data is null, stopping fetchData.");
            return;
          }
          
          const response = await fetch(`${API_BASE_URL}/${endpoint}?event_id=${event_id}`, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
          });
          
          if (!response.ok) throw new Error(`Failed to fetch ${endpoint}`);
          
          const result = await response.json();
          console.log("Fetched data: ", result);
          setData(result);
          
        } catch (err) {
          // If an error occurs in either authentication or fetching data, handle it
          if (err.message === "Authentication timed out") {
            notify("Authentication timed out, please try again later.");
          } else {
            notify(`${endpoint.split("/")[0]}: Failed to fetch data`);
          }
          setError(err.message);
        } finally {
          setLoading(false);
        }
    };
      
      

    const goEventPage = () => {
        navigate(`/event/${event_id}`);
    };

    useEffect(() => {
        
        fetchData();
    }, [event_id]); // Dependency on event_id

    return { data, event, error, loading, event_id, refetch: fetchData, goEventPage, setError};
};

export default useFetchEventData;
