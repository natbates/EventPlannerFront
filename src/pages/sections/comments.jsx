import { useAuth } from "../../contexts/auth";
import useFetchEventData from "../../hooks/useFetchEventData";
import { useState } from "react";
import { API_BASE_URL } from "../../components/App";
import { useHistory } from "../../contexts/history";

const Comments = () =>
{
    const { data: commentData, error, loading, event_id, refetch, goEventPage } = useFetchEventData("comments/fetch-comments");
    const { user_id, name, role } = useAuth();

    const [newComment, setNewComment] = useState('');
    const [replyTo, setReplyTo] = useState(null);
    const [replyText, setReplyText] = useState("");
    const [replyVisibility, setReplyVisibility] = useState({});
    const {updateEventPage, updateLastOpened} = useHistory();
    
    const handleDeleteComment = async (comment_id) => {
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
        
            refetch();
        } catch (error) {
            console.error("Error deleting comment:", error);
        }
        }
    };
  
    const handleAddComment = async (e) => {
        e.preventDefault();
    
        // Validate if the comment is not empty
        if (replyTo === null) {
        if (newComment.trim() === '') {
            alert('Comment cannot be empty');
            return;
        }
        } else {
        if (replyText.trim() === '') {
            alert('Reply cannot be empty');
            return;
        }
        }
    
        // Prepare the comment object to send
        const commentData = {
        event_id: event_id,
        user_id: user_id,
        username: name,
        message: replyTo !== null ? replyText : newComment,
        reply_to: replyTo,
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
        setReplyTo(null); // Clear the reply-to field after submission
        refetch(); // Refresh event data
        updateEventPage(event_id, "comments")
        updateLastOpened("comments");

        if (replyTo) {
            setReplyVisibility((prev) => ({
            ...prev,
            [replyTo]: true, // Expand the replied-to comment thread
            }));
        }

        } catch (error) {
        console.error('Error adding comment:', error);
        alert('Error adding comment: ' + error.message);
        }
    };

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
          .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      
        // Find the original comment being replied to
        const parentComment = commentData.comments.find((c) => c.uuid === comment.reply_to);
        const replyingToUsername = parentComment ? `@${parentComment.username} ` : "";
      
        return (
          <div key={comment.uuid} className="comment" style={{ marginLeft: `${level * 20}px` }}>
            <div className="comment-header">
              <strong>{comment.username}</strong>
              <p>{replyingToUsername}{comment.message}</p>
              <p>{comment.created_at}</p>
              {/* Reply button */}
              {replyTo === comment.uuid ? (
                <form onSubmit={(e) => handleAddComment(e)}>
                  <input
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Write a reply..."
                  />
                  <button type="submit">Send Reply</button>
                </form>
              ) : (
                <button onClick={() => setReplyTo(comment.uuid)}>Reply</button>
              )}
              { (comment.user_id === user_id || role === "organiser") && <button onClick={() => {handleDeleteComment(comment.uuid)}}>Delete Comment</button>}
            </div>
      
            {/* Show Replies Button (Only for nested replies) */}
            {replies.length > 0 && (
              <button onClick={() => toggleReplies(comment.uuid)}>
                {replyVisibility[comment.uuid] ? "Hide Replies" : `Show Replies (${replies.length})`}
              </button>
            )}
      
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
        setNewComment(e.target.value);
      };

    console.log(commentData);
    return (
        <div className="comments">
          <div className="top-line">
              <button className="back-button" onClick={() => { goEventPage(); }}>
                <img src="/svgs/back-arrow.svg" alt="Back" />
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
          <button onClick={handleAddComment}>Post Comment</button>
         </div>

        {commentData && commentData.comments != null && (
          <>
            {commentData.comments.length === 0 ? (
              <p>No comments yet. Be the first to comment!</p>
            ) : (
                commentData.comments
                .filter((comment) => comment.reply_to === null) // Only top-level comments
                .map((comment) => renderComment(comment))
            )}
          </>
        )}
        </div>
    )
}

export default Comments;