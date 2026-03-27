// components/Footer.tsx
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Linking,
} from 'react-native';
import Icon from 'react-native-vector-icons/AntDesign';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../../contexts/theme/ThemeContext';

// Define proper types for icons
type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];
type AntDesignName = React.ComponentProps<typeof Icon>['name'];

interface SocialMediaItem {
  icon: IoniconsName | AntDesignName;
  color: string;
  name: string;
  type: 'ion' | 'ant';
}

// Define navigation param types
type RootStackParamList = {
  [key: string]: any;
};

const Footer = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { isDark } = useTheme();

  // Solid colors based on theme
  const getSolidStyle = () => ({
    backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
    borderWidth: 1,
    borderColor: isDark ? '#334155' : '#E5E7EB',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
  });

  // Theme-based text colors
  const getTextColor = (type: 'primary' | 'secondary' | 'accent' | 'title') => {
    switch(type) {
      case 'primary':
        return isDark ? '#F1F5F9' : '#1F2937';
      case 'secondary':
        return isDark ? '#94A3B8' : '#6B7280';
      case 'accent':
        return isDark ? '#2DD4BF' : '#0F766E';
      case 'title':
        return isDark ? '#7DD3FC' : '#0F766E';
      default:
        return isDark ? '#F1F5F9' : '#1F2937';
    }
  };

  // Properly typed social media icons
  const socialMedia: SocialMediaItem[] = [
    { icon: 'logo-tiktok', color: '#23BBCF', name: 'TikTok', type: 'ion' },
    { icon: 'logo-snapchat', color: '#FCFF40', name: 'SnapChat', type: 'ion'},
    { icon: 'logo-twitter', color: '#1DA1F2', name: 'Twitter', type: 'ion' },
    { icon: 'logo-youtube', color: '#FF0000', name: 'YouTube', type: 'ion' },
    { icon: 'logo-instagram', color: '#E4405F', name: 'Instagram', type: 'ion' },
    { icon: 'logo-facebook', color: '#1877F2', name: 'Facebook', type: 'ion' },
    { icon: 'logo-linkedin', color: '#0A66C2', name: 'LinkedIn', type: 'ion' },
  ];

  const solidStyle = getSolidStyle();

  const handleNavigation = (screen: string) => {
    navigation.navigate(screen);
  };

  // Social Media Icons Component
  const SocialMediaIcons = () => (
    <View style={{ flexDirection: 'row', gap: 10 }}>
      {socialMedia.map((item) => (
        <View key={item.name}>
          {item.type === 'ion' ? (
            <Ionicons 
              name={item.icon as IoniconsName} 
              size={24} 
              color={item.color} 
            />
          ) : (
            <Icon 
              name={item.icon as AntDesignName} 
              size={24} 
              color={item.color} 
            />
          )}
        </View>
      ))}
    </View>
  );

  return (
    <View style={[styles.container, { 
      backgroundColor: isDark ? '#00000000' : '#00000000' 
    }]}>
      <ScrollView 
        style={styles.footerScroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Main Footer Content */}
        <View style={styles.footerGrid}>
          
          {/* Brand Section */}
          <View style={[styles.brandSection, solidStyle]}>
            <View style={styles.brandHeader}>
              <View style={[styles.logoContainer, { 
                borderColor: isDark ? '#334155' : '#CBD5E1' 
              }]}>
                <Image
                  source={require('../../../assets/images/tizzy-logo.jpg')}
                  style={styles.logoImage}
                />
              </View>
              <View style={styles.brandText}>
                <Text style={[styles.brandTitle, { color: getTextColor('primary') }]}>
                  TizzyGo
                </Text>
                <Text style={[styles.brandSubtitle, { color: getTextColor('secondary') }]}>
                  Everything in One Place
                </Text>
              </View>
            </View>
            
            <Text style={[styles.brandDescription, { color: getTextColor('secondary') }]}>
              Your one-stop platform for all your needs - shopping, transportation, 
              rentals, and more. Experience seamless service with cutting-edge technology.
            </Text>

            {/* Social Media */}
            <View style={styles.socialSection}>
              <Text style={[styles.socialTitle, { color: getTextColor('primary') }]}>
                Follow Us
              </Text>
              <View style={styles.socialIcons}>
                {socialMedia.map((social, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[styles.socialIcon, solidStyle]}
                    onPress={() => Linking.openURL('https://example.com')}
                  >
                    {social.type === 'ion' ? (
                      <Ionicons 
                        name={social.icon as IoniconsName} 
                        size={20} 
                        color={social.color} 
                      />
                    ) : (
                      <Icon 
                        name={social.icon as AntDesignName} 
                        size={20} 
                        color={social.color} 
                      />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* Help Section */}
          <View style={[styles.footerCard, solidStyle]}>
            <Text style={[styles.cardTitle, { color: getTextColor('title') }]}>
              Help & Support
            </Text>
            {['FAQs', 'Shipping', 'Returns', 'Payments', 'Contact Support'].map((item, index) => (
              <TouchableOpacity key={index} style={styles.listItem}>
                <View style={[styles.listDot, { 
                  backgroundColor: isDark ? '#2DD4BF' : '#0F766E' 
                }]} />
                <Text style={[styles.listText, { color: getTextColor('secondary') }]}>
                  {item}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Company Section */}
          <View style={[styles.footerCard, solidStyle]}>
            <Text style={[styles.cardTitle, { color: getTextColor('title') }]}>
              Company
            </Text>
            {['About Us', 'Careers', 'Blog', 'Press', 'Partners'].map((item, index) => (
              <TouchableOpacity key={index} style={styles.listItem}>
                <View style={[styles.listDot, { 
                  backgroundColor: isDark ? '#2DD4BF' : '#0F766E' 
                }]} />
                <Text style={[styles.listText, { color: getTextColor('secondary') }]}>
                  {item}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Legal Section */}
          <View style={[styles.footerCard, solidStyle]}>
            <Text style={[styles.cardTitle, { color: getTextColor('title') }]}>
              Legal
            </Text>
            {['Terms of Service', 'Privacy Policy', 'Cookie Policy', 'Security', 'Compliance'].map((item, index) => (
              <TouchableOpacity key={index} style={styles.listItem}>
                <View style={[styles.listDot, { 
                  backgroundColor: isDark ? '#2DD4BF' : '#0F766E' 
                }]} />
                <Text style={[styles.listText, { color: getTextColor('secondary') }]}>
                  {item}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Copyright Section */}
        <View style={[styles.copyrightSection, solidStyle, { 
          borderTopColor: isDark ? '#2DD4BF' : '#0F766E' 
        }]}>
          <Text style={[styles.copyrightText, { color: getTextColor('accent') }]}>
            © {new Date().getFullYear()} <Text style={[styles.brandHighlight, { color: getTextColor('accent') }]}>
              TizzyGo
            </Text>. All rights reserved.
          </Text>
          <View style={styles.madeWithLove}>
            <Text style={[styles.madeWithText, { 
              color: isDark ? '#2DD4BF' : '#0F766E' 
            }]}>
              Made with
            </Text>
            <View style={[styles.heartContainer, { 
              backgroundColor: isDark ? '#fee2e2': '#ffe8e8'
            }]}>
              <Text style={styles.heart}>❤️</Text>
            </View>
            <Text style={[styles.madeWithText, { 
              color: isDark ? '#2DD4BF' : '#0F766E' 
            }]}>
              for a seamless experience
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

// Styles remain the same
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  footerScroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  footerGrid: {
    gap: 16,
    marginBottom: 16,
  },
  brandSection: {
    borderRadius: 24,
    padding: 24,
    gap: 16,
  },
  brandHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  logoContainer: {
    width: 64,
    height: 64,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 2,
  },
  logoImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  brandText: {
    flex: 1,
  },
  brandTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  brandSubtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  brandDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  socialSection: {
    gap: 12,
  },
  socialTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  socialIcons: {
    flexDirection: 'row',
    gap: 8,
  },
  socialIcon: {
    width: 44,
    height: 44,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerCard: {
    borderRadius: 24,
    padding: 20,
    gap: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 6,
  },
  listDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  listText: {
    fontSize: 14,
  },
  copyrightSection: {
    borderRadius: 24,
    padding: 20,
    alignItems: 'center',
    gap: 12,
    borderTopWidth: 1,
    marginBottom: 56,
  },
  copyrightText: {
    fontSize: 16,
    fontWeight: '500',
  },
  brandHighlight: {
    fontWeight: 'bold',
  },
  madeWithLove: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  madeWithText: {
    fontSize: 14,
  },
  heartContainer: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heart: {
    fontSize: 10,
    color: 'white',
  },
});

export default Footer;