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
  Alert,
  Animated,
  Dimensions,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  useColorScheme,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useUser } from '../../contexts/auth/UserContext';
import { useTheme } from '../../contexts/theme/ThemeContext';
import { debounce } from 'lodash';
import Icon from 'react-native-vector-icons/FontAwesome';

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

// Define navigation param types
type RootStackParamList = {
  'account/:userId': { userId: string };
  'report/:userId/users': { userId: string };
  [key: string]: any;
};

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const CommentComponent: React.FC<{ productId: string }> = ({ productId }) => {
  console.log('🔵 CommentComponent Mounted - Product ID:', productId);
  
  const { user, setUser } = useUser();
  const { theme, isDark, resolvedTheme } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  
  const currentUserId = user?._id ?? '';
  console.log('👤 Current User ID:', currentUserId);
  
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[] | null>(null);
  const [users, setUsers] = useState<{ [key: string]: User }>({});
  const [currentUserImage, setCurrentUserImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingCommenters, setIsFetchingCommenters] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [newCommentMedia, setNewCommentMedia] = useState<string | null>(null);
  const [newCommentMediaType, setNewCommentMediaType] = useState<'image' | 'gif' | null>(null);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [replyMedia, setReplyMedia] = useState<string | null>(null);
  const [replyMediaType, setReplyMediaType] = useState<'image' | 'gif' | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<{
    id: string;
    type: 'comment' | 'reply';
    commentId?: string;
  } | null>(null);
  const [showReplies, setShowReplies] = useState<{ [key: string]: boolean }>({});
  const [commenters, setCommenters] = useState<Commenter[]>([]);
  const [hasFetchedComments, setHasFetchedComments] = useState(false);
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [hoveredComment, setHoveredComment] = useState<string | null>(null);
  const [hoveredReply, setHoveredReply] = useState<string | null>(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const suggestedEmojis = [
    '😊', '👍', '🔥', '❤️', '😂', '😍', '😡', '😢', '😱', '💔',
    '🎉', '👏', '🙏', '🤔', '😴', '🤮', '🥰', '🤯', '🥳', '🤬',
    '💯', '✨', '🌟', '😎', '🙌', '💥', '🎶', '🍀', '🌈', '☀️',
    '🌙', '⭐', '⚡', '💫', '🍎', '🍕', '🍔', '🍟', '🌮', '🍣',
    '🍩', '🍪', '☕', '🍺', '🍷', '🏆', '🎁', '📚', '✈️', '🚗',
    '🏠', '💼', '📱', '💻', '🎮', '⚽', '🏀', '🎲', '🎯', '🎬',
    '🎨', '🎤', '🎧', '📸', '📹', '🎥', '🖼️', '📺', '📻',
  ];

  const backendBaseUrl = 'http://192.168.42.121:5000';
  const FETCH_TIMEOUT = 10000;

  // ✅ DARK MODE COLORS
  const colors = {
    background: isDark ? '#00000000' : '#FFFFFF',
    modalBackground: isDark ? '#1E293B' : '#FFFFFF',
    cardBackground: isDark ? '#00000000' : '#FFFFFF',
    inputBackground: isDark ? '#475569' : '#ffffff',
    primaryText: isDark ? '#F1F5F9' : '#1F2937',
    secondaryText: isDark ? '#94A3B8' : '#6B7280',
    placeholderText: isDark ? '#64748B' : '#9CA3AF',
    border: isDark ? '#475569' : '#E5E7EB',
    lightBorder: isDark ? '#334155' : '#F3F4F6',
    primaryButton: isDark ? '#3B82F6' : '#3B82F6',
    primaryButtonText: isDark ? '#FFFFFF' : '#FFFFFF',
    secondaryButton: isDark ? '#475569' : '#F3F4F6',
    secondaryButtonText: isDark ? '#94A3B8' : '#6B7280',
    likeActive: '#EF4444',
    badgeBackground: isDark ? '#1D4ED8' : '#E0E7FF',
    badgeText: isDark ? '#93C5FD' : '#3B82F6',
    hoverBackground: isDark ? '#475569' : '#F0F9FF',
    hoverBorder: isDark ? '#60A5FA' : '#3B82F6',
    error: '#EF4444',
    success: '#10B981',
    warning: '#F59E0B',
    info: '#3B82F6',
    overlay: isDark ? 'rgba(0, 0, 0, 0.7)' : 'rgba(0, 0, 0, 0.5)',
    loadingOverlay: isDark ? 'rgba(15, 23, 42, 0.9)' : 'rgb(255, 255, 255)',
  };

  // Hover animations
  const handleHoverIn = (type: 'comment' | 'reply', id: string) => {
    console.log('🖱️ Hover In:', type, id);
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
    console.log('🖱️ Hover Out');
    setHoveredComment(null);
    setHoveredReply(null);
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  // Get auth token from storage
  const getAuthToken = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      console.log('🔐 Auth Token Retrieved:', token ? `Length: ${token.length}` : 'No token');
      return token || '';
    } catch (error) {
      console.error('🔐 Error getting auth token:', error);
      return '';
    }
  }, []);

  const getImageUrl = (image: string | undefined | null) => {
    if (!image) {
      console.log('🖼️ No image provided, using placeholder');
      return 'https://via.placeholder.com/40';
    }
    
    const url = image.startsWith('http') ? image : `${backendBaseUrl}${image}`;
    console.log('🖼️ Generated Image URL:', url);
    return url;
  };

  const totalCommentCount = commenters.reduce(
    (sum, commenter) => sum + commenter.commentCount,
    0
  );
  console.log('📊 Total Comment Count:', totalCommentCount);

  // Animation functions
  const openComments = () => {
    console.log('📖 Opening Comments Modal');
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
    console.log('❌ Closing Comments Modal');
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
    if (!currentUserId) {
      console.log('❌ No current user ID, skipping fetch');
      return;
    }
    
    console.log('🔄 Fetching current user image...');
    try {
      const authToken = await getAuthToken();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

      const res = await fetch(`${backendBaseUrl}/api/profile/users/batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ userIds: [currentUserId] }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      if (res.ok) {
        const [userData] = await res.json();
        console.log('✅ Current user image fetched:', userData.image);
        setCurrentUserImage(userData.image || null);
      } else {
        console.log('❌ Failed to fetch current user image, status:', res.status);
        setCurrentUserImage(null);
      }
    } catch (err) {
      console.error('💥 Error fetching current user image:', err);
      setCurrentUserImage(null);
    }
  }, [currentUserId, getAuthToken]);

  const debouncedFetchCommenters = useCallback(
    debounce(async () => {
      console.log('🔄 Fetching commenters...');
      setIsFetchingCommenters(true);
      try {
        const authToken = await getAuthToken();
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

        const res = await fetch(
          `${backendBaseUrl}/api/comments/comments/unique-user-count/${productId}`,
          {
            headers: { Authorization: `Bearer ${authToken}` },
            signal: controller.signal,
          }
        );

        clearTimeout(timeoutId);
        if (!res.ok) {
          const errorText = await res.text();
          console.error('❌ Failed to fetch commenters:', res.status, errorText);
          throw new Error(
            `Failed to fetch commenters: ${res.status} ${errorText}`
          );
        }

        const data: Commenter[] = await res.json();
        console.log('✅ Commenters fetched:', data.length);
        setCommenters(data);

        setUsers((prev) => {
          const newUsers = data.reduce((map, commenter) => {
            if (
              commenter.userId &&
              commenter.userName !== 'Deleted User' &&
              !prev[commenter.userId]
            ) {
              map[commenter.userId] = {
                _id: commenter.userId,
                name: commenter.userName,
                image: commenter.userImage || 'https://via.placeholder.com/40',
              };
            }
            return map;
          }, {} as { [key: string]: User });
          console.log('👥 New users added:', Object.keys(newUsers).length);
          return { ...prev, ...newUsers };
        });
      } catch (err: any) {
        console.error('💥 Error in fetchCommenters:', err);
        if (err.name === 'AbortError') {
          console.log('⏰ Request timed out');
          setError('Request timed out while fetching commenters.');
        } else if (err.message.includes('401')) {
          console.log('🔒 Unauthorized');
          setError('Unauthorized. Please log in again.');
        } else if (err.message.includes('429')) {
          console.log('🔄 Too many requests');
          setError('Too many requests. Please wait and try again.');
        } else {
          setError('Failed to load commenters. Please try again.');
        }
        setCommenters([]);
      } finally {
        setIsFetchingCommenters(false);
        console.log('✅ Commenters fetch complete');
      }
    }, 500),
    [productId, getAuthToken]
  );

  const fetchCommentsAndUsers = useCallback(async () => {
    console.log('🔄 Fetching comments and users...');
    setError(null);
    setIsLoading(true);
    try {
      const authToken = await getAuthToken();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

      const commentsRes = await fetch(
        `${backendBaseUrl}/api/comments/post/${productId}`,
        {
          headers: { Authorization: `Bearer ${authToken}` },
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);
      if (!commentsRes.ok) {
        const errorText = await commentsRes.text();
        console.error('❌ Failed to fetch comments:', commentsRes.status, errorText);
        throw new Error(
          `Failed to fetch comments: ${commentsRes.status} ${errorText}`
        );
      }

      const commentsData: Comment[] = await commentsRes.json();
      console.log('✅ Comments fetched:', commentsData.length);
      
      const userIds = new Set<string>();
      commentsData.forEach((comment) => {
        if (comment.userId && !users[comment.userId]) userIds.add(comment.userId);
        comment.replies.forEach((reply) => {
          if (reply.userId && !users[reply.userId]) userIds.add(reply.userId);
        });
      });
      
      console.log('👥 Unique user IDs to fetch:', userIds.size);

      let userData: User[] = [];
      if (userIds.size > 0) {
        const usersController = new AbortController();
        const usersTimeoutId = setTimeout(
          () => usersController.abort(),
          FETCH_TIMEOUT
        );

        const usersRes = await fetch(
          `${backendBaseUrl}/api/profile/users/batch`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${authToken}`,
            },
            body: JSON.stringify({ userIds: Array.from(userIds) }),
            signal: usersController.signal,
          }
        );

        clearTimeout(usersTimeoutId);
        if (!usersRes.ok) {
          const errorText = await usersRes.text();
          console.error('❌ Failed to fetch users:', usersRes.status, errorText);
          throw new Error(
            `Failed to fetch users: ${usersRes.status} ${errorText}`
          );
        }

        userData = await usersRes.json();
        console.log('✅ Users fetched:', userData.length);
      }

      setUsers((prev) => {
        const userMap = userData.reduce((map, user) => {
          if (!prev[user._id]) map[user._id] = user;
          return map;
        }, {} as { [key: string]: User });
        console.log('👥 Total users after merge:', Object.keys({...prev, ...userMap}).length);
        return { ...prev, ...userMap };
      });

      setComments(commentsData);
      setHasFetchedComments(true);
      console.log('✅ Comments and users fetch complete');
    } catch (err: any) {
      console.error('💥 Error in fetchCommentsAndUsers:', err);
      if (err.name === 'AbortError') {
        console.log('⏰ Request timed out');
        setError('Request timed out while fetching comments.');
      } else if (err.message.includes('401')) {
        console.log('🔒 Unauthorized');
        setError('Unauthorized. Please log in again.');
      } else if (err.message.includes('429')) {
        console.log('🔄 Too many requests');
        setError('Too many requests. Please wait and try again.');
      } else {
        setError(`Failed to load comments or user data: ${err.message}`);
      }
    } finally {
      setIsLoading(false);
      console.log('🔄 Loading state set to false');
    }
  }, [productId, getAuthToken, users]);

  // Handle comment submission
  const handleAddComment = async () => {
    console.log('➕ Adding comment...');
    console.log('📝 Comment text:', newComment);
    console.log('👤 Current user:', currentUserId);
    
    if ((!newComment.trim() && !newCommentMedia) || !currentUserId) {
      console.log('❌ Validation failed: No content or user');
      setError('Please add a comment');
      return;
    }
    
    setIsLoading(true);
    try {
      const authToken = await getAuthToken();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

      const bodyData: any = {
        postId: productId,
        content: newComment.trim(),
        userId: currentUserId,
      };

      if (newCommentMedia) {
        bodyData.media = newCommentMedia;
        bodyData.mediaType = newCommentMediaType;
      }

      console.log('📦 Request body:', bodyData);

      const res = await fetch(`${backendBaseUrl}/api/comments/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(bodyData),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      if (res.ok) {
        const newCommentData: Comment = await res.json();
        console.log('✅ Comment added successfully:', newCommentData._id);
        
        if (newCommentData.userId && !users[newCommentData.userId]) {
          console.log('👤 Fetching new commenter info...');
          const userController = new AbortController();
          const userTimeoutId = setTimeout(
            () => userController.abort(),
            FETCH_TIMEOUT
          );

          const userRes = await fetch(
            `${backendBaseUrl}/api/profile/users/batch`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${authToken}`,
              },
              body: JSON.stringify({ userIds: [newCommentData.userId] }),
              signal: userController.signal,
            }
          );

          clearTimeout(userTimeoutId);
          if (userRes.ok) {
            const [userData] = await userRes.json();
            console.log('👤 New user data fetched:', userData.name);
            setUsers((prev) => ({ ...prev, [userData._id]: userData }));
          }
        }
        
        setComments((prev) =>
          prev ? [newCommentData, ...prev] : [newCommentData]
        );
        console.log('💬 Comments updated, new count:', comments ? comments.length + 1 : 1);
        
        setNewComment('');
        setNewCommentMedia(null);
        setNewCommentMediaType(null);
        setHasFetchedComments(false);
        debouncedFetchCommenters();
      } else {
        const errorText = await res.text();
        console.error('❌ Failed to add comment:', res.status, errorText);
        throw new Error(`Failed to add comment: ${res.status} ${errorText}`);
      }
    } catch (err: any) {
      console.error('💥 Error adding comment:', err);
      setError(`Failed to add comment: ${err.message}`);
    } finally {
      setIsLoading(false);
      console.log('🔄 Loading state set to false');
    }
  };

  // Handle reply submission
  const handleAddReply = async (commentId: string) => {
    console.log('💬 Adding reply to comment:', commentId);
    console.log('📝 Reply text:', replyContent);
    
    if ((!replyContent.trim() && !replyMedia) || !currentUserId) {
      console.log('❌ Validation failed: No content or user');
      setError('Please add a reply');
      return;
    }
    setIsLoading(true);
    try {
      const authToken = await getAuthToken();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

      const bodyData: any = {
        content: replyContent.trim(),
        userId: currentUserId,
      };

      if (replyMedia) {
        bodyData.media = replyMedia;
        bodyData.mediaType = replyMediaType;
      }

      console.log('📦 Reply request body:', bodyData);

      const res = await fetch(
        `${backendBaseUrl}/api/comments/reply/${commentId}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify(bodyData),
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);
      if (res.ok) {
        const updatedComment: Comment = await res.json();
        console.log('✅ Reply added successfully');
        
        const newReply =
          updatedComment.replies[updatedComment.replies.length - 1];
        if (newReply.userId && !users[newReply.userId]) {
          console.log('👤 Fetching new reply user info...');
          const userController = new AbortController();
          const userTimeoutId = setTimeout(
            () => userController.abort(),
            FETCH_TIMEOUT
          );

          const userRes = await fetch(
            `${backendBaseUrl}/api/profile/users/batch`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${authToken}`,
              },
              body: JSON.stringify({ userIds: [newReply.userId] }),
              signal: userController.signal,
            }
          );

          clearTimeout(userTimeoutId);
          if (userRes.ok) {
            const [userData] = await userRes.json();
            console.log('👤 New reply user data:', userData.name);
            setUsers((prev) => ({ ...prev, [userData._id]: userData }));
          }
        }
        
        setComments((prev) =>
          prev
            ? prev.map((comment) =>
                comment._id === commentId
                  ? { ...comment, replies: updatedComment.replies }
                  : comment
              )
            : prev
        );
        
        setReplyingTo(null);
        setReplyContent('');
        setReplyMedia(null);
        setReplyMediaType(null);
        setHasFetchedComments(false);
        debouncedFetchCommenters();
        console.log('💬 Reply added and state cleared');
      } else {
        const errorText = await res.text();
        console.error('❌ Failed to add reply:', res.status, errorText);
        throw new Error(`Failed to add reply: ${res.status} ${errorText}`);
      }
    } catch (err: any) {
      console.error('💥 Error adding reply:', err);
      setError(`Failed to add reply: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Like functions
  const toggleLike = async (commentId: string) => {
    console.log('❤️ Toggling like for comment:', commentId);
    if (!currentUserId) {
      console.log('❌ No user logged in');
      setError('Please log in to like a comment.');
      return;
    }
    setIsLoading(true);
    try {
      const authToken = await getAuthToken();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

      const res = await fetch(
        `${backendBaseUrl}/api/comments/like/${commentId}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({ userId: currentUserId }),
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);
      if (res.ok) {
        const { likesCount, likedByCurrentUser } = await res.json();
        console.log('❤️ Like toggled:', likedByCurrentUser, 'Total likes:', likesCount);
        
        setComments((prev) =>
          prev
            ? prev.map((comment) =>
                comment._id === commentId
                  ? {
                      ...comment,
                      likes: likedByCurrentUser
                        ? [...comment.likes, currentUserId]
                        : comment.likes.filter((id) => id !== currentUserId),
                    }
                  : comment
              )
            : prev
        );
      } else {
        const errorText = await res.text();
        console.error('❌ Failed to toggle like:', res.status, errorText);
        throw new Error(`Failed to toggle like: ${res.status} ${errorText}`);
      }
    } catch (err: any) {
      console.error('💥 Error toggling like:', err);
      setError(`Failed to toggle like: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleReplyLike = async (commentId: string, replyId: string) => {
    console.log('❤️ Toggling like for reply:', replyId, 'in comment:', commentId);
    if (!currentUserId) {
      console.log('❌ No user logged in');
      setError('Please log in to like a reply.');
      return;
    }
    setIsLoading(true);
    try {
      const authToken = await getAuthToken();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

      const res = await fetch(
        `${backendBaseUrl}/api/comments/like-reply/${commentId}/${replyId}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({ userId: currentUserId }),
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);
      if (res.ok) {
        const { likesCount, likedByCurrentUser } = await res.json();
        console.log('❤️ Reply like toggled:', likedByCurrentUser, 'Total likes:', likesCount);
        
        setComments((prev) =>
          prev
            ? prev.map((comment) =>
                comment._id === commentId
                  ? {
                      ...comment,
                      replies: comment.replies.map((reply) =>
                        reply._id === replyId
                          ? {
                              ...reply,
                              likes: likedByCurrentUser
                                ? [...reply.likes, currentUserId]
                                : reply.likes.filter(
                                    (id) => id !== currentUserId
                                  ),
                            }
                          : reply
                      ),
                    }
                  : comment
              )
            : prev
        );
      } else {
        const errorText = await res.text();
        console.error('❌ Failed to toggle reply like:', res.status, errorText);
        throw new Error(
          `Failed to toggle reply like: ${res.status} ${errorText}`
        );
      }
    } catch (err: any) {
      console.error('💥 Error toggling reply like:', err);
      setError(`Failed to toggle reply like: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Delete function
  const handleDelete = async () => {
    if (!showDeleteConfirm || !currentUserId) {
      console.log('❌ No delete confirmation or user');
      return;
    }
    
    console.log('🗑️ Deleting:', showDeleteConfirm.type, showDeleteConfirm.id);
    setIsLoading(true);
    try {
      const authToken = await getAuthToken();
      const { id, type, commentId } = showDeleteConfirm;
      const url =
        type === 'comment'
          ? `${backendBaseUrl}/api/comments/delete/${id}`
          : `${backendBaseUrl}/api/comments/delete-reply/${commentId}/${id}`;

      console.log('🗑️ Delete URL:', url);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

      const res = await fetch(url, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${authToken}` },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      if (res.ok) {
        console.log('✅ Delete successful');
        if (type === 'comment') {
          setComments(
            (prev) => prev?.filter((comment) => comment._id !== id) || null
          );
          console.log('💬 Comment removed from state');
        } else {
          setComments((prev) =>
            prev
              ? prev.map((comment) =>
                  comment._id === commentId
                    ? {
                        ...comment,
                        replies: comment.replies.filter(
                          (reply) => reply._id !== id
                        ),
                      }
                    : comment
                )
              : prev
          );
          console.log('💬 Reply removed from state');
        }
        setShowDeleteConfirm(null);
        setHasFetchedComments(false);
        debouncedFetchCommenters();
      } else {
        const errorText = await res.text();
        console.error('❌ Delete failed:', res.status, errorText);
        throw new Error(`Failed to delete ${type}: ${res.status} ${errorText}`);
      }
    } catch (err: any) {
      console.error('💥 Error deleting:', err);
      setError(`Failed to delete ${showDeleteConfirm?.type}: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNavigateToProfile = (userId: string | null) => {
    console.log('👤 Navigating to profile:', userId);
    if (!userId) {
      console.log('❌ Cannot navigate: User ID is missing.');
      setError('Cannot navigate: User ID is missing.');
      return;
    }
    setUser({ ...user!, _id: userId });
    navigation.navigate(`account/${userId}`, { userId });
  };

  const handleNavigateToReport = (userId: string | null) => {
    console.log('⚠️ Navigating to report:', userId);
    if (!userId) {
      console.log('❌ Cannot navigate: User ID is missing.');
      setError('Cannot navigate: User ID is missing.');
      return;
    }
    setUser({ ...user!, _id: userId });
    navigation.navigate(`report/${userId}/users`, { userId });
  };

  const toggleReplies = (commentId: string) => {
    const newState = !showReplies[commentId];
    console.log('💬 Toggling replies for comment:', commentId, 'New state:', newState);
    setShowReplies((prev) => ({ ...prev, [commentId]: newState }));
  };

  const handleEmojiClick = (emoji: string, inputType: 'comment' | 'reply') => {
    console.log('😊 Emoji clicked:', emoji, 'for', inputType);
    if (inputType === 'comment') {
      setNewComment((prev) => prev + emoji);
    } else {
      setReplyContent((prev) => prev + emoji);
    }
  };

  const removeMedia = (type: 'comment' | 'reply') => {
    console.log('🗑️ Removing media from:', type);
    if (type === 'comment') {
      setNewCommentMedia(null);
      setNewCommentMediaType(null);
    } else {
      setReplyMedia(null);
      setReplyMediaType(null);
    }
  };

  useEffect(() => {
    console.log('🔵 useEffect - Initial fetch');
    debouncedFetchCommenters();
    if (showComments && !hasFetchedComments) {
      fetchCommentsAndUsers();
    }
    return () => {
      console.log('🔴 Cleanup - Cancelling debounced fetch');
      debouncedFetchCommenters.cancel();
    };
  }, [
    productId,
    getAuthToken,
    debouncedFetchCommenters,
    showComments,
    hasFetchedComments,
  ]);

  useEffect(() => {
    console.log('🔵 useEffect - Fetch current user image');
    fetchCurrentUserImage();
  }, [fetchCurrentUserImage]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const renderComment = (comment: Comment) => {
    const user = comment.userId ? users[comment.userId] : null;
    const isHovered = hoveredComment === comment._id;
    
    console.log('💬 Rendering comment:', comment._id, 'User:', user?.name);
    
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
            { transform: [{ scale: isHovered ? 1.02 : 1 }] }
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
            <Text style={[styles.commentContent, { color: colors.primaryText }]}>
              {comment.content}
            </Text>
          ) : null}

          {comment.media && (
            <View style={styles.mediaContainer}>
              <Image
                source={{ uri: getImageUrl(comment.media) }}
                style={comment.mediaType === 'gif' ? styles.gifMedia : styles.imageMedia}
                resizeMode="contain"
              />
              {comment.mediaType === 'gif' && (
                <View style={styles.gifBadge}>
                  <Text style={styles.gifText}>GIF</Text>
                </View>
              )}
            </View>
          )}

          <View style={[styles.commentActions, { borderTopColor: colors.border }]}>
            <TouchableOpacity
              onPress={() => setReplyingTo(replyingTo === comment._id ? null : comment._id)}
              style={[styles.actionButton, isHovered && { backgroundColor: colors.secondaryButton }]}
            >
              <Icon name="reply" size={12} color={colors.secondaryText} />
              <Text style={[styles.actionText, { color: colors.secondaryText }]}>Reply</Text>
            </TouchableOpacity>

            {currentUserId === comment.userId && (
              <TouchableOpacity
                onPress={() => setShowDeleteConfirm({
                  id: comment._id,
                  type: 'comment',
                })}
                style={[styles.actionButton, isHovered && { backgroundColor: colors.secondaryButton }]}
              >
                <Icon name="trash" size={12} color={colors.secondaryText} />
              </TouchableOpacity>
            )}

            <TouchableOpacity
              onPress={() => handleNavigateToReport(comment.userId)}
              style={[styles.actionButton, isHovered && { backgroundColor: colors.secondaryButton }]}
            >
              <Icon name="exclamation-circle" size={12} color={colors.secondaryText} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => toggleLike(comment._id)}
              style={[styles.actionButton, isHovered && { backgroundColor: colors.secondaryButton }]}
            >
              <Icon
                name={comment.likes.includes(currentUserId) ? "heart" : "heart-o"}
                size={12}
                color={comment.likes.includes(currentUserId) ? colors.likeActive : colors.secondaryText}
              />
              <Text style={[styles.likeCount, { color: colors.secondaryText }]}>
                {comment.likes.length}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Replies Section */}
          {comment.replies.length > 0 && (
            <TouchableOpacity
              onPress={() => toggleReplies(comment._id)}
              style={[
                styles.viewRepliesButton, 
                { backgroundColor: colors.secondaryButton },
                isHovered && { backgroundColor: colors.badgeBackground }
              ]}
            >
              <Text style={[styles.viewRepliesText, { color: colors.badgeText }]}>
                {showReplies[comment._id]
                  ? 'Hide Replies'
                  : `View Replies (${comment.replies.length})`}
              </Text>
            </TouchableOpacity>
          )}

          {/* Replies List */}
          {showReplies[comment._id] && comment.replies.length > 0 && (
            <View style={[styles.repliesContainer, { borderLeftColor: colors.border }]}>
              {comment.replies.map((reply) => {
                const replyUser = reply.userId ? users[reply.userId] : null;
                const isReplyHovered = hoveredReply === reply._id;
                
                console.log('💬 Rendering reply:', reply._id, 'User:', replyUser?.name);
                
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
                          borderColor: colors.border 
                        },
                        isReplyHovered && {
                          backgroundColor: colors.hoverBackground,
                          borderColor: colors.hoverBorder,
                          borderWidth: 1,
                        },
                        { transform: [{ scale: isReplyHovered ? 1.02 : 1 }] }
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
                            defaultSource={{ uri: 'https://via.placeholder.com/32' }}
                          />
                          <Text style={[styles.userName, { color: colors.primaryText }]}>
                            {replyUser?.name ?? 'Deleted User'}
                          </Text>
                        </TouchableOpacity>
                        <Text style={[styles.date, { color: colors.secondaryText }]}>
                          {formatDate(reply.createdAt)}
                        </Text>
                      </View>

                      {reply.content ? (
                        <Text style={[styles.replyContent, { color: colors.primaryText }]}>
                          {reply.content}
                        </Text>
                      ) : null}

                      {reply.media && (
                        <View style={styles.mediaContainer}>
                          <Image
                            source={{ uri: getImageUrl(reply.media) }}
                            style={reply.mediaType === 'gif' ? styles.gifMedia : styles.imageMedia}
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
                          onPress={() => toggleReplyLike(comment._id, reply._id)}
                          style={[styles.actionButton, isReplyHovered && { backgroundColor: colors.secondaryButton }]}
                        >
                          <Icon
                            name={reply.likes.includes(currentUserId) ? "heart" : "heart-o"}
                            size={10}
                            color={reply.likes.includes(currentUserId) ? colors.likeActive : colors.secondaryText}
                          />
                          <Text style={[styles.likeCount, { color: colors.secondaryText }]}>
                            {reply.likes.length}
                          </Text>
                        </TouchableOpacity>

                        {currentUserId === reply.userId && (
                          <TouchableOpacity
                            onPress={() => setShowDeleteConfirm({
                              id: reply._id,
                              type: 'reply',
                              commentId: comment._id,
                            })}
                            style={[styles.actionButton, isReplyHovered && { backgroundColor: colors.secondaryButton }]}
                          >
                            <Icon name="trash" size={12} color={colors.secondaryText} />
                          </TouchableOpacity>
                        )}

                        <TouchableOpacity
                          onPress={() => handleNavigateToReport(reply.userId)}
                          style={[styles.actionButton, isReplyHovered && { backgroundColor: colors.secondaryButton }]}
                        >
                          <Icon name="exclamation-circle" size={12} color={colors.secondaryText} />
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

  console.log('🎨 Rendering CommentComponent UI');
  console.log('📊 State - showComments:', showComments);
  console.log('📊 State - comments count:', comments?.length || 0);
  console.log('📊 State - isLoading:', isLoading);
  console.log('📊 State - error:', error);
  console.log('🎯 Theme - isDark:', isDark, 'resolvedTheme:', resolvedTheme);

  return (
    <View style={styles.container}>
      {/* Loading Overlay */}
      {isLoading && (
        <View style={[styles.loadingOverlay, { backgroundColor: colors.loadingOverlay }]}>
          <ActivityIndicator size="large" color={colors.primaryButton} />
        </View>
      )}

      {/* Comment Button */}
      <View style={styles.commentButtonContainer}>
        <TouchableOpacity
          onPress={openComments}
          style={[
            styles.commentButton, 
            { backgroundColor: colors.background },
            totalCommentCount > 0 && { backgroundColor: colors.background }
          ]}
        >
          <Icon 
            name="comment-o" 
            size={20} 
            color={totalCommentCount > 0 ? colors.primaryButton : colors.secondaryText} 
          />
          {totalCommentCount > 0 && (
            <View style={[styles.commentCountBadge, { backgroundColor: colors.primaryButton }]}>
              <Text style={styles.commentCountText}>{totalCommentCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Comments Modal */}
      <Modal
        visible={showComments}
        animationType="none"
        transparent={true}
        statusBarTranslucent={true}
      >
        <View style={styles.modalWrapper}>
          {/* Transparent overlay that covers entire screen */}
          <Animated.View style={[styles.modalOverlay, { 
            backgroundColor: colors.overlay,
            opacity: fadeAnim 
          }]}>
            <KeyboardAvoidingView 
              style={styles.keyboardAvoidingView}
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 25}
            >
              {/* Content container with bottom safe area */}
              <Animated.View 
                style={[
                  styles.modalContentContainer,
                  { transform: [{ translateY: slideAnim }] }
                ]}
              >
                <View style={[styles.modalContent, { backgroundColor: colors.modalBackground }]}>
                  {/* Header */}
                  <SafeAreaView style={{ backgroundColor: colors.modalBackground }}>
                    <View style={[styles.modalHeader, { 
                      backgroundColor: colors.modalBackground,
                      borderBottomColor: colors.border 
                    }]}>
                      <View style={styles.modalHeaderLeft}>
                        <Text style={[styles.modalTitle, { color: colors.primaryText }]}>
                          Comments
                        </Text>
                        {totalCommentCount > 0 && (
                          <View style={[styles.totalCommentsBadge, { backgroundColor: colors.badgeBackground }]}>
                            <Text style={[styles.totalCommentsText, { color: colors.badgeText }]}>
                              {totalCommentCount}
                            </Text>
                          </View>
                        )}
                      </View>
                      <TouchableOpacity
                        onPress={closeComments}
                        style={[styles.closeButton, { backgroundColor: colors.secondaryButton }]}
                      >
                        <Icon name="times" size={20} color={colors.secondaryText} />
                      </TouchableOpacity>
                    </View>
                  </SafeAreaView>

                  {/* Comments List */}
                  <ScrollView 
                    style={styles.commentsList}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.commentsListContent}
                  >
                    {comments === null && !error && (
                      <View style={styles.emptyState}>
                        <ActivityIndicator size="small" color={colors.primaryButton} />
                        <Text style={[styles.emptyStateText, { color: colors.secondaryText }]}>
                          Loading comments...
                        </Text>
                      </View>
                    )}
                    
                    {error && (
                      <View style={styles.emptyState}>
                        <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
                        <TouchableOpacity
                          onPress={() => {
                            setHasFetchedComments(false);
                            fetchCommentsAndUsers();
                            debouncedFetchCommenters();
                          }}
                          style={[styles.retryButton, { backgroundColor: colors.primaryButton }]}
                        >
                          <Text style={styles.retryText}>Retry</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                    
                    {comments && comments.length === 0 && (
                      <View style={styles.emptyState}>
                        <Icon name="comment-o" size={48} color={colors.border} />
                        <Text style={[styles.emptyStateText, { color: colors.secondaryText }]}>
                          No comments yet
                        </Text>
                        <Text style={[styles.emptyStateSubtext, { color: colors.placeholderText }]}>
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

                  {/* Add Comment Input - This handles BOTH new comments and replies */}
                  <SafeAreaView style={{ backgroundColor: colors.modalBackground }}>
                    <View style={[styles.addCommentContainer, { 
                      backgroundColor: colors.modalBackground,
                      borderTopColor: colors.border 
                    }]}>
                      {/* Show if replying to a comment */}
                      {replyingTo && (
                        <View style={[styles.replyingToContainer, { backgroundColor: colors.badgeBackground }]}>
                          <Text style={[styles.replyingToText, { color: colors.badgeText }]}>
                            Replying to comment
                          </Text>
                          <TouchableOpacity
                            onPress={() => setReplyingTo(null)}
                            style={[styles.cancelReplyButton, { backgroundColor: colors.secondaryButton }]}
                          >
                            <Icon name="times" size={12} color={colors.secondaryText} />
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
                          defaultSource={{ uri: 'https://via.placeholder.com/40' }}
                        />
                        <TextInput
                          value={replyingTo ? replyContent : newComment}
                          onChangeText={replyingTo ? setReplyContent : setNewComment}
                          placeholder={replyingTo ? "Write a reply..." : "Add a comment..."}
                          placeholderTextColor={colors.placeholderText}
                          style={[
                            styles.commentInput, 
                            { 
                              backgroundColor: colors.inputBackground,
                              borderColor: colors.border,
                              color: colors.primaryText
                            }
                          ]}
                          multiline
                          maxLength={500}
                        />
                        <View style={styles.commentActionsContainer}>
                          <TouchableOpacity
                            onPress={() => {
                              if (replyingTo) {
                                handleAddReply(replyingTo);
                              } else {
                                handleAddComment();
                              }
                            }}
                            disabled={
                              replyingTo 
                                ? (!replyContent.trim() && !replyMedia) || !currentUserId
                                : (!newComment.trim() && !newCommentMedia) || !currentUserId
                            }
                            style={[
                              styles.sendButton,
                              { backgroundColor: colors.badgeBackground },
                              (replyingTo 
                                ? (!replyContent.trim() && !replyMedia) || !currentUserId
                                : (!newComment.trim() && !newCommentMedia) || !currentUserId) && 
                                { backgroundColor: colors.secondaryButton }
                            ]}
                          >
                            <Icon
                              name="paper-plane"
                              size={18}
                              color={
                                (replyingTo 
                                  ? (replyContent.trim() || replyMedia) && currentUserId
                                  : (newComment.trim() || newCommentMedia) && currentUserId) 
                                  ? colors.primaryButton : colors.placeholderText
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
                        {suggestedEmojis.map((emoji) => (
                          <TouchableOpacity
                            key={emoji}
                            onPress={() => handleEmojiClick(emoji, replyingTo ? 'reply' : 'comment')}
                            style={[styles.emojiButton, { backgroundColor: colors.cardBackground }]}
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

      {/* Delete Confirmation Modal */}
      <Modal
        visible={!!showDeleteConfirm}
        transparent={true}
        animationType="fade"
        statusBarTranslucent={true}
      >
        <SafeAreaView style={{ backgroundColor: colors.overlay }}>
          <View style={[styles.confirmModalOverlay, { backgroundColor: colors.overlay }]}>
            <View style={[styles.confirmModal, { backgroundColor: colors.modalBackground }]}>
              <Icon name="exclamation-triangle" size={40} color={colors.error} style={styles.confirmIcon} />
              <Text style={[styles.confirmTitle, { color: colors.primaryText }]}>
                Delete {showDeleteConfirm?.type}?
              </Text>
              <Text style={[styles.confirmMessage, { color: colors.secondaryText }]}>
                Are you sure you want to delete this {showDeleteConfirm?.type}? This action cannot be undone.
              </Text>
              <View style={styles.confirmButtons}>
                <TouchableOpacity
                  onPress={() => setShowDeleteConfirm(null)}
                  style={[styles.confirmButton, styles.cancelButton, { backgroundColor: colors.secondaryButton }]}
                >
                  <Text style={[styles.cancelButtonText, { color: colors.secondaryText }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleDelete}
                  style={[styles.confirmButton, styles.deleteButton, { backgroundColor: colors.error }]}
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

// Styles remain the same as original
const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  commentButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
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
  commentCountText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  modalWrapper: {
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
  },
  commentsContainer: {
    padding: 20,
  },
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
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
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
  userName: {
    fontSize: 14,
    fontWeight: '600',
  },
  date: {
    fontSize: 12,
    fontWeight: '500',
  },
  commentContent: {
    fontSize: 15,
    marginBottom: 12,
    lineHeight: 22,
  },
  mediaContainer: {
    marginBottom: 12,
    position: 'relative',
  },
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
  gifText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
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
  actionText: {
    fontSize: 13,
    fontWeight: '500',
  },
  likeCount: {
    fontSize: 13,
    fontWeight: '500',
    marginLeft: 2,
  },
  viewRepliesButton: {
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  viewRepliesText: {
    fontSize: 13,
    fontWeight: '500',
  },
  repliesContainer: {
    marginTop: 16,
    paddingLeft: 16,
    borderLeftWidth: 2,
  },
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
  replyContent: {
    fontSize: 14,
    marginBottom: 8,
    lineHeight: 20,
  },
  replyActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  replyingToContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 12,
  },
  replyingToText: {
    fontSize: 14,
    fontWeight: '500',
  },
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
  emojiRow: {
    flexDirection: 'row',
    marginTop: 12,
  },
  emojiButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 8,
    borderRadius: 12,
  },
  emojiText: {
    fontSize: 18,
  },
  mediaPreview: {
    marginBottom: 12,
    position: 'relative',
  },
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
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
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
  confirmIcon: {
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