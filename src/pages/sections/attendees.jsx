import useFetchEventData from "../../hooks/useFetchEventData";
import { useAuth } from "../../contexts/auth";
import { API_BASE_URL } from "../../components/App";
import "../../styles/attendees.css";
import { useNavigate } from "react-router-dom";

const Profile = ({name, you, role}) =>
{
  return (
    <div className="profile">
      <img src = {`/svgs/profile-${role}.svg`} className="profile-image"></img>
      <p style={{ fontWeight: you ? "bold" : "normal" }}>{name}</p>
    </div>
  );
}

const generateFakeAttendees = (numAdmins = 5, numAttendees = 20) => {
  const fakeAdmins = Array.from({ length: numAdmins }, (_, i) => ({
      user_id: `admin_${i + 1}`,
      username: `Admin ${i + 1}`,
      role: "admin",
  }));

  const fakeAttendees = Array.from({ length: numAttendees }, (_, i) => ({
      user_id: `attendee_${i + 1}`,
      username: `Attendee ${i + 1}`,
      role: "attendee",
  }));

  return {
      organiser: { user_id: "organiser_1", username: "Main Organiser", role: "organiser" },
      attendees: [...fakeAdmins, ...fakeAttendees],
      requests: [],
  };
};


const Attendees = () => {

    const { data: attendeeData, error, loading, event_id, refetch, goEventPage} = useFetchEventData("attendees/fetch-attendees");
    const { user_id, name, role, createUser, authed, email: userEmail, fingerprint: userFingerprint, LogIn, LogOut} = useAuth();
    const navigate = useNavigate();

    const AcceptRequest = async (request) => {
    
        // Ensure the request is valid before proceeding
        if (request === undefined || request.email === undefined || request.username === undefined) {
            console.error("Invalid request object:", request);
            alert("Invalid request. Please try again.");
            return;
        }
    
        try {
            console.log("Processing request for:", request.username);
    
            // Call createUser to add the user to the event (attendee role)
            const { email, username } = request;
            console.log("Creating user for:", email, username);
    
            const userResponse = await createUser(email, username, false, event_id, false); // Assuming false represents an attendee role
            if (!userResponse) {
                throw new Error("Failed to create user.");
            }
    
            console.log("User created successfully:", userResponse);
    
            // Update the list of requests by removing the accepted request
            const updatedRequests = attendeeData.requests.filter((req) => req.email !== request.email);
            console.log("Updated requests list:", updatedRequests);
    
            // Now, update the requests in the event
            const response = await fetch(`${API_BASE_URL}/attendees/update-requests`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    event_id,
                    requests: updatedRequests,
                }),
            });
    
            if (!response.ok) {
                const errorData = await response.json();
                console.error("Failed to update requests:", errorData);
                throw new Error(`Failed to update requests: ${errorData.message || 'Unknown error'}`);
            }
    
            const data = await response.json();
            console.log("Request removed from event successfully:", data);
            refetch();
            alert("Request accepted and user added to the event.");
    
        } catch (error) {
            // Provide more meaningful error handling for various failures
            console.error("Error during request acceptance:", error.message || error);
            alert(`There was an error accepting the request: ${error.message || "Unknown error"}`);
        }
    };
    
    const RejectRequest = async (request) => {
        if (window.confirm("Are you sure you want to reject this user?")) {
          try {
            // Send request to backend API to reject the request
            const response = await fetch(`${API_BASE_URL}/attendees/reject-request`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                event_id: event_id, // assuming event_id is available in the scope
                email: request.email, 
              }),
            });
        
            const data = await response.json();
        
            if (response.ok) {
              refetch();
    
            } else {
              alert(`Failed to reject request: ${data.message}`);
            }
          } catch (err) {
            console.error("Error rejecting request:", err);
            alert("An error occurred while rejecting the request.");
          }
        }
    };

    const seeAvailability = (user_id) => {
      navigate(`/event/${event_id}/attendee-calender/${user_id}`);
    }

    const promoteUser = async (user_id) => {
        if (window.confirm("Are you sure you want to promote this user?")) {
          try {
            const response = await fetch(`${API_BASE_URL}/attendees/promote-user`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                event_id,
                user_id,
              }),
            });
        
            if (!response.ok) {
              throw new Error("Failed to promote user");
            }
        
            alert("User promoted to admin successfully!");
            // Refresh attendee data to reflect updated roles
            refetch();
          } catch (err) {
            alert("Error promoting user: " + err.message);
          }
        }
    };
      
    const demoteUser = async (user_id) => {
        try {
          const response = await fetch(`${API_BASE_URL}/attendees/demote-user`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              event_id,
              user_id,
            }),
          });
      
          if (!response.ok) {
            throw new Error("Failed to demote user");
          }
      
          alert("User demoted to attendee successfully!");
          // Refresh attendee data to reflect updated roles
          refetch();
        } catch (err) {
          alert("Error demoting user: " + err.message);
        }
    };
      
    const kickUser = async (user_id) => {
        if (window.confirm("Are you sure you want to kick this person?")) {
          try {
            const response = await fetch(`${API_BASE_URL}/attendees/kick-user`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                event_id,
                user_id,
              }),
            });
        
            if (!response.ok) {
              throw new Error("Failed to remove user");
            }
        
            alert("User removed successfully!");
            // Refresh attendee data to reflect the changes
            refetch();
          } catch (err) {
            alert("Error removing user: " + err.message);
          }
        }
    };  

    if (loading) return <p>Loading...</p>;
    if (error) return <p>{error}</p>;

    return (
      <div className="attendees">
        <div className="top-line">
          <button className="back-button" onClick={() => { goEventPage(); }}>
            <img src="/svgs/back-arrow.svg" alt="Back" />
          </button>
          <h2>Attendees</h2>
        </div>
    
        <div className="section">
          {attendeeData ? (
            <div>
              {/* Organiser Section */}
              <h3>Organiser</h3>
              <div className="profile-group">
                {attendeeData.organiser ? (
                  <div className="profile-container">
                    <Profile name={attendeeData.organiser.username} you={user_id === attendeeData.organiser.user_id} role={"organiser"} />
                    <div className="dropdown">
                      <button className="dropdown-button"><img src = "/svgs/3dots.svg" alt = "drop-down"></img></button>
                      <div className="dropdown-content">
                      <button onClick={() => seeAvailability(attendeeData.organiser.user_id)}>See Availability</button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p>No organiser found.</p>
                )}
              </div>
    
              {/* Admins Section */}
              <h3>Admins</h3>

              {attendeeData.attendees?.some(attendee => attendee.role === "admin") && (
                <div className="profile-group">
                  {attendeeData.attendees
                    .filter(attendee => attendee.role === "admin")
                    .map((attendee, index) => (
                      <div key={index} className="profile-container">
                        {user_id === attendee.user_id && <p>You</p>}
                        <Profile name={attendee.username} you={user_id === attendee.user_id} role={"admin"}/>
                          <div className="dropdown">
                            <button className="dropdown-button"><img src = "/svgs/3dots.svg" alt = "drop-down"></img></button>
                            <div className="dropdown-content">
                            <button onClick={() => seeAvailability(attendee.user_id)}>See Availability</button>
                            {role === "organiser" && (
                              <>
                                <button onClick={() => demoteUser(attendee.user_id)}>Demote</button>
                                <button onClick={() => kickUser(attendee.user_id)}>Kick</button>
                              </>
                              )}
                            </div>
                          </div>
                      </div>
                    ))}
                </div>
              )}
    
              {/* Attendees Section */}
              <h3>Attendees</h3>
              <div className="profile-group">
                {attendeeData.attendees?.some(attendee => attendee.role === "attendee") ? (
                  attendeeData.attendees
                    .filter(attendee => attendee.role === "attendee")
                    .map((attendee, index) => (
                      <div key={index} className="profile-container">
                        {user_id === attendee.user_id && <p>You</p>}
                        <Profile name={attendee.username} you={user_id === attendee.user_id} role={"attendee"}/>
                          <div className="dropdown">
                            <button className="dropdown-button"><img src = "/svgs/3dots.svg" alt = "drop-down"></img></button>
                            <div className="dropdown-content">
                              <button onClick={() => seeAvailability(attendee.user_id)}>See Availability</button>
                              {role === "organiser" && (
                              <>
                                <button onClick={() => promoteUser(attendee.user_id)}>Promote</button>
                                <button onClick={() => kickUser(attendee.user_id)}>Kick</button>
                              </>
                              )}
                            </div>
                          </div>
                      </div>
                    ))
                ) : (
                  <p>No attendees found.</p>
                )}
              </div>
            </div>
          ) : (
            <p>No attendee data available.</p>
          )}
        </div>
    
        {role !== "attendee" && (
          <div className="section">
            <h2>People Who Want to Join</h2>
            {attendeeData.requests?.length > 0 ? (
              <div className="profile-group">
                {attendeeData.requests.map((request, index) => (
                  request.status !== "rejected" && (
                    <div className = "profile-container request" key={index}>
                      <Profile name={request.username} role={"request"}/>
                      <button className = "request-button" onClick={() => RejectRequest(request)}><img src = "/svgs/cross.svg" alt = "reject"></img></button>
                      <button className = "request-button" onClick={() => AcceptRequest(request)}><img src = "/svgs/tick.svg" alt = "accept"></img></button>
                    </div>
                  )
                ))}
              </div>
            ) : (
              <p>No requests to join the event.</p>
            )}
          </div>
        )}
      </div>
    );
}    

export default Attendees;