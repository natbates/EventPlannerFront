import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/auth";
import useFetchEventData from "../../hooks/useFetchEventData";
import { API_BASE_URL } from "../../components/App";
import { useNavigate } from "react-router-dom";

const formatDate = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toISOString().split("T")[0];
};

const Settings = () => {
    const { data: eventData, error, loading, event_id, refetch, goEventPage } = useFetchEventData("settings/fetch-settings");
    const { user_id, email, name, role, LogIn} = useAuth();
    const navigate = useNavigate();

    const [isEditing, setIsEditing] = useState({
        title: false,
        description: false,
        earliest_date: false,
        latest_date: false,
        duration: false,
    });

    const [editedEvent, setEditedEvent] = useState({
        title: "",
        description: "",
        earliest_date: "",
        latest_date: "",
        duration: 0,
    });

    const [userEditing, setUserEditing] = useState(false);
    const [editedUser, setEditedUser] = useState({
        name: name || "",
        email: email || "",
    });

    useEffect(() => {
        if (eventData && eventData.event) {
            setEditedEvent({
                title: eventData.event.title || "",
                description: eventData.event.description || "",
                earliest_date: eventData.event.earliest_date || "",
                latest_date: eventData.event.latest_date || "",
                duration: eventData.event.duration || 0,
            });
        }
    }, [eventData]);

    const handleEditClick = (field) => {
        setIsEditing((prev) => ({
            ...prev,
            [field]: !prev[field],
        }));

        if (isEditing[field]) {
            handleSubmit();
        }
    };

    const handleUserEditClick = async () => {
        if (userEditing) {
            await handleUserSubmit();
        }
        setUserEditing(!userEditing);
    };

    const handleUserInputChange = (e, field) => {
        setEditedUser({
            ...editedUser,
            [field]: e.target.value,
        });
    };

    const handleUserSubmit = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/users/update-user`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    user_id,
                    name: editedUser.name,
                    email: editedUser.email,
                    event_id,
                }),
            });
    
            const data = await response.json(); // ← Try to read the message even on error
    
            if (!response.ok) {
                throw new Error(data.message || "Failed to update user info");
            }
    
            alert("User information updated!");
            LogIn(editedUser.email, event_id);
        } catch (error) {
            console.error("Error updating user:", error);
            alert("There was a problem updating your user information. " + error.message);
            setEditedUser({
                name: name || "",
                email: email || "",
            });
        }
    };
    

    const migrateEvent = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/events/migrate-event`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ event_id }),
            });

            const data = await response.json();

            if (response.ok) {
                alert("Event successfully migrated to a new event ID.");
                navigate(`/event/${data.new_event_id}`);
            } else {
                alert(data.message || "Failed to migrate the event.");
            }
        } catch (error) {
            console.error("Error migrating event:", error);
            alert("An error occurred while migrating the event.");
        }
    };

    const handleInputChange = (e, field) => {
        setEditedEvent({
            ...editedEvent,
            [field]: e.target.value,
        });
    };

    const handleSubmit = async () => {
        const formattedEvent = {
            ...editedEvent,
            earliest_date: formatDate(editedEvent.earliest_date),
            latest_date: formatDate(editedEvent.latest_date),
        };

        const response = await fetch(`${API_BASE_URL}/events/update-event`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
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
            refetch();
        } else {
            alert("Failed to update event details.");
        }
    };

    return (
        <div className="settings">
            <div className="top-line">
                <button className="back-button" onClick={() => { goEventPage(); }}>
                    <img src="/svgs/back-arrow.svg" alt="Back" />
                </button>
                <h2>Settings</h2>
            </div>

            {user_id && (
                <div className="user-info">
                    <p>User ID: {user_id}</p>
                    <p>
                        <strong>Name:</strong>{" "}
                        {userEditing ? (
                            <input
                                type="text"
                                value={editedUser.name}
                                onChange={(e) => handleUserInputChange(e, "name")}
                            />
                        ) : (
                            <span>{name}</span>
                        )}
                    </p>
                    <p>
                        <strong>Email:</strong>{" "}
                        {userEditing ? (
                            <input
                                type="email"
                                value={editedUser.email}
                                onChange={(e) => handleUserInputChange(e, "email")}
                            />
                        ) : (
                            <span>{email}</span>
                        )}
                    </p>
                    <p>Role: {role}</p>
                    <button onClick={handleUserEditClick}>
                        {userEditing ? "Save Info" : "Edit Info"}
                    </button>
                </div>
            )}

            {eventData && (
                <div>
                    {/* Title */}
                    <p>
                        <strong>Title:</strong>{" "}
                        {isEditing.title ? (
                            <input
                                type="text"
                                value={editedEvent.title}
                                onChange={(e) => handleInputChange(e, "title")}
                            />
                        ) : (
                            <span>{eventData.event.title}</span>
                        )}
                        <button onClick={() => handleEditClick("title")}>
                            {isEditing.title ? "Save" : "Edit"}
                        </button>
                    </p>

                    {/* Description */}
                    <p>
                        <strong>Description:</strong>{" "}
                        {isEditing.description ? (
                            <textarea
                                value={editedEvent.description}
                                onChange={(e) => handleInputChange(e, "description")}
                            />
                        ) : (
                            <span>{eventData.event.description}</span>
                        )}
                        <button onClick={() => handleEditClick("description")}>
                            {isEditing.description ? "Save" : "Edit"}
                        </button>
                    </p>

                    {/* Dates */}
                    <p>
                        <strong>Earliest Date:</strong>{" "}
                        {isEditing.earliest_date ? (
                            <input
                                type="date"
                                value={editedEvent.earliest_date}
                                onChange={(e) => handleInputChange(e, "earliest_date")}
                            />
                        ) : (
                            <span>{formatDate(eventData.event.earliest_date)}</span>
                        )}
                        <button onClick={() => handleEditClick("earliest_date")}>
                            {isEditing.earliest_date ? "Save" : "Edit"}
                        </button>
                    </p>

                    <p>
                        <strong>Latest Date:</strong>{" "}
                        {isEditing.latest_date ? (
                            <input
                                type="date"
                                value={editedEvent.latest_date}
                                onChange={(e) => handleInputChange(e, "latest_date")}
                            />
                        ) : (
                            <span>{formatDate(eventData.event.latest_date)}</span>
                        )}
                        <button onClick={() => handleEditClick("latest_date")}>
                            {isEditing.latest_date ? "Save" : "Edit"}
                        </button>
                    </p>

                    {/* Duration */}
                    <p>
                        <strong>Duration:</strong>{" "}
                        {isEditing.duration ? (
                            <input
                                type="number"
                                max={50}
                                value={editedEvent.duration}
                                onChange={(e) => handleInputChange(e, "duration")}
                            />
                        ) : (
                            <span>{eventData.event.duration} days</span>
                        )}
                        <button onClick={() => handleEditClick("duration")}>
                            {isEditing.duration ? "Save" : "Edit"}
                        </button>
                    </p>
                </div>
            )}

            <button onClick={migrateEvent}>Migrate Event</button>
        </div>
    );
};

export default Settings;
