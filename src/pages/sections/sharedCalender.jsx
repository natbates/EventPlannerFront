import { useEffect, useState } from "react";
import { API_BASE_URL } from "../../components/App";
import { useAuth } from "../../contexts/auth";
import useFetchEventData from "../../hooks/useFetchEventData";
import { SharedCalendar } from "../../components/Calender";
import { useNavigate } from "react-router-dom";

const AttendeeCalendar = () => {
    const { data: calenderData, error, loading, event_id, refetch, goEventPage } = useFetchEventData("calendar/fetch-calendar");
    const [attendeeAvailability, setAttendeeAvailability] = useState();
    const { user_id, name, role } = useAuth();

    const [isSelectingDates, setIsSelectingDates] = useState(false);
    const [selectedDates, setSelectedDates] = useState(null);

    const [reminderDate, setReminderDate] = useState(""); 
    const [cancelReason, setCancelReason] = useState("");
    const [showCancelReasonInput, setShowCancelReasonInput] = useState(false);

    const navigate = useNavigate();

    // Fetch attendee availability
    const fetchAttendeeAvailability = async () => {
        if (!event_id) return;
    
        try {
            const response = await fetch(`${API_BASE_URL}/calendar/fetch-availability/${event_id}`);
            if (!response.ok) throw new Error(`Error: ${response.status} ${response.statusText}`);
    
            const data = await response.json();
            setAttendeeAvailability(data);
        } catch (error) {
            console.error("Error fetching user availability:", error);
            setAttendeeAvailability(null);
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
    
        console.log(eventStartDate, selectedDate, eventEndDate);
        console.log(selectedDate.getTime() === eventEndDate.getTime()); // Should be true now
    
        return selectedDate >= eventStartDate && selectedDate <= eventEndDate;
    };
    

    // Select or Deselect Chosen Days
    const selectChosenDays = async (date) => {
        // Check if the date is within the event duration before proceeding
        if (!isDateWithinEventDuration(date)) {
            alert("You cannot select this date, it is outside the event duration.");
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
                alert(`Max amount of chosen days selected (${calenderData.duration})`);
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
            alert("please select all chosen days before confirming")
            return;
        }

        if (!reminderDate) {
            alert("Please select a reminder date.");
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/events/confirm-event`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ 
                    event_id, 
                    reminderDate, 
                    selectedDates 
                })
            });
            
            if (!response.ok) throw new Error("Failed to confirm event");

            alert("Event confirmed successfully!");
            refetch();
        } catch (err) {
            console.error("Error confirming event:", err);
        }
    };

    // Handle Cancel Submission
    const handleCancelSubmit = async (e) => {
        e.preventDefault();

        if (!cancelReason.trim()) {
            alert("Please provide a reason for cancellation.");
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/events/cancel-event`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ event_id, cancellation_reason: cancelReason }),
            });

            if (!response.ok) throw new Error("Failed to cancel event");

            alert("Event canceled successfully!");
            refetch();
        } catch (err) {
            console.error("Error canceling event:", err);
        } finally {
            setShowCancelReasonInput(false);
            setCancelReason("");
        }
    };


    return (
        <div>
            <div className="top-line">
                <button className="back-button" onClick={() => { goEventPage(); }}>
                    <img src="/svgs/back-arrow.svg" alt="Back" />
                </button>
                <h2>Shared Calender</h2>
            </div>

            <button onClick={() => {navigate(`/event/${event_id}/settings`)}}>Change Duration or Available Days</button>

            {isSelectingDates && 
                <p>Remaining = {calenderData.duration - (selectedDates?.length || 0)}</p>
            }
            <SharedCalendar 
                data={calenderData} 
                selectChosenDays={selectChosenDays} 
                attendeeData={attendeeAvailability} 
                isDateWithinEventDuration={isDateWithinEventDuration} // Pass the function to SharedCalendar if needed
                isSelectingDates={isSelectingDates}
                selectedDates={selectedDates}
            />  

            {/* Confirm Event Button */}
            {role === "organiser" && calenderData?.status !== "confirmed" && (
            <>
                {!isSelectingDates && (
                <button onClick={() => setIsSelectingDates(true)}>
                    Choose Dates
                </button>
                )}

                {isSelectingDates && (
                <button
                    onClick={() => {
                    setIsSelectingDates(false);
                    setSelectedDates(null);
                    }}
                >
                    Cancel
                </button>
                )}

                {isSelectingDates && selectedDates?.length === calenderData.duration && (
                <button onClick={confirmEvent}>
                    Confirm
                </button>
                )}
            </>
            )}



            {/* Cancel Event Button */}
            {role === "organiser" && calenderData?.status !== "canceled" && (
                <button onClick={() => {setShowCancelReasonInput(true);}}>Cancel Event</button>
            )}

            {/* Reminder Input */}
            {selectedDates?.length == calenderData?.duration && (
                <div>
                    <h3>Set Reminder Date</h3>
                    <label>
                        Reminder Date (Before event start, After current date):
                        <input
                            type="date"
                            value={reminderDate}
                            onChange={(e) => setReminderDate(e.target.value)}
                            required
                        />
                    </label>
                </div>
            )}

            {/* Cancel Reason Input */}
            {showCancelReasonInput && (
                <div>
                    <h3>Provide a Reason for Cancelling</h3>
                    <form onSubmit={handleCancelSubmit}>
                        <label>
                            Cancel Reason:
                            <textarea
                                value={cancelReason}
                                onChange={(e) => setCancelReason(e.target.value)}
                                maxLength={255}
                                required
                            />
                        </label>
                        <button type="submit">Cancel Event</button>
                        <button type="button" onClick={() => setShowCancelReasonInput(false)}>Cancel</button>
                    </form>
                </div>
            )}
        </div>
    );
};

export default AttendeeCalendar;
