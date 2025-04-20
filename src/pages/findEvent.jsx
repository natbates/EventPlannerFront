import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useNotification } from "../contexts/notification";
import "../styles/findEvent.css";
import { Profiles } from "../components/ProfileSelector";

const RecentEvent = ({ event_id, title, profile_pic, description, last_logged_in, isRequest }) => {
  const navigate = useNavigate();
  const profile = Profiles.find((profile) => profile.id === Number(profile_pic));

  return (
    <div className="recent-event" onClick={() => navigate(`/event/${event_id}`)}>
      <div className="title-profile-container">
        <div>
          <img src={profile?.path} alt="Profile" className="profile-pic" />
          <h2>{title}</h2>
        </div>
        <p>{isRequest ? "Request made" : `Last logged in: ${last_logged_in}`}</p>
      </div>
    </div>
  );
};


const FindEvent = () => {
  const [eventId, setEventId] = useState("");
  const [autoAdded, setAutoAdded] = useState(false);
  const navigate = useNavigate();
  const notify = useNotification();
  const [recentEvents, setRecentEvents] = useState([]);
  const [recentRequests, setRecentRequests] = useState([]);

  // Load stored event ID when component mounts
  useEffect(() => {
    const storedEventId = localStorage.getItem("lastEventId");
    if (storedEventId) {
      setEventId(storedEventId);
      setAutoAdded(true);
    }
  }, []);

  useEffect(() => {
    const storedEvents = localStorage.getItem("viewedEvents");
    if (storedEvents) {
      try {
        const parsed = JSON.parse(storedEvents);
        if (Array.isArray(parsed)) {
          setRecentEvents(parsed);
        }
      } catch (e) {
        console.error("Failed to parse stored events", e);
      }
    }

    const storedRequests = localStorage.getItem("requestedEvents");
    if (storedEvents) {
      try {
        const parsed = JSON.parse(storedRequests);
        if (Array.isArray(parsed)) {
          setRecentRequests(parsed);
        }
      } catch (e) {
        console.error("Failed to parse stored events", e);
      }
    }

  }, []);

  const handleFindEvent = () => {
    if (eventId.trim() !== "") {
      // Save the current ID to localStorage
      localStorage.setItem("lastEventId", eventId.trim());
      navigate(`/event/${eventId.trim()}`);
    } else 
    {
      notify.notify("Please enter a valid event ID");
    }
  };

  const deletePreset = () => {
    if (autoAdded) {
      setEventId("");
      setAutoAdded(false);
    }
  }

  const handleInputChange = (e) => {
    const filteredValue = e.target.value.replace(/[^a-zA-Z0-9\-]/g, "");
    setEventId(filteredValue);
  };

  const filteredRequests = recentRequests.filter(
    (request) => !recentEvents.some((event) => event.event_id === request.event_id)
  );

  return (
    <div className="find-event">
      <h1>Find Event</h1>
      <span className="find-event-input">
        <div>
          <input
            type="text"
            placeholder="e.g. 4f79df05-3556-462f-99a7-62f828f43f9c"
            value={eventId}
            onChange={handleInputChange}
            onFocus={() => deletePreset()}
          />
        </div>
        <button onClick={handleFindEvent}>Find Event</button>
      </span>

      <div className="recent-event-container">
        {recentEvents.length > 0 && <h3>Joined Events</h3>}
        {recentEvents.length > 0 && (
          recentEvents.map((event, index) => (
            <RecentEvent key={index} {...event} isRequest={false} />
          ))
        )}
      </div>

      {filteredRequests.length > 0 && (
        <div className="recent-event-container">
          <h3>Requested Events</h3>
          {filteredRequests.map((event, index) => (
            <RecentEvent key={index} {...event} isRequest={true} />
          ))}
        </div>
      )}


      <div className="section whats-new">
      <h2>Coming Soon</h2>
        <ul>
          <li>Like fellow attendees comments, polls, and links</li>
          <li>More efficient, secure, and smarter code</li>
          <li>Private attendee calendars for hiding your availability</li>
          <li>More cats</li>
        </ul>
      </div>
    </div>
  );
};

export default FindEvent;
