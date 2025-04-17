import useFetchEventData from "../../hooks/useFetchEventData";
import { useAuth } from "../../contexts/auth";
import { API_BASE_URL } from "../../components/App";
import "../../styles/attendees.css";
import { useNavigate } from "react-router-dom";
import { Profiles } from "../../components/ProfileSelector";
import { useNotification } from "../../contexts/notification";
import PageError from "../../components/PageError";
import { useTheme } from "../../contexts/theme";

export const Profile = ({ name, you, role, profileNum }) => {
  
  const profile = Profiles.find((profile) => profile.id === Number(profileNum));

  return (
    <div className="profile">
      {/* Check if profile is found and display its image */}
      {role != "request" && <img
        src={profile ? profile.path : ""}
        className="profile-image"
        alt={profile ? profile.name : "Default profile"}
      />}
      <p className={you ? "you underline" : ""}>{name}</p>
    </div>
  );
};

const generateFakeAttendees = (numAdmins = 5, numAttendees = 20, numRequests = 5) => {
  const totalProfiles = Profiles.length; // Get the total number of profiles available

  // Function to get profile number, cycling through available profiles
  const getProfileNum = (index) => index % totalProfiles;

  // Generate fake admins
  const fakeAdmins = Array.from({ length: numAdmins }, (_, i) => ({
    user_id: `admin_${i + 1}`,
    username: `Admin ${i + 1}`,
    role: "admin",
    profile_pic: getProfileNum(i) // Assign profile number based on index
  }));

  // Generate fake attendees
  const fakeAttendees = Array.from({ length: numAttendees }, (_, i) => ({
    user_id: `attendee_${i + 1}`,
    username: `Attendee ${i + 1}`,
    role: "attendee",
    profile_pic: getProfileNum(i + numAdmins) // Offset the index by the number of admins
  }));

  const generateRandomTime = () => {
    const now = new Date();
    const pastTime = now.getTime() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000); // up to 7 days ago
    return new Date(pastTime).toISOString();
  };

  // Generate fake requests (requests don't need a profileNum, but you can add one if needed)
  const fakeRequests = Array.from({ length: numRequests }, (_, i) => ({
    username: `Requesting User ${i + 1}`,
    time_requested: generateRandomTime(),
  }));

  return {
    organiser: { user_id: "organiser_1", username: "Main Organiser", role: "organiser", profile_pic: 0 }, // Default to profile 0
    attendees: [...fakeAdmins, ...fakeAttendees],
    requests: fakeRequests,
  };
};

