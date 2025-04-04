import { useState, useEffect } from "react";
import { API_BASE_URL } from "../../components/App";
import useFetchEventData from "../../hooks/useFetchEventData";
import { useAuth } from "../../contexts/auth";
import { useHistory } from "../../contexts/history";

const ToDo = () => {
    const { data: toDoData, error, loading, event_id, refetch, goEventPage } = useFetchEventData("to-do/fetch-to-do");
    const [newTask, setNewTask] = useState("");
    const { user_id, name, role } = useAuth();
    const {updateEventPage, updateLastOpened} = useHistory();

    useEffect(() => {
        refetch();  // Fetch updated tasks whenever the component loads
    }, []);

    const handleAddTask = async () => {
        if (!newTask.trim()) return alert("Task cannot be empty!");
    
        // Check if the task already exists (case-insensitive)
        const existingTasks = [...(toDoData?.to_do || []), ...(toDoData?.done || [])];
        const taskExists = existingTasks.some(task => task.task.toLowerCase() === newTask.toLowerCase());
    
        if (taskExists) {
            alert("This task already exists!");
            return;
        }
    
        // Send request to add the task
        const response = await fetch(`${API_BASE_URL}/to-do/add-to-do`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ event_id, creator_id: "USER_UUID", task: newTask }),
        });
    
        if (response.ok) {
            setNewTask("");
            updateEventPage(event_id, "to-do")
            updateLastOpened("to-do");
            refetch();
        } else {
            alert("Failed to add task!");
        }
    };    

    const handleMoveToDone = async (task_id) => {
        const response = await fetch(`${API_BASE_URL}/to-do/move-to-done`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ event_id, task_id }),
        });

        if (response.ok) refetch();
        else alert("Failed to move task!");
    };

    const handleMoveToDo = async (task_id) => {
        const response = await fetch(`${API_BASE_URL}/to-do/move-to-do`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ event_id, task_id }),
        });

        if (response.ok) refetch();
        else alert("Failed to move task!");
    };

    const handleDeleteTask = async (task_id) => {
        const response = await fetch(`${API_BASE_URL}/to-do/delete-to-do`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ event_id, task_id }),
        });

        if (response.ok) refetch();
        else alert("Failed to delete task!");
    };

    return (
        <div className="to-do">
            <div className="top-line">
                <button className="back-button" onClick={() => { goEventPage(); }}>
                    <img src="/svgs/back-arrow.svg" alt="Back" />
                </button>
                <h2>To Do</h2>
            </div>

            {/* New Task Input */}
            <div className="add-task">
                <input
                    type="text"
                    placeholder="Enter a new task..."
                    value={newTask}
                    onChange={(e) => setNewTask(e.target.value)}
                />
                <button onClick={handleAddTask}>Add Task</button>
            </div>

            {loading ? (
                <p>Loading tasks...</p>
            ) : error ? (
                <p>Error loading tasks!</p>
            ) : (
                <>
                    {/* To-Do List */}
                    <div className="task-section">
                        <h3>To-Do</h3>
                        <ul>
                            {toDoData?.to_do?.map((task) => (
                                <li key={task.task_id}>
                                    {task.task} 
                                    <button onClick={() => handleMoveToDone(task.task_id)}>✔ Done</button>
                                    {(role != "attendee" || task.creator_id === user_id) && <button onClick={() => handleDeleteTask(task.task_id)}>🗑 Delete</button>}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Done List */}
                    <div className="task-section">
                        <h3>Done</h3>
                        <ul>
                            {toDoData?.done?.map((task) => (
                                <li key={task.task_id}>
                                    {task.task}
                                    <button onClick={() => handleMoveToDo(task.task_id)}>↩ Undo</button>
                                    {(role != "attendee" || task.creator_id === user_id) && <button onClick={() => handleDeleteTask(task.task_id)}>🗑 Delete</button>}
                                </li>
                            ))}
                        </ul>
                    </div>
                </>
            )}
        </div>
    );
};

export default ToDo;
