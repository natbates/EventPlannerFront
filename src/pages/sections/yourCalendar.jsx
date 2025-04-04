import { useEffect, useState } from "react";
import { API_BASE_URL } from "../../components/App";
import { useAuth } from "../../contexts/auth";
import useFetchEventData from "../../hooks/useFetchEventData";
import MyCalendar from "../../components/Calender";
import { useHistory } from "../../contexts/history";

const YourCalendar = () => {
    const { data: calenderData, error, loading, event_id, refetch, goEventPage } = useFetchEventData("calendar/fetch-calendar");
    const [userAvailability, setUserAvailability] = useState();
    const { user_id, name, role } = useAuth();
    const { updateEventPage, updateLastOpened } = useHistory();

    console.log(calenderData);

    const processDate = async (date) => {
        // Get the current status or default to "not available"
        const currentStatus = userAvailability?.[date] || null;
      
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
      
        try {
          const response = await fetch(`${API_BASE_URL}/calendar/set-availability`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              user_id: user_id,
              date: date,
              status: newStatus, // Send null to remove from availability
            }),
          });
      
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Failed to set availability");
          }
      
          const responseData = await response.json();
          console.log("Availability updated successfully:", responseData);
          updateEventPage(event_id, "calender");
          updateLastOpened("calender");
          fetchUserAvailability();
    
        } catch (err) {
          console.error("Error setting availability:", err);
        }
    };

    const fetchUserAvailability = async () => {
        if (!user_id) return;

        try {
            const response = await fetch(`${API_BASE_URL}/calendar/fetch-user-availability/${user_id}`);
            if (!response.ok) {
                throw new Error(`Error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            setUserAvailability(data);
        } catch (error) {
            console.error("Error fetching user availability:", error);
            setUserAvailability(null);
        }
    };

    // Function to clear availability for the user
    const clearAvailability = async () => {
        if (!user_id) return;

        try {
            const response = await fetch(`${API_BASE_URL}/calendar/clear-availability`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    user_id: user_id,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Failed to clear availability");
            }

            // Clear local state after successful request
            setUserAvailability({});
            console.log("Availability cleared successfully!");
            fetchUserAvailability(); // Re-fetch the availability data if needed

        } catch (err) {
            console.error("Error clearing availability:", err);
        }
    };

    useEffect(() => { fetchUserAvailability(); }, [user_id]);

    return (
        <div>
            <div className="top-line">
              <button className="back-button" onClick={() => { goEventPage(); }}>
                <img src="/svgs/back-arrow.svg" alt="Back" />
              </button>
              <h2>Your Calender</h2>
            </div>
            <MyCalendar data={calenderData} processDate={processDate} userAvailability={userAvailability} />  

            {/* Clear Availability Button */}
            <button onClick={clearAvailability} style={{marginTop: '20px', backgroundColor: 'red', color: 'white'}}>
                Clear Availability
            </button>
        </div>
    );
}

export default YourCalendar;
