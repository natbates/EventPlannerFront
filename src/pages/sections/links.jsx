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
    const { data: linksDataFromAPI, error, loading, event_id, goEventPage} = useFetchEventData("links/fetch-links");
    const { user_id, role, name} = useAuth();
    const [newLink, setNewLink] = useState(""); 
    const [linksData, setLinksData] = useState([]); // Local state for links data
    const { updateEventPage, updateLastOpened } = useHistory();
    const { notify, setNotifyLoad } = useNotification();
    const { theme } = useTheme();
    const [linkUsernames, setLinkUsernames] = useState({});
    const [secondaryloading, setSecondaryLoading] = useState(true);
    const navigate = useNavigate();

    // Update the linksData state when linksDataFromAPI changes
    useEffect(() => {
        if (linksDataFromAPI) {
            setLinksData(linksDataFromAPI.links); // Transfer data to local state
        }
    }, [linksDataFromAPI]);

    // Fetch the user's name based on their user_id
    const fetchUsername = async (userId) => {
        try {
            const response = await fetch(`${API_BASE_URL}/users/fetch-username?user_id=${userId}`, {
                headers: {
                    "Authorization": `Bearer ${sessionStorage.getItem("token")}`
                }
            });
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
            if (linksData && linksData.length > 0) {
                const updatedUsernames = {};

                for (const link of linksData) {
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
    }, [linksDataFromAPI]);

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
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${sessionStorage.getItem("token")}`,
                },
                body: JSON.stringify(newLinkObject),
            });

            if (response.ok) {
                // Clear input field
                setNewLink("");

                // Directly update linksData in local state (without refetch)
                setLinksData((prevLinks) => [...prevLinks, newLinkObject]);

                // Optionally, update linkUsernames (if required)
                setLinkUsernames((prevUsernames) => ({
                    ...prevUsernames,
                    [newLink]:  name
                }));

                updateEventPage(event_id, "links");
                updateLastOpened("links");
                setNotifyLoad(false); // Hide loading indicator
            } else {
                notify("Failed to add the link.");
                setNotifyLoad(false);
            }
        } catch (error) {
            console.error("Error adding link:", error);
            notify("An error occurred while adding the link.");
            setNotifyLoad(false);
        }
    };

    const handleDeleteLink = async (link) => {
        try {
            setNotifyLoad(true);
            const response = await fetch(`${API_BASE_URL}/links/delete-link`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${sessionStorage.getItem("token")}`,
                },
                body: JSON.stringify({ event_id, link }),
            });

            if (response.ok) {
                // Directly update linksData by removing the deleted link from local state
                setLinksData((prevLinks) => prevLinks.filter((existingLink) => existingLink.link !== link));

                notify("Link deleted!");
            } else {
                notify("Failed to delete link");
            }
            setNotifyLoad(false);
        } catch (error) {
            console.error("Error deleting link:", error);
            notify("An error occurred while deleting the link");
            setNotifyLoad(false);
        }
    };

    if (loading || secondaryloading) {
        return (
            <div className="loader">
                <p>Fetching Links</p>
                <button
                    onClick={() => {
                        navigate(`/event/${event_id}`);
                    }}
                    className="small-button"
                >
                    Cancel
                </button>
            </div>
        );
    }

    return (
        <div className="links">
            <div className="top-line">
                <button className="back-button" onClick={() => { goEventPage(); }}>
                    {theme === "dark" ? (
                        <img src="/svgs/back-arrow-white.svg" alt="Back" />
                    ) : (
                        <img src="/svgs/back-arrow.svg" alt="Back" />
                    )}
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

            {linksData.length > 0 && (
                <div className="link-list section">
                    <h3>Link List</h3>
                    <ul>
                        {linksData.map((linkItem, index) => (
                            <li key={index} className="link-item">
                                <div>
                                    <a href={linkItem.link} target="_blank" rel="noopener noreferrer">
                                        {linkItem.link}
                                    </a>
                                    <small>
                                        Added by <strong className="name">{linkUsernames[linkItem.link]?.split(" ")[0] || "Loading..."}{" "}</strong>
                                        {new Date(linkItem.created_at).toDateString() ===
                                        new Date().toDateString()
                                            ? `at ${new Date(linkItem.created_at).toLocaleTimeString([], {
                                                  hour: "2-digit",
                                                  minute: "2-digit",
                                              })}`
                                            : `on ${new Date(linkItem.created_at).toLocaleDateString()}`}
                                    </small>
                                </div>
                                {(linkItem.added_by === user_id || role !== "attendee") && (
                                    <button
                                        className="small-button"
                                        onClick={() => handleDeleteLink(linkItem.link)}
                                    >
                                    {theme === "light" ? 
                                        <img className="delete" src="/svgs/trash-white.svg" alt="Delete" /> :
                                        <img className = "delete" src="/svgs/trash.svg" alt="Delete" />}
                                    </button>
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
                            {`https://${location.host}/event/${event_id}`}
                        </a>
                        <button
                            className="small-button"
                            onClick={() => {
                                navigator.clipboard.writeText(`https://${location.host}/event/${event_id}`);
                                notify("Link copied to clipboard!");
                            }}
                        >
                            Copy Link
                        </button>
                    </div>
                    <QRCodeCanvas
                        value={`https://${location.host}/event/${event_id}`}
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
