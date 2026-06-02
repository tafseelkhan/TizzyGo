// components/CommentComponent.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  Modal,
  Animated,
  Dimensions,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useUser } from '../../contexts/auth/UserContext';
import { useTheme } from '../../contexts/theme/ThemeContext';
import { debounce } from 'lodash';
import Icon from 'react-native-vector-icons/FontAwesome';
import {
  fetchCommentersAPI,
  fetchCommentsAPI,
  fetchUsersBatchAPI,
  addCommentAPI,
  addReplyAPI,
  toggleCommentLikeAPI,
  toggleReplyLikeAPI,
  deleteCommentAPI,
  deleteReplyAPI,
} from '../../../api/features/private/commentGlobalPrivateSlice';

// Types
interface User {
  _id: string;
  name: string;
  image: string;
}

interface Comment {
  _id: string;
  postId: string;
  userId: string | null;
  content: string;
  media?: string;
  mediaType?: 'image' | 'gif';
  likes: string[];
  replies: Reply[];
  createdAt: string;
}

interface Reply {
  _id: string;
  userId: string | null;
  content: string;
  media?: string;
  mediaType?: 'image' | 'gif';
  likes: string[];
  createdAt: string;
}

interface Commenter {
  userId: string;
  userName: string;
  userImage: string | null;
  commentCount: number;
}

