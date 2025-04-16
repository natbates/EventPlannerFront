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
  const [isFavouritePopupVisible, setFavouritePopupVisible] = useState(false);

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

  const showFavouritePopup = () => {
    if (false)
    {
      setTimeout(() => {
        setFavouritePopupVisible(true);
      }, 3000); // 3000 milliseconds = 3 seconds
    }
  };
  
  // Function to close the "Add to Favourites" pop-up
  const closeFavouritePopup = () => {
    setFavouritePopupVisible(false);
  };

  const handleAddToFavourites = () => {
    const title = document.title;
    const url = window.location.href;
  
    // Ensure it's an event page (adjust the regex if your route is different)
    const isEventPage = /^https?:\/\/[^/]+\/event\/[^/]+$/.test(url);
  
    if (!isEventPage) {
      return;
    }
  
    // Detect browser
    const isFirefox = navigator.userAgent.toLowerCase().includes("firefox");
    const isIE = window.external && "AddFavorite" in window.external;
  
    if (isIE) {
      window.external.AddFavorite(url, title);
    } else if (isFirefox) {
      alert("Press Ctrl+D (or ⌘+D on Mac) to bookmark this page.");
    } else {
      alert("Press Ctrl+D (or ⌘+D on Mac) to add this page to your favourites.");
    }
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

  const storedTheme = localStorage.getItem("theme") || "light";

  console.log("Stored theme:", storedTheme);

  return (
    <NotificationContext.Provider value={{ notify, setNotifyLoad, notifyLoad, showFavouritePopup}}>
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

      {isFavouritePopupVisible && (
        <div className="popup-overlay">
          <div className="popup-extra-cancel" onClick={closeFavouritePopup}>✕</div>
          <div className="popup-content">

            {storedTheme === "light" ? 
            <img className="pop-up-cat" src="/svgs/cats/happycat.svg" alt="Happy Cat" /> :
            <img className="pop-up-cat" src="/svgs/cats/happycat-white.svg" alt="Happy Cat" />}
            
            <h2>Add to Favourites</h2>
            <p>Would you like to add this page to your favourites?</p>
            
            <div className="button-container">
            <button className="small-button" onClick={closeFavouritePopup}>Close</button>
            <button
              onClick={handleAddToFavourites}
              className="small-button"
            >
              ⭐ Add to Favourites
            </button>
            </div>
          </div>
        </div>
      )}

    </NotificationContext.Provider>
  );
};

// Hook to use Notifications
export const useNotification = () => {
  return useContext(NotificationContext);
};
