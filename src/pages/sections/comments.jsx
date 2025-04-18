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
    const maxAmountOfChars = 128;

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
            headers: {
               "Content-Type": "application/json",
               "Authorization": `Bearer ${sessionStorage.getItem("token")}`
            },
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

      handleAddComment(e, true);

    }

    const handleReplyChange = (e) => {
      if (e.target.value.length <= maxAmountOfChars) {
          setReplyText(e.target.value);
      }
    };
  
    const handleAddComment = async (e, posting = false) => {
      e.preventDefault();
      setNotifyLoad(true);
  
      if (replyTo === null) {
          if (newComment.trim() === '') {
              alert('Comment cannot be empty');
              return;
          }
      } else {
          if (!posting) {
              if (replyText.trim() === '') {
                  alert('Reply cannot be empty');
                  return;
              }
              if (replyText.length > maxAmountOfChars) {
                  alert(`Reply cannot exceed ${maxAmountOfChars} characters`);
                  return;
              }
          }
      }
  
      const commentPayload = {
          event_id,
          user_id,
          message: replyTo !== null && !posting ? replyText : newComment,
          reply_to: !posting ? (replyTo?.uuid || null) : null,
      };
  
      try {
          const response = await fetch(`${API_BASE_URL}/comments/add-comment`, {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json',
                  "Authorization": `Bearer ${sessionStorage.getItem("token")}`
              },
              body: JSON.stringify(commentPayload),
          });
  
          if (!response.ok) throw new Error('Failed to add comment');
  
          const result = await response.json();
          const newCommentObj = result.comment;
  
          // Fetch user data for the new comment
          const userDetails = await getUserNameAndProfilePic(user_id);
          if (userDetails) {
              newCommentObj.username = userDetails.name;
              newCommentObj.profile_pic = userDetails.profile_pic;
          }
  
          // Update local state instead of refetching
          setCommentsWithUserDetails((prev) => [newCommentObj, ...prev]);
  
          // Reset inputs
          setNewComment('');
          setReplyText('');
          updateEventPage(event_id, "comments");
          updateLastOpened("comments");
          notify("Comment Posted!");
  
          // Expand visibility
          if (!replyTo) {
              setReplyVisibility((prev) => ({
                  ...prev,
                  [newCommentObj.comment_id]: true,
              }));
          } else {
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
      } finally
      {
        setNotifyLoad(false);
      }
    };
  

    const getUserNameAndProfilePic = async (user_id) => {
      try {
        const res = await fetch(`${API_BASE_URL}/users/fetch-username?user_id=${user_id}`, {
            headers: {
              "Authorization": `Bearer ${sessionStorage.getItem("token")}`
            }
          });  

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
        const replies = commentsWithUserDetails && commentsWithUserDetails
          .filter((c) => c.reply_to === comment.uuid)
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      
        // Find the original comment being replied to
        const parentComment = commentsWithUserDetails.find((c) => c.uuid === comment.reply_to);
        const replyingToUsername = parentComment ? `@${parentComment.username?.split(" ")[0]} ` : "";
        const profile = Profiles.find((profile) => profile.id === Number(comment.profile_pic));

        return (
          <div key={comment.uuid} className="comment" style={{ marginLeft: `${level >= 4 ? 0 : level * 20}px` }}>
            <div className="comment-header">
              {level > 0 && <div className="reply-line" alt="Reply Line" />}
              <div className="comment-info-delete">
                <span className="profile">
                  <img className="profile-pic" src={profile ? profile.path : ""} />
                  <p className={`${comment.user_id === user_id ? "you underline" : ""}`}>{comment.username}{" "}</p>
                  {new Date(comment.created_at).toDateString() === new Date().toDateString()
                    ? `at ${new Date(comment.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                    : `on ${new Date(comment.created_at).toLocaleDateString()}`}
                </span>
                { (comment.user_id === user_id || role != "attendee") && <button className="small-button" onClick={() => {handleDeleteComment(comment.uuid)}}>                                    {theme === "light" ? 
                  <img className="delete" src="/svgs/trash-white.svg" alt="Delete" /> :
                  <img className = "delete" src="/svgs/trash.svg" alt="Delete" />}</button>}
             </div>
              <p>{replyingToUsername}{comment.message}</p>
              {/* Reply button */}
              {replyTo?.uuid === comment.uuid ? (
                <form onSubmit={(e) => {handleAddComment(e, false)}} className="reply-form">
                  <div className="poll-input-container">
                    <input
                      value={replyText}
                      onChange={handleReplyChange}
                      placeholder={
                        replyTo?.user_id === user_id
                          ? "Write a reply to yourself..."
                          : `Write a reply to ${replyTo?.username}...`
                      }                  
                    />
                    <p className="character-counter">{replyText.length} / {maxAmountOfChars}</p>
                  </div>
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
      if (e.target.value.length <= maxAmountOfChars) {
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
          <div className="input-count-container">
            <textarea
              value={newComment}
              onChange={handleCommentChange}
              placeholder="Add your comment here"
            />
            <div className="comment-char-count">{newComment.length} / {maxAmountOfChars}</div>
          </div>
          <div className="button-container">
            <button className = "small-button" onClick={() => {setNewComment("")}}>Clear Text</button>
            <button className = "small-button" onClick={handlePostComment}>Post Comment</button>
          </div>
         </div>


         {!loading && commentsWithUserDetails && commentsWithUserDetails.length > 0 && (
          <div className="section">
            {commentsWithUserDetails
              .filter((comment) =>
                comment.reply_to === null &&
                comment.username && comment.profile_pic
              )
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