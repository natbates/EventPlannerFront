import useFetchEventData from "../../hooks/useFetchEventData";
import { useAuth } from "../../contexts/auth";
import { useState } from "react";
import { API_BASE_URL } from "../../components/App";
import { useHistory } from "../../contexts/history";

const Links = () =>
{
    const { data: linksData, error, loading, event_id, refetch, goEventPage } = useFetchEventData("links/fetch-links");
    const { user_id, name, role } = useAuth();
    const [newLink, setNewLink] = useState(""); 
    const {updateEventPage, updateLastOpened} = useHistory();
    

    const handleAddLink = async (e) => {
        e.preventDefault();
      
        if (!newLink) {
          alert("link required.");
          return;
        }
      
        const newLinkObject = {
          link: newLink,
          added_by_name: name,
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
            refetch();
      
            updateEventPage(event_id, "links");
            updateLastOpened("links");
          } else {
            alert("Failed to add the link.");
          }
        } catch (error) {
          console.error("Error adding link:", error);
          alert("An error occurred while adding the link.");
        }
    };

    return (
        <div className="links">
            <div className="top-line">
              <button className="back-button" onClick={() => { goEventPage(); }}>
                <img src="/svgs/back-arrow.svg" alt="Back" />
              </button>
              <h2>Links</h2>
            </div>

            <div>
              <h2>Invite Link</h2>
              <p>event/{event_id}</p>
              <p>QR Code:</p>
              <p>Share Links</p>
            </div>

            <form onSubmit={handleAddLink}>
                <h2>Usefull Links</h2>
                <div>
                    <label>
                    Link:
                    <input
                        type="url"
                        value={newLink}
                        onChange={(e) => setNewLink(e.target.value)}
                        placeholder="https://link.com"
                        required
                    />
                    </label>
                </div>
                <button type="submit">Add Link</button>
            </form>

            <div className="link-list">
                <h3>Link List</h3>
                {linksData != null && linksData.links.length > 0 ? (
                    <ul>
                    {linksData.links.map((linkItem, index) => (
                        <li key={index}>
                        <a href={linkItem.link} target="_blank" rel="noopener noreferrer">
                            {linkItem.link}
                        </a>
                        <br />
                        <small>
                            Added by {linkItem.added_by_name} on {new Date(linkItem.created_at).toLocaleString()}
                        </small>
                        {(linkItem.added_by === user_id || userRole === "organiser") && (
                            <button onClick={() => handleDeleteLink(linkItem.link)}>
                            Delete
                            </button>
                        )}
                        </li>
                    ))}
                    </ul>
                ) : (
                    <p>No links available.</p>
                )}
            </div>
      </div>
    )
}

export default Links;