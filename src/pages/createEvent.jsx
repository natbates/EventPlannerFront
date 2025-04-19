import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/createEvent.css";
import { useAuth } from "../contexts/auth";
import { API_BASE_URL } from "../components/App";
import { useNotification } from "../contexts/notification";
import ProfileSelector from "../components/ProfileSelector";
import { Profiles } from "../components/ProfileSelector";
import { getNames } from "country-list";

export const charLimits = {
  firstName: 20,
  lastName: 20,
  email: 70,
  title: 40,
  description: 100,
  address: 100,
  city: 50,
  postcode: 15,
};

const CreateEvent = () => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    title: "",
    description: "",
    earliest_date: "",
    latest_date: "",
    duration: 1,
    location: {
      address: "",
      city: "",
      postcode: "",
      country: "United Kingdom",
    },
    organiser_id: "",
  });

  const clearFormData = () => {
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      title: "",
      description: "",
      earliest_date: "",
      latest_date: "",
      duration: 1,
      location: {
        address: "",
        city: "",
        postcode: "",
        country: "",
      },
      organiser_id: "",
    });
    setValidationErrors({});
  };

  const [validationErrors, setValidationErrors] = useState({});
  const navigate = useNavigate();
  const { createUser } = useAuth();
  const { notify, setNotifyLoad, showFavouritePopup } = useNotification();
  const [error, setError] = useState(null);
  const [profileNum, setProfileNum] = useState(() => Math.floor(Math.random() * Profiles.length));

  const countryOptions = getNames()
    .map((country) => {
      if (country === "United Kingdom of Great Britain and Northern Ireland") return "United Kingdom";
      if (country === "United States of America") return "United States";
      return country;
    })
    .sort();

  const validateForm = () => {
    const errors = {};
    const { firstName, lastName, email, title, description, earliest_date, latest_date, duration, location } = formData;

    if (!firstName.trim()) errors.firstName = "First name is required.";
    if (!lastName.trim()) errors.lastName = "Last name is required.";
    if (!email.match(/^\S+@\S+\.\S+$/)) errors.email = "Invalid email format.";
    if (!title.trim()) errors.title = "Event title is required.";
    if (!earliest_date) errors.earliest_date = "Earliest date is required.";
    if (!latest_date) errors.latest_date = "Latest date is required.";
    if (!duration || Number(duration) < 1) errors.duration = "Duration must be at least 1 day.";

    const earliestDate = new Date(earliest_date);
    const latestDate = new Date(latest_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (earliestDate < today) {
      errors.earliest_date = "Earliest date must be today or in the future.";
      notify(errors.earliest_date);
    }

    if (earliestDate > latestDate) {
      errors.dateRange = "Earliest date must be before the latest date.";
      notify(errors.dateRange);
    }

    const millisecondsPerDay = 1000 * 60 * 60 * 24;
    const calculatedDuration = Math.floor((latestDate - earliestDate) / millisecondsPerDay) + 1;

    if (calculatedDuration < Number(duration)) {
      errors.duration = `The duration between the earliest and latest date (${calculatedDuration} days) is shorter than the entered duration (${duration} days).`;
      notify(errors.duration);
    }

    if (!location.country.trim()) errors.locationCountry = "Country is required.";

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if ((name === "firstName" || name === "lastName") && !/^[A-Za-z\s]*$/.test(value)) {
      notify("Names can only contain letters and spaces.");
      return;
    }

    if (name === "duration") {
      let numericValue = Number(value);
      if (numericValue > 50) {
        notify("Maximum duration is 50 days.");
        numericValue = 50;
      }

      setFormData((prev) => ({ ...prev, [name]: numericValue }));
      return;
    }

    if (name === "earliest_date") {
      setFormData((prev) => ({ ...prev, earliest_date: value }));
      return;
    }
    
    if (name.startsWith("location.")) {
      const field = name.split(".")[1];
      setFormData((prev) => ({ ...prev, location: { ...prev.location, [field]: value } }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }

    localStorage.setItem("createEventData", JSON.stringify(formData));
  };

  useEffect(() => {
    const savedData = localStorage.getItem("createEventData");
    if (savedData) {
      const parsedData = JSON.parse(savedData);
      const timeout = setTimeout(() => {
        const userResponse = window.confirm("Do you want to load detected lost information?");
        if (userResponse) {
          setFormData(parsedData);
        } else {
          localStorage.removeItem("createEventData");
        }
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      setError("Not all fields are filled in correctly.");
      return;
    }
  
    setNotifyLoad(true);
  
    try {
      const organiser_id = await createUser(
        formData.email,
        `${formData.firstName} ${formData.lastName}`,
        true,
        null,
        profileNum
      );
  
      if (!organiser_id) throw new Error("Failed to create user.");
  
      const eventPayload = {
        ...formData,
        organiser_id,
        earliest_date: new Date(formData.earliest_date).toISOString().split("T")[0],
        latest_date: new Date(formData.latest_date).toISOString().split("T")[0],
        location: JSON.stringify(formData.location),
      };
  
      const response = await fetch(`${API_BASE_URL}/events/create-event`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(eventPayload),
      });
  
      if (!response.ok) throw new Error((await response.json()).message || "Failed to create event");
  
      const data = await response.json();
      const eventId = data.event_id;
      localStorage.removeItem("createEventData");
  
      // ⏳ Polling until the event is available via public endpoint
      const maxAttempts = 10;
      let attempts = 0;
  
      const pollEvent = setInterval(async () => {
        try {
          const checkRes = await fetch(`${API_BASE_URL}/events/fetch-event-title/${eventId}`);
          if (checkRes.ok) {
            const eventData = await checkRes.json();
            console.log("Event available:", eventData.title);
            clearInterval(pollEvent);
            navigate(`/event/${eventId}`);
            showFavouritePopup();
            notify("Event created successfully!");
          } else {
            attempts++;
            if (attempts >= maxAttempts) {
              clearInterval(pollEvent);
              setError("Event not found after creation. Try refreshing manually.");
              notify("Event might take a bit longer to appear. Please refresh.");
            }
          }
        } catch (err) {
          console.error("Polling error:", err);
          attempts++;
          if (attempts >= maxAttempts) {
            clearInterval(pollEvent);
            setError("Error confirming event creation.");
            notify("Issue confirming event. Please try again.");
          }
        }
      }, 1000); // poll every second
  
    } catch (err) {
      setError("Error creating event: " + err.message);
      notify("Error: " + err.message);
    } finally {
      setNotifyLoad(false);
    }
  };
  

  return (
    <div className="create-event-container">
      <h1>Create Event</h1>
      {validationErrors.dateRange && <div className="error-message">{validationErrors.dateRange}</div>}

      <form onSubmit={handleSubmit} className="section">
        <section className="create-section">
          <div className="one-line-input">
            <div>
              <label>First Name: *</label>
              <div className="create-input-container">
                <input
                  required
                  placeholder="Your First Name..."
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  maxLength={charLimits.firstName}
                />
                <p className="character-counter">{formData.firstName.length} / {charLimits.firstName}</p>
              </div>
            </div>
            <div>
              <label>Last Name: *</label>
              <div className="create-input-container">
                <input
                  required
                  placeholder="Your Last Name..."
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  maxLength={charLimits.lastName}
                />
                <p className="character-counter">{formData.lastName.length} / {charLimits.lastName}</p>
              </div>
            </div>
          </div>

          <label>Email: *</label>
          <div className="create-input-container">
            <input
              required
              placeholder="Your Email..."
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              maxLength={charLimits.email}
            />
            <p className="character-counter">{formData.email.length} / {charLimits.email}</p>
          </div>

          <label>Profile Picture: *</label>
          <ProfileSelector index={profileNum} onSelect={(newIndex) => setProfileNum(newIndex)} />
        </section>

        <section className="create-section">
          <label>Event Name: *</label>
          <div className="create-input-container">
            <input
              placeholder="Event Name..."
              required
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              maxLength={charLimits.title}
            />
            <p className="character-counter">{formData.title.length} / {charLimits.title}</p>
          </div>

          <label>Description:</label>
          <div className="create-input-container">
            <textarea
              placeholder="Description Of Your Event..."
              name="description"
              value={formData.description}
              onChange={handleChange}
              maxLength={charLimits.description}
            />
            <p className="character-counter-bottom">{formData.description.length} / {charLimits.description}</p>
          </div>

          <div className="one-line-input swap">
            <div>
              <label>Earliest Potential Date: *</label>
              <input required type="date" name="earliest_date" value={formData.earliest_date} onChange={handleChange}
              onBlur={() => {
                setFormData((prev) => {
                  const latestDate = new Date(prev.latest_date);
                  const newEarliest = new Date(prev.earliest_date);
            
                  if (!prev.latest_date || latestDate < newEarliest) {
                    return { ...prev, latest_date: prev.earliest_date };
                  }
                  return prev;
                });}}
               />
            </div>
            <div>
              <label>Latest Potential Date: *</label>
              <input required type="date" name="latest_date" value={formData.latest_date} onChange={handleChange} />
            </div>
          </div>
        </section>

        <section className="create-section">
          <div className="one-line-input">
            <div>
              <label>Event Address:</label>
              <div className="create-input-container">
                <input
                  placeholder="Event Address..."
                  type="text"
                  name="location.address"
                  value={formData.location.address}
                  onChange={handleChange}
                  maxLength={charLimits.address}
                />
                <p className="character-counter">{formData.location.address.length} / {charLimits.address}</p>
              </div>
            </div>
            <div className="duration">
              <label>Duration (Days): *</label>
              <input
                placeholder="Days.."
                required
                type="number"
                name="duration"
                value={formData.duration}
                onChange={handleChange}
                min="1"
              />
            </div>
          </div>

          <div className="one-line-input">
            <div>
              <label>Event City:</label>
              <div className="create-input-container">
                <input
                  placeholder="Event City..."
                  type="text"
                  name="location.city"
                  value={formData.location.city}
                  onChange={handleChange}
                  maxLength={charLimits.city}
                />
                <p className="character-counter">{formData.location.city.length} / {charLimits.city}</p>
              </div>
            </div>
            <div>
              <label>Event Postcode:</label>
              <div className="create-input-container">
                <input
                  placeholder="Event Post Code..."
                  type="text"
                  name="location.postcode"
                  value={formData.location.postcode}
                  onChange={handleChange}
                  maxLength={charLimits.postcode}
                />
                <p className="character-counter">{formData.location.postcode.length} / {charLimits.postcode}</p>
              </div>
            </div>
          </div>

          <div className="one-line-bottom">
            <div style={{ flex: 1 }}>
              <label>Event Country: *</label>
              <select
                name="location.country"
                value={formData.location.country}
                onChange={handleChange}
                style={{ width: "100%", marginTop: "10px" }}
              >
                <option value="">Select Country</option>
                {countryOptions.map((country) => (
                  <option key={country} value={country}>
                    {country}
                  </option>
                ))}
              </select>
            </div>
            <div className="create-buttons">
              <button className="small-button" type="button" onClick={clearFormData}>Clear</button>
              <button className="small-button" type="submit">Create Event</button>
            </div>
          </div>
        </section>
      </form>
    </div>
  );
};

export default CreateEvent;
