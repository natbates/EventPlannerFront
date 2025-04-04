import { createContext, useContext, useState } from "react";

// Create Notification Context
const NotificationContext = createContext();

// Notification Provider
export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  // Function to trigger a new notification
  const notify = (message, duration = 3000) => {
    console.log("Attempting to create notification:", message);

    // Check if a notification with the same message already exists
    if (notifications.some((n) => n.message === message)) {
      console.log("Duplicate notification detected. Skipping.");
      return; // Stop if it's a duplicate
    }

    const id = Date.now(); // Unique ID for each notification

    setNotifications((prev) => [...prev, { id, message }]);

    console.log("Notification added:", message);

    // Remove notification after X seconds
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, duration);
  };

  return (
    <NotificationContext.Provider value={{ notify }}>
      {children}

      {/* Notification UI */}
      <div className="notification-container">
        {notifications.map((notification) => (
          <div key={notification.id} className="notification">
            {notification.message}
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
};

// Hook to use Notifications
export const useNotification = () => {
  return useContext(NotificationContext);
};
