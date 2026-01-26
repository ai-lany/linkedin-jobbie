import React from 'react';
import { View, Text, StyleSheet, Dimensions, useColorScheme } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import JobCard from './JobCard';
import { Job, SwipeDirection } from '../types/job';
import { Colors, SwipeConfig } from '../constants/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SWIPE_THRESHOLD = SwipeConfig.swipeThreshold;

interface SwipeableJobCardProps {
  job: Job;
  onSwipe: (direction: SwipeDirection) => void;
  onPress: () => void;
  isActive: boolean;
  index: number;
}

export default function SwipeableJobCard({
  job,
  onSwipe,
  onPress,
  isActive,
  index,
}: SwipeableJobCardProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(isActive ? 1 : 0.95);

  const handleSwipe = (direction: SwipeDirection) => {
    onSwipe(direction);
  };

  const panGesture = Gesture.Pan()
    .enabled(isActive)
    .onUpdate((event) => {
      translateX.value = event.translationX;
      translateY.value = event.translationY;
    })
    .onEnd((event) => {
      const swipedRight = translateX.value > SWIPE_THRESHOLD;
      const swipedLeft = translateX.value < -SWIPE_THRESHOLD;
      const swipedUp = translateY.value < -SWIPE_THRESHOLD * 1.5;

      if (swipedRight) {
        // Swipe right - interested
        translateX.value = withTiming(SCREEN_WIDTH * 1.5, { duration: 300 });
        translateY.value = withTiming(event.translationY * 2, { duration: 300 });
        runOnJS(handleSwipe)('right');
      } else if (swipedLeft) {
        // Swipe left - not interested
        translateX.value = withTiming(-SCREEN_WIDTH * 1.5, { duration: 300 });
        translateY.value = withTiming(event.translationY * 2, { duration: 300 });
        runOnJS(handleSwipe)('left');
      } else if (swipedUp) {
        // Swipe up - save for later
        translateY.value = withTiming(-SCREEN_HEIGHT, { duration: 300 });
        runOnJS(handleSwipe)('up');
      } else {
        // Return to center
        translateX.value = withSpring(0, { damping: 15, stiffness: 200 });
        translateY.value = withSpring(0, { damping: 15, stiffness: 200 });
      }
    });

  const cardStyle = useAnimatedStyle(() => {
    const rotation = interpolate(
      translateX.value,
      [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
      [-15, 0, 15],
      Extrapolation.CLAMP
    );

    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotate: `${rotation}deg` },
        { scale: scale.value },
      ],
    };
  });

  // Like indicator (right swipe)
  const likeOpacity = useAnimatedStyle(() => {
    const opacity = interpolate(
      translateX.value,
      [0, SWIPE_THRESHOLD / 2, SWIPE_THRESHOLD],
      [0, 0.5, 1],
      Extrapolation.CLAMP
    );
    return { opacity };
  });

  // Nope indicator (left swipe)
  const nopeOpacity = useAnimatedStyle(() => {
    const opacity = interpolate(
      translateX.value,
      [0, -SWIPE_THRESHOLD / 2, -SWIPE_THRESHOLD],
      [0, 0.5, 1],
      Extrapolation.CLAMP
    );
    return { opacity };
  });

  // Save indicator (up swipe)
  const saveOpacity = useAnimatedStyle(() => {
    const opacity = interpolate(
      translateY.value,
      [0, -SWIPE_THRESHOLD / 2, -SWIPE_THRESHOLD],
      [0, 0.5, 1],
      Extrapolation.CLAMP
    );
    return { opacity };
  });

  // Stack effect for background cards
  const stackStyle = useAnimatedStyle(() => {
    if (isActive) return {};
    return {
      transform: [{ scale: 0.95 - index * 0.02 }, { translateY: index * 8 }],
    };
  });

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={[styles.cardWrapper, cardStyle, stackStyle]}>
        {/* Swipe Indicators */}
        <Animated.View style={[styles.indicator, styles.likeIndicator, likeOpacity]}>
          <View style={[styles.indicatorBadge, { borderColor: colors.swipeRight }]}>
            <Ionicons name="checkmark" size={40} color={colors.swipeRight} />
            <Text style={[styles.indicatorText, { color: colors.swipeRight }]}>INTERESTED</Text>
          </View>
        </Animated.View>

        <Animated.View style={[styles.indicator, styles.nopeIndicator, nopeOpacity]}>
          <View style={[styles.indicatorBadge, { borderColor: colors.swipeLeft }]}>
            <Ionicons name="close" size={40} color={colors.swipeLeft} />
            <Text style={[styles.indicatorText, { color: colors.swipeLeft }]}>SKIP</Text>
          </View>
        </Animated.View>

        <Animated.View style={[styles.indicator, styles.saveIndicator, saveOpacity]}>
          <View style={[styles.indicatorBadge, { borderColor: colors.swipeUp }]}>
            <Ionicons name="bookmark" size={32} color={colors.swipeUp} />
            <Text style={[styles.indicatorText, { color: colors.swipeUp }]}>SAVE</Text>
          </View>
        </Animated.View>

        <JobCard job={job} onPress={onPress} />
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  cardWrapper: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  indicator: {
    position: 'absolute',
    zIndex: 10,
  },
  likeIndicator: {
    top: 40,
    left: 20,
    transform: [{ rotate: '-20deg' }],
  },
  nopeIndicator: {
    top: 40,
    right: 20,
    transform: [{ rotate: '20deg' }],
  },
  saveIndicator: {
    bottom: 100,
    alignSelf: 'center',
  },
  indicatorBadge: {
    borderWidth: 4,
    borderRadius: 8,
    padding: 8,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  indicatorText: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 2,
  },
});