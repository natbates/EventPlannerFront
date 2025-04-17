import { useEffect, useState } from "react";
import { API_BASE_URL } from "../../components/App";
import { useAuth } from "../../contexts/auth";
import useFetchEventData from "../../hooks/useFetchEventData";
import { SharedCalendar } from "../../components/Calender";
import { useNavigate } from "react-router-dom";
import { useNotification } from "../../contexts/notification";
import PageError from "../../components/PageError";
import { Profiles } from "../../components/ProfileSelector";
import { useTheme } from "../../contexts/theme";

const AttendeeCalendar = () => {
    const { data: calenderData, error, loading, event_id, refetch, goEventPage } = useFetchEventData("calendar/fetch-calendar");
    const [attendeeAvailability, setAttendeeAvailability] = useState();
    const { user_id, name, role } = useAuth();

    const [isSelectingDates, setIsSelectingDates] = useState(false);
    const [selectedDates, setSelectedDates] = useState(null);

    const [reminderDate, setReminderDate] = useState(""); 
    const [cancelReason, setCancelReason] = useState("");
    const [showCancelReasonInput, setShowCancelReasonInput] = useState(false);

    const [dataLoad, setDataLoad] = useState(false);
    const {theme} = useTheme();
    const navigate = useNavigate();
    const { notify, setNotifyLoad } = useNotification();

    console.log("Attendee Calendar Rendered ", attendeeAvailability);

    // Fetch attendee availability
    const fetchAttendeeAvailability = async () => {
        if (!event_id) return;

        setDataLoad(true);
    
        try {
            const response = await fetch(`${API_BASE_URL}/calendar/fetch-availability/${event_id}`, {
                method: 'GET',
                headers: {
                  'Authorization': `Bearer ${sessionStorage.getItem("token")}`,
                  'Content-Type': 'application/json', // optional if you expect JSON data
                },
              });
            if (!response.ok) throw new Error(`Error: ${response.status} ${response.statusText}`);
            const data = await response.json();
            setAttendeeAvailability(data);
        } catch (error) {
            console.error("Error fetching user availability:", error);
            setAttendeeAvailability(null);
        } finally {
            setDataLoad(false);
        }
    };
    
    useEffect(() => { fetchAttendeeAvailability(); }, [event_id]);

    // Function to check if a date is within the event duration
    const getDateWithoutTime = (date) => {
        const d = new Date(date);
        return new Date(d.getFullYear(), d.getMonth(), d.getDate()); // Time is reset to 00:00:00
    };
    
    const isDateWithinEventDuration = (date) => {
        if (!calenderData || !calenderData.duration) return false;
    
        const eventStartDate = getDateWithoutTime(calenderData.earliest_date);
        const eventEndDate = getDateWithoutTime(calenderData.latest_date);
        const selectedDate = getDateWithoutTime(date);
    
        return selectedDate >= eventStartDate && selectedDate <= eventEndDate;
    };
    
    // Select or Deselect Chosen Days
    const selectChosenDays = async (date) => {

        console.log("Selected date:", date);

        // Check if the date is within the event duration before proceeding
        if (!isDateWithinEventDuration(date)) {
            notify("You cannot select this date, it is outside the event duration.");
            return;
        }
    
        setSelectedDates((prevSelectedDates = []) => { // Default to empty array
            const isSelected = prevSelectedDates?.includes(date);
    
            // Prevent adding duplicate dates
            if (isSelected) {
                // If the date is already selected, remove it
                return prevSelectedDates.filter((selectedDate) => selectedDate !== date);
            }
    
            // Prevent exceeding max selection
            if (prevSelectedDates?.length >= calenderData.duration) {
                notify(`Max amount of chosen days selected (${calenderData.duration})`);
                return prevSelectedDates;
            }
    
            // Add the new date
            console.log(prevSelectedDates);
            if (prevSelectedDates != null)  return [...prevSelectedDates, date];
            else { return [date]}
        });
    };
    
    // Confirm Event
    const confirmEvent = async () => {

        if ( selectedDates?.length != calenderData.duration)
        {
            notify("please select all chosen days before confirming")
            return;
        }
        
        if (reminderDate) {
            const today = new Date();
            const reminder = new Date(reminderDate);
            const earliestChosen = new Date(
                Math.min(...selectedDates.map((dateStr) => new Date(dateStr)))
            );
        
            // Reset time to midnight for comparison
            today.setHours(0, 0, 0, 0);
            reminder.setHours(0, 0, 0, 0);
            earliestChosen.setHours(0, 0, 0, 0);
        
            if (reminder < today) {
                notify("Reminder date cannot be in the past.");
                return;
            }
        
            if (reminder > earliestChosen) {
                notify("Reminder date must be on or before the earliest selected date.");
                return;
            }
        }

        const confirmed = window.confirm(
            "Are you sure you want to confirm the event?"
        );
    
        if (!confirmed) {
            return; // Exit if user cancels
        }
        
        setNotifyLoad(true);
        try {
            const response = await fetch(`${API_BASE_URL}/events/confirm-event`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${sessionStorage.getItem("token")}`
                },
                body: JSON.stringify({ 
                    event_id, 
                    reminder_date: reminderDate, 
                    selectedDates 
                })
            });
            
            if (!response.ok) throw new Error("Failed to confirm event");

            notify("Event confirmed successfully!");
            refetch();
        } catch (err) {
            console.error("Error confirming event:", err);
        } finally {
            setNotifyLoad(false);
            setIsSelectingDates(false);
            setSelectedDates(null);
        }
    };

    // Handle Cancel Submission
    const handleCancelSubmit = async (e) => {
        e.preventDefault();

        if (!cancelReason.trim()) {
            alert("Please provide a reason for cancellation.");
            return;
        }

        const confirmed = window.confirm(
            "Are you sure you want to cancel the event?"
        );
    
        if (!confirmed) {
            return; // Exit if user cancels
        }

        setNotifyLoad(true);

        try {
            const response = await fetch(`${API_BASE_URL}/events/cancel-event`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${sessionStorage.getItem("token")}`
                },
                body: JSON.stringify({ event_id, cancellation_reason: cancelReason }),
            });

            if (!response.ok) throw new Error("Failed to cancel event");

            refetch();
        } catch (err) {
            console.error("Error canceling event:", err);
        } finally {
            setShowCancelReasonInput(false);
            setCancelReason("");
            setNotifyLoad(false);
        }
    };

    const isEmptyObjectOrNull = (value) => {
        return value === null || (typeof value === "object" && Object.keys(value).length === 0);
    };
    
    const getShameList = () => {
        if (!attendeeAvailability) return [];
    
        const shameList = [];
    
        // Helper to format entries
        const createEntry = (user) => {
            
             const profile = Profiles.find((profile) => profile.id === Number(user.profile_pic));

            return ({
            user_id: user.user_id || user._id,
            username: user.username || "Unnamed",
            profile_pic: profile || null,
            created_at: user.created_at || null,
        })};
    
        // Check organiser
        if (
            attendeeAvailability.organiser &&
            isEmptyObjectOrNull(attendeeAvailability.organiser.availability)
        ) {
            shameList.push(createEntry(attendeeAvailability.organiser));
        }
    
        // Check attendees
        if (Array.isArray(attendeeAvailability.attendees)) {
            attendeeAvailability.attendees.forEach(attendee => {
                if (isEmptyObjectOrNull(attendee.availability)) {
                    shameList.push(createEntry(attendee));
                }
            });
        }
    
        return shameList;
    };
    
    const getTimeAgo = (dateString) => {
        if (!dateString) return "Unknown";
    
        const createdDate = new Date(dateString);
        const now = new Date();
        const diffMs = now - createdDate;
    
        const diffMinutes = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMinutes / 60);
        const diffDays = Math.floor(diffHours / 24);
    
        if (diffDays > 0) {
            return `${diffDays} day${diffDays > 1 ? "s" : ""}`;
        } else if (diffHours > 0) {
            return `${diffHours} hour${diffHours !== 1 ? "s" : ""}`;
        } else {
            return "new";
        }
    };
    
    if (error) return <PageError error={error?.message ? error?.message : "Something Went Wrong"} page={"Shared Calender"} />;

    if (loading || dataLoad) return <div className="loader"><p>Fetching Calender Data</p><button onClick = {() => {navigate(`/event/${event_id}`)}} className="small-button">Cancel</button></div>;

    return (
        <div className="shared-calender">
            <div className="top-line">
                <button className="back-button" onClick={() => { goEventPage(); }}>
                    {theme === "dark" ? 
                        <img src="/svgs/back-arrow-white.svg" alt="Back" /> :
                    <img src="/svgs/back-arrow.svg" alt="Back" />}
                </button>
                <h2>Shared Calender</h2>
            </div>

            <div className="shame-list section">
                <h3>Shame Board</h3>
                {getShameList().length === 0 ? (
                    <p>Everyone has submitted their availability!</p>
                ) : (
                    <div className="shame-list-items">
                        {getShameList().map((user, index) => (
                            <div key={index} className="profile">
                                {user.profile_pic !== null && (
                                    <img 
                                        src={`${user.profile_pic.path}`} 
                                        alt={`${user.username}'s profile`} 
                                        className="profile-pic"
                                    />
                                )}
                                <div className="shame-info">
                                    <strong className={user.user_id === user_id ? "shame-you" : ""}>{user.username}</strong>
                                    <p className="created-at">{getTimeAgo(user.created_at)}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <SharedCalendar 
                data={calenderData} 
                selectChosenDays={selectChosenDays} 
                attendeeData={attendeeAvailability} 
                isDateWithinEventDuration={isDateWithinEventDuration} // Pass the function to SharedCalendar if needed
                isSelectingDates={isSelectingDates}
                selectedDates={selectedDates}
            />  

            {/* Confirm Event Button */}
            {role === "organiser" && calenderData?.status !== "confirmed" && !showCancelReasonInput && !isSelectingDates && (
            <div className="button-container">
                {!isSelectingDates && (
                <button className = "small-button" onClick={() => setIsSelectingDates(true)}>
                    Choose Dates
                </button>
                )}


                <button className = "small-button change-button" onClick={() => {navigate(`/event/${event_id}/settings`)}}>Change Duration or Available Days</button>
                
                {role === "organiser" && calenderData?.status !== "canceled" && (
                    <button className = "small-button  delete-event" onClick={() => {setShowCancelReasonInput(true);}}>Cancel Event</button>
                )}
            </div>
            )}

            {/* Reminder Input */}
            {isSelectingDates && (
                <div className="section reminder">

                    
                    <div className="reminder-count">
                        <h3>Set Reminder Date</h3>
                        <p>
                        {calenderData.duration - (selectedDates?.length || 0) === 0
                            ? "None Remaining"
                            : `${calenderData.duration - (selectedDates?.length || 0)} Remaining`}
                        </p>
                    </div>
                    <div className="date-selection">
                    <label>
                        Reminder Date: </label>
                        <input
                            type="date"
                            value={reminderDate}
                            onChange={(e) => setReminderDate(e.target.value)}
                            required
                        />
                    </div>
                    <div className="button-container">
                        <button
                            className = "small-button"
                            onClick={() => {
                            setIsSelectingDates(false);
                            setSelectedDates(null);
                            }}
                        >
                            Cancel
                        </button>
                        <button 
                            disabled={selectedDates?.length != calenderData.duration}
                            className = "small-button" 
                            onClick={confirmEvent}>
                            Confirm
                        </button>
                    </div>
                </div>
            )}

            {/* Cancel Reason Input */}
            {showCancelReasonInput && (
                <div className="section cancel-reason">
                    <h3>Provide a Reason for Cancelling</h3>
                    <form onSubmit={handleCancelSubmit}>
                        <input
                            value={cancelReason}
                            onChange={(e) => setCancelReason(e.target.value)}
                            maxLength={255}
                            placeholder="Enter reason for cancellation..."
                            required
                        />
                        <div className="button-container">
                            <button className = "small-button" type="button" onClick={() => setShowCancelReasonInput(false)}>Close</button>
                            <button className = "small-button delete-event" type="submit">Cancel Event</button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};

export default AttendeeCalendar;
