import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../contexts/auth";
import { useNotification } from "../contexts/notification";
import { API_BASE_URL } from "../components/App";

const useFetchEventData = (endpoint) => {
    const { event_id } = useParams();
    const [data, setData] = useState(null);
    const [event, setEvent] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);

    const { authed } = useAuth();
    const navigate = useNavigate();
    const { notify } = useNotification();

    useEffect(() => {
        if (!authed) {
            console.log("going to login page from useFetchEventData")
            navigate(`/event/${event_id}/login`);
        }
    }, [authed, event_id, navigate, location]);

    // 🔹 Fetch event status before fetching other data
    const fetchEventStatus = async () => {
        if (!event_id || !authed) return;

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

    // 🔹 Fetch endpoint data only if event is valid
    const fetchData = async () => {
        if (!event_id || !authed) return;

        const eventData = await fetchEventStatus();
        if (!eventData) return; // Stop if event is canceled/confirmed

        try {
            setLoading(true);
            const response = await fetch(`${API_BASE_URL}/${endpoint}?event_id=${event_id}`, {
                method: "GET",
                headers: { "Content-Type": "application/json" },
            });

            if (!response.ok) throw new Error(`Failed to fetch ${endpoint}`);

            const result = await response.json();
            setData(result);
        } catch (err) {
            notify(`Error fetching ${endpoint}`);
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

    return { data, event, error, loading, event_id, refetch: fetchData, goEventPage };
};

export default useFetchEventData;
