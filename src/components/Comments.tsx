import {useEffect, useRef, useState} from 'react';
import {useUserContext} from '../hooks/contextHooks';
import {useForm} from '../hooks/formHooks';
import {useCommentStore} from '../stores/commentStore';
import {
  CommentWithUsernameAndReplies,
  RecipeWithOwner,
  CommentWithReplies,
  CommentWithUsername,
} from 'hybrid-types/DBTypes';
import {useComments} from '../hooks/apiHooks';
import {formatDate} from '../lib/functions';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {StyleSheet, TextInput, TouchableOpacity, View} from 'react-native';
import {Text} from '@rneui/base';
import {HexColors} from '../utils/colors';

const Comments = ({item}: {item: RecipeWithOwner}) => {
  const inputRef = useRef<TextInput | null>(null);
  const {user} = useUserContext();
  const {comments, setComments} = useCommentStore();
  const {postComment, deleteComment, getCommentsByRecipeId} = useComments();
  const [replyToCommentId, setReplyToCommentId] = useState<number | null>(null);

  const initValues = {
    comment_text: '',
  };

  const doComment = async () => {
    if (!item || !inputs.comment_text.trim()) return;

    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) throw new Error('No token found');
      await postComment(
        inputs.comment_text.trim(),
        item.recipe_id,
        null,
        token,
      ); // Normal comment, no @username

      const response = await getCommentsByRecipeId(item.recipe_id);
      if (response) {
        setComments(groupComments(response));
      }
    } catch (error) {
      console.error(error);
    }

    if (inputRef.current) inputRef.current.clear();
    setInputs(initValues);
  };

  const handleReply = async (
    event: React.SyntheticEvent,
    comment: CommentWithUsername,
  ) => {
    event.preventDefault();
    if (!item || !replyToCommentId || inputs.comment_text.trim() === '') return;

    let replyText = inputs.comment_text.trim();

    // Only add @username if it's not already there
    if (!replyText.startsWith(`@${comment.username}`)) {
      replyText = `@${comment.username} ${replyText}`;
    }

    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) throw new Error('No token found');

      await postComment(replyText, item.recipe_id, replyToCommentId, token);

      const response = await getCommentsByRecipeId(item.recipe_id);
      if (!response) return;

      setComments(groupComments(response));
    } catch (error) {
      console.error(error);
    }

    if (inputRef.current) inputRef.current.clear();
    setInputs(initValues);
    setReplyToCommentId(null);
  };

  const {handleSubmit, handleInputChange, inputs, setInputs} = useForm(
    doComment,
    initValues,
  );

  const getComments = async () => {
    try {
      const response = await getCommentsByRecipeId(item.recipe_id);
      if (!response) return;

      setComments(groupComments(response));
    } catch (error) {
      setComments([]);
      console.error((error as Error).message);
    }
  };

  const handleDelete = async (commentId: number) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) throw new Error('No token found');

      await deleteComment(commentId, token);
      const response = await getCommentsByRecipeId(item.recipe_id);
      if (!response) return;

      setComments(groupComments(response));
    } catch (error) {
      console.error(error);
    }
  };

  const groupComments = (
    comments: CommentWithUsername[] = [],
  ): CommentWithUsernameAndReplies[] => {
    const commentMap: Record<
      number,
      CommentWithUsername & {replies: CommentWithUsername[]}
    > = {};
    const rootComments: CommentWithUsernameAndReplies[] = [];

    comments.forEach((comment) => {
      // Ensure replies is initialized as an empty array
      commentMap[comment.comment_id] = {...comment, replies: []};
    });

    comments.forEach((comment) => {
      if (comment.reference_comment_id) {
        // Push replies to the parent comment's 'replies' array
        commentMap[comment.reference_comment_id]?.replies.push(
          commentMap[comment.comment_id],
        );
      } else {
        // Add root comments (top-level comments)
        rootComments.push(commentMap[comment.comment_id]);
      }
    });

    return rootComments;
  };

  const renderComments = (comments: CommentWithUsernameAndReplies[]) => {
    return comments.map((comment) => (
      <View
        key={comment.comment_id}
        style={styles.comment}
      >
        <Text
          onPress={() => console.log('Comment clicked:', comment)}
          style={styles.username}
          // TODO: Add onPress to navigate to user profile
        >
          {comment.username}
        </Text>

        <Text style={styles.commentText}>{comment.comment}</Text>

        {user && (
          <TouchableOpacity
            onPress={() => {
              setReplyToCommentId(comment.comment_id);
              setInputs({comment_text: `@${comment.username} `});
            }}
          >
            <Text
              style={{
                color: '#fbbf24',
                paddingHorizontal: 8,
                paddingVertical: 4,
                fontSize: 14,
                fontWeight: '500',
              }}
            >
              ↳ Reply
            </Text>
          </TouchableOpacity>
        )}

        {user && user.user_level_id === 1 && (
          <TouchableOpacity onPress={() => handleDelete(comment.comment_id)}>
            <Text
              style={{
                color: '#ef4444',
                paddingHorizontal: 8,
                paddingVertical: 4,
                fontSize: 14,
                fontWeight: '500',
              }}
            >
              Delete
            </Text>
          </TouchableOpacity>
        )}

        {replyToCommentId === comment.comment_id && (
          <View
            style={{
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              width: '100%',
              marginTop: 20,
            }}
          >
            <TextInput
              ref={inputRef}
              placeholder="Write a reply..."
              placeholderTextColor="#fcd34d"
              style={{
                width: '100%',
                backgroundColor: '#292524',
                color: '#fcd34d',
                padding: 12,
                borderRadius: 10,
              }}
              onChangeText={(text) => handleInputChange('comment_text', text)}
            />
            <TouchableOpacity
              disabled={!inputs.comment_text.trim()}
              onPress={(e) =>
                handleReply(e as unknown as React.SyntheticEvent, comment)
              }
              style={{
                width: '100%',
                backgroundColor: '#fbbf24',
                paddingVertical: 12,
                borderRadius: 10,
                alignItems: 'center',
              }}
            >
              <Text style={styles.replyText}>Reply</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{width: '100%'}}>
          <Text style={{color: '#9ca3af'}}>
            {comment.created_at
              ? formatDate(comment.created_at.toString(), 'fi-FI')
              : 'Unknown date'}
          </Text>
        </View>

        {comment.replies && comment.replies.length > 0 && (
          <View style={styles.replies}>
            {renderComments(comment.replies as CommentWithUsernameAndReplies[])}
          </View>
        )}
      </View>
    ));
  };

  useEffect(() => {
    if (item) {
      getComments();
    }
  }, [item.recipe_id]);

  return (
    <>
      {user ? (
        <View style={styles.container}>
          <TextInput
            ref={inputRef}
            placeholder="Write a comment..."
            placeholderTextColor="#fcd34d"
            style={styles.commentInput}
            onChangeText={(text) => handleInputChange('comment_text', text)}
          />
          <TouchableOpacity
            onPress={handleSubmit}
            style={{
              width: '100%',
              backgroundColor: '#d1d5db',
              paddingVertical: 12,
              borderRadius: 10,
              alignItems: 'center',
            }}
          >
            <Text
              style={{
                color: '#1c1917',
                fontWeight: '600',
              }}
            >
              Comment
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <Text
          style={styles.loginToComment}
        >
          Please log in to comment
        </Text>
      )}

      {comments.length > 0 && (
        <View
          style={{
            flexDirection: 'column',
            alignItems: 'center',
            gap: 16,
            marginTop: 20,
            width: '100%',
            flexWrap: 'wrap',
          }}
        >
          {renderComments(comments as CommentWithReplies[])}
        </View>
      )}
    </>
  );
};

// adding styles is not finished

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: HexColors['almost-white'],
  },
  commentInput: {
    backgroundColor: HexColors['light-green'],
    borderRadius: 10,
    padding: 12,
    width: '100%',
    color: HexColors['white'],
  },
  commentButton: {
    backgroundColor: HexColors['green'],
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  ReplyButton: {
    backgroundColor: HexColors['light-green'],
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  commentText: {
    color: HexColors['almost-white'],
    fontSize: 16,
    fontWeight: '500',
  },
  replyText: {
    color: HexColors['almost-white'],
    fontSize: 14,
    fontWeight: '400',
  },
  replies: {
    paddingLeft: 16,
    borderLeftWidth: 2,
    borderLeftColor: HexColors['light-green'],
    marginTop: 12,
    width: '100%',
  },
  comment: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 12,
    width: '100%',
    padding: 16,
    borderRadius: 12,
    backgroundColor: HexColors['green'],
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  loginToComment: {
    color: HexColors['dark-green'],
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 20,
  },
  username: {
    color: HexColors['grey'],
    fontSize: 16,
    fontWeight: '600',
  },
});

export default Comments;
