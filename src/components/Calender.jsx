import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { useState } from "react";
import "../styles/calendar.css";
import { Profiles } from "./ProfileSelector";
import { useAuth } from "../contexts/auth";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../contexts/theme";

const localizer = momentLocalizer(moment);

const formatDateToYYYYMMDD = (date) => {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export const formatDate = (dateString) => {
  const date = new Date(dateString);
  const day = date.getDate();
  const month = date.toLocaleString('default', { month: 'long' }); // Get the full month name
  const year = date.getFullYear();
  const currentYear = new Date().getFullYear();

  // Determine the suffix for the day
  let suffix = "th";
  if (day === 1 || day === 21 || day === 31) {
      suffix = "st";
  } else if (day === 2 || day === 22) {
      suffix = "nd";
  } else if (day === 3 || day === 23) {
      suffix = "rd";
  }

  // If the year is the current year, omit it from the formatted string
  if (year === currentYear) {
      return `${day}${suffix} of ${month}`;
  } else {
      return `${day}${suffix} of ${month} of ${year}`;
  }
};

// Reusable Calendar Component
const SharedCalendarComponent = ({
  events = [],
  earliestDate,
  latestDate,
  onSelectDate,
  userAvailability,
}) => {

  // Function to grey out dates outside the range
  const dayPropGetter = (date) => {
    const formattedDate = formatDateToYYYYMMDD(date);
    const formattedEarliestDate = formatDateToYYYYMMDD(earliestDate);
    const formattedLatestDate = formatDateToYYYYMMDD(latestDate);

    const isBeforeEarliest = formattedDate < formattedEarliestDate;
    const isAfterLatest = formattedDate > formattedLatestDate;
    const isExactEarliest = formattedDate === formattedEarliestDate;
    const isExactLatest = formattedDate === formattedLatestDate;
    // Only grey out if outside range and not equal to boundary dates
    if ((isBeforeEarliest || isAfterLatest) && !isExactEarliest && !isExactLatest) {
      return { className: "grey-out" };
    }
  
    const status = userAvailability?.[formattedDate];
  
    if (status === "available") {
      return { className: "available-date" };
    }
  
    if (status === "not available") {
      return { className: "not-available-date" };
    }
  
    if (status === "tentative") {
      return { className: "tentative-date" };
    }
  
    return {};
  };
  

  return (
    <>
      <Calendar
        localizer={localizer}
        longPressThreshold={1}
        selectable={true}
        startAccessor="start"
        endAccessor="end"
        views={{ month: true }}
        defaultView="month"
        defaultDate={earliestDate}
        min={earliestDate}
        max={latestDate}
        onSelectSlot={(slotInfo) => {
  
          // Convert the selected slot to a Date object
          const selectedDate = new Date(slotInfo.start);
  
          // Format the dates as "YYYY-MM-DD" for consistent comparison
          const formattedSelectedDate = formatDateToYYYYMMDD(selectedDate);
          const formattedEarliestDate = formatDateToYYYYMMDD(earliestDate);
          const formattedLatestDate = formatDateToYYYYMMDD(latestDate);
  
          // Perform the date comparison
          const isWithinRange = (formattedSelectedDate >= formattedEarliestDate && formattedSelectedDate <= formattedLatestDate);
          const isExactMatch = (formattedSelectedDate === formattedEarliestDate || formattedSelectedDate === formattedLatestDate);
  
          // If the selected date is within range or matches either the earliest or latest date, call onSelectDate
          if (isWithinRange || isExactMatch) {
            onSelectDate(formattedSelectedDate);
          } 
        }}
        dayPropGetter={dayPropGetter}
      />
    </>
  );
} 

// MyCalendar Component
const MyCalendar = ({ data, processDate, userAvailability }) => {
  if (!data) return <p>Loading calendar...</p>;

  // Define the valid range for selection
  const earliestDate = new Date(data.earliest_date || "2024-01-01");
  const latestDate = new Date(data.latest_date || "2024-12-31");

  const events = Object.keys(userAvailability || {}).map((date) => ({
    title: userAvailability[date],
    start: new Date(date),
    end: new Date(date),
    allDay: true,
  }));

  return (
    <>
     <SharedCalendarComponent
        events={events}
        earliestDate={earliestDate}
        latestDate={latestDate}
        onSelectDate={processDate} // Passing processDate function from parent to SharedCalendarComponent
        userAvailability={userAvailability}
      />
    </>
  );
};

const buildAvailabilityMap = (rawAvailability) => {
  const summary = {};

  for (const [date, entries] of Object.entries(rawAvailability)) {
    summary[date] = { available: 0, notAvailable: 0, tentative: 0 };

    entries.forEach(({ status }) => {
      if (status === "available") summary[date].available++;
      else if (status === "not available") summary[date].notAvailable++;
      else if (status === "tentative") summary[date].tentative++;
    });
  }

  return summary;
};


export const SharedCalendar = ({ data, selectChosenDays, attendeeData, isSelectingDates, selectedDates}) => {
  if (!data || !attendeeData) return <p>Loading calendar...</p>;

  const {user_id} = useAuth();
  const navigate = useNavigate();
  const {theme} = useTheme();

  const earliestDate = new Date(data.earliest_date || "2024-01-01");
  const latestDate = new Date(data.latest_date || "2024-12-31");

  const availabilityMap = {};


  Object.entries(attendeeData.organiser.availability || {}).forEach(([date, status]) => {
    if (!availabilityMap[date]) {
      availabilityMap[date] = [];
    }
    availabilityMap[date].push({ user_id: attendeeData.organiser.user_id ,username: attendeeData.organiser.username, status, profile_pic: attendeeData.organiser.profile_pic});
  });

  attendeeData.attendees.forEach((attendee) => {

    Object.entries(attendee.availability || {}).forEach(([date, status]) => {
      if (!availabilityMap[date]) {
        availabilityMap[date] = [];
      }
      availabilityMap[date].push({ user_id: attendee.user_id, username: attendee.username, status, profile_pic: attendee.profile_pic});
    });
  });

  const events = [];
  Object.keys(availabilityMap).forEach((date) => {
    availabilityMap[date].forEach((entry) => {
      events.push({
        title: `${entry.username}: ${entry.status}`,
        start: new Date(date),
        end: new Date(date),
        allDay: true,
      });
    });
  });

  const newavailabilityMap = buildAvailabilityMap(availabilityMap);

  const dayPropGetterMain = (date) => {
    const log = dayPropGetter(date);

    // Check if selectedDates length equals the event's duration
    if (selectedDates?.length === data?.duration && !selectedDates?.includes(formatDateToYYYYMMDD(date))) {

        return {
            ...log, 
            style: { 
                ...log.style, 
                cursor: "not-allowed", 
                opacity: 0.5 
            }
        };
      }

      return log;
  };


  const dayPropGetter = (date) => {

    const formattedDate = formatDateToYYYYMMDD(date);
    // Check if the date is selected
    if (selectedDates?.includes(formattedDate)) {
      const stats = newavailabilityMap?.[formattedDate];
      if (!stats) if (selectedDates?.includes(formattedDate)){return { className: "selected-date grey-background" }} else {return {style: {opacity: isSelectingDates ? "0.6" : "1" }}};
  
      const { available = 0, notAvailable = 0, tentative = 0 } = stats;
      const total = available + notAvailable + tentative;
  
      // If there's no status to calculate, return an empty object
      if (total === 0) 
        if (selectedDates?.includes(formattedDate)){return { className: "selected-date" }} else {return {style: {opacity: isSelectingDates ? "0.6" : "1" }}};
         
  
      const green = "rgb(165, 220, 165)";
      const red = "rgb(220, 133, 133)";
      const yellow = "rgb(226, 202, 148)";
  
      const greenPercentage = (available / total) * 100;
      const redPercentage = (notAvailable / total) * 100;
      const yellowPercentage = (tentative / total) * 100;
  
      let gradientStops = [];
      let current = 0;
      let bgColor = null;
  
      // Handle cases for exact percentages to avoid unnecessary gradient calculation
      if (greenPercentage === 100) {
        bgColor = green;
      } else if (redPercentage === 100) {
        bgColor = red;
      } else if (yellowPercentage === 100) {
        bgColor = yellow;
      } else {
        // If percentages aren't exact, create gradient
        if (notAvailable > 0) {
          gradientStops.push(`${red} ${current}%`, `${red} ${current + redPercentage}%`);
          current += redPercentage;
        }
        if (tentative > 0) {
          gradientStops.push(`${yellow} ${current}%`, `${yellow} ${current + yellowPercentage}%`);
          current += yellowPercentage;
        }
        if (available > 0) {
          gradientStops.push(`${green} ${current}%`, `${green} ${current + greenPercentage}%`);
        }
        bgColor = gradientStops.length > 0 ? `linear-gradient(to right, ${gradientStops.join(", ")})` : "transparent";
      }
  
      return {
        className: "selected-date", // Apply selected-date class
        style: { 
          background: bgColor, 
      }      
      };
    }
  
    // Check if the date is outside the valid range
    const formatted = formatDateToYYYYMMDD(date);
    const earliest = formatDateToYYYYMMDD(earliestDate);
    const latest = formatDateToYYYYMMDD(latestDate);

    const isWithinRange = (formatted >= earliest && formatted <= latest);
    const isExactMatch = (formatted === earliest || formatted === latest);
    
    if (!isWithinRange && !isExactMatch) {
      return { className: "grey-out", style: {opacity: isSelectingDates ? "0.6" : "1" }};
    }
  
    // If the date isn't selected, apply background based on availability
    const stats = newavailabilityMap?.[formattedDate];
    if (!stats) return {style: {opacity: isSelectingDates ? "0.6" : "1" }};
  
    const { available = 0, notAvailable = 0, tentative = 0 } = stats;
    const total = available + notAvailable + tentative;
  
    // If there's no status to calculate, return an empty object
    if (total === 0) return {style: {opacity: isSelectingDates ? "0.6" : "1" }};
  
    const green = "rgb(165, 220, 165)";
    const red = "rgb(220, 133, 133)";
    const yellow = "rgb(226, 202, 148)";
  
    const greenPercentage = (available / total) * 100;
    const redPercentage = (notAvailable / total) * 100;
    const yellowPercentage = (tentative / total) * 100;
  
    let gradientStops = [];
    let current = 0;
    let bgColor = null;
  
    // Handle cases for exact percentages to avoid unnecessary gradient calculation
    if (greenPercentage === 100) {
      bgColor = green;
    } else if (redPercentage === 100) {
      bgColor = red;
    } else if (yellowPercentage === 100) {
      bgColor = yellow;
    } else {
      // If percentages aren't exact, create gradient
      if (notAvailable > 0) {
        gradientStops.push(`${red} ${current}%`, `${red} ${current + redPercentage}%`);
        current += redPercentage;
      }
      if (tentative > 0) {
        gradientStops.push(`${yellow} ${current}%`, `${yellow} ${current + yellowPercentage}%`);
        current += yellowPercentage;
      }
      if (available > 0) {
        gradientStops.push(`${green} ${current}%`, `${green} ${current + greenPercentage}%`);
      }
      bgColor = gradientStops.length > 0 ? `linear-gradient(to right, ${gradientStops.join(", ")})` : "transparent";
    }
  
    return {
      style: { background: bgColor, opacity: isSelectingDates ? "0.6" : "1" }, // Apply the background color or gradient
    };
  };
  

  const [selectedDate, setSelectedDate] = useState(null);

  return (
    <>
      <Calendar
        localizer={localizer}
        longPressThreshold={1}
        startAccessor="start"
        endAccessor="end"
        views={{ month: true }}
        defaultView="month"
        defaultDate={earliestDate}
        selectable={true}
        min={earliestDate}
        max={latestDate}
        onSelectSlot={(slotInfo) => {
  
          // Convert the selected slot to a Date object
          const selectedDate = new Date(slotInfo.start);
  
          // Format the dates as "YYYY-MM-DD" for consistent comparison
          const formattedSelectedDate = formatDateToYYYYMMDD(selectedDate);
          const formattedEarliestDate = formatDateToYYYYMMDD(earliestDate);
          const formattedLatestDate = formatDateToYYYYMMDD(latestDate);
  
          // Perform the date comparison
          const isWithinRange = (formattedSelectedDate >= formattedEarliestDate && formattedSelectedDate <= formattedLatestDate);
          const isExactMatch = (formattedSelectedDate === formattedEarliestDate || formattedSelectedDate === formattedLatestDate);
  
          // If the selected date is within range or matches either the earliest or latest date, call onSelectDate
          if (isWithinRange || isExactMatch) {

            if (isSelectingDates)
            {
              selectChosenDays(formatDateToYYYYMMDD(selectedDate));
            } else
            {
              if (selectedDate === formatDateToYYYYMMDD(selectedDate))
              {
                setSelectedDate(null);
              }
              else{
                setSelectedDate(formatDateToYYYYMMDD(selectedDate));
              }
            }
          }
        }}
        dayPropGetter={dayPropGetterMain} 
      />

      {!isSelectingDates && selectedDate && 
        <div className="section selected-dates">
          <span className="selected-date-top-header"><h3 style={{margin: 0}}>Selected: {selectedDate ? formatDate(selectedDate) : "None"}</h3><button className="small-button" onClick={(e) => {setSelectedDate(null)}}>
          {theme === "light" ? (
              <img className="cross" src="/svgs/cross-white.svg" alt="Reject" />
            ) : (
              <img className="cross" src="/svgs/cross.svg" alt="Reject" />
            )
          }</button></span>
          <div className= "availability-group-container">
            {selectedDate && (
              <>
                {!availabilityMap[selectedDate] && <p>None</p>}

                {/* Group entries by status */}
                {["available", "tentative", "not available"].map((statusKey) => {
                  const statusLabel = {
                    available: "Available",
                    tentative: "Tentative",
                    "not available": "Not Available"
                  }[statusKey];

                  const filtered = (availabilityMap[selectedDate] || []).filter(entry => entry.status === statusKey);

                  if (filtered.length === 0) return null;

                  return (
                    <div key={statusKey} className="availability-group">
                      <h4>{statusLabel} ({filtered.length})</h4>
                      <ul className="attendee-availability-list">
                        {filtered.map((entry, index) => {
                          const profile = Profiles.find((profile) => profile.id === Number(entry.profile_pic));
                          return (
                            <li key={index} className="attendee-availability-list-item">
                              <div className="entry">
                                <img
                                  className="profile-pic"
                                  src={profile ? profile.path : ""}
                                  alt={profile?.name || "profile"}
                                />
                                <p style = {{cursor: "pointer"}} onClick = {() => {navigate(`/event/${data.event_id}/attendee-calender/${entry.user_id}`)}} className={`${entry.user_id === user_id ? "you underline" : ""}`}>{entry.username}</p>
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        </div>
      }
    </>
  );
};




export default MyCalendar;
