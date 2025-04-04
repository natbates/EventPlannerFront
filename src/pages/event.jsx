import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../contexts/auth";
import MyCalendar, { SharedCalendar } from "../components/Calender";
import { useNavigate } from "react-router-dom";
import { useNotification } from "../contexts/notification";
import { API_BASE_URL } from "../components/App";
import "../styles/event.css";
import { useHistory } from "../contexts/history";

const EventPage = () => {
  const event_id = useParams().event_id;
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastOpened, setLastOpened] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [availabilityEmpty, setAvailabilityEmpty] = useState(false);

  const navigate = useNavigate();
  const { notify } = useNotification();
  const { signOut, role, authed, user_id} = useAuth();
  const {fetchLastOpened, fetchLastUpdated} = useHistory();

  const routes = [
    { path: "/attendees", label: "Attendees", img: "/svgs/attendees.svg"},
    { path: "/shared-calendar", label: "Shared Calendar", img: "/svgs/shared-calender.svg"},
    { path: "/links", label: "Links", img: "/svgs/links.svg"},
    { path: "/polls", label: "Polls", img: "/svgs/polls.svg"},
    { path: "/location", label: "Location", img: "/svgs/location.svg"},
    { path: "/your-calendar", label: "Your Calendar", img: "/svgs/your-calender.svg"},
    { path: "/to-do", label: "To Do List", img: "/svgs/to-do.svg"},
    { path: "/settings", label: "Settings", img: "/svgs/settings.svg"},
  ];

  const reopenEvent = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/events/reopen-event`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ event_id }),
      });

      if (!response.ok) {
        throw new Error("Failed to reopen event");
      }

      fetchEventData();
    } catch (err) {
      console.error("Error reopening event:", err);
    }
  };

  const fetchEventData = async () => {
    
    setError(null);
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/events/fetch-event/${event_id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) {
        setError("Event doesn't exist");
        throw new Error("Event doesn't exist");
      }
      const eventData = await response.json();
      setEvent(eventData);
      const last_updated = await fetchLastUpdated(event_id);
      setLastUpdated(last_updated);
      const last_opened = await fetchLastOpened(user_id);
      setLastOpened(last_opened);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
    
  };

  const fetchUserAvailability = async () => {
    if (user_id)
    {
      try {
        const response = await fetch(`${API_BASE_URL}/calendar/fetch-user-availability/${user_id}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });
    
        if (!response.ok) {
          throw new Error("Failed to fetch availability");
        }
    
        const availabilityData = await response.json();
        console.log("User availability data:", availabilityData);
    
        // Check if availability is empty
        if (!availabilityData || Object.keys(availabilityData).length === 0) {
          setAvailabilityEmpty(true); // Mark availability as empty
        } else {
          setAvailabilityEmpty(false); // Availability exists
        }
    
      } catch (err) {
        console.error("Error fetching availability:", err);
      }
    }
  };

  useEffect(() => {
    
    fetchEventData();
    fetchUserAvailability();
    
  }, [authed, user_id]);

  if (!authed && error === null && !loading) {
    console.log("Redirecting as event exists and not logged in FROM EVENT");
    navigate(`/event/${event_id}/login`);
  }

  if (error) return <div><h1>{error}</h1><p>Are you sure thats the right event ID?</p></div>;

  if (loading) return <div>Loading...</div>;

  if (authed && event && event.status === "canceled") {
    return (
      <div>
        <p>Event is Cancelled</p>
        <p>Reason: {event.cancellation_reason}</p>
        {role === "organiser" && <button onClick={reopenEvent}>Reopen</button>}
      </div>
    );
  }

  if (authed && event && event.status === "confirmed") {
    return (
      <div>
        <p>Event is Confirmed!</p>
        <p>{event.chosen_dates}</p>
        {role === "organiser" && <button onClick={reopenEvent}>Reopen</button>}
      </div>
    );
  }

  const filteredLastOpened = lastOpened
    ? lastOpened.filter((entry) => entry.path === "comments") // Or any path filter logic
    : [];

  const filteredLastUpdated = lastUpdated
    ? lastUpdated.filter((entry) => entry.path === "comments") // Or any path filter logic
    : [];

  const showCommentNotification =
    filteredLastOpened.length > 0 &&
    filteredLastUpdated.length > 0 &&
    new Date(filteredLastOpened[0].timestamp) < new Date(filteredLastUpdated[0].timestamp);


  return (
    <div className="event">
      <div className="event-top-line">
        <div>
          <h1>{event && event.title}</h1>
          <p>{event && event.description}</p>
        </div>
      </div>
      
      {authed && (
        <>
      
          <div className="panels">
            {routes.map(({ path, label, img }) => {
              // Filter lastOpened and lastUpdated for the current path
              const filteredLastOpened = lastOpened
                ? lastOpened.filter((entry) => entry.path === path.replace(/^\/+/, ''))
                : [];
              const filteredLastUpdated = lastUpdated
                ? lastUpdated.filter((entry) => entry.path === path.replace(/^\/+/, ''))
                : [];
    
              // Check if both lastOpened and lastUpdated exist for this path
              const showNotification =
                filteredLastOpened.length > 0 &&
                filteredLastUpdated.length > 0 &&
                new Date(filteredLastOpened[0].timestamp) < new Date(filteredLastUpdated[0].timestamp);
    
              return (
                <div className = "event-panel" key={path}>
                  <button className = "event-panel-button" onClick={() => navigate(`${location.pathname}${path}`)}>
                    <img src = {img} alt = {path}></img>
                    <p>{label}</p>
                    {showNotification && <div className="notifcation-circle">!</div>}
                  </button>

                  {/* {filteredLastOpened.length > 0 && (
                    <p>
                      Last opened:{" "}
                      {new Date(filteredLastOpened[0].timestamp).toLocaleString()}
                    </p>
                  )}
    
                  {filteredLastUpdated.length > 0 && (
                    <p>
                      Last updated:{" "}
                      {new Date(filteredLastUpdated[0].timestamp).toLocaleString()}
                    </p>
                  )} */}
    
                  {/* Show notification if last opened occurred before last updated */}
                </div>
              );
            })}
          </div>
         
          <div className="bottom-line">
            {availabilityEmpty ? (
              <div className="warning">
                <img src = "/svgs/warning.svg"></img>
                <p>You have not entered your calender availability.</p>
              </div>
              ) : <div></div>}
          </div>
        </>
      )}
    </div>
  );
   
};

export default EventPage;
