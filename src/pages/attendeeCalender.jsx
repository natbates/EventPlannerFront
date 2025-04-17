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
 const { data: calenderData, event_id, refetch, goEventPage } = useFetchEventData("calendar/fetch-calendar");
  const [availability, setAvailability] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user_id: user_id_param } = useParams();
  const { user_id, name, role } = useAuth();
  const [username, setUsername] = useState(null);
  const navigate = useNavigate();
  const {theme} = useTheme();


  useEffect(() => {
    const fetchAvailability = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/calendar/fetch-user-availability/${user_id_param}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            'Authorization': `Bearer ${sessionStorage.getItem("token")}`,
          },
        });
        
        if (!res.ok) throw new Error("Failed to fetch availability");

        const data = await res.json();
        console.log(data);
        setAvailability(data);
      } catch (err) {
        setError(err.message);
      }
    };

    const fetchUserName = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/users/fetch-username?user_id=${user_id_param}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            'Authorization': `Bearer ${sessionStorage.getItem("token")}`,
          },
        });
        
        if (!res.ok) throw new Error("Failed to fetch username");

        const data = await res.json();
        console.log("XTZ ", data);
        setUsername(data);
      } catch (err) {
        setError(err.message);
      }
    }

    if (user_id_param && user_id) {
      if (user_id === user_id_param)
      {
        navigate(`/event/${event_id}/your-calendar`)
      } else
      {
        setLoading(true);
        fetchAvailability();
        fetchUserName();
        setLoading(false);
      }
    }
  }, [user_id_param, user_id]);

  if (error) return <PageError error={error?.message ? error?.message : "Something Went Wrong"} page={"Attendees Calender"} />;

  if (loading) return <div className="loader"><p>Fetching Attendees Calender</p><button onClick = {() => {navigate(`/event/${event_id}`)}} className="small-button">Cancel</button></div>;


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

      {!availability && <p>Attendee has not added any avilability yet! Please remind them too</p>}

      {!loading && !error && (
        <MyCalendar data = {calenderData} processDate = {()=>{}} userAvailability={availability} />
      )}
    </div>
  );
};

export default UserCalender;
