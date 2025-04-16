import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useEffect, useState } from "react";
import "../styles/loader.css";

import NavBar from "./nav"
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
import PrivacyPolicy from "../pages/boring/privacyPolicy";
import TOS from "../pages/boring/TOS";
import { useNotification } from "../contexts/notification";
import Contact from "../pages/boring/contact";
import { useTheme } from "../contexts/theme";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
export { API_BASE_URL };

const App = () => {
    const { notify } = useNotification();
    const [isBackendUp, setIsBackendUp] = useState(true);
    const {theme} = useTheme();

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
              <div className="servers-down page">
                {theme === 'dark' ? 
                  <img className="sad-cat" src="/svgs/cats/sad-cat-white.svg" alt="Servers Down" /> : 
                <img className = "sad-cat" src="/svgs/cats/sad-cat.svg" alt="Servers Down" />}
                <h1>Sorry</h1>
                <h3>We are currently experiencing issues with our servers. Please try again later.</h3>
              </div>
            </div>
        </div>
      );
    }

    const catRightSrc = theme === 'dark' ? '/svgs/cats/cat-right-white.svg' : '/svgs/cats/cat-right.svg';
    const catLeftSrc = theme === 'dark' ? '/svgs/cats/cat-left-white.svg' : '/svgs/cats/cat-left.svg';
    const catRightBottomSrc = theme === 'dark' ? '/svgs/cats/cat-right-bottom-white.svg' : '/svgs/cats/cat-right-bottom.svg';

    return (
        <div className="page-content">

            <img onClick={() => { notify("Meow"); }} className="cat-right" src={catRightSrc} alt="cat" />
            <img onClick={() => { notify("Mrrp"); }} className="cat-left" src={catLeftSrc} alt="cat" />
            <img onClick={() => { notify("Mrrp"); }} className="cat-right-bottom" src={catRightBottomSrc} alt="cat" />
            <div className="page-container">
                <NavBar />
                <div className="page">
                  <Routes>
                      <Route path="/" element={<Home />} />
                      <Route path="/create-event" element={<CreateEvent />} />
                      <Route path="/find-event" element={<FindEvent />} />
                      
                      <Route path="/support" element={<Support />} />
                      <Route path="/tos" element={<TOS />} />
                      <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                      <Route path="/contact" element={<Contact />} />

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
            </div>
            <Footer />
        </div>
    );
};

export default App;
