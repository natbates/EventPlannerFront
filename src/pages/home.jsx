import "../styles/home.css";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const Home = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState("howItWorks");

  const sections = {
    howItWorks: [
      { text: "Create or Join an Event", img: "svgs/create.svg" },
      { text: "Fill in Event Information or Availability", img: "svgs/info.svg" },
      { text: "Stay Up to Date (Comments, Polls, Links, etc.)", img: "svgs/update.svg" },
      { text: "Organizer Selects Event Dates", img: "svgs/calendar.svg" },
      { text: "Receive Email Confirmation", img: "svgs/email.svg" },
      { text: "Event Can Be Canceled if Needed", img: "svgs/cancel.svg" },
    ],
    whatItCanDo: [
      { text: "Use Polls To Make Group Decisions", img: "svgs/polls.svg" },
      { text: "Share important links with your group.", img: "svgs/links.svg" },
      { text: "Set and share event locations easily.", img: "svgs/location.svg" },
      { text: "Discuss event details in one place.", img: "svgs/comments.svg" },
      { text: "Keep everyone in sync with a shared schedule.", img: "svgs/your-calender.svg" },
      { text: "Keep track of important tasks and stay organized.", img: "svgs/to-do.svg" },
    ],
    faqs: [
      { text: "How do I create an event?", img: "svgs/question.svg" },
      { text: "Can I invite multiple people?", img: "svgs/question.svg" },
      { text: "Is there a mobile version?", img: "svgs/question.svg" },
      { text: "How do I cancel an event?", img: "svgs/question.svg" },
      { text: "What happens if I forget my login?", img: "svgs/question.svg" },
      { text: "Is my data secure?", img: "svgs/question.svg" },
    ],
  };

  return (
    <div className="home-page">
      <h1>Make Planning Your Adventures Easy.</h1>

      <div className="home-section">

        <div className="section-toggle">
          <button onClick={() => setActiveSection("howItWorks")}>How It Works</button>
          <button onClick={() => setActiveSection("whatItCanDo")}>What It Can Do</button>
          <button onClick={() => setActiveSection("faqs")}>FAQs</button>
        </div>

        <div className="features">
          {sections[activeSection].map((item, index) => (
            <div key={index} className="feature">
              <img src={item.img} alt={item.text} />
              <h2>{item.text}</h2>
            </div>
          ))}
        </div>
      </div>

      <div className="home-section">
        <h2>Get Support.</h2>
      </div>
    </div>
  );
};

export default Home;
