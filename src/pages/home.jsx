import { useNavigate } from "react-router-dom";
import "../styles/home.css";

const Home = () => {
  const navigate = useNavigate();

  const handleCreateEventClick = () => {
    navigate("/create-event");
  };

  const handleFindEventClick = () => {
    navigate("/find-event");
  };

  return (
    <div className="home-page">
      <h1>
        Planning Your Adventures Has Never Been <b className="underline">Easier.</b>
      </h1>
      <div className="home-buttons">
        <button className="home-cta" onClick={handleCreateEventClick}>
          Create Event
        </button>
        <button className="home-cta" onClick={handleFindEventClick}>
          Find A Event
        </button>
      </div>

    </div>
  );
};

export default Home;
