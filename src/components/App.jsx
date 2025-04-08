import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useEffect, useState } from "react";

import NavBar from "./nav";
import Home from "../pages/home";
import CreateEvent from "../pages/createEvent";
import EventPage from "../pages/event";

import "../styles/app.css";
import Attendees from "../pages/sections/attendees";
import Login from "../pages/login";
import Comments from "../pages/sections/comments";
import Links from "../pages/sections/links";
import Settings from "../pages/sections/settings";
import ToDo from "../pages/sections/toDo";
import YourCalendar from "../pages/sections/yourCalendar";
import AttendeeCalendar from "../pages/sections/sharedCalender";
import Polls from "../pages/sections/polls";
import Location from "../pages/sections/location";
import NotFound from "../pages/notFound";
import FindEvent from "../pages/findEvent";
import Footer from "./Footer";
import Support from "../pages/boring/support";
import UserCalender from "../pages/attendeeCalender";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
export { API_BASE_URL };

const App = () => {

    const [isBackendUp, setIsBackendUp] = useState(true);

    useEffect(() => {
      const checkBackend = async () => {
        try {
          const res = await fetch(`${API_BASE_URL}/health`);
          if (!res.ok) throw new Error();
          setIsBackendUp(true);
        } catch (err) {
          setIsBackendUp(false);
        }
      };
  
      checkBackend();
    }, []);
  
    if (!isBackendUp) {
      return (
        <div className="page-content">
            <div className="page-container">
                <h1>Sorry, our servers are currently unavailable.</h1>
                <p>Please try again later.</p>
            </div>
            <Footer />
        </div>
      );
    }

    return (
        <div className="page-content">
            <div className="page-container">
                <NavBar />
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/create-event" element={<CreateEvent />} />
                    <Route path="/find-event" element={<FindEvent />} />
                    <Route path="/support" element={<Support />} />

                    <Route path="/event/:event_id" element={<EventPage />} /> 
                    <Route path="event/:event_id/login" element={<Login />} />
                    <Route path="/event/:event_id/attendees" element={<Attendees />} /> 
                    <Route path="/event/:event_id/comments" element={<Comments />} /> 
                    <Route path="/event/:event_id/links" element={<Links />} /> 
                    <Route path="/event/:event_id/settings" element={<Settings />} /> 
                    <Route path="/event/:event_id/to-do" element={<ToDo />} /> 
                    <Route path="/event/:event_id/your-calendar" element={<YourCalendar />} /> 
                    <Route path="/event/:event_id/shared-calendar" element={<AttendeeCalendar />} /> 
                    <Route path="/event/:event_id/polls" element={<Polls />} /> 
                    <Route path="/event/:event_id/location" element={<Location />} /> 
                    <Route path="event/:event_id/attendee-calender/:user_id" element={<UserCalender />} />
                    <Route path="*" element={<NotFound />} />
                </Routes>
            </div>
            <Footer />
        </div>
    );
};

export default App;
