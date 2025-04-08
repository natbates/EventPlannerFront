import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/createEvent.css";
import { useAuth } from "../contexts/auth";
import { API_BASE_URL } from "../components/App";

// Helper function to generate a random date within a range
const getRandomDate = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

// Helper function to generate a random integer
const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// Helper function to get a random item from an array
const getRandomItem = (array) => array[Math.floor(Math.random() * array.length)];

const CreateEvent = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState(() => {
    // Generate random earliest date within the next 30 days
    const earliestDate = getRandomDate(new Date(), new Date(new Date().getTime() + 30 * 24 * 60 * 60 * 1000));
    
    // Generate random duration (between 1 and 10 days)
    const duration = getRandomInt(1, 10);

    // Ensure latest date is after the earliest date and can fit the duration
    const latestDate = getRandomDate(
      new Date(earliestDate.getTime() + duration * 24 * 60 * 60 * 1000), // latest date must be after earliest date + duration
      new Date(earliestDate.getTime() + (duration + 10) * 24 * 60 * 60 * 1000) // random latest date within 10 days of the duration gap
    );

    return {
      firstName: getRandomItem(["John", "Jane", "Mark", "Emma", "Liam", "Sophia"]),
      lastName: getRandomItem(["Smith", "Johnson", "Brown", "Williams", "Davis", "Miller"]),
      email: `${Math.random().toString(36).substring(7)}@gmail.com`,
      title: getRandomItem(["Music Concert", "Tech Conference", "Wedding Party", "Art Exhibition", "Charity Gala"]),
      description: getRandomItem([
        "An exciting event filled with great performances.",
        "An unforgettable experience with amazing speakers.",
        "A celebration of love and unity.",
        "A cultural feast for the senses.",
        "A night to remember for a good cause.",
      ]),
      earliest_date: earliestDate.toISOString().split("T")[0],
      latest_date: latestDate.toISOString().split("T")[0],
      duration: duration,
      location: {
        address: getRandomItem(["123 Main St", "456 Elm St", "789 Broadway"]),
        city: getRandomItem(["New York", "Los Angeles", "Chicago"]),
        postcode: getRandomItem(["10001", "90001", "60601"]),
      },
      organiser_id: "",
    };
  });

  const [validationErrors, setValidationErrors] = useState({});
  const navigate = useNavigate();
  const { createUser } = useAuth();

  const validateDates = (name, value, currentFormData) => {
    const errors = { ...validationErrors };

    // Remove any existing date-related errors
    delete errors.dateValidation;

    // Parse current dates and duration
    const earliestDate = name === 'earliest_date' ? new Date(value) : new Date(currentFormData.earliest_date);
    const latestDate = name === 'latest_date' ? new Date(value) : new Date(currentFormData.latest_date);
    const duration = name === 'duration' ? Number(value) : Number(currentFormData.duration);

    // Validate dates are not empty
    if (!earliestDate || !latestDate) {
      errors.dateValidation = "Please select both earliest and latest dates.";
      return errors;
    }

    // Check if earliest date is before latest date
    if (earliestDate > latestDate) {
      errors.dateValidation = "Earliest date must be before the latest date.";
      return errors;
    }

    // Calculate the date difference in days
    const dateDifferenceInDays = Math.ceil((latestDate - earliestDate) / (1000 * 3600 * 24)) + 1;

    // Check if duration exceeds available days
    if (duration > dateDifferenceInDays) {
      errors.dateValidation = `Duration (${duration} days) cannot fit between the selected dates (${dateDifferenceInDays} available days).`;
      return errors;
    }

    return errors;
  };

  const validateStep = (stepNumber) => {
    switch (stepNumber) {
      case 1:
        return formData.firstName && formData.lastName && formData.email;
      case 2:
        return formData.title && formData.description;
      case 3:
        return formData.earliest_date && formData.latest_date && formData.duration;
      case 4:
        return formData.location;
      default:
        return false;
    }
  };

  const validateForm = (step) => {
    const errors = {};
  
    if (step === 1) {
      if (!formData.firstName.trim()) errors.firstName = "First name is required.";
      if (!formData.lastName.trim()) errors.lastName = "Last name is required.";
      if (!formData.email.match(/^\S+@\S+\.\S+$/)) errors.email = "Invalid email format.";
    }
  
    if (step === 2) {
      if (!formData.title.trim()) errors.title = "Event title is required.";
      if (!formData.description.trim()) errors.description = "Description is required.";
    }
  
    if (step === 3) {
      const earliestDate = new Date(formData.earliest_date);
      const latestDate = new Date(formData.latest_date);
      const duration = Number(formData.duration);
  
      if (!formData.earliest_date) errors.earliest_date = "Earliest date is required.";
      if (!formData.latest_date) errors.latest_date = "Latest date is required.";
      if (!formData.duration || duration < 1) errors.duration = "Duration must be at least 1 day.";
  
      if (earliestDate >= latestDate) {
        errors.dateRange = "Earliest date must be before the latest date.";
      } else if (duration > (latestDate - earliestDate) / (1000 * 3600 * 24) + 1) {
        errors.duration = `Duration (${duration} days) exceeds the available range.`;
      }
    }
  
    if (step === 4) {
      if (!formData.location.address.trim()) errors.locationAddress = "Address is required.";
      if (!formData.location.city.trim()) errors.locationCity = "City is required.";
      if (!formData.location.postcode.trim()) errors.locationPostcode = "Postcode is required.";
    }
  
    setValidationErrors(errors);
    return Object.keys(errors).length === 0; // Returns true if no errors
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
  
    const namePattern = /^[A-Za-z\s]*$/;
  
    // Check for special characters in name fields
    if ((name === "firstName" || name === "lastName") && !namePattern.test(value)) {
      alert("Names can only contain letters and spaces.");
      return;
    }
  
    // Handle nested location fields
    if (name.startsWith("location.")) {
      const field = name.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        location: {
          ...prev.location,
          [field]: value,
        },
      }));
    } else {
      setFormData((prevData) => ({
        ...prevData,
        [name]: value,
      }));
    }
  
    // Validate dates and duration
    const errors = validateDates(name, value, formData);
    setValidationErrors(errors);
  };

  const handleNextStep = () => {

    if (!validateStep(step)) return;

    if (!validateForm(step)) return;

    setStep(step + 1);
  };

  const handlePrevStep = () => {
    setStep(step - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const errors = validateDates('earliest_date', formData.earliest_date, formData);
    if (Object.keys(errors).length > 0) {
      alert(Object.values(errors)[0]);
      return;
    }

    try {
      const organiser_id = await createUser(
        formData.email,
        `${formData.firstName} ${formData.lastName}`,
        true,
        null
      );

      const formattedEventData = {
        ...formData,
        organiser_id,
        earliest_date: formatDate(formData.earliest_date),
        latest_date: formatDate(formData.latest_date),
        location: JSON.stringify(formData.location),
      };

      const response = await fetch(`${API_BASE_URL}/events/create-event`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formattedEventData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create event");
      }

      const responseData = await response.json();
      const eventId = responseData.event_id;

      navigate(`/event/${eventId}`);
    } catch (error) {
      alert("Error: " + error.message);
    }
  };

  const formatDate = (date) => (date ? new Date(date).toISOString().split("T")[0] : null);

  return (
    <div className="create-event-container">
      <h1>Create Event</h1>
      {validationErrors.dateValidation && (
        <div className="error-message" style={{ color: 'red', marginBottom: '10px' }}>
          {validationErrors.dateValidation}
        </div>
      )}
      <form onSubmit={handleSubmit}>
        {/* Step 1: Personal Information */}
        {step === 1 && (
          <div>
            <div>
              <label>First Name:</label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <label>Last Name:</label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                required
              />
            </div>

            <label>Email:</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />

            {validationErrors.email && <p className="error-text">{validationErrors.email}</p>}

            <div className="button-container">
              <button className="control-button" type="button">
                  <img className = "fire" alt = "next" src = "/svgs/fire.svg"></img>
              </button>

              <div className="right-button-container">
                <button className="control-button" type="button" onClick={handleNextStep}  disabled={!validateStep(1)}>
                  <img className = "next" alt = "next" src = "/svgs/go.svg"></img>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Event Details */}
        {step === 2 && (
          <div>
            <label>Event Name:</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
            />

            <label>Description:</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
            />
            <div className="create-button-container">
              <button className="control-button" type="button" onClick={handlePrevStep}>
                <img className = "back" alt = "next" src = "/svgs/go.svg"></img>
              </button>
              <button className="control-button" type="button" onClick={handleNextStep}  disabled={!validateStep(2)}>
                <img className = "next" alt = "next" src = "/svgs/go.svg"></img>
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Dates and Duration */}
        {step === 3 && (
          <div>
            <div>
              <label>Earliest Date:</label>
              <input
                type="date"
                name="earliest_date"
                value={formData.earliest_date}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <label>Latest Date:</label>
              <input
                type="date"
                name="latest_date"
                value={formData.latest_date}
                onChange={handleChange}
                required
            />
            </div>
            <div>
              <label>Days:</label>
              <input
                type="number"
                name="duration"
                value={formData.duration}
                onChange={handleChange}
                min="1"
                required
              />
            </div>

            <div className="create-button-container">
              <button className="control-button" type="button" onClick={handlePrevStep}>
                <img className = "back" alt = "next" src = "/svgs/go.svg"></img>
              </button>
              <button className="control-button" type="button" onClick={handleNextStep}  disabled={!validateStep(3)}>
                <img className = "next" alt = "next" src = "/svgs/go.svg"></img>
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Event Location */}
        {step === 4 && (
          <div>
            <label>Address:</label>
            <input
              type="text"
              name="location.address"
              value={formData.location.address}
              onChange={handleChange}
              required
            />

            <label>City:</label>
            <input
              type="text"
              name="location.city"
              value={formData.location.city}
              onChange={handleChange}
              required
            />

            <label>Postcode:</label>
            <input
              type="text"
              name="location.postcode"
              value={formData.location.postcode}
              onChange={handleChange}
              required
            />

            <div className="create-button-container">
              <button className="control-button" type="button" onClick={handlePrevStep}>
                <img className="back" alt="back" src="/svgs/go.svg" />
              </button>
              <button type="submit">Create Event</button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};

export default CreateEvent;
