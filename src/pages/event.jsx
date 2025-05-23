import { use, useEffect, useState } from "react";
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
import { useTheme } from "../contexts/theme";
import Countdown from 'react-countdown';

export function formatFancyDate(date) {
  const day = date.getDate();
  const daySuffix = (d) => {
    if (d > 3 && d < 21) return "th";
    switch (d % 10) {
      case 1: return "st";
      case 2: return "nd";
      case 3: return "rd";
      default: return "th";
    }
  };
  const month = date.toLocaleString("default", { month: "long" });
  const year = date.getFullYear();

  return `${day}${daySuffix(day)} ${month} ${year}`;
}

const EventPage = () => {

  const event_id = useParams().event_id;
  const [event, setEvent] = useState(null);
  const {theme} = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastOpened, setLastOpened] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [availabilityEmpty, setAvailabilityEmpty] = useState(false);

  const navigate = useNavigate();
  const { notify, setNotifyLoad, notifyLoad} = useNotification();
  const { LogIn, signOut, role, authed, user_id, profile_pic} = useAuth();
  const {fetchLastOpened, fetchLastUpdated, fetchEventStatus} = useHistory();
  const [loggingIn, setLoggingIn] = useState(JSON.parse(localStorage.getItem("user")) !== null);
  const [fetchingAttendees, setFetchingAttendees] = useState(false);

  const routes = [
    { path: "/attendees", label: "Attendees", img: "/svgs/attendees.svg"},
    { path: "/shared-calendar", label: "Shared Calendar", img: "/svgs/shared-calender.svg"},
    { path: "/links", label: "Links", img: "/svgs/links.svg"},
    { path: "/comments", label: "Comments", img: "/svgs/comments.svg"},
    { path: "/polls", label: "Polls", img: "/svgs/polls.svg"},
    { path: "/location", label: "Location", img: "/svgs/location.svg"},
    { path: "/your-calendar", label: "Your Calendar", img: "/svgs/your-calender.svg"},
    { path: "/to-do", label: "To Do List", img: "/svgs/to-do.svg"},
    { path: "/settings", label: "Settings", img: "/svgs/settings.svg"},
  ];

  const [attendeeDetails, setAttendeeDetails] = useState([]);
  const [isComing, setIsComing] = useState(null);

  const fetchUserDetails = async (userId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/users/fetch-username?user_id=${userId}`);
      if (!res.ok) throw new Error("Failed to fetch user");
      return await res.json(); // { name, profile_pic }
    } catch (error) {
      console.error("Error fetching user details:", error);
      return { name: "Unknown", profile_pic: "/default-profile.png" };
    }
  };

  useEffect(() => {
    const fetchUserComingStatus = async () => {
      const res = await fetch(`${API_BASE_URL}/users/fetch-username?user_id=${user_id}`);
      const data = await res.json();
      setIsComing(data.is_coming);
    };
  
    if (user_id) fetchUserComingStatus();
  }, [user_id]);

  const fetchAttendees = async () => {
      if (!event) return;
    
      let details = [];
    
      if (Array.isArray(event.attendees) && event.attendees.length > 0) {
        const attendeeDetails = await Promise.all(
          event.attendees.map((userId) => fetchUserDetails(userId))
        );
        details = attendeeDetails;
      }
    
      if (event.organiser_id) {
        const organiserDetails = await fetchUserDetails(event.organiser_id);
        details.unshift(organiserDetails); // Organiser first
      }
    
      setAttendeeDetails(details);
  };
  
  const reopenEvent = async () => {
    try {
      setNotifyLoad(true);
      const response = await fetch(`${API_BASE_URL}/events/reopen-event`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${sessionStorage.getItem("token")}`},
        body: JSON.stringify({ event_id }),
      });

      if (!response.ok) {
        throw new Error("Failed to reopen event");
      }

      await fetchEventData();
      await fetchEventStatus(event_id);
    } catch (err) {
      console.error("Error reopening event:", err);
      notify("Failed to reopen event");
    } finally {
      setNotifyLoad(false);
    }
  };

  const isEventExisting = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/events/fetch-event-title/${event_id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json"
        },
      });
  
      if (!response.ok) {
        throw new Error("Event not found");
      }
  
      const data = await response.json();
      return true; // or return true/false depending on your use case
    } catch (err) {
      console.error("Error checking event existence:", err);
      setError(err.message);
      setLoading(false);
      return false; // or false
    }
  };

  const fetchEventData = async () => {

    if (!event_id){
      setLoading(false);
      return;
    }
    
    setError(null);
    try {

      fetchEventStatus(event_id);
        const response = await fetch(`${API_BASE_URL}/events/fetch-event/${event_id}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${sessionStorage.getItem("token")}`,
          },
        });
        if (!response.ok) {
          setError("Event doesn't exist");
          notify("Event doesn't exist");
          throw new Error("Event doesn't exist");
        }
        const eventData = await response.json();
        setEvent(eventData);
        const last_updated = await fetchLastUpdated(event_id);
        setLastUpdated(last_updated);
        const last_opened = await fetchLastOpened(user_id);
        setLastOpened(last_opened);

        try {
          const viewedEventsKey = "viewedEvents";
          const stored = localStorage.getItem(viewedEventsKey);
          let viewedEvents = stored ? JSON.parse(stored) : [];
        
          // Find index of the event if it already exists
          const index = viewedEvents.findIndex(event => event.event_id === event_id);
        
          if (index === -1 && eventData) {
            // Not viewed yet – add it
            viewedEvents.push({
              event_id: event_id,
              title: eventData.title,
              description: eventData.description,
              profile_pic: profile_pic,
              last_logged_in: formatFancyDate(new Date())
            });
          } else if (index !== -1) {
            // Already exists – update just the last_logged_in
            viewedEvents[index].last_logged_in = formatFancyDate(new Date());
          }
        
          localStorage.setItem(viewedEventsKey, JSON.stringify(viewedEvents));
        } catch (storageError) {
          console.error("Failed to update viewed events in local storage:", storageError);
      } 
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }

  };

  const renderer = ({ days, hours, minutes, seconds, completed }) => {
    if (completed) {
      return <span>Event started!</span>;
    } else {
      return (
        <span>
          <strong>{days}</strong> days{" "}
          <strong>{hours}</strong> hours{" "}
          <strong>{minutes}</strong> minutes{" "}
          <strong>{seconds}</strong> seconds
        </span>
      );
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
    if (!user_id) {
      return;
    } 
    {
      try {
        const response = await fetch(`${API_BASE_URL}/calendar/fetch-user-availability/${user_id}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });
    
        if (!response.ok) {
          setLoading(false);
          throw new Error("Failed to fetch availability");
        }
    
        const availabilityData = await response.json();
    
        // Check if availability is empty
        if (!availabilityData || Object.keys(availabilityData).length === 0) {
          setAvailabilityEmpty(true);
  
          // Check last reminded time from localStorage
          const reminderKey = `availability-reminder-${user_id}`;
          const lastReminded = localStorage.getItem(reminderKey);
          const now = new Date().getTime();
  
          const eightHours = 8 * 60 * 60 * 1000;
  
          if (!lastReminded || now - parseInt(lastReminded, 10) > eightHours) {
            notify("You have not entered your calendar availability.");
            localStorage.setItem(reminderKey, now.toString()); // Update timestamp
          }
  
        } else {
          setAvailabilityEmpty(false);
        }
    
      } catch (err) {
        console.error("Error fetching availability:", err);
      }
    }
  };

  const handleToggleIsComing = async () => {
    
    let newStatus;
    if (isComing === null) newStatus = true;
    else if (isComing === true) newStatus = false;
    else newStatus = null;
  
    try {
      setNotifyLoad(true);
      const response = await fetch(`${API_BASE_URL}/users/set-is-coming`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ user_id, is_coming: newStatus }),
      });
  
      if (!response.ok) throw new Error("Failed to update status");
  
      setIsComing(newStatus);
      await fetchAttendees();
    } catch (error) {
      console.error("Error toggling is_coming:", error);
      notify("Failed to update RSVP status");
    } finally
    {
      setNotifyLoad(false);
    }
  };

  useEffect(() => {
    const initialLoad = async () => {
      let exists = await isEventExisting();
      if (error == null && exists) {
        console.log("Fetching event data...");
        await LogInFromEvent();  // sets user_id
      }
      setLoading(false);
    };
    

    initialLoad();
    
  }, [event_id]);
  
  // Watch for user_id becoming available
  useEffect(() => {
    const postLoginLoad = async () => {
      if (user_id) {
        setFetchingAttendees(true);
        await fetchUserAvailability();
        await fetchAttendees();
        setFetchingAttendees(false);
      }
    };
  
    postLoginLoad();
  }, [user_id]);

  const LogInFromEvent = async () => {

    console.log("Logging in from event page..."); // Debugging line
  
    const storedUser = JSON.parse(localStorage.getItem("user"));
    let data = null;
  
    if (storedUser && event_id) {
      data = await LogIn(storedUser.email, event_id); // Await login result
    }

    console.log("Login data:", data); // Debugging line
  
    if (data === true) {
      //setNotifyLoad(false);
      setLoggingIn(false);
      await fetchEventData();
      return;
    } else {
      setLoggingIn(false);
      navigate(`/event/${event_id}/login`);
      return;
    }
  }

  if (error) {
    return (
      <div className="page-not-found page">
        {theme === "light" ?
        <img className = "sad-cat" src="/svgs/cats/sad-cat.svg" alt="Servers Down" /> :
        <img className = "sad-cat" src="/svgs/cats/sad-cat-white.svg" alt="Servers Down" />}
        <h1>{error}</h1>
        <h3>Are you sure that's the right event ID? They can be changed!</h3>
        <button className = "small-button" onClick={() => navigate("/find-event")}>Try Again</button>
      </div>
    );
  }

  if (loggingIn) return <div className="loader"><p>Trying to Log You In</p></div>;

  if (loading) return <div className="loader"><p>Fetching Event</p></div>;

  if (!event) return null;

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
    
    if (fetchingAttendees) return <div className="loader"><p>Fetching Attendees</p></div>;

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
        {attendeeDetails.length > 0 && (
          <div className="attendee-list">
            {attendeeDetails.map((attendee, index) => {
              const profile = Profiles.find((profile) => profile.id === Number(attendee.profile_pic)); // Assuming 'id' links attendees to profiles
              return (
                <div key={index} className="profile">
                  <img src={profile?.path} alt={profile?.name || "Unknown"} className="profile-pic" />
                  <p className={`${attendee.user_id === user_id ? "you underline" : ""}`}>{attendee?.name || "Unknown"}</p>
                  <strong className="is_coming">
                    {attendee.is_coming === 1 ? (
                      theme === "dark" ? (
                        <img className="tick" src="/svgs/tick-white.svg" alt="Can Come" />
                      ) : (
                        <img className="tick" src="/svgs/tick.svg" alt="Can Come" />
                      )
                    ) : attendee.is_coming === 0 ? (
                      theme === "dark" ? (
                        <img className="cross" src="/svgs/cross-white.svg" alt="Cant Come" />
                      ) : (
                        <img className="cross" src="/svgs/cross.svg" alt="Cant Come" />
                      )
                    ) : (
                      theme === "dark" ? (
                        <img className="question" src="/svgs/question-mark-white.svg" alt="Undecided" />
                      ) : (
                        <img className="question" src="/svgs/question-mark.svg" alt="Undecided" />
                      )
                    )}
                  </strong>

                </div>
              );
            })
            }
          </div>
        )}
        <strong className="count-down"><Countdown date={moment(event.chosen_dates[0]).toDate()} renderer={renderer}/></strong>
        <div className="button-container confirm-page-buttons">
          <button className="small-button" onClick={handleToggleIsComing}>
            {(isComing === null || isComing === undefined) && "I'm Coming!"}
            {(isComing === true || isComing === 1) && "Cant Make It"}
            {(isComing === false || isComing === 0) && "Undecided"}
          </button>        
          {role === "organiser" && <button className="small-button" onClick={reopenEvent}>Reopen</button>}
        </div>
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
            <div className="event-panels-mask">
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
                      <img className = {theme === "dark" ? "light-up" : ""} src = {img} alt = {path}></img>
                      <h2>{label}</h2>
                    </span>

                    {showNotification && <div className="notifcation-circle">!</div>}
                  </button>
                </div>
              );
            })}
          </div>
    
          </div>
        </>
      )}
    </div>
  );
   
};

export default EventPage;
