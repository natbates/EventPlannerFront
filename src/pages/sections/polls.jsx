import useFetchEventData from "../../hooks/useFetchEventData";
import { useAuth } from "../../contexts/auth";
import { useState } from "react";
import { useEffect } from "react";
import { API_BASE_URL } from "../../components/App";
import { useHistory } from "../../contexts/history";
import "../../styles/polls.css";
import { useNotification } from "../../contexts/notification";
import { Profiles } from "../../components/ProfileSelector";
import PageError from "../../components/PageError";

const Polls = () =>
{
    const { data: pollsData, error, loading, event_id, refetch, goEventPage } = useFetchEventData("polls/fetch-polls");
    const { user_id, name, role } = useAuth();

    const [userDetailsMap, setUserDetailsMap] = useState({});
    const { notify, setNotifyLoad} = useNotification();
    const [secondaryloading, setSecondaryLoading] = useState(true);

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [priority, setPriority] = useState("level-1");
    const [options, setOptions] = useState(["", ""]);
    const [message, setMessage] = useState("");
    const [selectedOption, setSelectedOption] = useState(null);
    const [pendingVotes, setPendingVotes] = useState({});

    const {updateEventPage, updateLastOpened} = useHistory();
    const [showUnansweredPolls, setShowUnansweredPolls] = useState(false);

    const fetchUserDetails = async (userId) => {
      try {
        const res = await fetch(`${API_BASE_URL}/users/fetch-username?user_id=${user_id}`);
        if (!res.ok) throw new Error("Failed to fetch user");
        return await res.json(); // { name, profile_pic }
      } catch (error) {
        console.error("Error fetching user details:", error);
        return { name: "Unknown", profile_pic: "/default-profile.png" };
      }
    };

    const toggleUnansweredPolls = () => {
      setShowUnansweredPolls(prevState => !prevState); // Toggle the visibility of unanswered polls
    };

    useEffect(() => {
      const loadUserDetails = async () => {
        if (!pollsData?.polls) return;

        setSecondaryLoading(true); // Set loading state to true
    
        const uniqueUserIds = [
          ...new Set(Object.values(pollsData.polls).map((poll) => poll.created_by))
        ];
    
        const details = {};
    
        await Promise.all(
          uniqueUserIds.map(async (userId) => {
            if (!userDetailsMap[userId]) {
              const userDetails = await fetchUserDetails(userId);
              details[userId] = userDetails;
            }
          })
        );
    
        setUserDetailsMap((prev) => ({ ...prev, ...details }));
        setSecondaryLoading(false);
        setNotifyLoad(false);
      };
    
      loadUserDetails();
    }, [pollsData]);
    

    const addOption = (e) => {
      e.preventDefault();
        if (options.length < 5) {
          setOptions([...options, ""]);
        }
    };  
    
    const updateOption = (index, value) => {
        const newOptions = [...options];
        newOptions[index] = value;
        setOptions(newOptions);
    };
    
    const removeOption = (index) => {
        const newOptions = options.filter((_, i) => i !== index);
        setOptions(newOptions);
    };

    const submitPoll = async (e) => {
        e.preventDefault();
        // Ensure title, description, and at least 2 options are provided
        if (!title || !description || options.length < 2 || options.some(opt => opt.trim() === "")) {
          notify("Please fill all fields and provide at least 2 options.");
          return;
        }
            
        // Check for duplicate options (case insensitive check)
        const uniqueOptions = [...new Set(options.map(option => option.trim().toLowerCase()))];
      
        if (uniqueOptions.length !== options.length) {
          notify("Please make sure all options are unique.");
          return;
        }
      
        const pollId = `poll-${Date.now()}`; // Generate a unique poll ID

        setNotifyLoad(true);
      
        try {
          const response = await fetch(`${API_BASE_URL}/polls/create-poll`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              event_id: event_id,
              poll_id: pollId,
              user_id: user_id,
              title,
              description,
              options,
              priority
            }),
          });
      
          if (response.ok) {
            notify("Poll created successfully!");
            setTitle("");
            setDescription("");
            setOptions(["", ""]);
            refetch();
            updateEventPage(event_id, "polls")
            updateLastOpened("polls");
          } else {
            notify("Failed to create poll.");
          }
        } catch (error) {
          console.error("Error creating poll:", error);
          notify("An error occurred while creating the poll.");
        } 
    };

    const removeVote = async (pollId, selectedOption) => {

      console.log("Removing vote for pollId:", pollId, "and selectedOption:", selectedOption);
      setNotifyLoad(true);
      try {
        const response = await fetch(`${API_BASE_URL}/polls/remove-vote`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            event_id: event_id,
            poll_id: pollId,
            user_id: user_id,
            selected_option: selectedOption
          })
        });
    
        if (response.ok) {
          console.log("Vote removed successfully");
          refetch(); // Optionally refresh the poll data after the vote is removed
        } else {
          console.error("Failed to remove vote");
        }
      } catch (error) {
        console.error("Error removing vote:", error);
        notify(error.message || "An error occurred while removing the vote.");
      } 
    };
      
    const deletePoll = async (pollId) => {
        if (window.confirm("Are you sure you want to delete this poll?")) {
          setNotifyLoad(true);
          try {
            const response = await fetch(`${API_BASE_URL}/polls/delete-poll`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                event_id,
                poll_id: pollId,
                user_id,
              }),
            });
        
            if (!response.ok) {
              throw new Error("Failed to delete poll");
            }
        
            refetch();
            notify("Poll deleted successfully!");
            console.log("Poll deleted successfully");
          } catch (error) {
            console.error("Error deleting poll:", error);
            notify(error.message || "An error occurred while deleting the poll.");
          } 
        }
    };
    
    const castVote = async (poll_id, option) => {
      try{
        setNotifyLoad(true);
          const response = await fetch(`${API_BASE_URL}/polls/cast-vote`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ event_id: event_id, poll_id: poll_id, user_id: user_id, selected_option: option }),
          });
      
          if (response.ok) {
            setSelectedOption(prev => (prev === option ? "" : option)); // Toggle vote
            refetch();
          } else{
            throw new Error("Failed to cast vote");
          }
        } catch (error) {
          notify(error?.message || "An error occurred while casting the vote.");
          console.error("Error casting vote:", error);
      }
    };

    const getSelectedOption = (pollId, user_id) => {
      // Iterate over all the options in the poll
      const pollOptions = pollsData.polls[pollId]?.options;
      
      // Check if any option contains the user's vote
      for (const option in pollOptions) {
        if (pollOptions[option]?.includes(user_id)) {
          return option; // This is the selected option for the user
        }
      }
      return null; // Return null if no vote found
    };

    if (error) return <PageError error={error?.message ? error?.message : "Something Went Wrong"} page={"Polls"} />;

    if (loading || secondaryloading) return <div class="loader"><p>Fetching Polls</p></div>;

    return (
    <div className="polls">

        <div className="top-line-polls">
          <div className="top-line">
            <button className="back-button" onClick={() => { goEventPage(); }}>
              <img src="/svgs/back-arrow.svg" alt="Back" />
            </button>
            <h2>Polls</h2>
          </div>
          <span>
            <p>Show Only Unanswered Polls</p>
          <button 
          onClick={toggleUnansweredPolls}
          className={`small-button toggle-unanswered-polls ${showUnansweredPolls ? 'active' : ''}`}
        >
          {showUnansweredPolls ? '✓' : '✖'}
        </button>
        </span>
        </div>

        <div className="poll-container">
          {pollsData != null && pollsData.polls ? (
            // Sort polls by priority (level-3 > level-2 > level-1)
            Object.keys(pollsData.polls)
              .sort((a, b) => {
                const priorityOrder = {
                  "level-3": 1,
                  "level-2": 2,
                  "level-1": 3,
                };

                const priorityA = pollsData.polls[a].priority;
                const priorityB = pollsData.polls[b].priority;

                return priorityOrder[priorityA] - priorityOrder[priorityB];
              }).filter((pollId) => {
                // Check if showUnansweredPolls is true
                if (showUnansweredPolls) {
                  const poll = pollsData.polls[pollId];
                  // Check if any option in the poll has the user's ID, meaning the user has answered
                  const userHasVoted = Object.values(poll.options).some(optionVotes => optionVotes.includes(user_id));
                  
                  // Only include polls that have NOT been answered (if selected, filter out answered polls)
                  return !userHasVoted;
                }
                // If showUnansweredPolls is false, include all polls
                return true;
              })
              .map((pollId) => {
                // Define allOptions outside of the JSX
                const allOptions = Object.keys(pollsData.polls[pollId].options).map((option) => ({
                  option,
                  votedUserIds: pollsData.polls[pollId].options[option],
                }));

                const allVotedUserIds = Object.keys(pollsData.polls[pollId].options).flatMap(option => (
                  pollsData.polls[pollId].options[option]  // Flattening the list of user IDs
                ));

                const creatorId = pollsData.polls[pollId].created_by;
                const creatorDetails = userDetailsMap[creatorId] || {};
                const profile = Profiles.find(
                  (profile) => profile.id === Number(creatorDetails.profile_pic)
                );

                const hasVoted = allVotedUserIds?.includes(user_id);
                const selectedOption = getSelectedOption(pollId, user_id);

                return (
                  <div key={pollId} className="poll section">
                    <span className="creator-info">
                      <img
                        src={profile ? profile.path : ""}
                        alt="Creator"
                        className="profile-pic"
                      />
                      <p className={`${pollsData.polls[pollId].created_by === user_id ? "you underline" : ""}`}>
                          {userDetailsMap[pollsData.polls[pollId].created_by]?.name || "Unknown"}
                      </p>
                      <p>
                      {new Date(pollsData.polls[pollId].created_at).toDateString() === new Date().toDateString()
                      ? `at ${new Date(pollsData.polls[pollId].created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                      : `on ${new Date(pollsData.polls[pollId].created_at).toLocaleDateString()}`}
                      </p>
                    </span>

                    <h2>{pollsData.polls[pollId].title}</h2>
                    <h3>{pollsData.polls[pollId].description}</h3>
                    {pollsData.polls[pollId].priority != "level-1" && 
                    <div className="priority-level">
                    {pollsData.polls[pollId].priority === "level-2" ? (
                      <span className="level-1"><img src = "/svgs/priority.svg" /></span>    
                      ) : pollsData.polls[pollId].priority === "level-3" ? (  
                        <span className="level-2"><img src = "/svgs/priority.svg" /></span>    
                       ) : null}                     
                    </div>
                    }

                    <div className="poll-options">
                      {Object.keys(pollsData.polls[pollId].options).map((option) => {
                        // Find the option data in allOptions
                        const optionData = allOptions.find((o) => o.option === option);
                        const userVotedForOption = pollsData.polls[pollId].options[option]?.includes(user_id);

                        return (
                          <div className="poll-option" key={option} style={{ backgroundColor: pendingVotes[pollId] === option ? "rgb(100, 100, 100, 0.3)" : "transparent" }}>
                              <button
                                disabled={hasVoted && userVotedForOption} // Disable button if user has already voted and didn't vote for this option
                                onClick={() =>
                                  setPendingVotes((prev) => ({
                                    ...prev,
                                    [pollId]: prev[pollId] === option ? null : option, // If the same option is clicked, deselect it
                                  }))
                                  
                                }>   
                                {pendingVotes[pollId] != option && (
                                <div
                                className={`button-filler ${hasVoted ? "voted" : ""}`}  
                                style={{
                                  width: hasVoted ?`${(optionData.votedUserIds.length / allVotedUserIds.length) * 100}%` : "0%",
                                  opacity: pollsData.polls[pollId].options[option].includes(user_id) ? 0.8 : 0.3,
                                }}
                                ></div>)}
                              <p>{option}</p>
                            </button>
                            {pendingVotes[pollId] === option && <img className = "pending-poll-chosen" src = "/svgs/tick.svg"></img>}
                            {hasVoted && pendingVotes[pollId] != option && (
                              <span
                                className={`vote-count`}
                              >
                                {optionData.votedUserIds.length} votes
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    <div className="button-container">
                      {(pollsData.polls[pollId].created_by === user_id || role === "organiser") && (
                        <button className="small-button" onClick={() => deletePoll(pollId)}>🗑</button>
                      )}
                      <button 
                        disabled={pendingVotes[pollId] != null || !hasVoted}  // Disable if no option is selected
                        className="small-button"
                        onClick={async () => {
                          // If a vote was cast, call the removeVote function
                          if (hasVoted) {
                            await removeVote(pollId, selectedOption); // Remove vote if any vote has been cast
                            setPendingVotes((prev) => {
                              const updated = { ...prev };
                              delete updated[pollId]; // Remove pending vote
                              return updated;
                            });
                          }
                        }}
                      >↩</button>
                      <button
                        disabled={pendingVotes[pollId] == null } // Disable if no option is selected
                        className="small-button"
                        onClick={async () => {
                          if (pendingVotes[pollId]) {
                            await castVote(pollId, pendingVotes[pollId]);
                            setPendingVotes((prev) => {
                              const updated = { ...prev };
                              delete updated[pollId];
                              return updated;
                            });
                          }
                        }}
                      >
                        Submit
                      </button>

                    </div>
                  </div>
                );
              })
          ) : (
            <p>No Polls</p>
          )}
        </div>


        <div className="poll-form section">
          <h2>Create a Poll</h2>
          
          <form className="create-poll">
            <div>
              <label>Poll Title:</label>
              <input 
                type="text" 
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
                placeholder="Enter poll title" 
              />
            </div>

            <div>
              <label>Poll Description:</label>
              <textarea 
                value={description} 
                onChange={(e) => setDescription(e.target.value)} 
                placeholder="Describe the poll"
              />
            </div>

            <label>Options:</label>
            {options.map((option, index) => (
              <div key={index} className="option-field">
                <input 
                  type="text" 
                  value={option} 
                  onChange={(e) => updateOption(index, e.target.value)} 
                  placeholder={`Option ${index + 1}`}
                />
                {options.length > 2 && (
                  <button className = "small-button" onClick={() => removeOption(index)}>🗑</button>
                )}
              </div>
            ))}

            <div className="priority-and-buttons">
              <div>
                <label>Priority Level:</label>
                <select 
                  value={priority} 
                  onChange={(e) => setPriority(e.target.value)}
                >
                  <option value="level-1">Level 1</option>
                  <option value="level-2">Level 2</option>
                  <option value="level-3">Level 3</option>
                </select>
              </div>

              <button onClick={addOption}>Add Option</button>
              <button onClick={submitPoll}>Create Poll</button>
            </div>
          </form>
        </div>
    </div>
    )
}

export default Polls;