type RootStackParamList = {
  'account/:userId': { userId: string };
  'report/:userId/users': { userId: string };
  [key: string]: any;
};

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const CommentComponent: React.FC<{ productId: string }> = ({ productId }) => {
  console.log('🔵 CommentComponent Mounted - Product ID:', productId);

  const { user, setUser } = useUser();
  const { isDark } = useTheme();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const currentUserId = user?._id ?? '';

  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[] | null>(null);
  const [users, setUsers] = useState<{ [key: string]: User }>({});
  const [currentUserImage, setCurrentUserImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingCommenters, setIsFetchingCommenters] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [newCommentMedia, setNewCommentMedia] = useState<string | null>(null);
  const [newCommentMediaType, setNewCommentMediaType] = useState<
    'image' | 'gif' | null
  >(null);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [replyMedia, setReplyMedia] = useState<string | null>(null);
  const [replyMediaType, setReplyMediaType] = useState<'image' | 'gif' | null>(
    null,
  );
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<{
    id: string;
    type: 'comment' | 'reply';
    commentId?: string;
  } | null>(null);
  const [showReplies, setShowReplies] = useState<{ [key: string]: boolean }>(
    {},
  );
  const [commenters, setCommenters] = useState<Commenter[]>([]);
  const [hasFetchedComments, setHasFetchedComments] = useState(false);
  const [hoveredComment, setHoveredComment] = useState<string | null>(null);
  const [hoveredReply, setHoveredReply] = useState<string | null>(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const suggestedEmojis = [
    '😊',
    '👍',
    '🔥',
    '❤️',
    '😂',
    '😍',
    '😡',
    '😢',
    '😱',
    '💔',
    '🎉',
    '👏',
    '🙏',
    '🤔',
    '😴',
    '🤮',
    '🥰',
    '🤯',
    '🥳',
    '🤬',
    '💯',
    '✨',
    '🌟',
    '😎',
    '🙌',
    '💥',
    '🎶',
    '🍀',
    '🌈',
    '☀️',
    '🌙',
    '⭐',
    '⚡',
    '💫',
    '🍎',
    '🍕',
    '🍔',
    '🍟',
    '🌮',
    '🍣',
    '🍩',
    '🍪',
    '☕',
    '🍺',
    '🍷',
    '🏆',
    '🎁',
    '📚',
    '✈️',
    '🚗',
    '🏠',
    '💼',
    '📱',
    '💻',
    '🎮',
    '⚽',
    '🏀',
    '🎲',
    '🎯',
    '🎬',
    '🎨',
    '🎤',
    '🎧',
    '📸',
    '📹',
    '🎥',
    '🖼️',
    '📺',
    '📻',
  ];

  const backendBaseUrl = 'http://172.20.10.12:5000';

  const colors = {
    background: isDark ? '#00000000' : '#FFFFFF',
    modalBackground: isDark ? '#1E293B' : '#FFFFFF',
    cardBackground: isDark ? '#00000000' : '#FFFFFF',
    inputBackground: isDark ? '#475569' : '#ffffff',
    primaryText: isDark ? '#F1F5F9' : '#1F2937',
    secondaryText: isDark ? '#94A3B8' : '#6B7280',
    placeholderText: isDark ? '#64748B' : '#9CA3AF',
    border: isDark ? '#475569' : '#E5E7EB',
    primaryButton: isDark ? '#3B82F6' : '#3B82F6',
    secondaryButton: isDark ? '#475569' : '#F3F4F6',
    likeActive: '#EF4444',
    badgeBackground: isDark ? '#1D4ED8' : '#E0E7FF',
    badgeText: isDark ? '#93C5FD' : '#3B82F6',
    hoverBackground: isDark ? '#475569' : '#F0F9FF',
    hoverBorder: isDark ? '#60A5FA' : '#3B82F6',
    error: '#EF4444',
    overlay: isDark ? 'rgba(0, 0, 0, 0.7)' : 'rgba(0, 0, 0, 0.5)',
    loadingOverlay: isDark ? 'rgba(15, 23, 42, 0.9)' : 'rgb(255, 255, 255)',
  };

  const handleHoverIn = (type: 'comment' | 'reply', id: string) => {
    if (type === 'comment') {
      setHoveredComment(id);
    } else {
      setHoveredReply(id);
    }
    Animated.spring(scaleAnim, {
      toValue: 1.02,
      useNativeDriver: true,
    }).start();
  };

  const handleHoverOut = () => {
    setHoveredComment(null);
    setHoveredReply(null);
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const getImageUrl = (image: string | undefined | null) => {
    if (!image) return 'https://via.placeholder.com/40';
    return image.startsWith('http') ? image : `${backendBaseUrl}${image}`;
  };

  const totalCommentCount = commenters.reduce(
    (sum, commenter) => sum + commenter.commentCount,
    0,
  );

  const openComments = () => {
    setShowComments(true);
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const closeComments = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: SCREEN_HEIGHT,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => setShowComments(false));
  };

  const fetchCurrentUserImage = useCallback(async () => {
    if (!currentUserId) return;

    try {
      const userData = await fetchUsersBatchAPI([currentUserId]);
      if (userData.length > 0) {
        setCurrentUserImage(userData[0].image || null);
      }
    } catch (err) {
      console.error('Error fetching current user image:', err);
      setCurrentUserImage(null);
    }
  }, [currentUserId]);

  const debouncedFetchCommenters = useCallback(
    debounce(async () => {
      setIsFetchingCommenters(true);
      try {
        const data = await fetchCommentersAPI(productId);
        setCommenters(data);

        const newUsers = data.reduce(
          (
            map: { [key: string]: User },
            commenter: { userId: string; userName: string; userImage: string },
          ) => {
            if (
              commenter.userId &&
              commenter.userName !== 'Deleted User' &&
              !users[commenter.userId]
            ) {
              map[commenter.userId] = {
                _id: commenter.userId,
                name: commenter.userName,
                image: commenter.userImage || 'https://via.placeholder.com/40',
              };
            }
            return map;
          },
          {} as { [key: string]: User },
        );

        setUsers(prev => ({ ...prev, ...newUsers }));
      } catch (err: any) {
        console.error('Error fetching commenters:', err);
        setError(err.message || 'Failed to load commenters');
        setCommenters([]);
      } finally {
        setIsFetchingCommenters(false);
      }
    }, 500),
    [productId, users],
  );

  const fetchCommentsAndUsers = useCallback(async () => {
    setError(null);
    setIsLoading(true);
    try {
      const commentsData = await fetchCommentsAPI(productId);

      const userIds = new Set<string>();
      commentsData.forEach((comment: Comment) => {
        if (comment.userId && !users[comment.userId])
          userIds.add(comment.userId);
        comment.replies.forEach(reply => {
          if (reply.userId && !users[reply.userId]) userIds.add(reply.userId);
        });
      });

      if (userIds.size > 0) {
        const userData = await fetchUsersBatchAPI(Array.from(userIds));
        const userMap = userData.reduce((map: any, user: any) => {
          if (!users[user._id]) map[user._id] = user;
          return map;
        }, {} as { [key: string]: User });
        setUsers(prev => ({ ...prev, ...userMap }));
      }

      setComments(commentsData);
      setHasFetchedComments(true);
    } catch (err: any) {
      console.error('Error fetching comments:', err);
      setError(err.message || 'Failed to load comments');
    } finally {
      setIsLoading(false);
    }
  }, [productId, users]);

  const handleAddComment = async () => {
    if ((!newComment.trim() && !newCommentMedia) || !currentUserId) {
      setError('Please add a comment');
      return;
    }

    setIsLoading(true);
    try {
      const newCommentData = await addCommentAPI(
        productId,
        currentUserId,
        newComment,
        newCommentMedia || undefined,
        newCommentMediaType || undefined,
      );

      if (newCommentData.userId && !users[newCommentData.userId]) {
        const [userData] = await fetchUsersBatchAPI([newCommentData.userId]);
        setUsers(prev => ({ ...prev, [userData._id]: userData }));
      }

      setComments(prev =>
        prev ? [newCommentData, ...prev] : [newCommentData],
      );
      setNewComment('');
      setNewCommentMedia(null);
      setNewCommentMediaType(null);
      setHasFetchedComments(false);
      debouncedFetchCommenters();
    } catch (err: any) {
      console.error('Error adding comment:', err);
      setError(err.message || 'Failed to add comment');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddReply = async (commentId: string) => {
    if ((!replyContent.trim() && !replyMedia) || !currentUserId) {
      setError('Please add a reply');
      return;
    }

    setIsLoading(true);
    try {
      const updatedComment = await addReplyAPI(
        commentId,
        currentUserId,
        replyContent,
        replyMedia || undefined,
        replyMediaType || undefined,
      );

      const newReply =
        updatedComment.replies[updatedComment.replies.length - 1];
      if (newReply.userId && !users[newReply.userId]) {
        const [userData] = await fetchUsersBatchAPI([newReply.userId]);
        setUsers(prev => ({ ...prev, [userData._id]: userData }));
      }

      setComments(prev =>
        prev
          ? prev.map(comment =>
              comment._id === commentId
                ? { ...comment, replies: updatedComment.replies }
                : comment,
            )
          : prev,
      );

      setReplyingTo(null);
      setReplyContent('');
      setReplyMedia(null);
      setReplyMediaType(null);
      setHasFetchedComments(false);
      debouncedFetchCommenters();
    } catch (err: any) {
      console.error('Error adding reply:', err);
      setError(err.message || 'Failed to add reply');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleLike = async (commentId: string) => {
    if (!currentUserId) {
      setError('Please log in to like a comment.');
      return;
    }

    setIsLoading(true);
    try {
      const { likedByCurrentUser } = await toggleCommentLikeAPI(
        commentId,
        currentUserId,
      );

      setComments(prev =>
        prev
          ? prev.map(comment =>
              comment._id === commentId
                ? {
                    ...comment,
                    likes: likedByCurrentUser
                      ? [...comment.likes, currentUserId]
                      : comment.likes.filter(id => id !== currentUserId),
                  }
                : comment,
            )
          : prev,
      );
    } catch (err: any) {
      console.error('Error toggling like:', err);
      setError(err.message || 'Failed to toggle like');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleReplyLike = async (commentId: string, replyId: string) => {
    if (!currentUserId) {
      setError('Please log in to like a reply.');
      return;
    }

    setIsLoading(true);
    try {
      const { likedByCurrentUser } = await toggleReplyLikeAPI(
        commentId,
        replyId,
        currentUserId,
      );

      setComments(prev =>
        prev
          ? prev.map(comment =>
              comment._id === commentId
                ? {
                    ...comment,
                    replies: comment.replies.map(reply =>
                      reply._id === replyId
                        ? {
                            ...reply,
                            likes: likedByCurrentUser
                              ? [...reply.likes, currentUserId]
                              : reply.likes.filter(id => id !== currentUserId),
                          }
                        : reply,
                    ),
                  }
                : comment,
            )
          : prev,
      );
    } catch (err: any) {
      console.error('Error toggling reply like:', err);
      setError(err.message || 'Failed to toggle reply like');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!showDeleteConfirm || !currentUserId) return;

    setIsLoading(true);
    try {
      const { id, type, commentId } = showDeleteConfirm;

      if (type === 'comment') {
        await deleteCommentAPI(id);
        setComments(
          prev => prev?.filter(comment => comment._id !== id) || null,
        );
      } else {
        await deleteReplyAPI(commentId!, id);
        setComments(prev =>
          prev
            ? prev.map(comment =>
                comment._id === commentId
                  ? {
                      ...comment,
                      replies: comment.replies.filter(
                        reply => reply._id !== id,
                      ),
                    }
                  : comment,
              )
            : prev,
        );
      }

      setShowDeleteConfirm(null);
      setHasFetchedComments(false);
      debouncedFetchCommenters();
    } catch (err: any) {
      console.error('Error deleting:', err);
      setError(err.message || `Failed to delete ${showDeleteConfirm?.type}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNavigateToProfile = (userId: string | null) => {
    if (!userId) {
      setError('Cannot navigate: User ID is missing.');
      return;
    }
    setUser({ ...user!, _id: userId });
    navigation.navigate(`account/${userId}`, { userId });
  };

  const handleNavigateToReport = (userId: string | null) => {
    if (!userId) {
      setError('Cannot navigate: User ID is missing.');
      return;
    }
    setUser({ ...user!, _id: userId });
    navigation.navigate(`report/${userId}/users`, { userId });
  };

  const toggleReplies = (commentId: string) => {
    setShowReplies(prev => ({ ...prev, [commentId]: !prev[commentId] }));
  };

  const handleEmojiClick = (emoji: string, inputType: 'comment' | 'reply') => {
    if (inputType === 'comment') {
      setNewComment(prev => prev + emoji);
    } else {
      setReplyContent(prev => prev + emoji);
    }
  };

  const removeMedia = (type: 'comment' | 'reply') => {
    if (type === 'comment') {
      setNewCommentMedia(null);
      setNewCommentMediaType(null);
    } else {
      setReplyMedia(null);
      setReplyMediaType(null);
    }
  };

  useEffect(() => {
    debouncedFetchCommenters();
    if (showComments && !hasFetchedComments) {
      fetchCommentsAndUsers();
    }
    return () => {
      debouncedFetchCommenters.cancel();
    };
  }, [
    productId,
    debouncedFetchCommenters,
    showComments,
    hasFetchedComments,
    fetchCommentsAndUsers,
  ]);

  useEffect(() => {
    fetchCurrentUserImage();
  }, [fetchCurrentUserImage]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const renderComment = (comment: Comment) => {
    const user = comment.userId ? users[comment.userId] : null;
    const isHovered = hoveredComment === comment._id;

    return (
      <TouchableOpacity
        activeOpacity={0.9}
        onPressIn={() => handleHoverIn('comment', comment._id)}
        onPressOut={handleHoverOut}
        key={comment._id}
      >
        <Animated.View
          style={[
            styles.commentContainer,
            { backgroundColor: colors.cardBackground },
            isHovered && {
              backgroundColor: colors.hoverBackground,
              borderColor: colors.hoverBorder,
              borderWidth: 1,
            },
            { transform: [{ scale: isHovered ? 1.02 : 1 }] },
          ]}
        >
          <View style={styles.commentHeader}>
            <TouchableOpacity
              onPress={() => handleNavigateToProfile(comment.userId)}
              style={styles.userInfo}
            >
              <Image
                source={{ uri: getImageUrl(user?.image) }}
                style={styles.avatar}
                defaultSource={{ uri: 'https://via.placeholder.com/40' }}
              />
              <Text style={[styles.userName, { color: colors.primaryText }]}>
                {user?.name ?? 'Deleted User'}
              </Text>
            </TouchableOpacity>
            <Text style={[styles.date, { color: colors.secondaryText }]}>
              {formatDate(comment.createdAt)}
            </Text>
          </View>

          {comment.content ? (
            <Text
              style={[styles.commentContent, { color: colors.primaryText }]}
            >
              {comment.content}
            </Text>
          ) : null}

          {comment.media && (
            <View style={styles.mediaContainer}>
              <Image
                source={{ uri: getImageUrl(comment.media) }}
                style={
                  comment.mediaType === 'gif'
                    ? styles.gifMedia
                    : styles.imageMedia
                }
                resizeMode="contain"
              />
              {comment.mediaType === 'gif' && (
                <View style={styles.gifBadge}>
                  <Text style={styles.gifText}>GIF</Text>
                </View>
              )}
            </View>
          )}

          <View
            style={[styles.commentActions, { borderTopColor: colors.border }]}
          >
            <TouchableOpacity
              onPress={() =>
                setReplyingTo(replyingTo === comment._id ? null : comment._id)
              }
              style={[
                styles.actionButton,
                isHovered && { backgroundColor: colors.secondaryButton },
              ]}
            >
              <Icon name="reply" size={12} color={colors.secondaryText} />
              <Text
                style={[styles.actionText, { color: colors.secondaryText }]}
              >
                Reply
              </Text>
            </TouchableOpacity>

            {currentUserId === comment.userId && (
              <TouchableOpacity
                onPress={() =>
                  setShowDeleteConfirm({ id: comment._id, type: 'comment' })
                }
                style={[
                  styles.actionButton,
                  isHovered && { backgroundColor: colors.secondaryButton },
                ]}
              >
                <Icon name="trash" size={12} color={colors.secondaryText} />
              </TouchableOpacity>
            )}

            <TouchableOpacity
              onPress={() => handleNavigateToReport(comment.userId)}
              style={[
                styles.actionButton,
                isHovered && { backgroundColor: colors.secondaryButton },
              ]}
            >
              <Icon
                name="exclamation-circle"
                size={12}
                color={colors.secondaryText}
              />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => toggleLike(comment._id)}
              style={[
                styles.actionButton,
                isHovered && { backgroundColor: colors.secondaryButton },
              ]}
            >
              <Icon
                name={
                  comment.likes.includes(currentUserId) ? 'heart' : 'heart-o'
                }
                size={12}
                color={
                  comment.likes.includes(currentUserId)
                    ? colors.likeActive
                    : colors.secondaryText
                }
              />
              <Text style={[styles.likeCount, { color: colors.secondaryText }]}>
                {comment.likes.length}
              </Text>
            </TouchableOpacity>
          </View>

          {comment.replies.length > 0 && (
            <TouchableOpacity
              onPress={() => toggleReplies(comment._id)}
              style={[
                styles.viewRepliesButton,
                { backgroundColor: colors.secondaryButton },
                isHovered && { backgroundColor: colors.badgeBackground },
              ]}
            >
              <Text
                style={[styles.viewRepliesText, { color: colors.badgeText }]}
              >
                {showReplies[comment._id]
                  ? 'Hide Replies'
                  : `View Replies (${comment.replies.length})`}
              </Text>
            </TouchableOpacity>
          )}

          {showReplies[comment._id] && comment.replies.length > 0 && (
            <View
              style={[
                styles.repliesContainer,
                { borderLeftColor: colors.border },
              ]}
            >
              {comment.replies.map(reply => {
                const replyUser = reply.userId ? users[reply.userId] : null;
                const isReplyHovered = hoveredReply === reply._id;

                return (
                  <TouchableOpacity
                    key={reply._id}
                    activeOpacity={0.9}
                    onPressIn={() => handleHoverIn('reply', reply._id)}
                    onPressOut={handleHoverOut}
                  >
                    <Animated.View
                      style={[
                        styles.replyContainer,
                        {
                          backgroundColor: colors.cardBackground,
                          borderColor: colors.border,
                        },
                        isReplyHovered && {
                          backgroundColor: colors.hoverBackground,
                          borderColor: colors.hoverBorder,
                          borderWidth: 1,
                        },
                        { transform: [{ scale: isReplyHovered ? 1.02 : 1 }] },
                      ]}
                    >
                      <View style={styles.replyHeader}>
                        <TouchableOpacity
                          onPress={() => handleNavigateToProfile(reply.userId)}
                          style={styles.userInfo}
                        >
                          <Image
                            source={{ uri: getImageUrl(replyUser?.image) }}
                            style={styles.smallAvatar}
                            defaultSource={{
                              uri: 'https://via.placeholder.com/32',
                            }}
                          />
                          <Text
                            style={[
                              styles.userName,
                              { color: colors.primaryText },
                            ]}
                          >
                            {replyUser?.name ?? 'Deleted User'}
                          </Text>
                        </TouchableOpacity>
                        <Text
                          style={[styles.date, { color: colors.secondaryText }]}
                        >
                          {formatDate(reply.createdAt)}
                        </Text>
                      </View>

                      {reply.content ? (
                        <Text
                          style={[
                            styles.replyContent,
                            { color: colors.primaryText },
                          ]}
                        >
                          {reply.content}
                        </Text>
                      ) : null}

                      {reply.media && (
                        <View style={styles.mediaContainer}>
                          <Image
                            source={{ uri: getImageUrl(reply.media) }}
                            style={
                              reply.mediaType === 'gif'
                                ? styles.gifMedia
                                : styles.imageMedia
                            }
                            resizeMode="contain"
                          />
                          {reply.mediaType === 'gif' && (
                            <View style={styles.gifBadge}>
                              <Text style={styles.gifText}>GIF</Text>
                            </View>
                          )}
                        </View>
                      )}

                      <View style={styles.replyActions}>
                        <TouchableOpacity
                          onPress={() =>
                            toggleReplyLike(comment._id, reply._id)
                          }
                          style={[
                            styles.actionButton,
                            isReplyHovered && {
                              backgroundColor: colors.secondaryButton,
                            },
                          ]}
                        >
                          <Icon
                            name={
                              reply.likes.includes(currentUserId)
                                ? 'heart'
                                : 'heart-o'
                            }
                            size={10}
                            color={
                              reply.likes.includes(currentUserId)
                                ? colors.likeActive
                                : colors.secondaryText
                            }
                          />
                          <Text
                            style={[
                              styles.likeCount,
                              { color: colors.secondaryText },
                            ]}
                          >
                            {reply.likes.length}
                          </Text>
                        </TouchableOpacity>

                        {currentUserId === reply.userId && (
                          <TouchableOpacity
                            onPress={() =>
                              setShowDeleteConfirm({
                                id: reply._id,
                                type: 'reply',
                                commentId: comment._id,
                              })
                            }
                            style={[
                              styles.actionButton,
                              isReplyHovered && {
                                backgroundColor: colors.secondaryButton,
                              },
                            ]}
                          >
                            <Icon
                              name="trash"
                              size={12}
                              color={colors.secondaryText}
                            />
                          </TouchableOpacity>
                        )}

                        <TouchableOpacity
                          onPress={() => handleNavigateToReport(reply.userId)}
                          style={[
                            styles.actionButton,
                            isReplyHovered && {
                              backgroundColor: colors.secondaryButton,
                            },
                          ]}
                        >
                          <Icon
                            name="exclamation-circle"
                            size={12}
                            color={colors.secondaryText}
                          />
                        </TouchableOpacity>
                      </View>
                    </Animated.View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </Animated.View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {isLoading && (
        <View
          style={[
            styles.loadingOverlay,
            { backgroundColor: colors.loadingOverlay },
          ]}
        >
          <ActivityIndicator size="large" color={colors.primaryButton} />
        </View>
      )}

      <View style={styles.commentButtonContainer}>
        <TouchableOpacity
          onPress={openComments}
          style={[styles.commentButton, { backgroundColor: colors.background }]}
        >
          <Icon
            name="comment-o"
            size={20}
            color={
              totalCommentCount > 0
                ? colors.primaryButton
                : colors.secondaryText
            }
          />
          {totalCommentCount > 0 && (
            <View
              style={[
                styles.commentCountBadge,
                { backgroundColor: colors.primaryButton },
              ]}
            >
              <Text style={styles.commentCountText}>{totalCommentCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <Modal
        visible={showComments}
        animationType="none"
        transparent={true}
        statusBarTranslucent={true}
      >
        <View style={styles.modalWrapper}>
          <Animated.View
            style={[
              styles.modalOverlay,
              { backgroundColor: colors.overlay, opacity: fadeAnim },
            ]}
          >
            <KeyboardAvoidingView
              style={styles.keyboardAvoidingView}
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 25}
            >
              <Animated.View
                style={[
                  styles.modalContentContainer,
                  { transform: [{ translateY: slideAnim }] },
                ]}
              >
                <View
                  style={[
                    styles.modalContent,
                    { backgroundColor: colors.modalBackground },
                  ]}
                >
                  <SafeAreaView
                    style={{ backgroundColor: colors.modalBackground }}
                  >
                    <View
                      style={[
                        styles.modalHeader,
                        {
                          backgroundColor: colors.modalBackground,
                          borderBottomColor: colors.border,
                        },
                      ]}
                    >
                      <View style={styles.modalHeaderLeft}>
                        <Text
                          style={[
                            styles.modalTitle,
                            { color: colors.primaryText },
                          ]}
                        >
                          Comments
                        </Text>
                        {totalCommentCount > 0 && (
                          <View
                            style={[
                              styles.totalCommentsBadge,
                              { backgroundColor: colors.badgeBackground },
                            ]}
                          >
                            <Text
                              style={[
                                styles.totalCommentsText,
                                { color: colors.badgeText },
                              ]}
                            >
                              {totalCommentCount}
                            </Text>
                          </View>
                        )}
                      </View>
                      <TouchableOpacity
                        onPress={closeComments}
                        style={[
                          styles.closeButton,
                          { backgroundColor: colors.secondaryButton },
                        ]}
                      >
                        <Icon
                          name="times"
                          size={20}
                          color={colors.secondaryText}
                        />
                      </TouchableOpacity>
                    </View>
                  </SafeAreaView>

                  <ScrollView
                    style={styles.commentsList}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.commentsListContent}
                  >
                    {comments === null && !error && (
                      <View style={styles.emptyState}>
                        <ActivityIndicator
                          size="small"
                          color={colors.primaryButton}
                        />
                        <Text
                          style={[
                            styles.emptyStateText,
                            { color: colors.secondaryText },
                          ]}
                        >
                          Loading comments...
                        </Text>
                      </View>
                    )}

                    {error && (
                      <View style={styles.emptyState}>
                        <Text
                          style={[styles.errorText, { color: colors.error }]}
                        >
                          {error}
                        </Text>
                        <TouchableOpacity
                          onPress={() => {
                            setHasFetchedComments(false);
                            fetchCommentsAndUsers();
                            debouncedFetchCommenters();
                          }}
                          style={[
                            styles.retryButton,
                            { backgroundColor: colors.primaryButton },
                          ]}
                        >
                          <Text style={styles.retryText}>Retry</Text>
                        </TouchableOpacity>
                      </View>
                    )}

                    {comments && comments.length === 0 && (
                      <View style={styles.emptyState}>
                        <Icon
                          name="comment-o"
                          size={48}
                          color={colors.border}
                        />
                        <Text
                          style={[
                            styles.emptyStateText,
                            { color: colors.secondaryText },
                          ]}
                        >
                          No comments yet
                        </Text>
                        <Text
                          style={[
                            styles.emptyStateSubtext,
                            { color: colors.placeholderText },
                          ]}
                        >
                          Be the first to comment!
                        </Text>
                      </View>
                    )}

                    {comments && comments.length > 0 && (
                      <View style={styles.commentsContainer}>
                        {comments.map(renderComment)}
                      </View>
                    )}
                  </ScrollView>

                  <SafeAreaView
                    style={{ backgroundColor: colors.modalBackground }}
                  >
                    <View
                      style={[
                        styles.addCommentContainer,
                        {
                          backgroundColor: colors.modalBackground,
                          borderTopColor: colors.border,
                        },
                      ]}
                    >
                      {replyingTo && (
                        <View
                          style={[
                            styles.replyingToContainer,
                            { backgroundColor: colors.badgeBackground },
                          ]}
                        >
                          <Text
                            style={[
                              styles.replyingToText,
                              { color: colors.badgeText },
                            ]}
                          >
                            Replying to comment
                          </Text>
                          <TouchableOpacity
                            onPress={() => setReplyingTo(null)}
                            style={[
                              styles.cancelReplyButton,
                              { backgroundColor: colors.secondaryButton },
                            ]}
                          >
                            <Icon
                              name="times"
                              size={12}
                              color={colors.secondaryText}
                            />
                          </TouchableOpacity>
                        </View>
                      )}

                      {newCommentMedia && (
                        <View style={styles.mediaPreview}>
                          <Image
                            source={{ uri: getImageUrl(newCommentMedia) }}
                            style={styles.mediaPreviewImage}
                          />
                          <TouchableOpacity
                            style={styles.removeMediaButton}
                            onPress={() => removeMedia('comment')}
                          >
                            <Icon name="times" size={12} color="white" />
                          </TouchableOpacity>
                        </View>
                      )}

                      <View style={styles.addCommentRow}>
                        <Image
                          source={{ uri: getImageUrl(currentUserImage) }}
                          style={styles.avatar}
                          defaultSource={{
                            uri: 'https://via.placeholder.com/40',
                          }}
                        />
                        <TextInput
                          value={replyingTo ? replyContent : newComment}
                          onChangeText={
                            replyingTo ? setReplyContent : setNewComment
                          }
                          placeholder={
                            replyingTo ? 'Write a reply...' : 'Add a comment...'
                          }
                          placeholderTextColor={colors.placeholderText}
                          style={[
                            styles.commentInput,
                            {
                              backgroundColor: colors.inputBackground,
                              borderColor: colors.border,
                              color: colors.primaryText,
                            },
                          ]}
                          multiline
                          maxLength={500}
                        />
                        <View style={styles.commentActionsContainer}>
                          <TouchableOpacity
                            onPress={() => {
                              if (replyingTo) handleAddReply(replyingTo);
                              else handleAddComment();
                            }}
                            disabled={
                              replyingTo
                                ? (!replyContent.trim() && !replyMedia) ||
                                  !currentUserId
                                : (!newComment.trim() && !newCommentMedia) ||
                                  !currentUserId
                            }
                            style={[
                              styles.sendButton,
                              { backgroundColor: colors.badgeBackground },
                              (replyingTo
                                ? (!replyContent.trim() && !replyMedia) ||
                                  !currentUserId
                                : (!newComment.trim() && !newCommentMedia) ||
                                  !currentUserId) && {
                                backgroundColor: colors.secondaryButton,
                              },
                            ]}
                          >
                            <Icon
                              name="paper-plane"
                              size={18}
                              color={
                                (
                                  replyingTo
                                    ? (replyContent.trim() || replyMedia) &&
                                      currentUserId
                                    : (newComment.trim() || newCommentMedia) &&
                                      currentUserId
                                )
                                  ? colors.primaryButton
                                  : colors.placeholderText
                              }
                            />
                          </TouchableOpacity>
                        </View>
                      </View>

                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={styles.emojiRow}
                      >
                        {suggestedEmojis.map(emoji => (
                          <TouchableOpacity
                            key={emoji}
                            onPress={() =>
                              handleEmojiClick(
                                emoji,
                                replyingTo ? 'reply' : 'comment',
                              )
                            }
                            style={[
                              styles.emojiButton,
                              { backgroundColor: colors.cardBackground },
                            ]}
                          >
                            <Text style={styles.emojiText}>{emoji}</Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  </SafeAreaView>
                </View>
              </Animated.View>
            </KeyboardAvoidingView>
          </Animated.View>
        </View>
      </Modal>

      <Modal
        visible={!!showDeleteConfirm}
        transparent={true}
        animationType="fade"
        statusBarTranslucent={true}
      >
        <SafeAreaView style={{ backgroundColor: colors.overlay }}>
          <View
            style={[
              styles.confirmModalOverlay,
              { backgroundColor: colors.overlay },
            ]}
          >
            <View
              style={[
                styles.confirmModal,
                { backgroundColor: colors.modalBackground },
              ]}
            >
              <Icon
                name="exclamation-triangle"
                size={40}
                color={colors.error}
                style={styles.confirmIcon}
              />
              <Text
                style={[styles.confirmTitle, { color: colors.primaryText }]}
              >
                Delete {showDeleteConfirm?.type}?
              </Text>
              <Text
                style={[styles.confirmMessage, { color: colors.secondaryText }]}
              >
                Are you sure you want to delete this {showDeleteConfirm?.type}?
                This action cannot be undone.
              </Text>
              <View style={styles.confirmButtons}>
                <TouchableOpacity
                  onPress={() => setShowDeleteConfirm(null)}
                  style={[
                    styles.confirmButton,
                    styles.cancelButton,
                    { backgroundColor: colors.secondaryButton },
                  ]}
                >
                  <Text
                    style={[
                      styles.cancelButtonText,
                      { color: colors.secondaryText },
                    ]}
                  >
                    Cancel
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleDelete}
                  style={[
                    styles.confirmButton,
                    styles.deleteButton,
                    { backgroundColor: colors.error },
                  ]}
                >
                  <Text style={styles.deleteButtonText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { position: 'relative' },
  commentButtonContainer: { flexDirection: 'row', alignItems: 'center' },
  commentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: 44,
    height: 44,
    borderRadius: 22,
    position: 'relative',
    elevation: 3,
  },
  commentCountBadge: {
    position: 'absolute',
    top: 8,
    right: -0,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  commentCountText: { color: 'white', fontSize: 10, fontWeight: 'bold' },
  modalWrapper: { flex: 1 },
  modalOverlay: { flex: 1 },
  keyboardAvoidingView: { flex: 1 },
  modalContentContainer: { flex: 1, justifyContent: 'flex-end' },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  modalHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  modalTitle: { fontSize: 20, fontWeight: '700' },
  totalCommentsBadge: {
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 12,
  },
  totalCommentsText: { fontSize: 12, fontWeight: '600' },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  commentsList: { flex: 1 },
  commentsListContent: { flexGrow: 1 },
  commentsContainer: { padding: 20 },
  commentContainer: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  userInfo: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  smallAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  userName: { fontSize: 14, fontWeight: '600' },
  date: { fontSize: 12, fontWeight: '500' },
  commentContent: { fontSize: 15, marginBottom: 12, lineHeight: 22 },
  mediaContainer: { marginBottom: 12, position: 'relative' },
  imageMedia: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  gifMedia: {
    width: '100%',
    height: 150,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  gifBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  gifText: { color: 'white', fontSize: 10, fontWeight: 'bold' },
  commentActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: 'transparent',
  },
  actionText: { fontSize: 13, fontWeight: '500' },
  likeCount: { fontSize: 13, fontWeight: '500', marginLeft: 2 },
  viewRepliesButton: {
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  viewRepliesText: { fontSize: 13, fontWeight: '500' },
  repliesContainer: { marginTop: 16, paddingLeft: 16, borderLeftWidth: 2 },
  replyContainer: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
  },
  replyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  replyContent: { fontSize: 14, marginBottom: 8, lineHeight: 20 },
  replyActions: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  replyingToContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 12,
  },
  replyingToText: { fontSize: 14, fontWeight: '500' },
  cancelReplyButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addCommentContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 0,
    borderTopWidth: 1,
  },
  addCommentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  commentInput: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    maxHeight: 120,
    borderWidth: 1,
  },
  commentActionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emojiRow: { flexDirection: 'row', marginTop: 12 },
  emojiButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 8,
    borderRadius: 12,
  },
  emojiText: { fontSize: 18 },
  mediaPreview: { marginBottom: 12, position: 'relative' },
  mediaPreviewImage: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  removeMediaButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: { padding: 40, alignItems: 'center', justifyContent: 'center' },
  emptyStateText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 12,
    fontWeight: '500',
  },
  emptyStateSubtext: { fontSize: 14, textAlign: 'center', marginTop: 4 },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 12,
    fontWeight: '500',
  },
  retryButton: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  retryText: { fontSize: 14, color: 'white', fontWeight: '500' },
  loadingOverlay: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  confirmModalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  confirmModal: {
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
  },
  confirmIcon: { marginBottom: 16 },
  confirmTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  confirmMessage: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  confirmButtons: { flexDirection: 'row', width: '100%', gap: 12 },
  confirmButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelButton: {},
  cancelButtonText: { fontSize: 14, fontWeight: '600' },
  deleteButton: {},
  deleteButtonText: { fontSize: 14, color: 'white', fontWeight: '600' },
});

export default CommentComponent;
