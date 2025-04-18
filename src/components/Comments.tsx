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
import { TextInput, TouchableOpacity, View } from 'react-native';
import { Text } from '@rneui/base';


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
      await postComment(inputs.comment_text.trim(), item.recipe_id, null, token); // Normal comment, no @username

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
        style={{
          flexDirection: 'column',
          alignItems: 'flex-start',
          gap: 12,
          width: '100%',
          padding: 16,
          borderRadius: 12,
          backgroundColor: '#1f2937',
          shadowColor: '#000',
          shadowOpacity: 0.2,
          shadowRadius: 6,
        }}
      >
        <Text
          onPress={() => console.log('Comment clicked:', comment)}
          style={{
            color: '#fbbf24',
            fontWeight: '500',
            fontSize: 18,
          }}
        >
          {comment.username}
        </Text>

        <Text
          style={{
            color: '#d1d5db',
            opacity: 0.8,
            width: '100%',
            textAlign: 'left',
          }}
        >
          {comment.comment}
        </Text>

        {user && (
          <TouchableOpacity
            onPress={() => {
              setReplyToCommentId(comment.comment_id);
              setInputs({ comment_text: `@${comment.username} ` });
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
              onChangeText={(text) =>
                handleInputChange('comment_text', text)
              }
            />
            <TouchableOpacity
              disabled={!inputs.comment_text.trim()}
              onPress={(e) => handleReply(e as unknown as React.SyntheticEvent, comment)}
              style={{
                width: '100%',
                backgroundColor: '#fbbf24',
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
                Reply
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ width: '100%' }}>
          <Text style={{ color: '#9ca3af' }}>
            {comment.created_at
              ? formatDate(comment.created_at.toString(), 'fi-FI')
              : 'Unknown date'}
          </Text>
        </View>

        {comment.replies && comment.replies.length > 0 && (
          <View
            style={{
              paddingLeft: 16,
              borderLeftWidth: 2,
              borderLeftColor: '#374151',
              marginTop: 12,
              width: '100%',
            }}
          >
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
            placeholder="Write a comment..."
            placeholderTextColor="#fcd34d"
            style={{
              width: '100%',
              backgroundColor: '#292524',
              color: '#fcd34d',
              padding: 12,
              borderRadius: 10,
            }}
            onChangeText={(text) =>
              handleInputChange('comment_text', text)
            }
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
          style={{
            color: '#9ca3af',
            textAlign: 'center',
            marginTop: 20,
          }}
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

export default Comments;

