import {Comment} from 'hybrid-types/DBTypes';
import {create} from 'zustand';

// Define the store type for comments
type CommentStore = {
  comments: Partial<Comment & {username: string;}>[];
  setComments: (comments: Partial<Comment & {username: string;}>[]) => void;
  addComment: (comment: Partial<Comment & {username: string;}>) => void;
  deleteComment: (comment_id: number) => void;
};

export const useCommentStore = create<CommentStore>((set) => ({
  comments: [],
  setComments: (comments) => set({comments}),
  addComment: (comment) =>
    set((state) => ({
      comments: [
        ...state.comments,
        {
          comment_id: comment.comment_id,
          comment_text: comment.comment,
          user_id: comment.user_id,
          media_id: comment.recipe_id,
          created_at: new Date().toLocaleDateString('fi-FI'),
          username: comment.username,
          reference_comment_id: comment.reference_comment_id,
        },
      ],
    })),
  deleteComment: (comment_id) =>
    set((state) => ({
      comments: state.comments.filter(
        (comment) => comment.comment_id !== comment_id,
      ),
    })),
}));
