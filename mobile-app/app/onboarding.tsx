import { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  FlatList,
  TouchableOpacity,
  ViewToken,
  Animated,
} from 'react-native';
import { router } from 'expo-router';
import { storage } from '../services/storage';
import { useTheme } from '../context/AuthContext';
import { Fonts } from '../constants/Fonts';
import { Tv, Users, MapPin } from 'lucide-react-native';

const { width } = Dimensions.get('window');

const hero = '#FF004F';

interface SlideData {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  icon: React.ReactNode;
}

const slides: SlideData[] = [
  {
    id: '1',
    title: 'Host Your Party',
    subtitle: 'Be the Star Host',
    description:
      'Transform your home theatre into a mini cinema. Set up your screen, configure seating, and invite guests for an unforgettable movie night.',
    icon: <Tv size={64} color="#fff" strokeWidth={1.5} />,
  },
  {
    id: '2',
    title: 'Discover Shows',
    subtitle: 'Right in Your Neighborhood',
    description:
      'Find movie screenings happening near you. Browse now playing and upcoming shows hosted by people around your area.',
    icon: <MapPin size={64} color="#fff" strokeWidth={1.5} />,
  },
  {
    id: '3',
    title: 'Join the Party',
    subtitle: 'Grab a Seat & Enjoy',
    description:
      'Book your seat, grab some snacks, and enjoy the show. Rate your experience and request movies you want to watch next.',
    icon: <Users size={64} color="#fff" strokeWidth={1.5} />,
  },
];

export default function OnboardingScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const { colors } = useTheme();

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

  const renderSlide = ({ item, index }: { item: SlideData; index: number }) => {
    const inputRange = [(index - 1) * width, index * width, (index + 1) * width];
    const iconScale = scrollX.interpolate({
      inputRange,
      outputRange: [0.6, 1, 0.6],
      extrapolate: 'clamp',
    });
    const textOpacity = scrollX.interpolate({
      inputRange,
      outputRange: [0, 1, 0],
      extrapolate: 'clamp',
    });
    const translateY = scrollX.interpolate({
      inputRange,
      outputRange: [40, 0, 40],
      extrapolate: 'clamp',
    });

    return (
      <View style={[styles.slide, { backgroundColor: colors.background }]}>
        <View style={[styles.bgShape, { backgroundColor: hero + '15' }]} />

        <Animated.View
          style={[
            styles.iconContainer,
            { backgroundColor: hero, transform: [{ scale: iconScale }] },
          ]}
        >
          {item.icon}
        </Animated.View>

        <Animated.View style={{ opacity: textOpacity, transform: [{ translateY }] }}>
          <Text style={[styles.subtitle, { color: colors.textSecondary, fontFamily: Fonts.semiBold }]}>
            {item.subtitle}
          </Text>
          <Text style={[styles.title, { color: colors.text, fontFamily: Fonts.heroExtraBold }]}>
            {item.title}
          </Text>
          <Text style={[styles.description, { color: colors.textSecondary, fontFamily: Fonts.regular }]}>
            {item.description}
          </Text>
        </Animated.View>
      </View>
    );
  };

  const isLastSlide = currentIndex === slides.length - 1;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Animated.FlatList
        ref={flatListRef}
        data={slides}
        renderItem={renderSlide}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false },
        )}
        scrollEventThrottle={16}
        bounces={false}
      />

      <View style={styles.footer}>
        <View style={styles.indicators}>
          {slides.map((_, index) => {
            const inputRange = [(index - 1) * width, index * width, (index + 1) * width];
            const dotWidth = scrollX.interpolate({
              inputRange,
              outputRange: [8, 28, 8],
              extrapolate: 'clamp',
            });
            const dotOpacity = scrollX.interpolate({
              inputRange,
              outputRange: [0.3, 1, 0.3],
              extrapolate: 'clamp',
            });
            return (
              <Animated.View
                key={index}
                style={[
                  styles.indicator,
                  {
                    width: dotWidth,
                    opacity: dotOpacity,
                    backgroundColor: hero,
                  },
                ]}
              />
            );
          })}
        </View>

        <View style={styles.buttons}>
          <TouchableOpacity
            onPress={handleComplete}
            style={[styles.btn, styles.skipButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            <Text style={[styles.skipText, { color: colors.textSecondary, fontFamily: Fonts.semiBold }]}>Skip</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleNext}
            style={[styles.btn, styles.nextButton]}
          >
            <Text style={[styles.nextText, { fontFamily: Fonts.bold }]}>
              {isLastSlide ? 'Get Started' : 'Next'}
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
  },
  slide: {
    width,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  bgShape: {
    position: 'absolute',
    top: -width * 0.3,
    width: width * 1.4,
    height: width * 1.4,
    borderRadius: width * 0.7,
    opacity: 0.45,
  },
  iconContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 36,
    shadowColor: '#FF004F',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 12,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  title: {
    fontSize: 32,
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 26,
    paddingHorizontal: 8,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 48,
  },
  indicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 28,
  },
  indicator: {
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
  },
  btn: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipButton: {
    borderWidth: 1,
  },
  skipText: {
    fontSize: 16,
  },
  nextButton: {
    backgroundColor: '#FF004F',
    shadowColor: '#FF004F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  nextText: {
    fontSize: 16,
    color: '#FFFFFF',
  },
});
