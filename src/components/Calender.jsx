import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { useState } from "react";
import "../styles/calendar.css";

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

  console.log("EARLIEST DATE ", earliestDate);

  // Function to grey out dates outside the range
  const dayPropGetter = (date) => {
    const formattedDate = formatDateToYYYYMMDD(date);
  
    if (date < earliestDate || date > latestDate) {
      return { className: "grey-out" };
    }
  
    const status = userAvailability?.[formattedDate];

    console.log("STATUS ", status);
  
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
        startAccessor="start"
        endAccessor="end"
        style={{ height: 500 }}
        views={{ month: true }} // Show only month view
        defaultView="month" // Default to month view
        defaultDate={earliestDate}
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
    <>
  <p>{Object.keys(userAvailability).join(", ")}</p>
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

  const newavailabilityMap = buildAvailabilityMap(availabilityMap);

  console.log(newavailabilityMap);

  const dayPropGetter = (date) => {
    const formattedDate = formatDateToYYYYMMDD(date);
  
    if (date < earliestDate || date > latestDate) {
      return { className: "grey-out" };
    }
  
    const stats = newavailabilityMap?.[formattedDate];
    if (!stats) return {};
  
    const score = (stats.available || 0) - (stats.notAvailable || 0);
    const maxScore = stats.available + stats.notAvailable;

    console.log("SCORE: ", score);
  
    const normalized = Math.max(0, Math.min(1, (score + maxScore) / (2 * maxScore)));
  
    const red = Math.round(255 * (1 - normalized));
    const green = Math.round(255 * normalized);
    const bgColor = `rgb(${red}, ${green}, 100)`;

    if (maxScore != undefined)
    {
      console.log("DATE ", date, " STATS ", stats, " SCORE ", score, " MAX ", maxScore, " NORMALIZED ", normalized, " BG COLOR ", bgColor);
    }
  
    return {
      style: {
        backgroundColor: bgColor,
        borderRadius: "50%",
        color: "white"
      }
    };
  };

  const [selectedDate, setSelectedDate] = useState(null);

  return (
    <>
      <Calendar
        localizer={localizer}
        startAccessor="start"
        endAccessor="end"
        style={{ height: 500 }}
        views={{ month: true }}
        defaultView="month"
        defaultDate={earliestDate}
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
    </>
  );
};




export default MyCalendar;
