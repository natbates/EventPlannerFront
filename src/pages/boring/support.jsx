import "../../styles/support.css";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const Support = () => {

  const navigate = useNavigate();

  const [visibleSections, setVisibleSections] = useState({
    howItWorks: false,
    whatItCanDo: false,
    faqs: false,
  });

  const toggleSection = (section) => {
    setVisibleSections((prevSections) => ({
      ...prevSections,
      [section]: !prevSections[section], // Toggle the specific section
    }));
  };

  return (
    <div className="support">
      <h1>Support</h1>

      <div className="home-section">
        <div className="features">
          {/* How It Works Section */}
          <h2 onClick={() => toggleSection("howItWorks")} className="toggle-header">
            How It Works
          </h2>
          {visibleSections.howItWorks && (
            <div>
              <div className="feature">
                <img src="svgs/create.svg" alt="Create or Join an Event" />
                <p>Create or Join an Event</p>
              </div>
              <div className="feature">
                <img src="svgs/info.svg" alt="Fill in Event Information or Availability" />
                <p>Fill in Event Information or Availability</p>
              </div>
              <div className="feature">
                <img src="svgs/update.svg" alt="Stay Up to Date" />
                <p>Stay Up to Date (Comments, Polls, Links, etc.)</p>
              </div>
              <div className="feature">
                <img src="svgs/calendar.svg" alt="Organizer Selects Event Dates" />
                <p>Organizer Selects Event Dates</p>
              </div>
              <div className="feature">
                <img src="svgs/email.svg" alt="Receive Email Confirmation" />
                <p>Receive Email Confirmation</p>
              </div>
              <div className="feature">
                <img src="svgs/cancel.svg" alt="Event Can Be Canceled if Needed" />
                <p>Event Can Be Canceled if Needed</p>
              </div>
            </div>
          )}

          {/* What It Can Do Section */}
          <h2 onClick={() => toggleSection("whatItCanDo")} className="toggle-header">
            What It Can Do
          </h2>
          {visibleSections.whatItCanDo && (
            <div>
              <div className="feature">
                <img src="svgs/polls.svg" alt="Use Polls To Make Group Decisions" />
                <p>Use Polls To Make Group Decisions</p>
              </div>
              <div className="feature">
                <img src="svgs/links.svg" alt="Share Important Links" />
                <p>Share Important Links</p>
              </div>
              <div className="feature">
                <img src="svgs/location.svg" alt="Set and Share Locations" />
                <p>Set and Share Locations</p>
              </div>
              <div className="feature">
                <img src="svgs/comments.svg" alt="Discuss Details in One Place" />
                <p>Discuss Event Details in One Place</p>
              </div>
              <div className="feature">
                <img src="svgs/your-calender.svg" alt="Shared Schedule" />
                <p>Keep Everyone in Sync with a Shared Schedule</p>
              </div>
              <div className="feature">
                <img src="svgs/to-do.svg" alt="Track Important Tasks" />
                <p>Keep Track of Important Tasks and Stay Organized</p>
              </div>
            </div>
          )}

          {/* FAQs Section */}
          <h2 onClick={() => toggleSection("faqs")} className="toggle-header">
            FAQs
          </h2>
          {visibleSections.faqs && (
            <div>
              <div className="feature">
                <img src="svgs/question.svg" alt="Can I invite multiple people?" />
                <p>Can I invite multiple people?</p>
              </div>
              <div className="feature">
                <img src="svgs/question.svg" alt="Is there a mobile version?" />
                <p>Is there a mobile version?</p>
              </div>
              <div className="feature">
                <img src="svgs/question.svg" alt="How do I cancel an event?" />
                <p>How do I cancel an event?</p>
              </div>
              <div className="feature">
                <img src="svgs/question.svg" alt="What happens if I forget my login?" />
                <p>What happens if I forget my login?</p>
              </div>
              <div className="feature">
                <img src="svgs/question.svg" alt="Is my data secure?" />
                <p>Is my data secure?</p>
              </div>
            </div>
          )}
        </div>
        
        <span className="contact-button">
          <h3>Not Found What You Were Looking For?</h3>
          <button onClick = {() => {navigate("/contact")}} className="small-button">Contact</button>
        </span>
      </div>
    </div>
  );
};

export default Support;
