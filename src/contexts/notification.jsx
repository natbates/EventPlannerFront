import { createContext, useContext, useState, useRef, useEffect } from "react";
import "../styles/notifications.css";

// Create Notification Context
const NotificationContext = createContext();

// Notification Provider
export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [notifyLoad, setNotifyLoad] = useState(false);
  const [notifyLoadExiting, setNotifyLoadExiting] = useState(false);
  const activeMessages = useRef(new Set());
  const prevNotifyLoad = useRef(notifyLoad); // Track previous state of notifyLoad

  // Function to trigger a new notification
  const notify = (message, duration = 3000) => {
    if (activeMessages.current.has(message)) {
      console.log("Duplicate notification skipped:", message);
      return;
    }

    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    activeMessages.current.add(message);
    setNotifications((prev) => [...prev, { id, message, exiting: false }]);

    setTimeout(() => {
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === id ? { ...n, exiting: true } : n
        )
      );

      setTimeout(() => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
        activeMessages.current.delete(message); // Remove from active list
      }, 300); // Match animation duration
    }, duration);
  };

  // Detect when notifyLoad changes from true to false
  useEffect(() => {
    if (prevNotifyLoad.current && !notifyLoad) {
      // Transition from true to false detected
      setNotifyLoadExiting(true); // Trigger exiting animation
      setTimeout(() => {
        setNotifyLoadExiting(false); // Reset exiting state after animation duration
      }, 300); // Match CSS transition duration
    }

    prevNotifyLoad.current = notifyLoad; // Update the previous state

    // Set timeout to notify problem after 20 seconds
    const timeoutId = setTimeout(() => {
      if (notifyLoad) {
        notify("Problem with loading. Please try again.", 5000); // Show notification after 20 seconds
        setNotifyLoad(false); // Reset notifyLoad after showing the problem notification
      }
    }, 20000); // 20 seconds timeout

    return () => clearTimeout(timeoutId); // Cleanup the timeout if component unmounts or changes
  }, [notifyLoad]);

  return (
    <NotificationContext.Provider value={{ notify, setNotifyLoad, notifyLoad }}>
      {children}

      {/* Notification UI */}
      <div className="notification-container">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`notification ${notification.exiting ? "exiting" : ""}`}
          >
            {notification.message}
          </div>
        ))}
      </div>

      {/* Notification loader */}
      {notifyLoad || notifyLoadExiting ? ( // Show during loading or exiting
        <div
          className={`notification-load-container ${
            notifyLoadExiting ? "exiting" : ""
          }`}
        >
          <div className="notification-load">
            <div className="loader">
              <p>Loading</p>
            </div>
          </div>
        </div>
      ) : null}
    </NotificationContext.Provider>
  );
};

// Hook to use Notifications
export const useNotification = () => {
  return useContext(NotificationContext);
};
