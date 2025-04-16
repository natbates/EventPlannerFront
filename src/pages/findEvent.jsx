import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useNotification } from "../contexts/notification";
import "../styles/findEvent.css";

const FindEvent = () => {
  const [eventId, setEventId] = useState("");
  const [autoAdded, setAutoAdded] = useState(false);
  const navigate = useNavigate();
  const notify = useNotification();

  // Load stored event ID when component mounts
  useEffect(() => {
    const storedEventId = localStorage.getItem("lastEventId");
    if (storedEventId) {
      setEventId(storedEventId);
      setAutoAdded(true);
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
