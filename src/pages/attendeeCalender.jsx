import { useEffect, useState } from "react";
import MyCalendar from "../components/Calender";
import { API_BASE_URL } from "../components/App";
import { useParams } from "react-router-dom";
import useFetchEventData from "../hooks/useFetchEventData";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/auth";
import { useTheme } from "../contexts/theme";
import PageError from "../components/PageError";

const UserCalender = () => {
 const { data: calenderData, loading, event_id, refetch, goEventPage } = useFetchEventData("calendar/fetch-calendar");
  const [availability, setAvailability] = useState(null);
  const [secondLoading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user_id: user_id_param } = useParams();
  const { user_id, name, role } = useAuth();
  const [username, setUsername] = useState(null);
  const navigate = useNavigate();
  const {theme} = useTheme();


  useEffect(() => {
    // IIFE so we can use async/await
    (async () => {
      if (!user_id_param || !user_id) return;
  
      // if you're looking at _your_ calendar, bounce back
      if (user_id === user_id_param) {
        navigate(`/event/${event_id}/your-calendar`);
        return;
      }
  
      setLoading(true);
      setError(null);
  
      try {
        // kick off both in parallel
        await Promise.all([
          (async () => {
            const res = await fetch(
              `${API_BASE_URL}/calendar/fetch-user-availability/${user_id_param}`,
              {
                method: "GET",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${sessionStorage.getItem("token")}`,
                },
              }
            );
            if (!res.ok) throw new Error("Failed to fetch availability");
            const data = await res.json();
            console.log("fetched availability →", data);
            setAvailability(data);
          })(),
          (async () => {
            const res = await fetch(
              `${API_BASE_URL}/users/fetch-username?user_id=${user_id_param}`,
              {
                method: "GET",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${sessionStorage.getItem("token")}`,
                },
              }
            );
            if (!res.ok) throw new Error("Failed to fetch username");
            const data = await res.json();
            console.log("fetched username →", data);
            setUsername(data.name);  // or data.username depending on your payload
          })(),
        ]);
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [user_id_param, user_id, event_id, navigate]);
  

  if (error) return <PageError error={error?.message ? error?.message : "Something Went Wrong"} page={"Attendees Calender"} />;

  if (loading || secondLoading) return <div className="loader"><p>Fetching Attendees Calender</p><button onClick = {() => {navigate(`/event/${event_id}`)}} className="small-button">Cancel</button></div>;


  return (
    <div className="your-calendar">

      <div className="top-line">
          <button className="back-button" onClick={() => { goEventPage(); }}>
            {theme === "dark" ? 
              <img src="/svgs/back-arrow-white.svg" alt="Back" /> :
            <img src="/svgs/back-arrow.svg" alt="Back" />}
        </button>
        <h2>{username?.name} Calendar</h2>
      </div>

      {!availability && <p style={{marginBottom: "30px"}}>Attendee has not added any avilability yet! Please remind them too</p>}

      {!loading && !error && (
        <MyCalendar data = {calenderData} processDate = {()=>{}} userAvailability={availability} />
      )}
    </div>
  );
};

export default UserCalender;
