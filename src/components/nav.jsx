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
    const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
    
    const [isOnHomeRoutes, setIsOnHomeRoutes] = useState(false);
    const [isOnEventHomePage, setIsOnEventHomePage] = useState(false);
    const [isOnLoginPage, setIsOnLoginPage] = useState(false);

    const {fetchLastOpened, fetchLastUpdated, eventStatus, fetchEventStatus} = useHistory(); 

    useEffect(() =>
    {
        fetchEventStatus(event_id);
        const match = location.pathname.match(/\/event\/([^/]+)/);
        setEvent_id(match ? match[1] : undefined);
    }, [location.pathname]);

    const fetchCommentData = async () =>
    {
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
    ];

    const otherHomeRoutes = [
        {path: "/support"}, {path: "/tos"}, {path: "/contact"}, {path: "/privacy-policy"}
    ]

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
        setIsOnHomeRoutes(location.pathname === "/" || homeRoutesPaths.includes(location.pathname) || otherHomeRoutes.some(route => location.pathname === route.path));
      
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

    const handleSignOut = () => {
        const confirmSignOut = window.confirm("Are you sure you want to sign out?");
        if (confirmSignOut) {
            signOut(event_id);
        }
    };

    const toggleMobileNav = () => {
        setIsMobileNavOpen((prev) => !prev);
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
                {theme === "dark" ? 
                <img className="nav-icon home-logo" src="/svgs/logo-white.svg" alt="Logo" /> : 
                <img className="nav-icon home-logo" src="/svgs/logo.svg" alt="Logo" /> }
            </Link>

            {/* Show home routes if on any home-related page */}
            {isOnHomeRoutes && (
                <div className="nav-links home-links">
                    {homeRoutes.map(({ path, label, img }, index) => (
                        <div className="tooltip-wrapper" key={path}>
                            <button
                                className={`nav-item ${theme === "dark" ? "light-up" : ""} ${location.pathname === path ? "active" : ""}`}
                                onClick={() => handleHomeNavigation(path)}
                                style={{ animationDelay: `${index * 0.03}s` }}
                            >
                                <img src={img} alt={label} className="nav-icon" />
                            </button>
                            <span className="tooltip-text">{label}</span>
                        </div>
                    ))}

                    <div className="tooltip-wrapper">
                        <button
                            className={`nav-item ${theme === "dark" ? "light-up" : ""}`}
                            onClick={() => toggleTheme()}
                            style={{ animationDelay: `${4 * 0.03}s` }}
                        >
                            {theme === "light" ? 
                                <img src="/svgs/lightmode.svg" alt="light mode" className="nav-icon" /> :
                                <img src="/svgs/darkmode.svg" alt="dark mode" className="nav-icon" />}
                        </button>
                        <span className="tooltip-text">{theme === "light" ? "Light Mode" : "Dark Mode"}</span>
                    </div>
                </div>
            )}


            {isOnEventHomePage && authed && eventStatus && eventStatus !== "confirmed" && eventStatus !== "canceled" && (
                <div className="nav-links">
                    <div className="tooltip-wrapper">
                        <button
                            className={`nav-item ${theme === "dark" ? "light-up" : ""}`}
                            onClick={() => navigate("/event/" + event_id + "/comments")}
                            style={{ animationDelay: `${1 * 0.01}s` }}
                        >
                            <img src="/svgs/comments.svg" alt="comments" className="nav-icon" />
                            {showCommentNotification && <div className="notifcation-circle-comment"></div>}
                        </button>
                        <span className="tooltip-text">Comments</span>
                    </div>

                    <div className="tooltip-wrapper">
                        <button
                            className={`nav-item ${theme === "dark" ? "light-up" : ""}`}
                            onClick={() => toggleTheme()}
                            style={{ animationDelay: `${2 * 0.03}s` }}
                        >
                            {theme === "light" ? (
                                <img src="/svgs/lightmode.svg" alt="light mode" className="nav-icon" />
                            ) : (
                                <img src="/svgs/darkmode.svg" alt="dark mode" className="nav-icon" />
                            )}
                        </button>
                        <span className="tooltip-text">{theme === "light" ? "Light Mode" : "Dark Mode"}</span>
                    </div>

                    <div className="tooltip-wrapper">
                        <button
                            className={`nav-item ${theme === "dark" ? "light-up" : ""}`}
                            onClick={() => handleSignOut()}
                            style={{ animationDelay: `${3 * 0.05}s` }}
                        >
                            <img src="/svgs/logout.svg" alt="sign out" className="nav-icon" />
                        </button>
                        <span className="tooltip-text">Sign Out</span>
                    </div>
                </div>
            )}

            {/* Show event routes if NOT on event home page */}
            {!isOnEventHomePage && event_id && !isOnHomeRoutes && !isOnLoginPage && (
                <>
                    {/* Burger Menu (Mobile only) */}
                    <button onClick={toggleMobileNav} className={`burger-menu nav-item ${theme === "dark" ? "light-up" : ""}`}>
                        <img className="nav-icon" src = "/svgs/burger.svg" alt="Menu" />
                    </button>

                    {/* Desktop/Event Nav */}
                    <div className="nav-links event-links desktop-only">
                        {eventRoutes.map(({ path, label, img }, index) => {
                            const isCommentsRoute = path === "/comments";
                            const showNotification = isCommentsRoute && showCommentNotification;

                            return (
                            <div key={path} className="tooltip-wrapper">
                                <button
                                    className={`nav-item ${theme === "dark" ? "light-up" : ""} ${location.pathname.includes(path) ? "active" : ""}`}
                                    onClick={() => handleNavigation(path)}
                                    style={{ animationDelay: `${index * 0.01}s` }}
                                >
                                    <img src={img} alt={label} className="nav-icon" />
                                    {showNotification && <div className="notifcation-circle-comment"></div>}
                                </button>
                                <span className="tooltip-text">{label}</span>
                            </div>
                            );
                        })}
                    </div>


                    {/* Mobile Nav Dropdown */}
            {isMobileNavOpen && (
                <div className="mobile-nav">
                <h2>Menu</h2>
                <button
                    className="close-mobile-nav"
                    onClick={() => setIsMobileNavOpen(false)}
                    >
                    ✕
                    </button>

                    {eventRoutes.map(({ path, label, img }) => (
                    <button
                        key={path}
                        onClick={() => {
                        handleNavigation(path);
                        setIsMobileNavOpen(false); // Close after click
                        }}
                        className="mobile-nav-item"
                    >
                        <img src={img} alt={label} className={`nav-icon ${theme === "dark" ? "light-up" : ""} ${location.pathname.includes(path) ? "active" : ""}`} />
                        {label}
                    </button>
                    ))}
                </div>
                )}
            </>
            )}

        {isOnEventHomePage && authed && (eventStatus === "confirmed" || eventStatus === "canceled" ) && (
        <div className="nav-links">
            <div className="tooltip-wrapper">
                <button
                    className={`nav-item ${theme === "dark" ? "light-up" : ""}`}
                    onClick={() => toggleTheme()}
                    style={{ animationDelay: `${4 * 0.03}s` }}
                >
                    {theme === "light" ? 
                        <img src="/svgs/lightmode.svg" alt="light mode" className="nav-icon" /> :
                        <img src="/svgs/darkmode.svg" alt="dark mode" className="nav-icon" />}
                </button>
                <span className="tooltip-text">{theme === "light" ? "Light Mode" : "Dark Mode"}</span>
            </div>
            <div className="tooltip-wrapper">
                <button
                className={`nav-item ${theme === "dark" ? "light-up" : ""}`}
                onClick={() => handleSignOut()}
                style={{ animationDelay: `${3 * 0.05}s` }}
            >
                <img src="/svgs/logout.svg" alt="sign out" className="nav-icon" />
                </button>
                <span className="tooltip-text">Sign Out</span>
            </div>
        </div>
        )}

        </nav>
    );
};

export default NavBar;
