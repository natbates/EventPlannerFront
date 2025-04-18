import { useState, useEffect } from "react";
import { API_BASE_URL } from "../../components/App";
import useFetchEventData from "../../hooks/useFetchEventData";
import { useAuth } from "../../contexts/auth";
import { useHistory } from "../../contexts/history";
import "../../styles/todo.css";
import { useNotification } from "../../contexts/notification";
import { Profiles } from "../../components/ProfileSelector";
import PageError from "../../components/PageError";
import { useTheme } from "../../contexts/theme";
import { useNavigate } from "react-router-dom";

const ToDo = () => {
    const { data: toDoData, error, loading, event_id, refetch, goEventPage } = useFetchEventData("to-do/fetch-to-do");
    const [newTask, setNewTask] = useState("");
    const { user_id, name, role, profile_pic } = useAuth();
    const { updateEventPage, updateLastOpened } = useHistory();
    const { notify, setNotifyLoad} = useNotification();
    const {theme} = useTheme();
    const navigate = useNavigate();
    const [updatedToDoData, setUpdatedToDoData] = useState({ to_do: [], done: [] });
    const [secondaryloading, setSecondaryLoading] = useState(true);
    // Fetch user profiles and update tasks with username and profile_pic
    const maxTodoLength = 40;
    
    useEffect(() => {
        const fetchProfile = async (userId) => {
            try {
                const response = await fetch(`${API_BASE_URL}/users/fetch-username?user_id=${userId}`, {
                    headers: {
                      "Authorization": `Bearer ${sessionStorage.getItem("token")}`
                    }
                  });                
                  if (response.ok) {
                    const { name, profile_pic } = await response.json();
                    return { username: name, profile_pic };
                } else {
                    notify("Failed to fetch profile data");
                    return { username: "Unknown", profile_pic: "/path/to/default/profile-pic.png" };
                }
            } catch (error) {
                console.error("Error fetching profile:", error);
                notify("Error fetching profile data");
                return { username: "Unknown", profile_pic: "/path/to/default/profile-pic.png" };
            }
        };

        const fetchProfiles = async () => {
            setSecondaryLoading(true);
            if (toDoData) {
                const updatedTasks = { to_do: [], done: [] };

                // Combine tasks from both to_do and done sections
                const allTasks = [...toDoData.to_do, ...toDoData.done];

                for (const task of allTasks) {
                    const profileData = await fetchProfile(task.creator_id);
                    
                    const updatedTask = {
                        ...task,
                        username: profileData.username,
                        profile_pic: profileData.profile_pic,
                    };

                    // Add section (either 'to_do' or 'done') to the task
                    if (toDoData.to_do.includes(task)) {
                        updatedTasks.to_do.push(updatedTask);
                    } else {
                        updatedTasks.done.push(updatedTask);
                    }
                }

                // Set the updated task data
                setUpdatedToDoData(updatedTasks)
                setSecondaryLoading(false);
            }
        };

        fetchProfiles();
    }, [toDoData]); // Run whenever toDoData changes

    useEffect(() => {
        refetch();  // Fetch updated tasks whenever the component loads
    }, []); // Refetch tasks only once on mount

    const handleAddTask = async () => {
        if (!newTask.trim()) return alert("Task cannot be empty!");
    
        // Check if the task already exists (case-insensitive)
        const existingTasks = [...(toDoData?.to_do || []), ...(toDoData?.done || [])];
        const taskExists = existingTasks.some(task => task.task.toLowerCase() === newTask.toLowerCase());
    
        if (taskExists) {
            notify("This task already exists!");
            return;
        }
        try {
            setNotifyLoad(true);
            const response = await fetch(`${API_BASE_URL}/to-do/add-to-do`, {
                method: "POST",
                headers: { "Content-Type": "application/json", 'Authorization': `Bearer ${sessionStorage.getItem("token")}`},
                body: JSON.stringify({ event_id, creator_id: user_id, task: newTask}),
            });
        
            if (response.ok) {
                setNewTask("");
                updateEventPage(event_id, "to-do");
                updateLastOpened("to-do");
                await refetch();
                notify("New Task Added!");
            } else {
                throw new Error("Failed to add task!");
            }
        }catch (error) {
            console.error("Error adding task:", error);
            notify("Failed to add task!");
        } finally {
            setNotifyLoad(false);
        }
    };

    const handleMoveToDone = async (task_id) => {
        try{
            setNotifyLoad(true);
            const response = await fetch(`${API_BASE_URL}/to-do/move-to-done`, {
                method: "POST",
                headers: { "Content-Type": "application/json", 'Authorization': `Bearer ${sessionStorage.getItem("token")}`,},
                body: JSON.stringify({ event_id, task_id }),
            });

            if (response.ok)            {
                await refetch();
                notify("Task Moved to Done!");
            }
            else{
                throw new Error("Failed to move task!");
            }
        }catch (error) {
            console.error("Error moving task:", error);
            notify("Failed to move task!");
        } finally{

            setNotifyLoad(false);
        }
    };

    const handleMoveToDo = async (task_id) => {
        try{
            setNotifyLoad(true);
            const response = await fetch(`${API_BASE_URL}/to-do/move-to-do`, {
                method: "POST",
                headers: { "Content-Type": "application/json", 'Authorization': `Bearer ${sessionStorage.getItem("token")}`, },
                body: JSON.stringify({ event_id, task_id }),
            });

            if (response.ok) 
            {
                await refetch();
                notify("Task Moved Back to To Do!");
            }
            else throw new Error("Failed to move task!");
        } catch (error) {
            console.error("Error moving task:", error);
            notify("Failed to move task!");         
        } finally {
            setNotifyLoad(false);
        }
    }

    const handleDeleteTask = async (task_id) => {
        try{
            setNotifyLoad(true);
            const response = await fetch(`${API_BASE_URL}/to-do/delete-to-do`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json", 'Authorization': `Bearer ${sessionStorage.getItem("token")}`,},
                body: JSON.stringify({ event_id, task_id }),
            });

            if (response.ok){
                await refetch();
                notify("Task Deleted!");
            }
            else throw new Error("Failed to delete task!");
        } catch (error) {
            console.error("Error deleting task:", error);
            notify("Failed to delete task!");
        } finally {
            setNotifyLoad(false);
        }
    };

    const handleTaskChange = (e) => {
        if (e.target.value.length <= maxTodoLength) {
            setNewTask(e.target.value);
        }
    };

    if (error) return <PageError error={error?.message ? error?.message : "Something Went Wrong"} page={"To Do"} />;

    if (loading || secondaryloading) return <div className="loader"><p>Fetching To Dos</p><button onClick = {() => {navigate(`/event/${event_id}`)}} className="small-button">Cancel</button></div>;

    return (
        <div className="to-do">
            <div className="top-line">
                <button className="back-button" onClick={() => { goEventPage(); }}>
                    {theme === "dark" ? 
                        <img src="/svgs/back-arrow-white.svg" alt="Back" /> :
                    <img src="/svgs/back-arrow.svg" alt="Back" />}
                </button>
                <h2>To Do</h2>
            </div>

            {/* New Task Input */}
            <div className="add-task">
                <div className="to-do-input-container">
                    <input
                        type="text"
                        placeholder="Enter a new task..."
                        value={newTask}
                        onChange={handleTaskChange}
                    />
                    <p className="task-length">{newTask.length} / {maxTodoLength}</p>
                </div>
                <button className="small-button" onClick={handleAddTask}>Add Task</button>
            </div>

            {loading ? (
                <p>Loading tasks...</p>
            ) : error ? (
                <p>Error loading tasks!</p>
            ) : (
                <>
                    {updatedToDoData?.to_do?.length > 0 && (
                    <div className="task-section section">
                        <h2>To-Do</h2>
                        <ul>
                            {updatedToDoData?.to_do?.map((task) => {
                                const profile = Profiles.find((profile) => profile.id === Number(task.profile_pic));

                                return (
                                    <li key={task.task_id}>
                                        <span className="profile">
                                            <img className="profile-pic" src={profile.path} alt={task.username} />
                                            <p className={`${task.creator_id === user_id ? "you underline" : ""} to-do-creator`}>{task.username}</p>
                                        </span>
                                        <p className="task">{task.task}</p>
                                        <div className="button-container">
                                            {(role !== "attendee" || task.creator_id === user_id) && 
                                                <button className="small-button" onClick={() => handleDeleteTask(task.task_id)}>🗑</button>}
                                            <button className="small-button" onClick={() => handleMoveToDone(task.task_id)}>✔</button>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>)}

                    {updatedToDoData?.done?.length > 0 && (
                    <div className="task-section section done">
                        <h2>Done</h2>
                        <ul>
                            {updatedToDoData?.done?.map((task) => {
                                const profile = Profiles.find((profile) => profile.id === Number(task.profile_pic));
                                return (
                                    <li key={task.task_id}>
                                        <span className="profile">
                                            <img className="profile-pic" src={profile.path} alt={task.username} />
                                            <p className={`${task.creator_id === user_id ? "you underline" : ""} to-do-creator`}>{task.username}</p>
                                        </span>
                                        <p className="task">{task.task}</p>
                                        <div className="button-container">
                                            {(role !== "attendee" || task.creator_id === user_id) && 
                                                <button className="small-button" onClick={() => handleDeleteTask(task.task_id)}>🗑</button>}
                                            <button className="small-button" onClick={() => handleMoveToDo(task.task_id)}>
                                            {theme === "light" ? 
                                                <img className="undo" src="/svgs/undo-white.svg" alt="Undo" /> :
                                                <img className = "undo" src="/svgs/undo.svg" alt="Undo" />}
                                            </button>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>)}
                </>
            )}
        </div>
    );
};

export default ToDo;
