import { useEffect, useState } from "react";
import { API_BASE_URL } from "../../components/App";
import { useAuth } from "../../contexts/auth";
import useFetchEventData from "../../hooks/useFetchEventData";
import MyCalendar from "../../components/Calender";
import { useHistory } from "../../contexts/history";
import PageError from "../../components/PageError";
import { useNotification } from "../../contexts/notification";
import { useTheme } from "../../contexts/theme";
import { useNavigate } from "react-router-dom";

const YourCalendar = () => {
    const { data: calenderData, error, loading, event_id, refetch, goEventPage } = useFetchEventData("calendar/fetch-calendar");
    const [userAvailability, setUserAvailability] = useState();
    const { user_id, name, role } = useAuth();
    const { updateEventPage, updateLastOpened } = useHistory();
    const { notify, setNotifyLoad } = useNotification();
    const [secondaryloading, setSecondaryLoading] = useState(true);
    const [pendingAvailability, setPendingAvailability] = useState(false);
    const {theme} = useTheme();
    const navigate = useNavigate();

    const updateAvailability = async () => {
      setNotifyLoad(true);
    
      // Construct the payload for all the changed dates and their statuses
      const updates = Object.keys(pendingAvailability).map(date => ({
        date: date,
        status: pendingAvailability[date], // status from the updated state
      }));
    
      try {
        const response = await fetch(`${API_BASE_URL}/calendar/set-availability`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${sessionStorage.getItem("token")}`
          },
          body: JSON.stringify({
            user_id: user_id,
            updates: updates, // Send all date changes in one request
          }),
        });
    
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to set availability");
        }
    
        const responseData = await response.json();
        updateEventPage(event_id, "calender");
        updateLastOpened("calender");
        fetchUserAvailability(); // Refetch to reflect changes
    
      } catch (err) {
        console.error("Error setting availability:", err);
        notify("Error setting availability");
      } finally {
        setNotifyLoad(false);
      }
    };    

    const processDate = async (date) => {

        // Get the current status or default to "not available"
        const currentStatus = (pendingAvailability && pendingAvailability[date]) ?? null;


        // Define the new status cycle
        let newStatus;
        if (currentStatus === "available") {
          newStatus = "not available";
        } else if (currentStatus === "not available") {
          newStatus = "tentative";
        } else if (currentStatus === "tentative") {
          newStatus = null; // "Remove" - deletes the date from availability
        } else {
          newStatus = "available"; // Default cycle
        }

        setPendingAvailability((prev) => {
          const updated = { ...prev, [date]: newStatus };
      
          return { ...updated }; // Return the updated state
      });

    };

    const fetchUserAvailability = async () => {
        if (!user_id) return;

        try {
          setSecondaryLoading(true);
          const response = await fetch(`${API_BASE_URL}/calendar/fetch-user-availability/${user_id}`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${sessionStorage.getItem("token")}`,
              'Content-Type': 'application/json',
              },
            });

            if (!response.ok) {
                throw new Error(`Error: ${response.status} ${response.statusText}`);
            }
            const data = await response.json();
            setUserAvailability(data);
            setPendingAvailability(data);
        } catch (error) {
            console.error("Error fetching user availability:", error);
            setUserAvailability(null);
        } finally {
          setSecondaryLoading(false);
        }
    };

    // Function to clear availability for the user
    const clearAvailability = async () => {
      if (!user_id) return;
  
      const confirmClear = window.confirm("Are you sure you want to clear your availability? This action cannot be undone.");
  
      if (!confirmClear) return;
  
      try {
        setNotifyLoad(true);
          const response = await fetch(`${API_BASE_URL}/calendar/clear-availability`, {
              method: "POST",
              headers: {
                  "Content-Type": "application/json",
                  "Authorization": `Bearer ${sessionStorage.getItem("token")}`
              },
              body: JSON.stringify({
                  user_id: user_id,
              }),
          });
  
          if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.message || "Failed to clear availability");
          }
  
          setUserAvailability({});
          setPendingAvailability({});
          fetchUserAvailability();
      } catch (err) {
          console.error("Error clearing availability:", err);
      } finally {
        setNotifyLoad(false);
      }
    };

    useEffect(() => {if (!error){fetchUserAvailability();} }, [user_id]);

    if (error) return <PageError error={error?.message ? error?.message : "Something Went Wrong"} page={"Your Calendar"} />;

    if (loading || secondaryloading) return <div className="loader"><p>Fetching Calendar</p><button onClick = {() => {navigate(`/event/${event_id}`)}} className="small-button">Cancel</button></div>;


    return (
        <div className="your-calendar">
            <div className="top-line">
              <button className="back-button" onClick={() => { goEventPage(); }}>
                    {theme === "dark" ? 
                      <img src="/svgs/back-arrow-white.svg" alt="Back" /> :
                    <img src="/svgs/back-arrow.svg" alt="Back" />}
                </button>
              <h2>Your Calendar</h2>
            </div>

            {calenderData.earliest_date !== calenderData.latest_date && (() => {
              const start = new Date(calenderData.earliest_date);
              const end = new Date(calenderData.latest_date);

              const sameYear = start.getFullYear() === end.getFullYear();

              const getOrdinal = (n) => {
                const s = ["th", "st", "nd", "rd"];
                const v = n % 100;
                return n + (s[(v - 20) % 10] || s[v] || s[0]);
              };

              const formatDate = (date, includeYear) => {
                const day = getOrdinal(date.getDate());
                const month = date.toLocaleString(undefined, { month: "long" });
                const year = date.getFullYear();
                return `${day} of ${month}${includeYear ? ` ${year}` : ''}`;
              };

              const startFormatted = formatDate(start, !sameYear);
              const endFormatted = formatDate(end, true);

              return <h3 className="date-range">Availability Range: {startFormatted} to {endFormatted}</h3>;
            })()}

            <MyCalendar data={calenderData} processDate={processDate} userAvailability={pendingAvailability} />  

            {/* Clear Availability Button */}
            <div className="your-calender-bottom">

              <div className="legend">

                <div className="legend-item available">
                  <div className="legend-color"></div>
                  <p>Available</p>
                </div>
                <div className="legend-item not-available">
                  <div className="legend-color"></div>
                  <p>Not Available</p>
                </div>
                <div className="legend-item tentative">
                  <div className="legend-color"></div>
                  <p>Tentative</p>
                </div>

              </div>

              <div className="button-container">
                <button className = "small-button" onClick={clearAvailability}>
                    Clear Availability
                </button>
                <button disabled={JSON.stringify(userAvailability) === JSON.stringify(pendingAvailability)} className="small-button" onClick={() => { setPendingAvailability(userAvailability); }}>
                    Cancel
                </button>
                <button disabled={JSON.stringify(userAvailability) === JSON.stringify(pendingAvailability)} className="small-button" onClick={() => { updateAvailability(pendingAvailability); }}>
                    Save
                </button>
              </div>
            </div>
        </div>
    );
}

export default YourCalendar;
