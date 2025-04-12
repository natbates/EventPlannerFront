import "../../styles/contact.css";
import { useState } from "react";

const Contact = () => {
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        message: "",
    });

    const [formSubmitted, setFormSubmitted] = useState(false);

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

    const handleSubmit = (e) => {
        e.preventDefault();
        // Here you can add your form submission logic, like sending the form data to an API
        console.log("Form submitted:", formData);
        setFormSubmitted(true);
    };

    return (
        <div className="contact">
            <h1>Contact Us</h1>
            {!formSubmitted ? (
                <form className="section contact-form" onSubmit={handleSubmit}>
                    <div className="one-line-input">
                        <div className="form-group">
                            <label htmlFor="firstName">First Name:</label>
                            <input
                                type="text"
                                id="firstName"
                                name="firstName"
                                value={formData.firstName}
                                onChange={handleInputChange}
                                placeholder="Your First Name"
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="lastName">Last Name:</label>
                            <input
                                type="text"
                                id="lastName"
                                name="lastName"
                                value={formData.lastName}
                                onChange={handleInputChange}
                                placeholder="Your Last Name"
                                required
                            />
                        </div>
                    </div>
                    <div className="form-group">
                        <label htmlFor="email">Email:</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            placeholder="Your Email"
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="message">Message:</label>
                        <textarea
                            id="message"
                            name="message"
                            value={formData.message}
                            onChange={handleInputChange}
                            placeholder="Your Message"
                            rows="5"
                            required
                        />
                    </div>
                    <div className="contact-buttons">
                        <button type="button" onClick={handleClear} className="contact-submit small-button">Clear</button>
                        <button type="submit" className="contact-submit small-button">Submit</button>
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
