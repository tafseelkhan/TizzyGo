// components/ProductShare.tsx
import React, { useState } from 'react';
import {
  SafeAreaView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Share,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

// ✅ FIXED: Added category prop and renamed title to productTitle
interface Props {
  productId: string;
  productTitle: string; // Changed from 'title'
  category: string; // Added
}

// Define navigation param types
type RootStackParamList = {
  [key: string]: any;
};

// ✅ FIXED: Updated props destructuring
const ProductShare: React.FC<Props> = ({
  productId,
  productTitle,
  category,
}) => {
  const [loading, setLoading] = useState(false);
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const longMessages = [
    `🔥 **EXCLUSIVE FIND ALERT!** 🔥\n\nJust discovered this absolutely incredible product on TizzyGo and I had to share it with you! 🎯 "${productTitle}" is genuinely one of the best products I've come across in a long time. The quality, design, and value are simply outstanding! Perfect for anyone looking to elevate their daily experience. Don't miss out on this amazing opportunity – check it out now!\n\nFull product details available here:`,
    `💡 **LIFESTYLE UPGRADE DISCOVERY!** 💡\n\nHey! I stumbled upon something truly special that I think you'd absolutely love! "${productTitle}" is currently trending on TizzyGo and for all the right reasons! This product combines innovative technology with user-friendly design to create something truly remarkable. Whether you're shopping for yourself or looking for the perfect gift, this is definitely worth exploring. Trust me, you don't want to miss this one!\n\nExplore this amazing product here:`,
    `🎉 **CAN'T-MISS OPPORTUNITY!** 🎉\n\nAttention everyone! "${productTitle}" is taking TizzyGo by storm and creating a major buzz in the shopping community! This isn't just another product – it's a complete game-changer that's redefining quality standards. I've been researching similar items for weeks, and this one stands out in every possible way. The features, the craftsmanship, and the overall value are absolutely unparalleled!\n\nSee what all the excitement is about:`,
    `✨ **PREMIUM PRODUCT SPOTLIGHT!** ✨\n\nI just found what might be the perfect addition to your collection! "${productTitle}" is currently available on TizzyGo, and it's genuinely impressive. What makes this product exceptional is its attention to detail, superior materials, and innovative design approach. It's receiving rave reviews from early adopters and has already become a favorite among savvy shoppers who appreciate quality and style.\n\nDiscover this premium selection:`,
    `🚀 **GAME-CHANGING INNOVATION ALERT!** 🚀\n\nPrepare to be amazed! "${productTitle}" is not just a product – it's a revolution in its category! This innovative creation combines cutting-edge technology with practical functionality in ways you've never seen before. I was genuinely surprised by how much value and performance they've packed into this offering. It's the kind of product that makes you wonder how you ever managed without it!\n\nExperience the innovation here:`,
    `🎁 **PERFECT GIFT DISCOVERY!** 🎁\n\nFound the ultimate solution for your gifting needs! "${productTitle}" is currently available on TizzyGo and it's absolutely perfect for any occasion! Whether you're celebrating a birthday, anniversary, holiday, or just want to treat yourself or someone special, this product delivers exceptional quality and thoughtful design. The presentation alone is worth the attention, but the functionality will truly impress!\n\nFind this perfect gift option:`,
    `🌟 **TOP-RATED EXCELLENCE!** 🌟\n\nJust discovered a top-rated product that's receiving outstanding reviews! "${productTitle}" on TizzyGo has consistently earned 5-star ratings from verified buyers who praise its durability, performance, and overall value. What sets this apart is the manufacturer's commitment to quality and customer satisfaction. They've clearly listened to customer feedback and created something truly exceptional that exceeds expectations!\n\nCheck out these rave reviews:`,
    `⚡ **LIMITED AVAILABILITY NOTICE!** ⚡\n\nUrgent shopping alert! "${productTitle}" is currently in high demand with limited stock available on TizzyGo! This premium product is selling faster than anticipated due to its exceptional features and competitive pricing. Early buyers are already reporting incredible satisfaction, and the buzz is growing by the hour. If you've been considering an upgrade or looking for something special, now is definitely the time to act!\n\nSecure yours before it's gone:`,
    `🔥 **HOTTEST DEAL OF THE SEASON!** 🔥\n\nThis is not a drill! "${productTitle}" is officially the hottest deal I've found this season on TizzyGo! The combination of quality, features, and price point is virtually unbeatable in today's market. Retail experts are predicting this will sell out quickly once word gets out about its incredible value proposition. I've compared similar products across multiple platforms, and this one genuinely offers the best overall package!\n\nDon't miss this amazing deal:`,
    `💎 **LUXURY MEETS VALUE DISCOVERY!** 💎\n\nDiscovered something truly special that offers luxury quality at an accessible price! "${productTitle}" on TizzyGo represents that perfect balance between premium craftsmanship and sensible pricing. The materials used, the attention to detail, and the overall design aesthetic rival products costing significantly more. This is that rare find where you get exceptional quality without the extravagant markup typically associated with such items!\n\nExperience affordable luxury:`,
    `🎯 **ESSENTIAL PRODUCT ALERT!** 🎯\n\nFound what might become your new daily essential! "${productTitle}" on TizzyGo is designed to seamlessly integrate into your lifestyle while significantly enhancing your daily routine. The thoughtful engineering and user-centered design make this product not just useful but genuinely indispensable once you experience it. It's one of those purchases that you'll find yourself grateful for every single day!\n\nMake it part of your life:`,
    `🛍️ **SMART SHOPPER'S SECRET FIND!** 🛍️\n\nAs someone who's always looking for the best value, I had to share this incredible discovery! "${productTitle}" on TizzyGo represents exactly what smart shoppers search for – exceptional quality, fair pricing, and genuine utility. I've done extensive research and can confidently say this product outperforms competitors while costing less. It's the kind of find that makes you feel like you've uncovered a hidden gem in the marketplace!\n\nDiscover this smart choice:`,
    `📢 **COMMUNITY FAVORITE ALERT!** 📢\n\nThe shopping community is buzzing about this amazing find! "${productTitle}" has quickly become a favorite among TizzyGo users who appreciate quality and innovation. What's particularly impressive is how this product has generated genuine excitement through word-of-mouth recommendations rather than just marketing. People who've purchased it are genuinely excited about their experience and can't stop talking about its impressive features and performance!\n\nJoin the satisfied customers:`,
    `✨ **EXCLUSIVE PREMIUM DISCOVERY!** ✨\n\nJust uncovered a premium product that's absolutely worth your attention! "${productTitle}" on TizzyGo stands out for its exceptional craftsmanship, innovative features, and overall excellence. This isn't mass-produced mediocrity – it's carefully designed and manufactured with pride. The difference is noticeable from the moment you experience it, and the long-term satisfaction is guaranteed by the manufacturer's commitment to quality!\n\nExplore premium quality:`,
    `🚀 **INNOVATION BREAKTHROUGH SPOTLIGHT!** 🚀\n\nWitness genuine innovation in action! "${productTitle}" on TizzyGo represents a significant leap forward in product design and functionality. The engineers and designers behind this creation have reimagined what's possible in this category, resulting in something that's not just incrementally better but fundamentally superior. It's the kind of product that makes you appreciate how innovation can genuinely improve everyday experiences!\n\nSee innovation in action:`,
    `🎉 **TRENDING SENSATION DISCOVERY!** 🎉\n\nJoining the trend that everyone's talking about! "${productTitle}" is currently the most talked-about product in its category on TizzyGo, and the excitement is completely justified! Social media influencers, product reviewers, and everyday users alike are sharing their positive experiences and recommending it to friends and family. This level of organic buzz is rare and speaks volumes about the product's genuine quality and appeal!\n\nExperience the sensation:`,
    `💡 **PROBLEM-SOLVING GENIUS!** 💡\n\nFound a brilliant solution to a common problem! "${productTitle}" on TizzyGo isn't just another product – it's a well-thought-out solution that addresses real needs in innovative ways. The designers clearly understood the challenges people face and created something that not only solves those problems but does so with elegance and efficiency. It's satisfying to find products that are actually designed with the user's experience in mind!\n\nDiscover this smart solution:`,
    `🔥 **INDUSTRY STANDARD REDEFINED!** 🔥\n\nThis product is changing expectations! "${productTitle}" on TizzyGo is setting new standards in its category with features and quality that competitors will struggle to match. Industry experts are already taking notice of how this product raises the bar for what consumers should expect at this price point. It's rare to find something that genuinely pushes an entire category forward, but this product is doing exactly that!\n\nSee the new standard:`,
    `🌟 **AWARD-WORTHY EXCELLENCE!** 🌟\n\nDiscovered a product that deserves recognition! "${productTitle}" on TizzyGo exhibits the kind of quality, innovation, and user-focused design that typically wins industry awards and critical acclaim. From the packaging to the performance, every aspect shows careful consideration and commitment to excellence. This is what happens when passionate creators refuse to compromise on quality and dedicate themselves to making something truly special!\n\nExperience award-worthy quality:`,
    `🎁 **ULTIMATE SURPRISE REVEAL!** 🎁\n\nPrepare to be pleasantly surprised! "${productTitle}" on TizzyGo exceeds expectations in every possible way! Often we see products that look good in pictures but disappoint in person – this is the complete opposite. The actual product is even more impressive than the description suggests, with attention to detail and quality that genuinely surprises and delights. It's that wonderful experience of getting more than you expected!\n\nPrepare for a happy surprise:`,
  ];

  // 🔹 Backend se share link create karna
  const createShare = async (): Promise<string | null> => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('authToken');

      const res = await fetch('http://172.20.10.12:5000/api/shares/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          productId,
          productType: 'product',
          platform: 'all',
        }),
      });

      const data = await res.json();
      setLoading(false);

      if (!res.ok) {
        Alert.alert('Error', data.message || 'Share failed');
        return null;
      }

      const buildShareUrl = (title: string, productId: string) => {
        const base = 'https://www.tizzygo.com/aircloud/s';
        const params = new URLSearchParams({
          title: title,
          id: productId,
          show: '1',
        });
        return `${base}?${params.toString()}`;
      };

      return buildShareUrl(productTitle, data.share._id);
    } catch (err) {
      console.error('Share error:', err);
      setLoading(false);
      return null;
    }
  };

  // 🔹 Random long message select karke share karna
  const handleShare = async () => {
    const shareUrl = await createShare();
    if (!shareUrl) return;

    const randomIndex = Math.floor(Math.random() * longMessages.length);
    const message = `${longMessages[randomIndex]}\n\n🔗 **Product Link:** ${shareUrl}\n\n📱 **Platform:** TizzyGo Mobile App\n⭐ **Rating:** Currently receiving excellent reviews!\n💬 **Community Feedback:** Overwhelmingly positive!\n\n#TizzyGo #SmartShopping #ProductDiscovery #QualityFinds #ShoppingGoals #Innovation #PremiumProducts #MustHaveItems #TrendingNow #ShoppingCommunity`;

    try {
      await Share.share({
        message: message,
        title: `Check out "${productTitle}" on TizzyGo!`,
      });
    } catch (err) {
      Alert.alert('Share failed', 'Unable to share the product link.');
    }
  };

  return (
    <SafeAreaView>
      <TouchableOpacity
        style={styles.iconWrap}
        onPress={handleShare}
        disabled={loading}
      >
        <Icon name="share-outline" size={26} color={'gray'} />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  iconWrap: {
    padding: 8,
  },
});

export default ProductShare;
