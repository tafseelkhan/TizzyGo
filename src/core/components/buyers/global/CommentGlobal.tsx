// components/CommentComponent.tsx - FULLY REDESIGNED WITH GREEN THEME & SAFEAREA

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from 'react';
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
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useUser } from '../../../contexts/auth/UserContext';
import { useTheme } from '../../../contexts/theme/ThemeContext';
import { debounce } from 'lodash';
import Icon from 'react-native-vector-icons/MaterialIcons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
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
} from '../../../../api/features/private/commentGlobalPrivateSlice';

// ============ TYPES ============
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

// ============ GREEN THEME COLORS ============
const GREEN_THEME = {
  primary: '#10B981', // Emerald Green
  primaryDark: '#059669',
  primaryLight: '#34D399',
  primaryBg: '#ECFDF5',
  primaryBgDark: '#064E3B',
  accent: '#6EE7B7',
  error: '#EF4444',
  success: '#10B981',
  warning: '#F59E0B',
};

// ============ MAIN COMPONENT ============
const CommentComponent: React.FC<{ productId: string }> = ({ productId }) => {
  console.log('💚 CommentComponent Mounted - Product ID:', productId);

  const { user, setUser } = useUser();
  const { isDark } = useTheme();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const currentUserId = user?._id ?? '';
  const isMountedRef = useRef(true);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  // ============ STATE ============
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[] | null>(null);
  const [users, setUsers] = useState<{ [key: string]: User }>({});
  const [currentUserImage, setCurrentUserImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
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
  const [isFetchingCommenters, setIsFetchingCommenters] = useState(false);

  // ============ COLORS ============
  const colors = {
    background: isDark ? '#0F172A' : '#F8FAFC',
    modalBackground: isDark ? '#1E293B' : '#FFFFFF',
    cardBackground: isDark ? '#1E293B' : '#FFFFFF',
    inputBackground: isDark ? '#334155' : '#F1F5F9',
    primaryText: isDark ? '#F1F5F9' : '#0F172A',
    secondaryText: isDark ? '#94A3B8' : '#64748B',
    placeholderText: isDark ? '#64748B' : '#94A3B8',
    border: isDark ? '#334155' : '#E2E8F0',
    primaryButton: GREEN_THEME.primary,
    secondaryButton: isDark ? '#334155' : '#F1F5F9',
    likeActive: '#EF4444',
    badgeBackground: isDark ? GREEN_THEME.primaryBgDark : GREEN_THEME.primaryBg,
    badgeText: isDark ? GREEN_THEME.primaryLight : GREEN_THEME.primary,
    hoverBackground: isDark ? '#334155' : GREEN_THEME.primaryBg,
    hoverBorder: isDark ? GREEN_THEME.primaryLight : GREEN_THEME.primary,
    error: GREEN_THEME.error,
    overlay: isDark ? 'rgba(15, 23, 42, 0.9)' : 'rgba(0, 0, 0, 0.5)',
    loadingOverlay: isDark
      ? 'rgba(15, 23, 42, 0.9)'
      : 'rgba(255, 255, 255, 0.9)',
  };

  // ============ HELPERS ============
  const getImageUrl = (image: string | undefined | null) => {
    if (!image) return 'https://via.placeholder.com/40';
    return image.startsWith('http')
      ? image
      : `http://10.141.253.121:5000${image}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const totalCommentCount = commenters.reduce(
    (sum, commenter) => sum + commenter.commentCount,
    0,
  );

  // ============ ANIMATIONS ============
  const openComments = () => {
    setShowComments(true);
    StatusBar.setBarStyle(isDark ? 'light-content' : 'dark-content');
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        damping: 25,
        mass: 1,
        stiffness: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const closeComments = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: SCREEN_HEIGHT,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowComments(false);
      StatusBar.setBarStyle('default');
    });
  };

  // ============ DATA FETCHING ============
  const fetchCurrentUserImage = useCallback(async () => {
    if (!currentUserId || !isMountedRef.current) return;
    try {
      const userData = await fetchUsersBatchAPI([currentUserId]);
      if (userData.length > 0 && isMountedRef.current) {
        setCurrentUserImage(userData[0].image || null);
      }
    } catch (err) {
      console.error('Error fetching user image:', err);
    }
  }, [currentUserId]);

  const fetchCommenters = useCallback(async () => {
    if (!productId || !isMountedRef.current) return;
    setIsFetchingCommenters(true);
    try {
      const data = await fetchCommentersAPI(productId);
      if (isMountedRef.current) setCommenters(data);
    } catch (err: any) {
      console.error('Error fetching commenters:', err);
      if (isMountedRef.current) setCommenters([]);
    } finally {
      if (isMountedRef.current) setIsFetchingCommenters(false);
    }
  }, [productId]);

  const fetchCommentsAndUsers = useCallback(async () => {
    if (!productId || !isMountedRef.current) return;
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

      if (userIds.size > 0 && isMountedRef.current) {
        const userData = await fetchUsersBatchAPI(Array.from(userIds));
        const userMap = userData.reduce(
          (map: any, user: any) => {
            if (user._id) map[user._id] = user;
            return map;
          },
          {} as { [key: string]: User },
        );
        if (isMountedRef.current) setUsers(prev => ({ ...prev, ...userMap }));
      }

      if (isMountedRef.current) {
        setComments(commentsData);
        setHasFetchedComments(true);
      }
    } catch (err: any) {
      console.error('Error fetching comments:', err);
      if (isMountedRef.current)
        setError(err.message || 'Failed to load comments');
    } finally {
      if (isMountedRef.current) setIsLoading(false);
    }
  }, [productId, users]);

  // ============ INITIAL LOAD ============
  useEffect(() => {
    isMountedRef.current = true;
    const initialFetch = async () => {
      await Promise.all([fetchCommenters(), fetchCurrentUserImage()]);
    };
    initialFetch();
    return () => {
      isMountedRef.current = false;
    };
  }, [productId]);

  useEffect(() => {
    if (showComments && !hasFetchedComments) {
      fetchCommentsAndUsers();
    }
  }, [showComments, hasFetchedComments]);

  // ============ HANDLERS ============
  const handleAddComment = useCallback(async () => {
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
      if (isMountedRef.current) {
        if (newCommentData.userId && !users[newCommentData.userId]) {
          const [userData] = await fetchUsersBatchAPI([newCommentData.userId]);
          if (userData)
            setUsers(prev => ({ ...prev, [userData._id]: userData }));
        }
        setComments(prev =>
          prev ? [newCommentData, ...prev] : [newCommentData],
        );
        setNewComment('');
        setNewCommentMedia(null);
        setNewCommentMediaType(null);
        setHasFetchedComments(false);
        fetchCommenters();
      }
    } catch (err: any) {
      console.error('Error adding comment:', err);
      if (isMountedRef.current)
        setError(err.message || 'Failed to add comment');
    } finally {
      if (isMountedRef.current) setIsLoading(false);
    }
  }, [newComment, currentUserId, productId, users, fetchCommenters]);

  const handleAddReply = useCallback(
    async (commentId: string) => {
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
        if (isMountedRef.current) {
          const newReply =
            updatedComment.replies[updatedComment.replies.length - 1];
          if (newReply?.userId && !users[newReply.userId]) {
            const [userData] = await fetchUsersBatchAPI([newReply.userId]);
            if (userData)
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
          fetchCommenters();
        }
      } catch (err: any) {
        console.error('Error adding reply:', err);
        if (isMountedRef.current)
          setError(err.message || 'Failed to add reply');
      } finally {
        if (isMountedRef.current) setIsLoading(false);
      }
    },
    [replyContent, currentUserId, users, fetchCommenters],
  );

  const toggleLike = useCallback(
    async (commentId: string) => {
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
        if (isMountedRef.current) {
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
        }
      } catch (err: any) {
        console.error('Error toggling like:', err);
        if (isMountedRef.current)
          setError(err.message || 'Failed to toggle like');
      } finally {
        if (isMountedRef.current) setIsLoading(false);
      }
    },
    [currentUserId],
  );

  const toggleReplyLike = useCallback(
    async (commentId: string, replyId: string) => {
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
        if (isMountedRef.current) {
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
                                  : reply.likes.filter(
                                      id => id !== currentUserId,
                                    ),
                              }
                            : reply,
                        ),
                      }
                    : comment,
                )
              : prev,
          );
        }
      } catch (err: any) {
        console.error('Error toggling reply like:', err);
        if (isMountedRef.current)
          setError(err.message || 'Failed to toggle reply like');
      } finally {
        if (isMountedRef.current) setIsLoading(false);
      }
    },
    [currentUserId],
  );

  const handleDelete = useCallback(async () => {
    if (!showDeleteConfirm || !currentUserId) return;
    setIsLoading(true);
    try {
      const { id, type, commentId } = showDeleteConfirm;
      if (type === 'comment') {
        await deleteCommentAPI(id);
        if (isMountedRef.current) {
          setComments(
            prev => prev?.filter(comment => comment._id !== id) || null,
          );
        }
      } else {
        await deleteReplyAPI(commentId!, id);
        if (isMountedRef.current) {
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
      }
      if (isMountedRef.current) {
        setShowDeleteConfirm(null);
        setHasFetchedComments(false);
        fetchCommenters();
      }
    } catch (err: any) {
      console.error('Error deleting:', err);
      if (isMountedRef.current) setError(err.message || 'Failed to delete');
    } finally {
      if (isMountedRef.current) setIsLoading(false);
    }
  }, [showDeleteConfirm, currentUserId, fetchCommenters]);

  // ============ NAVIGATION ============
  const handleNavigateToProfile = (userId: string | null) => {
    if (!userId) return;
    setUser({ ...user!, _id: userId });
    navigation.navigate(`account/${userId}`, { userId });
  };

  const handleNavigateToReport = (userId: string | null) => {
    if (!userId) return;
    setUser({ ...user!, _id: userId });
    navigation.navigate(`report/${userId}/users`, { userId });
  };

  const toggleReplies = (commentId: string) => {
    setShowReplies(prev => ({ ...prev, [commentId]: !prev[commentId] }));
  };

  // ============ COMMENT RENDERER ============
  const renderComment = useCallback(
    (comment: Comment) => {
      const user = comment.userId ? users[comment.userId] : null;
      const isLiked = comment.likes.includes(currentUserId);

      return (
        <View
          key={comment._id}
          style={[
            styles.commentCard,
            { backgroundColor: colors.cardBackground },
          ]}
        >
          {/* Header */}
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
              <View style={styles.userNameContainer}>
                <Text style={[styles.userName, { color: colors.primaryText }]}>
                  {user?.name ?? 'Deleted User'}
                </Text>
                <Text style={[styles.date, { color: colors.secondaryText }]}>
                  {formatDate(comment.createdAt)}
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Content */}
          {comment.content ? (
            <Text
              style={[styles.commentContent, { color: colors.primaryText }]}
            >
              {comment.content}
            </Text>
          ) : null}

          {/* Media */}
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

          {/* Actions */}
          <View
            style={[styles.commentActions, { borderTopColor: colors.border }]}
          >
            <TouchableOpacity
              onPress={() =>
                setReplyingTo(replyingTo === comment._id ? null : comment._id)
              }
              style={styles.actionButton}
            >
              <FontAwesome
                name="reply"
                size={14}
                color={colors.secondaryText}
              />
              <Text
                style={[styles.actionText, { color: colors.secondaryText }]}
              >
                Reply
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => toggleLike(comment._id)}
              style={styles.actionButton}
            >
              <FontAwesome
                name={isLiked ? 'heart' : 'heart-o'}
                size={14}
                color={isLiked ? colors.likeActive : colors.secondaryText}
              />
              {comment.likes.length > 0 && (
                <Text
                  style={[styles.likeCount, { color: colors.secondaryText }]}
                >
                  {comment.likes.length}
                </Text>
              )}
            </TouchableOpacity>

            {currentUserId === comment.userId && (
              <TouchableOpacity
                onPress={() =>
                  setShowDeleteConfirm({ id: comment._id, type: 'comment' })
                }
                style={styles.actionButton}
              >
                <FontAwesome name="trash-o" size={14} color={colors.error} />
              </TouchableOpacity>
            )}

            <TouchableOpacity
              onPress={() => handleNavigateToReport(comment.userId)}
              style={styles.actionButton}
            >
              <FontAwesome
                name="flag-o"
                size={14}
                color={colors.secondaryText}
              />
            </TouchableOpacity>
          </View>

          {/* Replies Toggle */}
          {comment.replies.length > 0 && (
            <TouchableOpacity
              onPress={() => toggleReplies(comment._id)}
              style={[
                styles.viewRepliesButton,
                { backgroundColor: colors.badgeBackground },
              ]}
            >
              <Text
                style={[styles.viewRepliesText, { color: colors.badgeText }]}
              >
                {showReplies[comment._id]
                  ? 'Hide Replies'
                  : `View ${comment.replies.length} Replies`}
              </Text>
            </TouchableOpacity>
          )}

          {/* Replies List */}
          {showReplies[comment._id] && comment.replies.length > 0 && (
            <View
              style={[
                styles.repliesContainer,
                { borderLeftColor: colors.border },
              ]}
            >
              {comment.replies.map(reply => {
                const replyUser = reply.userId ? users[reply.userId] : null;
                const isReplyLiked = reply.likes.includes(currentUserId);

                return (
                  <View
                    key={reply._id}
                    style={[
                      styles.replyCard,
                      { backgroundColor: colors.cardBackground },
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
                        <View style={styles.userNameContainer}>
                          <Text
                            style={[
                              styles.userName,
                              { color: colors.primaryText },
                            ]}
                          >
                            {replyUser?.name ?? 'Deleted User'}
                          </Text>
                          <Text
                            style={[
                              styles.date,
                              { color: colors.secondaryText },
                            ]}
                          >
                            {formatDate(reply.createdAt)}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    </View>

                    {reply.content && (
                      <Text
                        style={[
                          styles.replyContent,
                          { color: colors.primaryText },
                        ]}
                      >
                        {reply.content}
                      </Text>
                    )}

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
                      </View>
                    )}

                    <View style={styles.replyActions}>
                      <TouchableOpacity
                        onPress={() => toggleReplyLike(comment._id, reply._id)}
                        style={styles.actionButton}
                      >
                        <FontAwesome
                          name={isReplyLiked ? 'heart' : 'heart-o'}
                          size={12}
                          color={
                            isReplyLiked
                              ? colors.likeActive
                              : colors.secondaryText
                          }
                        />
                        {reply.likes.length > 0 && (
                          <Text
                            style={[
                              styles.likeCount,
                              { color: colors.secondaryText },
                            ]}
                          >
                            {reply.likes.length}
                          </Text>
                        )}
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
                          style={styles.actionButton}
                        >
                          <FontAwesome
                            name="trash-o"
                            size={12}
                            color={colors.error}
                          />
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      );
    },
    [
      users,
      currentUserId,
      replyingTo,
      showReplies,
      colors,
      toggleLike,
      toggleReplyLike,
    ],
  );

  // ============ RENDER ============
  return (
    <View style={styles.container}>
      {/* Comment Button */}
      <TouchableOpacity
        onPress={openComments}
        style={styles.commentButton}
        activeOpacity={0.8}
      >
        <FontAwesome
          name="comment-o"
          size={20}
          color={
            totalCommentCount > 0 ? GREEN_THEME.primary : colors.secondaryText
          }
        />
        {totalCommentCount > 0 && (
          <View
            style={[
              styles.commentBadge,
              { backgroundColor: GREEN_THEME.primary },
            ]}
          >
            <Text style={styles.commentBadgeText}>{totalCommentCount}</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Comments Modal - Bottom Sheet Style */}
      <Modal
        visible={showComments}
        animationType="none"
        transparent={true}
        statusBarTranslucent={true}
        onRequestClose={closeComments}
      >
        <SafeAreaView style={styles.modalSafeArea}>
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
                  {/* Drag Handle */}
                  <View style={styles.dragHandleContainer}>
                    <View
                      style={[
                        styles.dragHandle,
                        { backgroundColor: colors.border },
                      ]}
                    />
                  </View>

                  {/* Header */}
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
                            { backgroundColor: GREEN_THEME.primaryBg },
                          ]}
                        >
                          <Text
                            style={[
                              styles.totalCommentsText,
                              { color: GREEN_THEME.primary },
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
                      <FontAwesome
                        name="times"
                        size={20}
                        color={colors.secondaryText}
                      />
                    </TouchableOpacity>
                  </View>

                  {/* Comments List */}
                  <ScrollView
                    style={styles.commentsList}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.commentsListContent}
                  >
                    {comments === null && !error && (
                      <View style={styles.emptyState}>
                        <ActivityIndicator
                          size="large"
                          color={GREEN_THEME.primary}
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
                        <FontAwesome
                          name="exclamation-triangle"
                          size={48}
                          color={colors.error}
                        />
                        <Text
                          style={[styles.errorText, { color: colors.error }]}
                        >
                          {error}
                        </Text>
                        <TouchableOpacity
                          onPress={() => {
                            setHasFetchedComments(false);
                            fetchCommentsAndUsers();
                          }}
                          style={[
                            styles.retryButton,
                            { backgroundColor: GREEN_THEME.primary },
                          ]}
                        >
                          <Text style={styles.retryText}>Retry</Text>
                        </TouchableOpacity>
                      </View>
                    )}

                    {comments && comments.length === 0 && (
                      <View style={styles.emptyState}>
                        <FontAwesome
                          name="comment-o"
                          size={48}
                          color={colors.border}
                        />
                        <Text
                          style={[
                            styles.emptyStateText,
                            { color: colors.primaryText },
                          ]}
                        >
                          No comments yet
                        </Text>
                        <Text
                          style={[
                            styles.emptyStateSubtext,
                            { color: colors.secondaryText },
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

                  {/* Input Area */}
                  <SafeAreaView
                    style={{ backgroundColor: colors.modalBackground }}
                  >
                    <View
                      style={[
                        styles.inputContainer,
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
                            { backgroundColor: GREEN_THEME.primaryBg },
                          ]}
                        >
                          <Text
                            style={[
                              styles.replyingToText,
                              { color: GREEN_THEME.primary },
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
                            <FontAwesome
                              name="times"
                              size={12}
                              color={colors.secondaryText}
                            />
                          </TouchableOpacity>
                        </View>
                      )}

                      <View style={styles.inputRow}>
                        <Image
                          source={{ uri: getImageUrl(currentUserImage) }}
                          style={styles.inputAvatar}
                          defaultSource={{
                            uri: 'https://via.placeholder.com/36',
                          }}
                        />
                        <TextInput
                          value={replyingTo ? replyContent : newComment}
                          onChangeText={
                            replyingTo ? setReplyContent : setNewComment
                          }
                          placeholder={
                            replyingTo
                              ? 'Write a reply...'
                              : 'Write a comment...'
                          }
                          placeholderTextColor={colors.placeholderText}
                          style={[
                            styles.inputField,
                            {
                              backgroundColor: colors.inputBackground,
                              borderColor: colors.border,
                              color: colors.primaryText,
                            },
                          ]}
                          multiline
                          maxLength={500}
                        />
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
                            {
                              backgroundColor: (
                                replyingTo
                                  ? (replyContent.trim() || replyMedia) &&
                                    currentUserId
                                  : (newComment.trim() || newCommentMedia) &&
                                    currentUserId
                              )
                                ? GREEN_THEME.primary
                                : colors.secondaryButton,
                            },
                          ]}
                        >
                          <FontAwesome
                            name="send"
                            size={16}
                            color={
                              (
                                replyingTo
                                  ? (replyContent.trim() || replyMedia) &&
                                    currentUserId
                                  : (newComment.trim() || newCommentMedia) &&
                                    currentUserId
                              )
                                ? 'white'
                                : colors.placeholderText
                            }
                          />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </SafeAreaView>
                </View>
              </Animated.View>
            </KeyboardAvoidingView>
          </Animated.View>
        </SafeAreaView>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={!!showDeleteConfirm}
        transparent={true}
        animationType="fade"
        statusBarTranslucent={true}
        onRequestClose={() => setShowDeleteConfirm(null)}
      >
        <SafeAreaView style={styles.confirmModalSafeArea}>
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
              <View
                style={[
                  styles.confirmIconContainer,
                  { backgroundColor: `${GREEN_THEME.error}15` },
                ]}
              >
                <FontAwesome
                  name="exclamation-triangle"
                  size={36}
                  color={colors.error}
                />
              </View>
              <Text
                style={[styles.confirmTitle, { color: colors.primaryText }]}
              >
                Delete {showDeleteConfirm?.type}?
              </Text>
              <Text
                style={[styles.confirmMessage, { color: colors.secondaryText }]}
              >
                This action cannot be undone. Are you sure you want to delete
                this {showDeleteConfirm?.type}?
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

// ============ STYLES ============
const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  // Comment Button
  commentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: 44,
    height: 44,
    borderRadius: 22,
    position: 'relative',
  },
  commentBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  commentBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  // Modal
  modalSafeArea: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  modalContentContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '92%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 20,
    flex: 1,
  },
  dragHandleContainer: {
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 4,
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  modalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  totalCommentsBadge: {
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 12,
  },
  totalCommentsText: {
    fontSize: 12,
    fontWeight: '600',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  commentsList: {
    flex: 1,
  },
  commentsListContent: {
    flexGrow: 1,
    paddingBottom: 8,
  },
  commentsContainer: {
    padding: 16,
  },
  // Comment Card
  commentCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
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
    marginBottom: 10,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  userNameContainer: {
    flex: 1,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  smallAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
  },
  date: {
    fontSize: 11,
    fontWeight: '500',
  },
  commentContent: {
    fontSize: 15,
    marginBottom: 10,
    lineHeight: 22,
  },
  mediaContainer: {
    marginBottom: 10,
    position: 'relative',
  },
  imageMedia: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  gifMedia: {
    width: '100%',
    height: 120,
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
  gifText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  commentActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderRadius: 6,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '500',
  },
  likeCount: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 2,
  },
  viewRepliesButton: {
    marginTop: 10,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  viewRepliesText: {
    fontSize: 12,
    fontWeight: '500',
  },
  repliesContainer: {
    marginTop: 12,
    paddingLeft: 12,
    borderLeftWidth: 2,
  },
  replyCard: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  replyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  replyContent: {
    fontSize: 14,
    marginBottom: 6,
    lineHeight: 20,
  },
  replyActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  // Input
  inputContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 8 : 12,
    borderTopWidth: 1,
  },
  replyingToContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 10,
  },
  replyingToText: {
    fontSize: 13,
    fontWeight: '500',
  },
  cancelReplyButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
  },
  inputAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  inputField: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 10,
    fontSize: 14,
    maxHeight: 100,
    borderWidth: 1,
    minHeight: 40,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
  // Empty State
  emptyState: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 12,
    fontWeight: '500',
  },
  emptyStateSubtext: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 4,
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 12,
    fontWeight: '500',
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: {
    fontSize: 14,
    color: 'white',
    fontWeight: '500',
  },
  // Confirm Modal
  confirmModalSafeArea: {
    flex: 1,
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
    maxWidth: 340,
    alignItems: 'center',
  },
  confirmIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
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
  confirmButtons: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelButton: {},
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  deleteButton: {},
  deleteButtonText: {
    fontSize: 14,
    color: 'white',
    fontWeight: '600',
  },
});

export default CommentComponent;
