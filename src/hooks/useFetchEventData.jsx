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
    const [loading, setLoading] = useState("logging in");
    const [loggin, setLoggingIn] = useState(false);

    const { authed, loading: authLoading, ReLogIn} = useAuth(); // 👈 renamed loading to authLoading
    const navigate = useNavigate();
    const { notify } = useNotification();

    

    // 🔹 Fetch event status before fetching other data
    const fetchEventStatus = async () => {
        if (!event_id || !authedRef.current) {
            return;
        }
        try {
            const response = await fetch(`${API_BASE_URL}/events/fetch-event/${event_id}`, {
                method: "GET",
                headers: { "Content-Type": "application/json", 'Authorization': `Bearer ${sessionStorage.getItem("token")}`,},
            });

            if (!response.ok) throw new Error("Failed to fetch event status");

            const eventData = await response.json();
            setEvent(eventData);

            // 🔥 Redirect if event is canceled or confirmed
            if (eventData.status === "confirmed" || eventData.status === "canceled") {
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
    
        const timeoutDuration = 30000;
        
        let data = null;
        
        if (event_id) {
            data = await ReLogIn(event_id); // Await login result
        }
    
        console.log("Login data:", data); // Debugging line
        
        if (data === true) {
            setLoading(true);
        } else {
            navigate(`/event/${event_id}/login`);
        }
        
    
        try {
            if (!logginRef.current && authedRef.current) {
            } else {
                // 🔹 Wait for authentication to complete
                await new Promise((resolve, reject) => {
                    const interval = setInterval(() => {
                        
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
            }
    
            if (!event_id || !authedRef.current) {
                return;
            }
    
            const eventData = await fetchEventStatus();
            if (!eventData) {
                return;
            }
    
            const response = await fetch(`${API_BASE_URL}/${endpoint}?event_id=${event_id}`, {
                method: "GET",
                headers: { "Content-Type": "application/json", 'Authorization': `Bearer ${sessionStorage.getItem("token")}`, },
                
            });
    
            if (!response.ok) throw new Error(`Failed to fetch ${endpoint}`);
    
            const result = await response.json();
            setData(result);
    
        } catch (err) {
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
