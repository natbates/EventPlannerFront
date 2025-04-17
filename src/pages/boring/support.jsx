import "../../styles/support.css";
import { useNavigate } from "react-router-dom";

const Support = () => {
  const navigate = useNavigate();

  return (
    <div className="support">
      <h1>Support</h1>

      <div className="home-section">
        <div className="features">

          {/* How It Works Section */}
          <h2 className="section-header">How It Works</h2>
          <ul className="simple-list">
            <li>Create or Join an Event</li>
            <li>Fill in Event Information or Availability</li>
            <li>Stay Up to Date (Comments, Polls, Links, etc.)</li>
            <li>Organizer Selects Event Dates</li>
            <li>Receive Email Confirmation</li>
            <li>Event Can Be Canceled if Needed</li>
          </ul>

          {/* What It Can Do Section */}
          <h2 className="section-header">What It Can Do</h2>
          <ul className="simple-list">
            <li>Use Polls To Make Group Decisions</li>
            <li>Share Important Links</li>
            <li>Set and Share Locations</li>
            <li>Discuss Event Details in One Place</li>
            <li>Keep Everyone in Sync with a Shared Schedule</li>
            <li>Keep Track of Important Tasks and Stay Organized</li>
          </ul>

          {/* FAQs Section */}
          <h2 className="section-header">FAQs</h2>
          <ul className="simple-list">
            <li>Can I invite multiple people? Yes! You can invite as many attendees as you would like.</li>
            <li>Is there a mobile version? There is not a mobile app but the website works on mobile.</li>
            <li>How do I cancel an event? Go to your shared calender and select cancel event and provide a reason for cancellation.</li>
            <li>What happens if I forget my login? Your login details includes only your email address</li>
            <li>What if i forget the event code? You can find the event code in your emails or anyone in the event can send it to you.</li>
            <li>Is my data secure? Yes your data is secure, only people invited and accepted into the event can see your availability</li>
            <li>Can I change my availability? Yes you can change your availability at any time.</li>
            <li>Can I delete my event? Yes you can delete your event at any time.</li>
          </ul>
        </div>

        <span className="contact-button">
          <h3>Not Found What You Were Looking For? Have any suggestions?</h3>
          <button onClick={() => navigate("/contact")} className="small-button">Contact</button>
        </span>
      </div>
    </div>
  );
};

export default Support;
