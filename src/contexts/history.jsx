import { createContext, useContext, useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "./auth";
import { API_BASE_URL } from "../components/App"; // Adjust this based on where your API base URL is defined
import moment from "moment-timezone";

const HistoryContext = createContext();

export const HistoryProvider = ({ children }) => {
  const [history, setHistory] = useState({ previous: null, current: null });
  const location = useLocation();
  const { user_id, authed } = useAuth();
  const [eventStatus, setEventStatus] = useState("pending");

  const acceptedPaths = ["location", "to-do", "settings", "polls", "calendar", "links", "comments"]; 


  const fetchEventStatus = async (event_id) => {
    if (!event_id) return;

    try {
      const res = await fetch(`${API_BASE_URL}/events/fetch-event-status?event_id=${event_id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${sessionStorage.getItem("token")}` // ⬅️ set Authorization header
        }
      });
      const data = await res.json();
      console.log("Event status data:", data.status);
      setEventStatus(data.status); // e.g., "active", "confirmed", "cancelled"
    } catch (error) {
      console.error("Failed to fetch event status", error);
      setEventStatus("pending");
    }
  };

  const fetchLastOpened = async (user_id) => {

    if (!user_id || user_id===undefined || user_id==="undefined") {return;}

    try {
      const response = await fetch(`${API_BASE_URL}/users/fetch-last-opened`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${sessionStorage.getItem("token")}`
        },
        body: JSON.stringify({ user_id })
      });
      if (!response.ok) {
        throw new Error("Failed to fetch last opened");
      }
      const data = await response.json();
      return data.last_opened;
    } catch (err) {
      console.error("Error fetching last opened:", err);
    }
  };

  const fetchLastUpdated = async (event_id) => {
    if (!event_id) {return};
    try {
      const response = await fetch(`${API_BASE_URL}/events/fetch-last-update`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${sessionStorage.getItem("token")}`
        },
        body: JSON.stringify({ event_id }),
      });
      if (!response.ok) {
        throw new Error("Failed to fetch last updated");
      }
      const data = await response.json();

      return data.last_updated;
    } catch (err) {
      console.error("Error fetching last updated:", err);
    }
  };

  const updateLastOpened = async (path) => {
  
    try {
      const response = await fetch(`${API_BASE_URL}/users/update-last-opened`, {
        method: "POST",
        headers: { "Content-Type": "application/json",  "Authorization": `Bearer ${sessionStorage.getItem("token")}`},
        body: JSON.stringify({
          user_id,
          path,
          timestamp: moment().utc().format(), // Ensure UTC format
        }),
      });
  
      if (!response.ok) {
        throw new Error("Failed to update last opened path");
      }
  
      const data = await response.json();
      console.log("Last opened path updated successfully:", data);
    } catch (error) {
      console.error("Error updating last opened path:", error);
    }
  };
  
  const updateEventPage = async (event_id, pathname) => {
    console.log("Updating event page last opened for event:", event_id, "at path:", pathname);
  
    try {
      const utcTime = moment().utc().format(); // Strict UTC timestamp
      console.log("UTC TIME:", utcTime);
  
      const response = await fetch(`${API_BASE_URL}/events/update-last-update`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${sessionStorage.getItem("token")}` },
        body: JSON.stringify({
          event_id,
          path: pathname,
          timestamp: utcTime, // Send UTC time
        }),
      });
  
      if (!response.ok) {
        throw new Error("Failed to update event last opened path");
      }
  
      const data = await response.json();
      console.log("Event last opened path updated successfully:", data);
    } catch (error) {
      console.error("Error updating event last opened path:", error);
    }
  };

  useEffect(() => {

    // If not logged in, we do not need to proceed with the path check
    if (!authed) return;
  
    // Check and modify the pathname if necessary
    let modifiedPath = location.pathname;
  
    // If the path is '/your-calendar', change it to '/calendar'
    if (modifiedPath === "/your-calendar") {
      modifiedPath = "/calendar";
    }
  
    // Split the modified path to check if it matches any of the accepted paths
    const pathParts = modifiedPath.split("/");
  
    if (pathParts.length > 3 && acceptedPaths.includes(pathParts[3])) {
      const currentPath = pathParts[3]; // Example: /event123/location or /event123/to-do
        // Call the API to update the last opened path
      updateLastOpened(currentPath);
    }
  
    // Update the history state to keep track of the previous and current path
    setHistory((prev) => ({
      previous: prev.current,
      current: modifiedPath,
    }));
  }, [location, authed, user_id]); // Dependency array ensures it runs when location or auth changes
  

  return (
    <HistoryContext.Provider value={{ history, eventStatus, fetchEventStatus, updateEventPage, updateLastOpened, fetchLastUpdated, fetchLastOpened}}>
      {children}
    </HistoryContext.Provider>
  );
};

export const useHistory = () => useContext(HistoryContext);
