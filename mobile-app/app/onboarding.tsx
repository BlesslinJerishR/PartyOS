import { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  FlatList,
  TouchableOpacity,
  ViewToken,
} from 'react-native';
import { router } from 'expo-router';
import { storage } from '../services/storage';
import Colors from '../constants/Colors';
import { Tv, Users, MapPin } from 'lucide-react-native';

const { width } = Dimensions.get('window');

interface SlideData {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  gradient: string[];
}

const slides: SlideData[] = [
  {
    id: '1',
    title: 'Host Your Party',
    description:
      'Transform your home theatre into a mini cinema. Set up your screen, configure seating, and invite guests to enjoy movies together.',
    icon: <Tv size={120} color={Colors.primary} strokeWidth={1.2} />,
    gradient: ['#F8F9FA', '#E8E5FF'],
  },
  {
    id: '2',
    title: 'Discover Nearby Shows',
    description:
      'Find movie screenings happening near you. Browse now playing and upcoming shows hosted by people in your neighborhood.',
    icon: <MapPin size={120} color={Colors.secondary} strokeWidth={1.2} />,
    gradient: ['#F8F9FA', '#E5FFF5'],
  },
  {
    id: '3',
    title: 'Join the Party',
    description:
      'Book your seat, grab some snacks, and enjoy the show. Rate your experience and request movies you want to watch.',
    icon: <Users size={120} color={Colors.nowPlaying} strokeWidth={1.2} />,
    gradient: ['#F8F9FA', '#FFE8E3'],
  },
];

export default function OnboardingScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index !== null) {
        setCurrentIndex(viewableItems[0].index);
      }
    },
  ).current;

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const handleComplete = async () => {
    await storage.setOnboardingComplete();
    router.replace('/(auth)/login');
  };

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
    } else {
      handleComplete();
    }
  };

  const renderSlide = ({ item }: { item: SlideData }) => (
    <View style={styles.slide}>
      <View style={styles.iconContainer}>{item.icon}</View>
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.description}>{item.description}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={slides}
        renderItem={renderSlide}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        bounces={false}
      />

      <View style={styles.footer}>
        <View style={styles.indicators}>
          {slides.map((_, index) => (
            <View
              key={index}
              style={[
                styles.indicator,
                index === currentIndex && styles.activeIndicator,
              ]}
            />
          ))}
        </View>

        <View style={styles.buttons}>
          <TouchableOpacity onPress={handleComplete} style={styles.skipButton}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleNext} style={styles.nextButton}>
            <Text style={styles.nextText}>
              {currentIndex === slides.length - 1 ? 'Get Started' : 'Next'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  slide: {
    width,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  iconContainer: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 48,
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 24,
    elevation: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 48,
  },
  indicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 32,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.border,
    marginHorizontal: 4,
  },
  activeIndicator: {
    width: 24,
    backgroundColor: Colors.primary,
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  skipButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  skipText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  nextButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  nextText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
});
