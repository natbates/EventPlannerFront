import "../../styles/contact.css";
import { useState } from "react";
import { useNotification } from "../../contexts/notification";
import { charLimits } from "../createEvent";

const Contact = () => {
  const { notify, setNotifyLoad } = useNotification();

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    message: "",
  });

  const [formSubmitted, setFormSubmitted] = useState(false);
  const [error, setError] = useState(null); // <-- Add error state if not already present

  const handleClear = () => {
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      message: "",
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setNotifyLoad(true);
      const response = await fetch("https://formspree.io/f/mwpljbze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setFormSubmitted(true);
        setError(null);
        notify("Message submitted successfully!");
      } else {
        const data = await response.json();
        throw new Error(data.error || "Something went wrong.");
      }
    } catch (err) {
      setError(err.message);
      notify("Form submission error:", err.message);
    } finally {
      setNotifyLoad(false);
    }
  };

  return (
    <div className="contact">
      <h1>Contact Us</h1>
      {!formSubmitted ? (
        <form className="section contact-form" onSubmit={handleSubmit}>
          <div className="one-line-input">
            <div>
              <label htmlFor="firstName">First Name:</label>
              <div className="poll-input-container">
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  placeholder="Your First Name"
                  required
                  maxLength={charLimits.firstName}
                />
                <p className="character-counter">
                  {formData.firstName.length} / {charLimits.firstName}
                </p>
              </div>
            </div>
            <div>
              <label htmlFor="lastName">Last Name:</label>
              <div className="poll-input-container">
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  placeholder="Your Last Name"
                  required
                  maxLength={charLimits.lastName}
                />
                <p className="character-counter">
                  {formData.lastName.length} / {charLimits.lastName}
                </p>
              </div>
            </div>
          </div>

          <label htmlFor="email">Email:</label>
          <div className="poll-input-container">
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="Your Email"
              required
              maxLength={charLimits.email}
            />
            <p className="character-counter">
              {formData.email.length} / {charLimits.email}
            </p>
          </div>

          <label htmlFor="message">Message:</label>
          <div className="poll-input-container">
            <textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleInputChange}
              placeholder="Your Message"
              rows="5"
              required
              maxLength={300}
            />
            <p className="character-counter-bottom">
              {formData.message.length} / 300
            </p>
          </div>

          <div className="contact-buttons">
            <button
              type="button"
              onClick={handleClear}
              className="contact-submit small-button"
            >
              Clear
            </button>
            <button type="submit" className="contact-submit small-button">
              Submit
            </button>
          </div>
        </form>
      ) : (
        <div className="thank-you-message">
          <h2>Thank you for reaching out!</h2>
          <p>We have received your message and will get back to you soon.</p>
        </div>
      )}
    </div>
  );
};

export default Contact;
