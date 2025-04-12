import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../contexts/auth";
import MyCalendar, { SharedCalendar } from "../components/Calender";
import { useNavigate } from "react-router-dom";
import { useNotification } from "../contexts/notification";
import { API_BASE_URL } from "../components/App";
import "../styles/event.css";
import { useHistory } from "../contexts/history";
import { formatDate } from "../components/Calender";
import moment from "moment";
import { Profiles } from "../components/ProfileSelector";

const EventPage = () => {
  const event_id = useParams().event_id;
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastOpened, setLastOpened] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [availabilityEmpty, setAvailabilityEmpty] = useState(false);
  const [countdown, setCountdown] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });
  const navigate = useNavigate();
  const { notify } = useNotification();
  const { signOut, role, authed, user_id, profile_pic} = useAuth();
  const {fetchLastOpened, fetchLastUpdated, fetchEventStatus} = useHistory();

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

  useEffect(() => {
    if (event && event.chosen_dates && event.chosen_dates.length > 0) {
      // Sort the chosen dates and get the earliest date
      const sortedChosenDates = event.chosen_dates.map(date => moment(date)).sort((a, b) => a - b);
      const earliestChosenDate = sortedChosenDates[0];
  
      const interval = setInterval(() => {
        const now = moment();
        const duration = moment.duration(earliestChosenDate.diff(now));
  
        if (duration.asSeconds() <= 0) {
          clearInterval(interval);
          setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        } else {
          setCountdown({
            days: duration.days(),
            hours: duration.hours(),
            minutes: duration.minutes(),
            seconds: duration.seconds()
          });
        }
      }, 1000);
  
      return () => clearInterval(interval);
    }
  }, [event]);
  

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
      fetchEventStatus(event_id);
    } catch (err) {
      console.error("Error reopening event:", err);
    }
  };

  const fetchEventData = async () => {
    
    setError(null);
    setLoading(true);
    fetchEventStatus(event_id);
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
      notify(err.message);
    } finally {
      setLoading(false);
    }
    
  };

  const formatChosenDates = (chosenDatesInput) => {
    // Ensure chosenDates is a string
    let chosenDatesString = "";
  
    if (Array.isArray(chosenDatesInput)) {
      // If it's an array, join it into a single string
      chosenDatesString = chosenDatesInput.join(" ");
    } else if (typeof chosenDatesInput === "string") {
      chosenDatesString = chosenDatesInput;
    } else {
      return ''; // Return empty string if the input is not a valid type
    }
  
    // Extract the dates in YYYY-MM-DD format from the string
    const dateStrings = chosenDatesString.match(/\d{4}-\d{2}-\d{2}/g); // Extract dates (e.g., 2025-05-16)
  
    if (!dateStrings || dateStrings.length < 2) return ''; // Return empty if no valid date pairs
  
    // Get the earliest and latest dates
    const earliestDate = moment.min(dateStrings.map(date => moment(date)));
    const latestDate = moment.max(dateStrings.map(date => moment(date)));
  
    // Return the formatted date range
    return `${formatDate(earliestDate)} to ${formatDate(latestDate)}`;
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

  if (error) {
    return (
      <div className="page-not-found page">
        <img className = "sad-cat" src="/svgs/sad-cat.svg" alt="Servers Down" />
        <h1>{error}</h1>
        <h3>Are you sure that's the right event ID?</h3>
        <button className = "small-button" onClick={() => navigate("/find-event")}>Try Again</button>
      </div>
    );
  }
  

  if (loading) return <div class="loader"><p>Fetching Event</p></div>;

  if (authed && event && event.status === "canceled") {
    const profile = Profiles.find((profile) => profile.id === Number(profile_pic));
    return (
      <div className="page-not-found page event-cancelled pending-form">
        <img className = "sad-cat" src={profile.path} alt="Confirmed" />
        <h1>Oh No - {event.title} is Cancelled</h1>
        <p>Cancelled Because: {event.cancellation_reason}</p>
        {role === "organiser" && <button className = "small-button" onClick={reopenEvent}>Reopen</button>}
      </div>
    );
  }

  if (authed && event && event.status === "confirmed") {
    const profile = Profiles.find((profile) => profile.id === Number(profile_pic));

    let formattedChosenDates;
    if (event.chosen_dates.length === 1) {
      formattedChosenDates = moment(event.chosen_dates[0]).format('MMMM Do YYYY');
    } else {
      formattedChosenDates = formatChosenDates(event.chosen_dates);
    }

    const { address, city, postcode, country } = event?.location || {};

    return (
      <div className="page-not-found page event-confirmed">
        <img className="sad-cat" src={profile.path} alt="Confirmed" />
        <h1>{event.title} is Confirmed!</h1>
        <p>{formattedChosenDates} at {address}, {city}, {postcode}, {country}</p>
        <strong> {countdown.days} days {countdown.hours} hours {countdown.minutes} minutes {countdown.seconds} seconds</strong>
        {role === "organiser" && <button className="small-button" onClick={reopenEvent}>Reopen</button>}
      </div>
    );
  }
  
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
                    <span>
                      <img src = {img} alt = {path}></img>
                      <h2>{label}</h2>
                    </span>
                    {path === "/your-calendar" && availabilityEmpty && (
                      <div className="warning">
                        <img src = "/svgs/warning.svg"></img>
                        <p>You have not entered your calender availability.</p>
                    </div>)}
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
         
          {/* <div className="bottom-line">
            {availabilityEmpty ? (
              <div className="warning">
                <img src = "/svgs/warning.svg"></img>
                <p>You have not entered your calender availability.</p>
              </div>
              ) : <div></div>}
          </div> */}
        </>
      )}
    </div>
  );
   
};

export default EventPage;
