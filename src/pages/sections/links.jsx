import { useState, useEffect } from "react";
import { API_BASE_URL } from "../../components/App";
import { useAuth } from "../../contexts/auth";
import { useHistory } from "../../contexts/history";
import { QRCodeCanvas } from "qrcode.react";
import { useNotification } from "../../contexts/notification";
import "../../styles/links.css";
import useFetchEventData from "../../hooks/useFetchEventData";
import PageError from "../../components/PageError";
import { useTheme } from "../../contexts/theme";
import { useNavigate } from "react-router-dom";

const Links = () => {
    const { data: linksData, error, loading, event_id, refetch, goEventPage} = useFetchEventData("links/fetch-links");
    const { user_id, name, role } = useAuth();
    const [newLink, setNewLink] = useState(""); 
    const { updateEventPage, updateLastOpened } = useHistory();
    const { notify, setNotifyLoad} = useNotification();
    const {theme} = useTheme();
    // State to store the added_by_name for each link
    const [linkUsernames, setLinkUsernames] = useState({});
    const [secondaryloading, setSecondaryLoading] = useState(true);
    const navigate = useNavigate();

    // Fetch the user's name based on their user_id
    const fetchUsername = async (userId) => {
        try {
            const response = await fetch(`${API_BASE_URL}/users/fetch-username?user_id=${userId}`);
            if (response.ok) {
                const { name } = await response.json();
                return name;
            } else {
                console.error("Failed to fetch user name");
                return "Unknown User";
            }
        } catch (error) {
            console.error("Error fetching username:", error);
            return "Unknown User";
        }
    };

    // Update the link's added_by_name when linksData changes
    useEffect(() => {
        const fetchNamesForLinks = async () => {
            setSecondaryLoading(true); 
            if (linksData && linksData.links.length > 0) {
                const updatedUsernames = {};

                for (const link of linksData.links) {
                    const username = await fetchUsername(link.added_by);
                    updatedUsernames[link.link] = username; // Store the username with the link
                }

                setLinkUsernames(updatedUsernames); // Update state
                setSecondaryLoading(false);
                setNotifyLoad(false);
            } else {
                setLinkUsernames({}); // Reset if no links
                setSecondaryLoading(false);
                setNotifyLoad(false);
            }
        };

        fetchNamesForLinks();
    }, [linksData]);

    const handleAddLink = async (e) => {
        e.preventDefault();
      
        if (!newLink) {
          notify("Link required.");
          return;
        }

        setNotifyLoad(true);
      
        const newLinkObject = {
          link: newLink,
          added_by: user_id, 
          created_at: new Date().toISOString(), 
          event_id: event_id, 
        };
      
        try {
          // Make the API request to add the new link
          const response = await fetch(`${API_BASE_URL}/links/add-link`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newLinkObject),
          });
      
          if (response.ok) {
            setNewLink("");  
            updateEventPage(event_id, "links");
            updateLastOpened("links");
            refetch();
          } else {
            notify("Failed to add the link.");
          }
        } catch (error) {
          console.error("Error adding link:", error);
          notify("An error occurred while adding the link.");
        } 
    };

    const handleDeleteLink = async (link) => {
        // Assuming you have a delete link function
        try {
            setNotifyLoad(true);
            const response = await fetch(`${API_BASE_URL}/links/delete-link`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ event_id, link }),
            });

            if (response.ok) {
                refetch(); // Re-fetch links after deletion
                notify("Link deleted!");
            } else {
                notify("Failed to delete link");
            }
        } catch (error) {
            console.error("Error deleting link:", error);
            notify("An error occurred while deleting the link");
        } 
    };

    if (error) return <PageError error={error?.message ? error?.message : "Something Went Wrong"} page={"Links"} />;

    console.log("Loadig Links", loading, secondaryloading, linksData);

    if (loading || secondaryloading) return <div className="loader"><p>Fetching Links</p><button onClick = {() => {navigate(`/event/${event_id}`)}} className="small-button">Cancel</button></div>;

    return (
        <div className="links">
            <div className="top-line">
                <button className="back-button" onClick={() => { goEventPage(); }}>
                  {theme === "dark" ? 
                    <img src="/svgs/back-arrow-white.svg" alt="Back" /> :
                  <img src="/svgs/back-arrow.svg" alt="Back" />}
                </button>
                <h2>Links</h2>
            </div>

            <form onSubmit={handleAddLink} className="add-link-form">
                <div className="add-link">
                    <div className="to-do-input-container"> 
                        <input
                            type="url"
                            value={newLink.toLowerCase()}
                            onChange={(e) => setNewLink(e.target.value)}
                            placeholder="https://link.com"
                            required
                            maxLength={150}
                        />
                        <p className="character-counter">{newLink.length} / 150</p>
                    </div>
                    <button className="small-button" type="submit">Add Link</button>
                </div>
            </form>

            
            {linksData != null && linksData.links.length > 0 && (
            <div className="link-list section">
                <h3>Link List</h3>
                <ul>
                    {linksData.links.map((linkItem, index) => (
                        <li key={index} className="link-item">
                            <div>
                                <a href={linkItem.link} target="_blank" rel="noopener noreferrer">
                                    {linkItem.link}
                                </a>
                                <small>
                                    Added by {linkUsernames[linkItem.link] || "Loading..."} {new Date(linkItem.created_at).toDateString() === new Date().toDateString()
                                  ? `at ${new Date(linkItem.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                                  : `on ${new Date(linkItem.created_at).toLocaleDateString()}`}
                                </small>
                            </div>
                            {(linkItem.added_by === user_id || role === "organiser") && (
                                <button className="small-button" onClick={() => handleDeleteLink(linkItem.link)}>🗑</button>
                            )}
                        </li>
                    ))}
                </ul>
              </div>
            )}

            <div className="section">
                <h2>Invite Link</h2>
                <div className="invite-link-qr-code">
                    <div>
                        <a href={`${location.host}/event/${event_id}`} target="_blank" rel="noopener noreferrer">
                            {`${location.host}/event/${event_id}`}
                        </a>
                        <button className="small-button" onClick={() => {
                            navigator.clipboard.writeText(`${location.host}/event/${event_id}`);
                            notify("Link copied to clipboard!");
                        }}>Copy Link</button>
                    </div>
                    <QRCodeCanvas 
                        value={`${location.host}/event/${event_id}`} 
                        size={128}   
                        bgColor="white"
                        fgColor="black" 
                        className="qr"
                    />
                </div>
            </div>

        </div>
    );
};

export default Links;
