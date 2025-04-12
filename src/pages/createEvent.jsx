import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/createEvent.css";
import { useAuth } from "../contexts/auth";
import { API_BASE_URL } from "../components/App";
import { useNotification } from "../contexts/notification";
import ProfileSelector from "../components/ProfileSelector";
import { Profiles } from "../components/ProfileSelector";
import { getNames } from "country-list";

const CreateEvent = () => {
  
  const [formData, setFormData] = useState(
    {firstName: "",
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
    organiser_id: ""
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
      organiser_id: ""
    });
    setValidationErrors({});
  };
  
  const [validationErrors, setValidationErrors] = useState({});
  const navigate = useNavigate();
  const { createUser } = useAuth();
  const { notify, setNotifyLoad} = useNotification();
  const [error, setError] = useState(null);
  const [profileNum, setProfileNum] = useState(() => {
    return Math.floor(Math.random() * Profiles.length);
  });
  
  const countryOptions = getNames().map(country => {
    if (country === "United Kingdom of Great Britain and Northern Ireland") {
        return "United Kingdom";
    }
    if (country === "United States of America") {
        return "United States";
    }
    // You can add more cases as needed
    return country;
  }).sort();

  const validateForm = () => {
    const errors = {};
    const { firstName, lastName, email, title, description, earliest_date, latest_date, duration, location } = formData;

    // Basic validations
    if (!firstName.trim()) errors.firstName = "First name is required.";
    if (!lastName.trim()) errors.lastName = "Last name is required.";
    if (!email.match(/^\S+@\S+\.\S+$/)) errors.email = "Invalid email format.";
    if (!title.trim()) errors.title = "Event title is required.";
    if (!description.trim()) errors.description = "Description is required.";
    if (!earliest_date) errors.earliest_date = "Earliest date is required.";
    if (!latest_date) errors.latest_date = "Latest date is required.";
    if (!duration || Number(duration) < 1) errors.duration = "Duration must be at least 1 day.";

    // Convert dates
    const earliestDate = new Date(earliest_date);
    const latestDate = new Date(latest_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to midnight to ignore time part

    // Check if earliestDate is before today's date
    if (earliestDate < today) {
        errors.earliest_date = "Earliest date must be today or in the future.";
        notify(errors.earliest_date);  
    }

    // Check if earliestDate is before latestDate
    if (earliestDate >= latestDate) {
        errors.dateRange = "Earliest date must be before the latest date.";
        notify(errors.dateRange);  
    }

    // Calculate the duration in days between earliest and latest date
    const calculatedDuration = Math.floor((latestDate - earliestDate) / (1000 * 60 * 60 * 24)); // duration in days

    // Check if the duration between the earliest and latest date is greater than or equal to the entered duration
    if (calculatedDuration < Number(duration)) {
        errors.duration = `The duration between the earliest and latest date (${calculatedDuration} days) is shorter than the entered duration (${duration} days).`;
        notify(errors.duration);  
    }

    // Location validations
    if (!location.address.trim()) errors.locationAddress = "Address is required.";
    if (!location.city.trim()) errors.locationCity = "City is required.";
    if (!location.postcode.trim()) errors.locationPostcode = "Postcode is required.";
    if (!location.country.trim()) errors.locationCountry = "Country is required.";

    // Set validation errors and return true/false based on if there are errors
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
  
      setFormData((prev) => ({
        ...prev,
        [name]: numericValue,
      }));
      return;
    }

    if (name.startsWith("location.")) {
      const field = name.split(".")[1];
      setFormData((prev) => ({ ...prev, location: { ...prev.location, [field]: value } }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }

    localStorage.setItem('createEventData', JSON.stringify(formData));
  };
  useEffect(() => {
    const savedData = localStorage.getItem('createEventData');
    if (savedData) {
      const parsedData = JSON.parse(savedData);
      const timeout = setTimeout(() => {
        // Show confirmation prompt after the page is loaded
        const userResponse = window.confirm('Do you want to load detected lost information?');
        
        if (userResponse) {
          // If the user presses "Yes", load the saved data
          setFormData(parsedData);
        } else {
          // If the user presses "No", remove the data from localStorage
          localStorage.removeItem('createEventData');
        }
      }, 500); // Delay to ensure page is loaded
      
      return () => clearTimeout(timeout); // Cleanup the timeout on unmount
    }
  }, []);
  

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()){
      setError("Not all fields are filled in correctly.");
      return;
    };

    setNotifyLoad(true);

    try {
      const organiser_id = await createUser(
        formData.email,
        `${formData.firstName} ${formData.lastName}`,
        true,
        null,
        profileNum
      );

      const eventPayload = {
        ...formData,
        organiser_id,
        earliest_date: new Date(formData.earliest_date).toISOString().split("T")[0],
        latest_date: new Date(formData.latest_date).toISOString().split("T")[0],
        location: JSON.stringify(formData.location)
      };

      const response = await fetch(`${API_BASE_URL}/events/create-event`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(eventPayload)
      });

      if (!response.ok) throw new Error((await response.json()).message || "Failed to create event");

      const data = await response.json();
      navigate(`/event/${data.event_id}`);
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

      <form onSubmit={handleSubmit}>

        <section className="create-section">
          <div className="one-line-input">
            <div>
              <label>First Name:</label>
              <input placeholder = "Your First Name..." type="text" name="firstName" value={formData.firstName} onChange={handleChange} />
            </div>
            <div>
              <label>Last Name:</label>
              <input placeholder = "Your Last Name..." type="text" name="lastName" value={formData.lastName} onChange={handleChange} />
            </div>
          </div>
          <label>Email:</label>
          <input placeholder = "Your Email..." type="email" name="email" value={formData.email} onChange={handleChange} />

          <label>Profile Picture:</label>
          <ProfileSelector index={profileNum} onSelect={(newIndex) => setProfileNum(newIndex)} />
          </section>

        <section className="create-section">

          <label>Event Name:</label>
          <input placeholder="Event Name..." required type="text" name="title" value={formData.title} onChange={handleChange} />

          <label>Description:</label>
          <textarea placeholder="Description Of Your Event..." required name="description" value={formData.description} onChange={handleChange} />

          <div className="one-line-input swap">
            <div>
              <label>Earliest Date:</label>
              <input required type="date" name="earliest_date" value={formData.earliest_date} onChange={handleChange} />
            </div>
            <div>
              <label>Latest Date:</label>
              <input required type="date" name="latest_date" value={formData.latest_date} onChange={handleChange} />
            </div>
          </div>
        </section>

        <section className="create-section">

          <div className="one-line-input">
            <div>
              <label>Address:</label>
              <input placeholder="Address..." required type="text" name="location.address" value={formData.location.address} onChange={handleChange} />
            </div>
            <div className="duration">
              <label>Duration (Days):</label>
              <input placeholder="Days.." required type="number" name="duration" value={formData.duration} onChange={handleChange} min="1" />
            </div>
          </div>
          <div className="one-line-input">
            <div>
              <label>City:</label>
              <input placeholder="City..." required type="text" name="location.city" value={formData.location.city} onChange={handleChange} />
            </div>

            <div>
              <label>Postcode:</label>
              <input placeholder="Post Code..."required type="text" name="location.postcode" value={formData.location.postcode} onChange={handleChange} />
            </div>
          </div>
          <div className="one-line-bottom">
            <div style={{ flex: 1 }}>
            <label>Country:</label>
            <select
              name="location.country"
              value={formData.location.country}
              onChange={handleChange}
              style={{ width: "100%", marginTop: "10px" }}
              required
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
              <button className = "small-button" type="button" onClick={clearFormData}>Clear</button>
              <button className = "small-button" type="submit">Create Event</button>
            </div>
          </div>
        </section>
      </form>
    </div>
  );
};

export default CreateEvent;