const Attendees = () => {

    const { data: attendeeData, error, loading, event_id, refetch, goEventPage} = useFetchEventData("attendees/fetch-attendees");
    const { user_id, name, role, createUser, authed, email: userEmail, fingerprint: userFingerprint, LogIn, LogOut} = useAuth();
    const navigate = useNavigate();
    const {theme} = useTheme();
    const {notify, setNotifyLoad} = useNotification();

    const AcceptRequest = async (request) => {
        setNotifyLoad(true);
        // Ensure the request is valid before proceeding
        if (request === undefined || request.email === undefined || request.username === undefined) {
            console.error("Invalid request object:", request);
            notify("Invalid request. Please try again.");
            return;
        }
    
        try {
            console.log("Processing request for:", request.username);
    
            // Call createUser to add the user to the event (attendee role)
            const { email, username, profile_pic} = request;
            console.log("Creating user for:", email, username);

            let profileNum = profile_pic;

            console.log("LOOK HERE PLEASE ", profileNum);
    
            const userResponse = await createUser(  email, 
              username, 
              false, 
              event_id, 
              profile_pic,  
              false           
            );
            if (!userResponse) {
                throw new Error("Failed to create user.");
            }
    
            // Update the list of requests by removing the accepted request
            const updatedRequests = attendeeData.requests.filter((req) => req.email !== request.email);
            console.log("Updated requests list:", updatedRequests);
    
            // Now, update the requests in the event
            const response = await fetch(`${API_BASE_URL}/attendees/update-requests`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    "Authorization": `Bearer ${sessionStorage.getItem("token")}`
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
            await refetch();
            notify("Request accepted and user added to the event.");
    
        } catch (error) {
            // Provide more meaningful error handling for various failures
            console.error("Error during request acceptance:", error.message || error);
            notify(`There was an error accepting the request: ${error.message || "Unknown error"}`);
        } finally
        {
            setNotifyLoad(false); // Reset loading state
        }
    };
    
    const RejectRequest = async (request) => {
        if (window.confirm("Are you sure you want to reject this user?")) {
          try {
            setNotifyLoad(true);
            // Send request to backend API to reject the request
            const response = await fetch(`${API_BASE_URL}/attendees/reject-request`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                "Authorization": `Bearer ${sessionStorage.getItem("token")}`
              },
              body: JSON.stringify({
                event_id: event_id, // assuming event_id is available in the scope
                email: request.email, 
              }),
            });
        
            const data = await response.json();
        
            if (response.ok) {
              await refetch();
              notify("Request rejected successfully!");
    
            } else {
              notify(`Failed to reject request: ${data.message}`);
            }
          } catch (err) {
            console.error("Error rejecting request:", err);
            notify("An error occurred while rejecting the request.");
          } finally {
            setNotifyLoad(false); // Reset loading state
          }
        }
    };

    const seeAvailability = (user_id) => {
      navigate(`/event/${event_id}/attendee-calender/${user_id}`);
    }

    const promoteUser = async (user_id) => {
        if (window.confirm("Are you sure you want to promote this user?")) {
          try {
            setNotifyLoad(true);
            const response = await fetch(`${API_BASE_URL}/attendees/promote-user`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${sessionStorage.getItem("token")}`
              },
              body: JSON.stringify({
                event_id,
                user_id,
              }),
            });
        
            if (!response.ok) {
              throw new Error("Failed to promote user");
            }
        
            // Refresh attendee data to reflect updated roles
            await refetch();
            notify("User promoted to admin successfully!");
          } catch (err) {
            notify("Error promoting user: " + err.message);
          } finally {
            setNotifyLoad(false); // Reset loading state
          }
        }
    };
      
    const demoteUser = async (user_id) => {
      setNotifyLoad(true);
        try {

          const response = await fetch(`${API_BASE_URL}/attendees/demote-user`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${sessionStorage.getItem("token")}`
            },
            body: JSON.stringify({
              event_id,
              user_id,
            }),
          });
      
          if (!response.ok) {
            throw new Error("Failed to demote user");
          }
      
          await refetch();
          notify("User demoted to attendee successfully!");
        } catch (err) {
          notify("Error demoting user: " + err.message);
        } finally {
          setNotifyLoad(false); // Reset loading state
        }
    };
      
    const kickUser = async (user_id) => {
        if (window.confirm("Are you sure you want to kick this person?")) {
          try {
            setNotifyLoad(true);
            const response = await fetch(`${API_BASE_URL}/attendees/kick-user`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${sessionStorage.getItem("token")}`
              },
              body: JSON.stringify({
                event_id,
                user_id,
              }),
            });
        
            if (!response.ok) {
              throw new Error("Failed to remove user");
            }
        
            await refetch();
            notify("User removed successfully!");
          } catch (err) {
            notify("Error removing user: " + err.message);
          } finally {
            setNotifyLoad(false); // Reset loading state
          }
        }
    }; 
    

    if (error) return <PageError error={error?.message ? error?.message : "Something Went Wrong"} page={"Attendees"} />;

    if (loading) return <div className="loader"><p>Fetching Attendees</p><button onClick = {() => {navigate(`/event/${event_id}`)}} className="small-button">Cancel</button></div>;

    return (
      <div className="attendees">
          <div className="top-line">
              <button className="back-button" onClick={() => { goEventPage(); }}>
                  {theme === "dark" ? 
                    <img src="/svgs/back-arrow-white.svg" alt="Back" /> :
                  <img src="/svgs/back-arrow.svg" alt="Back" />}
              </button>
              <h2>Attendees ({attendeeData?.attendees?.length + 1})</h2>
          </div>
  
          <div className="attendees-and-requests">
              <div className="section flexible attendees-section">
                  {attendeeData ? (
                      <div>
                          {/* Organiser Section */}
                          <h2>Organiser</h2>
                          <div className="profile-group organiser-group">
                              {attendeeData.organiser ? (
                                  <div className="profile-dropdown-container">
                                      <Profile
                                          name={attendeeData.organiser.username}
                                          you={user_id === attendeeData.organiser.user_id}
                                          role={"organiser"}
                                          profileNum={attendeeData.organiser.profile_pic}
                                      />
                                      <div className="dropdown">
                                          <div className="dropdown-content">
                                              <strong>{attendeeData.organiser.username}</strong>
                                              <button onClick={() => seeAvailability(attendeeData.organiser.user_id)}>
                                                  See Availability
                                              </button>
                                          </div>
                                      </div>
                                  </div>
                              ) : (
                                  <p>No organiser found.</p>
                              )}
                          </div>
  
                          {/* Admins Section */}
                          {attendeeData.attendees?.some(attendee => attendee.role === "admin") && (
                              <>
                                  <h3>Admins</h3>
                                  <div className="profile-group">
                                      {attendeeData.attendees
                                          .filter(attendee => attendee.role === "admin")
                                          .map((attendee, index) => (
                                              <div key={index} className="profile-dropdown-container">
                                                  <Profile
                                                      name={attendee.username}
                                                      you={user_id === attendee.user_id}
                                                      role={"admin"}
                                                      profileNum={attendee.profile_pic}
                                                  />
                                                  <div className="dropdown">
                                                      <div className="dropdown-content">
                                                          <strong>{attendee.username}</strong>
                                                          <button onClick={() => seeAvailability(attendee.user_id)}>
                                                              See Availability
                                                          </button>
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
                              </>
                          )}
  
                          {/* Attendees Section */}
                          {attendeeData.attendees?.some(attendee => attendee.role === "attendee") && (
                              <>
                                  <h3>Attendees</h3>
                                  <div className="profile-group">
                                      {attendeeData.attendees
                                          .filter(attendee => attendee.role === "attendee")
                                          .map((attendee, index) => (
                                              <div key={index} className="profile-dropdown-container">
                                                  <Profile
                                                      name={attendee.username}
                                                      you={user_id === attendee.user_id}
                                                      role={"attendee"}
                                                      profileNum={attendee.profile_pic}
                                                  />
                                                  <div className="dropdown">
                                                      <div className="dropdown-content">
                                                          <button onClick={() => seeAvailability(attendee.user_id)}>
                                                              See Availability
                                                          </button>
                                                          {role === "organiser" && (
                                                              <>
                                                                  <button onClick={() => promoteUser(attendee.user_id)}>Promote</button>
                                                                  <button onClick={() => kickUser(attendee.user_id)}>Kick</button>
                                                              </>
                                                          )}
                                                      </div>
                                                  </div>
                                              </div>
                                          ))}
                                  </div>
                              </>
                          )}
                      </div>
                  ) : (
                      <p>Loading attendees...</p>
                  )}
              </div>
  
              {/* Requests Section */}
              {role !== "attendee" && attendeeData?.requests?.length > 0 && (
                <div className="section requests-section">
                  <h2>Requests</h2>
                  <div className="profile-group">
                    {attendeeData.requests
                      .filter(request => request.status !== "rejected")
                      .map((request, index) => (
                        <div className="profile-container request" key={index}>
                          <Profile name={`${request.username}`}  profileNum={request.profile_pic}/>
                          <div className="button-container">
                            <button className="request-button" onClick={() => RejectRequest(request)}>✖</button>
                            <button className="request-button" onClick={() => AcceptRequest(request)}>✔</button>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
          </div>
      </div>
  );
}
export default Attendees;