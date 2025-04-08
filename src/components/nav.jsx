import { Link, useNavigate, useParams, useLocation } from "react-router-dom";
import "../styles/navbar.css";
import { useAuth } from "../contexts/auth";
import { useEffect, useState } from "react";
import { useHistory } from "../contexts/history";
import { useTheme } from "../contexts/theme";

const NavBar = () => {
    const { signOut, user_id, authed} = useAuth();
    const params = useParams();
    const [event_id, setEvent_id] = useState();
    const navigate = useNavigate();
    const location = useLocation();
    const { toggleTheme, theme } = useTheme();

    const [lastOpened, setLastOpened] = useState(null);
    const [lastUpdated, setLastUpdated] = useState(null);

    const [isOnHomeRoutes, setIsOnHomeRoutes] = useState(false);
    const [isOnEventHomePage, setIsOnEventHomePage] = useState(false);
    const [isOnLoginPage, setIsOnLoginPage] = useState(false);

    const {fetchLastOpened, fetchLastUpdated} = useHistory();

    useEffect(() =>
    {
        console.log("X");
        const match = location.pathname.match(/\/event\/([^/]+)/);
        setEvent_id(match ? match[1] : undefined);
    }, []);

    const fetchCommentData = async () =>
    {
        console.log("X");
        const last_updated = await fetchLastUpdated(event_id);
        setLastUpdated(last_updated);
        const last_opened = await fetchLastOpened(user_id);
        setLastOpened(last_opened);
    }    

    useEffect(() => {
        fetchCommentData();
    }, [event_id, user_id])


    const homeRoutes = [
        { path: "/create-event", label: "Create Event", img: "/svgs/create.svg" },
        { path: "/find-event", label: "Find Event", img: "/svgs/find.svg" },
        { path: "/support", label: "Get Support", img: "/svgs/support.svg" },
    ];

    const eventRoutes = [
        { path: "/attendees", label: "Attendees", img: "/svgs/attendees.svg" },
        { path: "/shared-calendar", label: "Shared Calendar", img: "/svgs/shared-calender.svg" },
        { path: "/links", label: "Links", img: "/svgs/links.svg" },
        { path: "/polls", label: "Polls", img: "/svgs/polls.svg" },
        { path: "/location", label: "Location", img: "/svgs/location.svg" },
        { path: "/your-calendar", label: "Your Calendar", img: "/svgs/your-calender.svg" },
        { path: "/comments", label: "Comments", img: "/svgs/comments.svg" },
        { path: "/to-do", label: "To Do List", img: "/svgs/to-do.svg" },
        { path: "/settings", label: "Settings", img: "/svgs/settings.svg" },
    ];

    useEffect(() => {
        // Logic to set states based on the current location and event_id
        const homeRoutesPaths = homeRoutes.map((route) => route.path);
        setIsOnHomeRoutes(location.pathname === "/" || homeRoutesPaths.includes(location.pathname));
      
        const isOnEventHomePage = location.pathname.startsWith('/event/') && location.pathname.split('/').length === 3;
        setIsOnEventHomePage(isOnEventHomePage);
                
        const loginPagePath = event_id ? `/event/${event_id}/login` : null;
        setIsOnLoginPage(location.pathname === loginPagePath);
    }, [event_id, location.pathname]);

    const handleNavigation = (path) => {
        if (event_id === null || event_id === undefined) {
            console.log("No event_id found, redirecting to /find-event");
            navigate("/find-event");
        } else {
            navigate(event_id ? `/event/${event_id}${path}` : path);
        }
    };

    const handleHomeNavigation = (path) => {
        navigate(`${path}`);
    }

    const filteredLastOpened = lastOpened
    ? lastOpened.filter((entry) => entry.path === "comments") // Or any path filter logic
    : [];

    const filteredLastUpdated = lastUpdated
        ? lastUpdated.filter((entry) => entry.path === "comments") // Or any path filter logic
        : [];

    const showCommentNotification =
        filteredLastOpened.length > 0 &&
        filteredLastUpdated.length > 0 &&
        new Date(filteredLastOpened[0].timestamp) < new Date(filteredLastUpdated[0].timestamp);


    return (
        <nav className="nav-bar">
            <Link to="/">
                <img className="nav-icon" src="/svgs/logo.svg" alt="Logo" />
            </Link>

            {/* Show home routes if on any home-related page */}
            {isOnHomeRoutes && (
                <div className="nav-links home-links">
                    {homeRoutes.map(({ path, label, img }) => (
                        <button
                            key={path}
                            className={`nav-item ${location.pathname === path ? "active" : ""}`}
                            onClick={() => handleHomeNavigation(path)}
                        >
                            <img src={img} alt={label} className="nav-icon" />
                        </button>
                    ))}
                </div>
            )}

            {isOnEventHomePage && authed && (
            <div className="nav-links">
                <button
                    className= "nav-item"
                    onClick={() => signOut()}
                >
                    <img src="/svgs/logout.svg" alt="sign out" className="nav-icon" />
                </button>   
                <button
                    className= "nav-item"
                    onClick={() => navigate("/event/" + event_id + "/comments")}
                >
                    <img src="/svgs/comments.svg" alt="comments" className="nav-icon" />
                    {showCommentNotification && <div className="notifcation-circle-comment"></div>}
                </button>
                <button
                    className= "nav-item"
                    onClick={() => toggleTheme()}
                >
                    <img src="/svgs/theme.svg" alt="comments" className="nav-icon" />
                </button>      
            </div>         
            )}

            {/* Show event routes if NOT on event home page */}
            {!isOnEventHomePage && event_id && !isOnHomeRoutes && !isOnLoginPage && (
                <div className="nav-links event-links">
                    {eventRoutes.map(({ path, label, img }, index) => {
                        const isCommentsRoute = path === "/comments";
                        const showNotification = isCommentsRoute && showCommentNotification;
                        
                        return (
                            <button
                                key={path}
                                className={`nav-item ${location.pathname.includes(path) ? "active" : ""}`}
                                onClick={() => handleNavigation(path)}
                                style={{ animationDelay: `${index * 0.01}s` }} // Delay increases per item
                            >
                                <img src={img} alt={label} className="nav-icon" />
                                {/* Notification circle for comments */}
                                {showNotification && <div className="notifcation-circle-comment"></div>}
                            </button>
                        );
                    })}
                </div>
            )}
        </nav>
    );
};

export default NavBar;
