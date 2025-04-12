import { useNavigate } from "react-router-dom";
import { useNotification } from "../contexts/notification"; // Make sure this is correct path
import "../styles/home.css"; // Ensure you're importing your styles correctly

const Home = () => {
  const navigate = useNavigate();

  // Handler for "Create Event" button
  const handleCreateEventClick = () => {
    navigate("/create-event");
  };

  // Handler for "Find Event" button
  const handleFindEventClick = () => {
    navigate("/find-event");
  };

  return (
    <div className="home-page">
      <h1>Planning Your Adventures Has Never Been <b className="underline">Easier.</b></h1>
      <div className="home-buttons">
        <button className="home-cta" onClick={handleCreateEventClick}>Create Event</button>
        <button className="home-cta" onClick={handleFindEventClick}>Find A Event</button>
      </div>

    </div>
  );
};

export default Home;
