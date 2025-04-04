import useFetchEventData from "../../hooks/useFetchEventData";
import { useAuth } from "../../contexts/auth";
import { useState } from "react";
import { API_BASE_URL } from "../../components/App";
import { useHistory } from "../../contexts/history";
import "../../styles/polls.css";

const Polls = () =>
{
    const { data: pollsData, error, loading, event_id, refetch, goEventPage } = useFetchEventData("polls/fetch-polls");
    const { user_id, name, role } = useAuth();

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [priority, setPriority] = useState("level-1");
    const [options, setOptions] = useState([""]);
    const [message, setMessage] = useState("");
    const [selectedOption, setSelectedOption] = useState(null);

    const {updateEventPage, updateLastOpened} = useHistory();

    const addOption = () => {
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

    const submitPoll = async () => {
        // Ensure title, description, and at least 2 options are provided
        if (!title || !description || options.length < 2 || options.some(opt => opt.trim() === "")) {
          setMessage("Please fill all fields and provide at least 2 options.");
          return;
        }
      
        // Check for duplicate options (case insensitive check)
        const uniqueOptions = [...new Set(options.map(option => option.trim().toLowerCase()))];
      
        if (uniqueOptions.length !== options.length) {
          alert("Please make sure all options are unique.");
          return;
        }
      
        const pollId = `poll-${Date.now()}`; // Generate a unique poll ID
      
        try {
          const response = await fetch(`${API_BASE_URL}/polls/create-poll`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              event_id: event_id,
              poll_id: pollId,
              user_id: user_id,
              name: name,
              title,
              description,
              options,
              priority
            }),
          });
      
          if (response.ok) {
            setMessage("Poll created successfully!");
            setTitle("");
            setDescription("");
            setOptions([""]);
            refetch();
            updateEventPage(event_id, "polls")
            updateLastOpened("polls");
          } else {
            setMessage("Failed to create poll.");
          }
        } catch (error) {
          console.error("Error creating poll:", error);
          setMessage("An error occurred while creating the poll.");
        }
    };
      
    const deletePoll = async (pollId) => {
        if (window.confirm("Are you sure you want to delete this poll?")) {
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
            setMessage("Poll deleted successfully!");
            console.log("Poll deleted successfully");
          } catch (error) {
            console.error("Error deleting poll:", error);
          }
        }
    };
    
    const castVote = async (poll_id, option) => {
        const response = await fetch(`${API_BASE_URL}/polls/cast-vote`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ event_id: event_id, poll_id: poll_id, user_id: user_id, selected_option: option }),
        });
    
        if (response.ok) {
          setSelectedOption(prev => (prev === option ? "" : option)); // Toggle vote
          const data = await response.json();
          refetch();
        }
    };


    return (
    <div className="polls">
        <div className="top-line">
          <button className="back-button" onClick={() => { goEventPage(); }}>
            <img src="/svgs/back-arrow.svg" alt="Back" />
          </button>
          <h2>Polls</h2>
        </div>
        <div className="section">
          {pollsData != null && pollsData.polls && pollsData.polls.length > 0 ? 
          // Sort polls by priority (level-3 > level-2 > level-1)
          Object.keys(pollsData.polls)
            .sort((a, b) => {
              const priorityOrder = {
                "level-3": 1,
                "level-2": 2,
                "level-1": 3
              };

              const priorityA = pollsData.polls[a].priority;
              const priorityB = pollsData.polls[b].priority;

              return priorityOrder[priorityA] - priorityOrder[priorityB];
            })
            .map((pollId) => (
              <div key={pollId}>
              <h3>{pollsData.polls[pollId].title}</h3>
              {Object.keys(pollsData.polls[pollId].options).map((option) => (
                <button key={option} onClick={() => castVote(pollId, option)}>
                  {option} ({pollsData.polls[pollId].options[option].length} votes)
                </button>
              ))}
              <p>Priority: {pollsData.polls[pollId].priority}</p>
              <p>Made by {pollsData.polls[pollId].creator_name}</p>
              {(pollsData.polls[pollId].created_by === user_id || role === "organiser")&& <button onClick={() => deletePoll(pollId)}>Delete Poll</button>}
          </div>
          )) : <p>No Polls</p>}
        </div>

        <div className="poll-form section">
          <h2>Create a Poll</h2>
          {message && <p>{message}</p>}
          
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
                  <button onClick={() => removeOption(index)}>❌</button>
                )}
              </div>
            ))}

            <button onClick={addOption}>➕ Add Option</button>
            <button onClick={submitPoll}>✅ Create Poll</button>
          </form>
        </div>
    </div>
    )
}

export default Polls;