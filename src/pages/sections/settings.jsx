import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/auth";
import useFetchEventData from "../../hooks/useFetchEventData";
import { API_BASE_URL } from "../../components/App";
import { useNavigate } from "react-router-dom";
import "../../styles/settings.css";
import ProfileSelector from "../../components/ProfileSelector";
import { useNotification } from "../../contexts/notification";
import PageError from "../../components/PageError";
import { useTheme } from "../../contexts/theme";
import { charLimits } from "../createEvent";

const formatDate = (dateString) => {
    if (!dateString) return "";
    let date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Month is zero-based
    const day = String(date.getDate()).padStart(2, '0');
    const formattedDate = `${year}-${month}-${day}`;
    return formattedDate;
};

const Settings = () => {
    const { data: eventData, error, loading, event_id, refetch, goEventPage, setError} = useFetchEventData("settings/fetch-settings");
    const { user_id, email, name, role, LogIn, profile_pic} = useAuth();
    const navigate = useNavigate();
    const {notify, setNotifyLoad} = useNotification();
    const [updating, setUpdating] = useState(false);
    const [eventUpdating, setEventUpdating] = useState(false);
    const {theme} = useTheme();

    const [isEditing, setIsEditing] = useState({
        title: false,
        description: false,
        earliest_date: false,
        latest_date: false,
        duration: false,
    });

    const [initialEvent, setInitialEvent] = useState({
        title: "",
        description: "",
        earliest_date: "",
        latest_date: "",
        duration: 0,
    });

    const [editedEvent, setEditedEvent] = useState({
        title: "",
        description: "",
        earliest_date: "",
        latest_date: "",
        duration: 0,
    });

    const [initialUser, setInitialUser] = useState({
        firstName: name ? name.split(" ")[0] : "",
        lastName: name && name.split(" ").length > 1 ? name.split(" ").slice(1).join(" ") : "",
        email: email || "",
        profile_pic: profile_pic || 0,
    });

    const [editedUser, setEditedUser] = useState({
        firstName: name ? name.split(" ")[0] : "",
        lastName: name && name.split(" ").length > 1 ? name.split(" ").slice(1).join(" ") : "",
        email: email || "",
        profile_pic: profile_pic || 0,
    });

    useEffect(() => {

        if (eventData && eventData.event) {
            const event = eventData.event;
            setInitialEvent({
                title: event.title || "",
                description: event.description || "",
                earliest_date: formatDate(event.earliest_date),
                latest_date: formatDate(event.latest_date),
                duration: event.duration || 0,
            });
            setEditedEvent({
                title: event.title || "",
                description: event.description || "",
                earliest_date: formatDate(event.earliest_date),
                latest_date: formatDate(event.latest_date),
                duration: event.duration || 0,
            });
        }
    }, [eventData]);

    const handleUserInputChange = (e, field) => {
        let value = e.target.value;
    
        // Check if the field is 'firstName' or 'lastName'
        if (field === "firstName" || field === "lastName") {
            // Remove any spaces
            value = value.replace(/\s+/g, '');
    
            // Remove any numbers
            value = value.replace(/[0-9]/g, '');
    
        }
    
        // Update the state with the validated value
        setEditedUser({
            ...editedUser,
            [field]: value,
        });
    };
    
    const handleUserSubmit = async () => {

        if (!user_id) {notify("User ID is not available."); return;}

        try {
            setUpdating(true);
            setNotifyLoad(true);
            const response = await fetch(`${API_BASE_URL}/users/update-user`, {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${sessionStorage.getItem("token")}`},
                body: JSON.stringify({
                    user_id,
                    name: `${editedUser.firstName} ${editedUser.lastName}`,
                    email: editedUser.email,
                    event_id,
                    profile_pic: editedUser.profile_pic,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error("Failed to update user info");
            }

            notify("Info updated successfully.");
            const isAuthed = await LogIn(editedUser.email, event_id);
            if (isAuthed)
            {
                setInitialUser({
                    firstName: editedUser.firstName,
                    lastName: editedUser.lastName,
                    email: editedUser.email,
                    profile_pic: editedUser.profile_pic || 0, // Update with the correct profile_pic if available
                });
            }    
        } catch (error) {
            console.error("Error updating user:", error);
            notify("There was a problem updating your user information. ");
            setEditedUser(initialUser);
        } finally{
            setNotifyLoad(false);
            setUpdating(false);
        }
    };

    const handleCancelEdit = () => {
        setEditedUser(initialUser);
    };

    const handleCancelEditEvent = () => {
        setEditedEvent(initialEvent);
    }

    const deleteEvent = async () => {

        const isConfirmed = window.confirm("Are you sure you want to delete this event? This action cannot be undone.");
    
        if (!isConfirmed) {
            return; // Stop the function if the user cancels
        }
    
        try {
            setNotifyLoad(true);
            const response = await fetch(`${API_BASE_URL}/events/delete-event`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${sessionStorage.getItem("token")}`},
                body: JSON.stringify({ event_id }),
            });
    
            const data = await response.json();
    
            if (response.ok) {
                notify("Event successfully deleted.");
                navigate(`/`);
            } else {
                notify(data.message || "Failed to delete the event.");
            }
        } catch (error) {
            console.error("Error deleting the event:", error);
            notify("An error occurred while deleting the event.");
        } finally {
            setNotifyLoad(false);
        }
    };

    const migrateEvent = async () => {
        // Display a confirmation prompt
        const isConfirmed = window.confirm("Are you sure you want to migrate this event? This action cannot be undone.");
    
        if (!isConfirmed) {
            return; // Stop the function if the user cancels
        }
    
        try {
            setNotifyLoad(true);
            const response = await fetch(`${API_BASE_URL}/events/migrate-event`, {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${sessionStorage.getItem("token")}` },
                body: JSON.stringify({ event_id }),
            });
    
            const data = await response.json();
    
            if (response.ok) {
                notify("Event successfully migrated to a new event ID.");
                navigate(`/event/${data.new_event_id}`);
            } else {
                notify(data.message || "Failed to migrate the event.");
            }
        } catch (error) {
            console.error("Error migrating event:", error);
            notify("An error occurred while migrating the event.");
        } finally {
            setNotifyLoad(false);
        }
    };
    
    const handleInputChange = (e, field) => {
        let value = e.target.value;
    
        // If the field is 'duration', ensure the value is capped at 50
        if (field === "duration") {
            value = Math.min(Number(value), 50); // Cap the value at 50
        }
    
        setEditedEvent({
            ...editedEvent,
            [field]: value,
        });
    }

    const handleLeaveEvent = async () => {
        // Display a confirmation prompt
        const isConfirmed = window.confirm("Are you sure you want to leave this event? This action cannot be undone.");
    
        if (!isConfirmed) {
            return; // Stop the function if the user cancels
        }
    
        try {
            setNotifyLoad(true);
            const response = await fetch(`${API_BASE_URL}/users/leave-event`, {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${sessionStorage.getItem("token")}`},
                body: JSON.stringify({ event_id, user_id }),
            });
    
            const data = await response.json();
    
            if (response.ok) {
                notify("Event successfully left.");
                navigate(`/`);
            } else {
                notify(data.message || "Failed to leave the event.");
            }
        } catch (error) {
            console.error("Error leaving event:", error);
            notify("An error occurred while leaving the event.");
        } finally {
            setNotifyLoad(false);
        }
    };

    const handleSubmit = async () => {

        const earliestDate = new Date(editedEvent.earliest_date);
        const latestDate = new Date(editedEvent.latest_date);
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Set to midnight to ignore time part
    
        // Calculate the duration in days between earliest and latest date
        const millisecondsPerDay = 1000 * 60 * 60 * 24;
        const calculatedDuration = Math.floor((latestDate - earliestDate) / millisecondsPerDay) + 1; 
            
        // Check if earliestDate is before latestDate
        if (earliestDate > latestDate) {
            notify("Earliest date must be before the latest date.");
            return;
        }
    
        // Check if the earliestDate is before today's date
        if (earliestDate < today) {
            notify("Earliest date must be today or in the future.");
            return;
        }
    
        // Check if the duration between the dates matches the user's entered duration
        if (calculatedDuration < editedEvent.duration) {
            notify("The duration between the earliest and latest date doesn't match the duration.");
            return;
        }
    
        setEventUpdating(true);

        const formattedEvent = {
            ...editedEvent,
            earliest_date: editedEvent.earliest_date,
            latest_date: editedEvent.latest_date,
        };

        try {

            setNotifyLoad(true);
            const response = await fetch(`${API_BASE_URL}/events/update-event`, {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${sessionStorage.getItem("token")}`},
                body: JSON.stringify({
                    event_id,
                    ...formattedEvent,
                }),
            });

            if (response.ok) {
                setIsEditing({
                    title: false,
                    description: false,
                    earliest_date: false,
                    latest_date: false,
                    duration: false,
                });
                await refetch();
                setEventUpdating(false);


            } else {
                throw new Error("Failed to update event info");
            } 
        } catch (error) {
            console.error("Error updating event:", error);
            notify("There was a problem updating the event details.");
        } finally {
            setEventUpdating(false);
            setNotifyLoad(false);
        }
    };

    if (error) return <PageError error={error?.message ? error?.message : "Something Went Wrong"} page={"Settings"} />;

    if (loading) return <div className="loader"><p>Fetching Settings</p><button onClick = {() => {navigate(`/event/${event_id}`)}} className="small-button">Cancel</button></div>;

    return (
        <div className="settings">
            <div className="top-line">
                <button className="back-button" onClick={() => { goEventPage(); }}>
                  {theme === "dark" ? 
                    <img src="/svgs/back-arrow-white.svg" alt="Back" /> :
                  <img src="/svgs/back-arrow.svg" alt="Back" />}
                </button>
                <h2>Settings</h2>
            </div>

            <div className="section user-settings">
                <h3>User Settings</h3>
                {user_id && (
                    <div className="user-info">
                        <div className="one-line-input">
                            <div className="settings-input">
                                <label>First Name:</label>{" "}
                                <div className="poll-input-container">
                                    <input
                                        type="text"
                                        value={editedUser.firstName}
                                        onChange={(e) => handleUserInputChange(e, "firstName")}
                                        maxLength={charLimits.firstName}
                                        pattern="[A-Za-z]*"
                                        onInput={(e) => {
                                            // Capitalize first letter, rest lowercase
                                            const value = e.target.value;
                                            const formattedValue =
                                                value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
                                            e.target.value = formattedValue;
                                        }}
                                        
                                    />
                                    <p className="character-counter">{editedUser.firstName.length}/{charLimits.firstName}</p>
                                </div>
                            </div>
                            <div className="settings-input">
                                <label>Last Name:</label>{" "}
                                <div className="poll-input-container">
                                    <input
                                        type="text"
                                        value={editedUser.lastName}
                                        onChange={(e) => handleUserInputChange(e, "lastName")}
                                        maxLength={charLimits.lastName}
                                        pattern="[A-Za-z]*"
                                        onInput={(e) => {
                                            // Capitalize first letter, rest lowercase
                                            const value = e.target.value;
                                            const formattedValue =
                                                value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
                                            e.target.value = formattedValue;
                                        }}
                                    />
                                    <p className="character-counter">{editedUser.lastName.length}/{charLimits.lastName}</p>
                                </div>
                            </div>
                        </div>
                        <div className="settings-input">
                            <label>Email:</label>
                            <div className="poll-input-container">
                            <input
                                type="email"
                                value={editedUser.email}
                                onChange={(e) => handleUserInputChange(e, "email")}
                                maxLength={charLimits.email}
                            />
                              <p className="character-counter">{editedUser.email.length}/{charLimits.email}</p>
                            </div>
                        </div>
                        <div className="settings-profile-input">
                            <label>Profile Picture:</label>
                            <ProfileSelector index = {Number(editedUser?.profile_pic)} onSelect={(newIndex) => setEditedUser({ ...editedUser, profile_pic: newIndex })} />
                        </div>
                        <div className="settings-buttons-user">
                            {role != "organiser" ? (
                            <button className="small-button leave-event" onClick={handleLeaveEvent}>Leave Event</button>) : <div></div>}
                            <div className="button-container">
                                <button className="small-button" onClick={handleCancelEdit}     disabled={
                                    initialUser.firstName === editedUser.firstName &&
                                    initialUser.lastName === editedUser.lastName &&
                                    initialUser.email === editedUser.email &&
                                    initialUser.profile_pic === editedUser.profile_pic
                                }>
                                    Cancel
                                </button>
                                <button  className="small-button" onClick={handleUserSubmit} disabled={
                                    updating ||
                                    (initialUser.firstName === editedUser.firstName &&
                                    initialUser.lastName === editedUser.lastName &&
                                    initialUser.email === editedUser.email &&
                                    initialUser.profile_pic === editedUser.profile_pic)
                                }>
                                    Save Info
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            
            {role === "organiser" && (
            <div className="section event-settings">
                <h3>Event Settings</h3>
                {eventData && (
                    <div>
                        {/* Title */}
                        <div className="settings-input">
                            <label>Title:</label>{" "}
                            <div className="poll-input-container">
                                <input
                                    type="text"
                                    value={editedEvent.title}
                                    onChange={(e) => handleInputChange(e, "title")}
                                    maxLength={charLimits.title}
                                />
                                <p className="character-counter">{editedEvent.title.length}/{charLimits.title}</p>
                            </div>
                        </div>

                        {/* Description */}
                        <div className="settings-input">
                            <label>Description:</label>{" "}
                            <div className="poll-input-container">
                            <textarea
                                value={editedEvent.description}
                                onChange={(e) => handleInputChange(e, "description")}
                                maxLength={charLimits.description}
                            />
                            <p className="character-counter-bottom">{editedEvent.description.length}/{charLimits.description}</p>
                            </div>
                        </div>

                        {/* Dates */}
                        <div className="one-line-input">
                            <div className="settings-input">
                                <label>Earliest Date:</label>{" "}
                                <input
                                    type="date"
                                    value={editedEvent.earliest_date}
                                    onChange={(e) => handleInputChange(e, "earliest_date")}
                                />
                        </div>

                            <div className="settings-input">
                                <label>Latest Date:</label>{" "}
                                <input
                                    type="date"
                                    value={editedEvent.latest_date}
                                    onChange={(e) => handleInputChange(e, "latest_date")}
                                />
                            </div>
                        </div>

                        {/* Duration */}
                        <div className="settings-input">
                            <label>Duration:</label>{" "}
                            <input
                                type="number"
                                max={50}
                                value={editedEvent.duration}
                                onChange={(e) => handleInputChange(e, "duration")}
                            />
                        </div>
                        <div className="settings-buttons-event">
                            <div className="button-container">
                                <button className="small-button delete-event" onClick={deleteEvent}>Delete Event</button>
                                <button className="small-button" onClick={migrateEvent}>Migrate Event</button>
                            </div>
                            <div className="button-container">
                                <button className="small-button" onClick={handleCancelEditEvent}     disabled={
                                    initialEvent.title === editedEvent.title &&
                                    initialEvent.description === editedEvent.description &&
                                    initialEvent.earliest_date === editedEvent.earliest_date &&
                                    initialEvent.latest_date === editedEvent.latest_date &&
                                    initialEvent.duration === editedEvent.duration
                                }>
                                    Cancel
                                </button>
                                <button className="small-button" onClick={handleSubmit} disabled={
                                    eventUpdating ||
                                    (initialEvent.title === editedEvent.title &&
                                    initialEvent.description === editedEvent.description &&
                                    initialEvent.earliest_date === editedEvent.earliest_date &&
                                    initialEvent.latest_date === editedEvent.latest_date &&
                                    initialEvent.duration === editedEvent.duration)
                                }>
                                    Save Info
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>)}
        </div>
    );
};

export default Settings;
