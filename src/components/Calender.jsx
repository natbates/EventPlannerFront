import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { useState } from "react";

const localizer = momentLocalizer(moment);

const formatDateToYYYYMMDD = (date) => {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
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
    const currentDate = new Date(date);
    if (currentDate < earliestDate || currentDate > latestDate) {
      return {
        className: "grey-out", // Apply 'grey-out' class to out-of-range dates
      };
    }
    return {};
  };

  return (
    <>
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: 500 }}
        views={{ month: true }} // Show only month view
        defaultView="month" // Default to month view
        selectable
        min={earliestDate} // Restrict selection to earliestDate
        max={latestDate} // Restrict selection to latestDate
        onSelectSlot={(slotInfo) => {
          const selectedDate = new Date(slotInfo.start);
          if (selectedDate >= earliestDate && selectedDate <= latestDate) {
            onSelectDate(formatDateToYYYYMMDD(selectedDate)); // Call parent function on date select
          }
        }}
        dayPropGetter={dayPropGetter} // Apply the dayPropGetter to apply styles to days
      />

      <style>
        {`
          .grey-out {
            background-color: #d3d3d3 !important; /* Grey background for out-of-range dates */
            pointer-events: none; /* Disable click interaction */
          }
        `}
      </style>
    </>
  );
};

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
    <SharedCalendarComponent
      events={events}
      earliestDate={earliestDate}
      latestDate={latestDate}
      onSelectDate={processDate} // Passing processDate function from parent to SharedCalendarComponent
      userAvailability={userAvailability}
    />
  );
};

export const SharedCalendar = ({ data, selectChosenDays, attendeeData, isSelectingDates, selectedDates}) => {
  if (!data || !attendeeData) return <p>Loading calendar...</p>;

  const earliestDate = new Date(data.earliest_date || "2024-01-01");
  const latestDate = new Date(data.latest_date || "2024-12-31");

  const availabilityMap = {};

  Object.entries(attendeeData.organiser.availability || {}).forEach(([date, status]) => {
    if (!availabilityMap[date]) {
      availabilityMap[date] = [];
    }
    availabilityMap[date].push({ username: attendeeData.organiser.username, status });
  });

  attendeeData.attendees.forEach((attendee) => {
    Object.entries(attendee.availability || {}).forEach(([date, status]) => {
      if (!availabilityMap[date]) {
        availabilityMap[date] = [];
      }
      availabilityMap[date].push({ username: attendee.username, status });
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

  const [selectedDate, setSelectedDate] = useState(null);

  const dayPropGetter = (date) => {
    const formattedDate = formatDateToYYYYMMDD(date);
    if (date < earliestDate || date > latestDate) {
      return { className: "grey-out" };
    }
    if (selectedDates != null && selectedDates.includes(formattedDate)) {
      return { className: "chosen-date" };
    }
    return {};
  };

  return (
    <>
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: 500 }}
        views={{ month: true }}
        defaultView="month"
        selectable
        min={earliestDate}
        max={latestDate}
        onSelectSlot={(slotInfo) => {
          const selected = new Date(slotInfo.start);
          if (selected >= earliestDate && selected <= latestDate) {

            if (isSelectingDates)
            {
              selectChosenDays(formatDateToYYYYMMDD(selected));
            } else
            {
              setSelectedDate(formatDateToYYYYMMDD(selected));
            }
          }
        }}
        dayPropGetter={dayPropGetter}
      />

      {!isSelectingDates && 
      <div style={{ marginTop: "20px", padding: "10px", border: "1px solid #ccc", borderRadius: "5px" }}>
        <h3>Selected Date: {selectedDate || "None"}</h3>
        {selectedDate && (
          <ul>
            {(availabilityMap[selectedDate] || []).map((entry, index) => (
              <li key={index}>{entry.username}: {entry.status}</li>
            ))}
          </ul>
        )}
      </div>}

      <style>
        {`
          .grey-out {
            background-color: #d3d3d3 !important;
            pointer-events: none;
          }
          .chosen-date {
            border: 2px solid red !important;
            border-radius: 5px;
          }
        `}
      </style>
    </>
  );
};




export default MyCalendar;
