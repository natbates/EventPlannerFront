import { useAuth } from "../../contexts/auth";
import useFetchEventData from "../../hooks/useFetchEventData";
import { useState, useEffect} from "react";
import { API_BASE_URL } from "../../components/App";
import { useHistory } from "../../contexts/history";
import "../../styles/comments.css";
import { Profiles } from "../../components/ProfileSelector";
import { useNotification } from "../../contexts/notification";
import PageError from "../../components/PageError";
import { useTheme } from "../../contexts/theme";

const Comments = () =>
{
    const { data: commentData, error, event_id, loading, refetch, goEventPage } = useFetchEventData("comments/fetch-comments");
    const { user_id, name, role, profile_pic} = useAuth();
    const [commentsWithUserDetails, setCommentsWithUserDetails] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [replyTo, setReplyTo] = useState(null);
    const [replyText, setReplyText] = useState("");
    const [replyVisibility, setReplyVisibility] = useState({});
    const {updateEventPage, updateLastOpened} = useHistory();
    const [secondaryloading, setLoading] = useState(true);
    const {notify, setNotifyLoad, notifyLoad} = useNotification();
    const {theme} = useTheme();
    const [visibleTopLevelCount, setVisibleTopLevelCount] = useState(6);

    const handleDeleteComment = async (comment_id) => {
        setNotifyLoad(true);

        const getAllReplies = (id) => {
        let replies = commentData.comments.filter((c) => c.reply_to === id);
        replies.forEach((reply) => {
            replies = [...replies, ...getAllReplies(reply.uuid)];
        });
        return replies;
        };
    
        const commentsToDelete = getAllReplies(comment_id).map((c) => c.uuid);
        commentsToDelete.push(comment_id);
        if (window.confirm("Are you sure you want to delete this comment?")) {
        try {
            const response = await fetch(`${API_BASE_URL}/comments/delete-comment`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ event_id: event_id, commentIds: commentsToDelete }),
            });
        
            if (!response.ok) throw new Error("Failed to delete comments");
        
            await refetch();
        } catch (error) {
            setNotifyLoad(false);
            console.error("Error deleting comment:", error);
        }
        }
    };

    const timeout = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    const handlePostComment = async (e) => {

      e.preventDefault();

      setReplyText("");
      setReplyTo(null);

      console.log("POSTING COMMENT ", newComment, replyText, replyTo);

      handleAddComment(e, true);

    }
  
    const handleAddComment = async (e, posting = false) => {
      
        e.preventDefault();

        setNotifyLoad(true);

        // Validate if the comment is not empty
        if (replyTo === null )  {
          if (newComment.trim() === '') {
              alert('Comment cannot be empty');
              return;
          }
          } else {
          if (!posting && replyText.trim() === '') {
              alert('Reply cannot be empty');
              return;
          }
        }
    
        // Prepare the comment object to send
        const commentData = {
          event_id: event_id,
          user_id: user_id,
          message: replyTo !== null && !posting ? replyText : newComment,
          reply_to: !posting ? (replyTo?.uuid || null) : null, // Null if no reply
        };
    
        try {
        const response = await fetch(`${API_BASE_URL}/comments/add-comment`, {
            method: 'POST',
            headers: {
            'Content-Type': 'application/json',
            },
            body: JSON.stringify(commentData),
        });
    
        if (!response.ok) {
            throw new Error('Failed to add comment');
        }
    
        const result = await response.json();
        console.log('Comment added successfully:', result);
    
        // Clear the comment inputs
        setNewComment('');
        setReplyText('');
        await refetch(); // Refresh event data
        updateEventPage(event_id, "comments")
        updateLastOpened("comments");
        notify("Comment Posted!")

        if (!replyTo) {
          console.log("Expanding visibility for top-level comment");
          console.log("Result comment ID", result.comment.comment_id);
          setReplyVisibility((prev) => ({
              ...prev,
              [result.comment.comment_id]: true,
          }));
          } else {
              console.log("Expanding visibility for reply", replyTo);
              setReplyVisibility((prev) => ({
                  ...prev,
                  [replyTo.uuid]: true,
              }));
          }

          setReplyTo(null);

        } catch (error) {
          console.error('Error adding comment:', error);
          notify('Error adding comment: ' + error.message);
          setNotifyLoad(false);
        }
    };

    const getUserNameAndProfilePic = async (user_id) => {
      try {
          const res = await fetch(`${API_BASE_URL}/users/fetch-username?user_id=${user_id}`);
  
          if (!res.ok) {
              const errorData = await res.json();
              throw new Error(errorData.message || "Error fetching username and profile pic.");
          }
  
          const data = await res.json();
          return data;
      } catch (error) {
          console.error("Error:", error);
          setNotifyLoad(false);
          return null; // Return null if there is an error
      }
    };

    useEffect(() => {
        const fetchUserDetailsForComments = async () => {
            setLoading(true);
            const updatedComments = await Promise.all(
                commentData.comments.map(async (comment) => {
                    const userDetails = await getUserNameAndProfilePic(comment.user_id);
                    if (userDetails) {
                        comment.username = userDetails.name;
                        comment.profile_pic = userDetails.profile_pic;
                    }
                    return comment;
                })
            );
            setCommentsWithUserDetails(updatedComments);
            setLoading(false);
            setNotifyLoad(false);
        };

        if (commentData && commentData.comments && !error) {
          fetchUserDetailsForComments();
        }
    }, [commentData]);

    const toggleReplies = (commentId) => {
        setReplyVisibility((prev) => ({
          ...prev,
          [commentId]: !prev[commentId], // Toggle visibility
        }));
    };

    const renderComment = (comment, level = 0) => {

        // Get replies, sorted oldest to newest
        const replies = commentData.comments && commentData.comments
          .filter((c) => c.reply_to === comment.uuid)
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      
        // Find the original comment being replied to
        const parentComment = commentData.comments.find((c) => c.uuid === comment.reply_to);
        const replyingToUsername = parentComment ? `@${parentComment.username} ` : "";
        const profile = Profiles.find((profile) => profile.id === Number(comment.profile_pic));
      
      
        return (
          <div key={comment.uuid} className="comment" style={{ marginLeft: `${level * 20}px` }}>
            <div className="comment-header">
              <div className="comment-info-delete">
                <span>
                  <img className="profile-pic" src={profile ? profile.path : ""} />
                  <p className={`${comment.user_id === user_id ? "you underline" : ""}`}>{comment.username}{" "}</p>
                  {new Date(comment.created_at).toDateString() === new Date().toDateString()
                    ? `at ${new Date(comment.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                    : `on ${new Date(comment.created_at).toLocaleDateString()}`}
                </span>
                { (comment.user_id === user_id || role === "organiser") && <button className="small-button" onClick={() => {handleDeleteComment(comment.uuid)}}>🗑</button>}
             </div>
              <p>{replyingToUsername}{comment.message}</p>
              {/* Reply button */}
              {replyTo?.uuid === comment.uuid ? (
                <form onSubmit={(e) => {handleAddComment(e, false)}} className="reply-form">
                  <input
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder={
                      replyTo?.user_id === user_id
                        ? "Write a reply to yourself..."
                        : `Write a reply to ${replyTo?.username}...`
                    }                  />
                  <div className="button-container">
                    <button className = "small-button" type = "button" onClick={() => {setReplyTo(null)}}>Cancel</button>
                    <button className = "small-button" type="submit">Send Reply</button>
                  </div>
                </form>
              ) : (
                <div className="reply-button-container">
                <button className = "small-button" onClick={() => {setReplyTo(comment); setReplyText("")}}>Reply</button>

                {replies.length > 0 && (
                  <button className = "small-button" onClick={() => toggleReplies(comment.uuid)}>
                    {replyVisibility[comment.uuid] ? "Hide Replies" : `Show Replies (${replies.length})`}
                  </button>
                )}
                </div>
              )}
            </div>
      
            {/* Render Replies if visible */}
            {replyVisibility[comment.uuid] && replies.length > 0 && (
              <div className="replies">
                {replies.map((reply) => renderComment(reply, level + 1))}
              </div>
            )}
          </div>
        );
    };
    
    const handleCommentChange = (e) => {
      // Ensure that the comment does not exceed 100 characters
      if (e.target.value.length <= 10) {
          setNewComment(e.target.value);
      }
  };

    if (error) return <PageError error={error?.message ? error?.message : "Something Went Wrong"} page={"Comments"} />;

    if ((loading || secondaryloading) && !notifyLoad) return <div className="loader"><p>Fetching Comments</p><button onClick = {() => {navigate(`/event/${event_id}`)}} className="small-button">Cancel</button></div>;

    return (
        <div className="comments">
          <div className="top-line">
              <button className="back-button" onClick={() => { goEventPage(); }}>
                  {theme === "dark" ? 
                    <img src="/svgs/back-arrow-white.svg" alt="Back" /> :
                  <img src="/svgs/back-arrow.svg" alt="Back" />}
              </button>
              <h2>Comments</h2>
          </div>

        {/* Input form for adding a new comment */}
        <div className="comment-form">
          <textarea
            value={newComment}
            onChange={handleCommentChange}
            placeholder="Add your comment here"
            rows="4"
          />
          <div className="button-container">
            <button className = "small-button" onClick={() => {setNewComment("")}}>Clear Text</button>
            <button className = "small-button" onClick={handlePostComment}>Post Comment</button>
          </div>
         </div>

         {console.log("here" + JSON.stringify(commentsWithUserDetails))}

         {!loading && commentsWithUserDetails && commentsWithUserDetails.length > 0 && (
          <div className="section">
            {commentsWithUserDetails
              .filter((comment) => comment.reply_to === null)
              .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
              .slice(0, visibleTopLevelCount)
              .map((comment) => renderComment(comment))}
          </div>
        )}
        {commentsWithUserDetails.filter(c => c.reply_to === null).length > visibleTopLevelCount && (
          <div className="show-more-container">
            <button className="small-button" onClick={() => setVisibleTopLevelCount(prev => prev + 6)}>
              Show More Comments
            </button>
          </div>
        )}

        {visibleTopLevelCount > 6 && (
          <div className="show-less-container">
            <button className="small-button" onClick={() => setVisibleTopLevelCount(6)}>
              Show Less
            </button>
          </div>
        )}

        </div>
    )
}

export default Comments;