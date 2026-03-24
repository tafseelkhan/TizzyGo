// SignupScreen.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Dimensions,
  ActivityIndicator,
  Keyboard,
  Animated,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/Ionicons';
import LottieView from 'lottie-react-native';
import { signup, verifySignup } from '../../services/AuthService';
import { RootStackParamList } from '../../types/NavigationTypes';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

type NavigationProp = StackNavigationProp<RootStackParamList>;

export default function SignupScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [step, setStep] = useState<'form' | 'otp'>('form');
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [name, setName] = useState('');
  const [otp, setOtp] = useState('');
  const [msg, setMsg] = useState('');
  const [waitTime, setWaitTime] = useState(0);
  const [errors, setErrors] = useState({ name: '', emailOrPhone: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  
  const scrollViewRef = useRef<ScrollView>(null);
  const lottieRef = useRef<LottieView>(null);
  
  // Animation values
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const headerTranslateY = useRef(new Animated.Value(-30)).current;
  const formOpacity = useRef(new Animated.Value(0)).current;
  const formScale = useRef(new Animated.Value(0.9)).current;
  const nameInputOpacity = useRef(new Animated.Value(0)).current;
  const nameInputTranslateX = useRef(new Animated.Value(-20)).current;
  const emailInputOpacity = useRef(new Animated.Value(0)).current;
  const emailInputTranslateX = useRef(new Animated.Value(-20)).current;
  const checkboxOpacity = useRef(new Animated.Value(0)).current;
  const checkboxTranslateY = useRef(new Animated.Value(20)).current;
  const buttonOpacity = useRef(new Animated.Value(0)).current;
  const buttonTranslateY = useRef(new Animated.Value(20)).current;
  const sliderHeight = useRef(new Animated.Value(screenHeight * 0.4)).current;

  const isPhone = /^\d{4}/.test(emailOrPhone);
  const isEmail = emailOrPhone.includes('@');

  // Keyboard listeners
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => {
        setIsKeyboardVisible(true);
        Animated.timing(sliderHeight, {
          toValue: 0,
          duration: 300,
          useNativeDriver: false,
        }).start();
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setIsKeyboardVisible(false);
        Animated.timing(sliderHeight, {
          toValue: screenHeight * 0.4,
          duration: 300,
          useNativeDriver: false,
        }).start();
      }
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  // Initial animations
  useEffect(() => {
    // Header animation
    Animated.parallel([
      Animated.timing(headerOpacity, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(headerTranslateY, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
    
    // Form animation
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(formOpacity, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.spring(formScale, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();
    }, 200);
    
    // Name input animation
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(nameInputOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(nameInputTranslateX, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start();
    }, 400);
    
    // Email input animation
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(emailInputOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(emailInputTranslateX, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start();
    }, 600);
    
    // Checkbox animation
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(checkboxOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(checkboxTranslateY, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start();
    }, 800);
    
    // Button animation
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(buttonOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(buttonTranslateY, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start();
    }, 1000);
  }, []);

  useEffect(() => {
    if (waitTime > 0) {
      const timer = setTimeout(() => setWaitTime(waitTime - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [waitTime]);

  const handleEmailPhoneFocus = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollTo({ y: 150, animated: true });
    }, 100);
  };

  const validateForm = () => {
    const newErrors = {
      name: !name ? 'Please enter your name' : '',
      emailOrPhone: !emailOrPhone ? 'Please enter your email or phone' : '',
    };
    setErrors(newErrors);
    return !newErrors.name && !newErrors.emailOrPhone;
  };

  const handleSignup = async () => {
    if (!validateForm()) return;
    if (!agreeTerms) {
      Alert.alert('Terms Required', 'Please agree to Terms of Use and Privacy Policy');
      return;
    }
    
    setIsLoading(true);
    const res = await signup({ identifier: emailOrPhone });

    if (res.identifier) {
      setMsg(`OTP sent to ${res.identifier}`);
      setStep('otp');
      setWaitTime(30);
    } else {
      Alert.alert('Error', res.msg || 'Something went wrong');
    }
    setIsLoading(false);
  };

  const handleVerify = async () => {
    if (!otp) {
      Alert.alert('OTP Required', 'Please enter the OTP');
      return;
    }
    
    setIsLoading(true);
    const res = await verifySignup({
      identifier: emailOrPhone,
      otp,
      name,
    });

    if (res.token && res.user && res.user._id) {
      await AsyncStorage.setItem('authToken', res.token);
      await AsyncStorage.setItem('userId', res.user._id);
      navigation.navigate('Home');
    } else {
      Alert.alert('Error', res.msg || 'Invalid OTP');
    }
    setIsLoading(false);
  };

  const handleResendOTP = async () => {
    if (waitTime > 0) return;
    setIsLoading(true);
    const res = await signup({ identifier: emailOrPhone });
    if (res.identifier) {
      setMsg(`OTP resent to ${res.identifier}`);
      setWaitTime(30);
    } else {
      Alert.alert('Error', res.msg || 'Failed to resend OTP');
    }
    setIsLoading(false);
  };

  // Animated styles
  const headerAnimatedStyle = {
    opacity: headerOpacity,
    transform: [{ translateY: headerTranslateY }],
  };

  const formAnimatedStyle = {
    opacity: formOpacity,
    transform: [{ scale: formScale }],
  };

  const nameInputAnimatedStyle = {
    opacity: nameInputOpacity,
    transform: [{ translateX: nameInputTranslateX }],
  };

  const emailInputAnimatedStyle = {
    opacity: emailInputOpacity,
    transform: [{ translateX: emailInputTranslateX }],
  };

  const checkboxAnimatedStyle = {
    opacity: checkboxOpacity,
    transform: [{ translateY: checkboxTranslateY }],
  };

  const buttonAnimatedStyle = {
    opacity: buttonOpacity,
    transform: [{ translateY: buttonTranslateY }],
  };

  return (
    <View style={styles.container}>
      {/* Background Gradient */}
      <View style={styles.background}>
        <View style={[styles.gradientLayer, styles.gradientStart]} />
        <View style={[styles.gradientLayer, styles.gradientEnd]} />
      </View>

      {/* Lottie Animation Container */}
      <Animated.View style={[styles.sliderContainer, { height: sliderHeight }]}>
        {!isKeyboardVisible && (
          <View style={styles.lottieWrapper}>
            <LottieView
              ref={lottieRef}
              source={require('../../../core/components/animations/lotties/delivery.json')}
              style={styles.lottieAnimation}
              autoPlay
              loop
              resizeMode="cover"
            />
            <View style={styles.lottieOverlay}>
              <Text style={styles.lottieTitle}>Join TizzyGo!</Text>
              <Text style={styles.lottieDescription}>Create your account to get started</Text>
            </View>
          </View>
        )}
      </Animated.View>

      <ScrollView 
        ref={scrollViewRef}
        contentContainerStyle={[
          styles.scrollContainer,
          isKeyboardVisible && styles.scrollContainerKeyboardOpen
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header - Hide when keyboard is open */}
        {!isKeyboardVisible && (
          <Animated.View style={[styles.header, headerAnimatedStyle]}>
            <View style={styles.logoContainer}>
              <Icon name="cart" size={40} color="#2dd4bf" />
            </View>
            <Text style={styles.title}>Welcome to TizzyGo</Text>
            <Text style={styles.subtitle}>
              {step === 'form' ? 'Create your account to get started' : 'Verify your account'}
            </Text>
          </Animated.View>
        )}

        {/* Glass Effect Switch Tabs */}
        <View style={styles.glassTabsContainer}>
          <TouchableOpacity 
            style={[styles.glassTab, styles.glassTabActive]}
          >
            <Icon name="person-add" size={20} color="#ffffff" style={styles.tabIcon} />
            <Text style={styles.glassTabTextActive}>SignUp</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.glassTab}
            onPress={() => navigation.navigate('Login')}
          >
            <Icon name="log-in" size={20} color="#6b7280" style={styles.tabIcon} />
            <Text style={styles.glassTabText}>LogIn</Text>
          </TouchableOpacity>
        </View>

        {/* Glass Form Container */}
        <Animated.View style={[styles.glassContainer, formAnimatedStyle]}>
          {step === 'form' ? (
            <View style={styles.formContent}>
              {/* Name Input */}
              <Animated.View style={[styles.inputContainer, errors.name && styles.inputError, nameInputAnimatedStyle]}>
                <Text style={styles.inputLabel}>Full Name</Text>
                <View style={styles.inputWrapper}>
                  <Icon name="person-outline" size={20} color="#9ca3af" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your full name"
                    placeholderTextColor="#9ca3af"
                    value={name}
                    onChangeText={(text) => {
                      setName(text);
                      setErrors({ ...errors, name: '' });
                    }}
                    returnKeyType="next"
                  />
                </View>
                {errors.name ? (
                  <Text style={styles.errorText}>{errors.name}</Text>
                ) : null}
              </Animated.View>

              {/* Email/Phone Input */}
              <Animated.View style={[styles.inputContainer, errors.emailOrPhone && styles.inputError, emailInputAnimatedStyle]}>
                <Text style={styles.inputLabel}>Email or Phone</Text>
                <View style={styles.inputWrapper}>
                  <Icon name="mail-outline" size={20} color="#9ca3af" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter email or phone number"
                    placeholderTextColor="#9ca3af"
                    value={emailOrPhone}
                    onChangeText={(text) => {
                      setEmailOrPhone(text);
                      setErrors({ ...errors, emailOrPhone: '' });
                    }}
                    keyboardType={isPhone ? 'phone-pad' : 'email-address'}
                    autoCapitalize="none"
                    returnKeyType="done"
                    onFocus={handleEmailPhoneFocus}
                  />
                </View>
                {errors.emailOrPhone ? (
                  <Text style={styles.errorText}>{errors.emailOrPhone}</Text>
                ) : null}
              </Animated.View>

              {/* Checkbox - Only Terms & Privacy */}
              <Animated.View style={[styles.checkboxContainer, checkboxAnimatedStyle]}>
                <TouchableOpacity
                  style={styles.checkboxRow}
                  onPress={() => setAgreeTerms(!agreeTerms)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.checkbox, agreeTerms && styles.checkboxChecked]}>
                    {agreeTerms && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                  <Text style={styles.checkboxLabel}>
                    I agree to{' '}
                    <Text style={styles.link}>Terms</Text> and{' '}
                    <Text style={styles.link}>Privacy Policy</Text>
                  </Text>
                </TouchableOpacity>
              </Animated.View>

              {/* Signup Button */}
              <Animated.View style={buttonAnimatedStyle}>
                <TouchableOpacity
                  style={[styles.button, isLoading && styles.buttonDisabled]}
                  onPress={handleSignup}
                  disabled={isLoading}
                  activeOpacity={0.9}
                >
                  <View style={styles.buttonGradient}>
                    {isLoading ? (
                      <ActivityIndicator color="#ffffff" size="small" />
                    ) : (
                      <>
                        <Icon name="arrow-forward" size={20} color="#ffffff" style={styles.buttonIcon} />
                        <Text style={styles.buttonText}>Create Account</Text>
                      </>
                    )}
                  </View>
                </TouchableOpacity>
              </Animated.View>
            </View>
          ) : (
            <View style={styles.otpContent}>
              {/* OTP Message */}
              <View style={styles.otpMessage}>
                <Icon name="mail" size={32} color="#059669" />
                <Text style={styles.otpMessageText}>{msg}</Text>
                <Text style={styles.otpMessageSubtext}>
                  Check your messages for the OTP
                </Text>
              </View>

              {/* OTP Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Verification Code</Text>
                <View style={styles.inputWrapper}>
                  <Icon name="key-outline" size={20} color="#9ca3af" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter 6-digit OTP"
                    placeholderTextColor="#9ca3af"
                    value={otp}
                    onChangeText={setOtp}
                    keyboardType="number-pad"
                    maxLength={6}
                    onFocus={handleEmailPhoneFocus}
                  />
                </View>
              </View>

              {/* Verify Button */}
              <TouchableOpacity
                style={[styles.button, isLoading && styles.buttonDisabled]}
                onPress={handleVerify}
                disabled={isLoading}
                activeOpacity={0.9}
              >
                <View style={styles.buttonGradient}>
                  {isLoading ? (
                    <ActivityIndicator color="#ffffff" size="small" />
                  ) : (
                    <>
                      <Icon name="checkmark" size={20} color="#ffffff" style={styles.buttonIcon} />
                      <Text style={styles.buttonText}>Verify & Continue</Text>
                    </>
                  )}
                </View>
              </TouchableOpacity>

              {/* Resend OTP */}
              <TouchableOpacity
                style={[
                  styles.resendButton,
                  (waitTime > 0 || isLoading) && styles.resendButtonDisabled,
                ]}
                onPress={handleResendOTP}
                disabled={waitTime > 0 || isLoading}
                activeOpacity={0.7}
              >
                {isLoading ? (
                  <ActivityIndicator color="#059669" size="small" />
                ) : waitTime > 0 ? (
                  <Text style={styles.resendTextDisabled}>
                    Resend in {waitTime}s
                  </Text>
                ) : (
                  <Text style={styles.resendText}>Resend OTP</Text>
                )}
              </TouchableOpacity>

              {/* Back to Signup */}
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => setStep('form')}
                disabled={isLoading}
                activeOpacity={0.7}
              >
                <Icon name="arrow-back" size={18} color="#6b7280" />
                <Text style={styles.backText}> Back to Signup</Text>
              </TouchableOpacity>
            </View>
          )}
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  background: {
    ...StyleSheet.absoluteFillObject,
  },
  gradientLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  gradientStart: {
    backgroundColor: '#f0fdfa',
    opacity: 0.8,
  },
  gradientEnd: {
    backgroundColor: '#e0f2fe',
    opacity: 0.6,
  },
  sliderContainer: {
    overflow: 'hidden',
    backgroundColor: '#ffffff',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  lottieWrapper: {
    flex: 1,
    position: 'relative',
  },
  lottieAnimation: {
    width: '100%',
    height: '100%',
  },
  lottieOverlay: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  lottieTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  lottieDescription: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
  },
  scrollContainerKeyboardOpen: {
    paddingTop: 10,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(45, 212, 191, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(45, 212, 191, 0.3)',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  glassTabsContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 20,
    padding: 6,
    marginBottom: 25,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  glassTab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  glassTabActive: {
    backgroundColor: '#3b82f6',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  tabIcon: {
    marginRight: 8,
  },
  glassTabText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  glassTabTextActive: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  glassContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  formContent: {
    gap: 20,
  },
  otpContent: {
    gap: 20,
  },
  inputContainer: {
    marginBottom: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    marginLeft: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: 'rgba(45, 212, 191, 0.3)',
    borderRadius: 16,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    color: '#1f2937',
  },
  inputError: {
    borderColor: '#f87171',
  },
  errorText: {
    color: '#dc2626',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
    fontWeight: '500',
  },
  checkboxContainer: {
    marginBottom: 8,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#d1d5db',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
    backgroundColor: '#ffffff',
  },
  checkboxChecked: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  checkmark: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: '#374151',
  },
  link: {
    color: '#059669',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  button: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
    height: 56,
  },
  buttonGradient: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2dd4bf',
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  otpMessage: {
    backgroundColor: 'rgba(240, 253, 250, 0.9)',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(45, 212, 191, 0.3)',
    alignItems: 'center',
    gap: 8,
  },
  otpMessageText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#065f46',
    textAlign: 'center',
  },
  otpMessageSubtext: {
    fontSize: 12,
    color: '#047857',
    textAlign: 'center',
  },
  resendButton: {
    backgroundColor: 'rgba(240, 253, 250, 0.9)',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(45, 212, 191, 0.3)',
  },
  resendButtonDisabled: {
    backgroundColor: 'rgba(243, 244, 246, 0.9)',
    borderColor: '#d1d5db',
  },
  resendText: {
    color: '#059669',
    fontSize: 16,
    fontWeight: '500',
  },
  resendTextDisabled: {
    color: '#9ca3af',
    fontSize: 16,
    fontWeight: '500',
  },
  backButton: {
    paddingVertical: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  backText: {
    color: '#6b7280',
    fontSize: 14,
    marginLeft: 4,
  },
});