import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

function SkeletonBox({ width, height, borderRadius = 8, style }) {
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        { width, height, borderRadius, backgroundColor: '#e2e8f0' },
        { opacity },
        style,
      ]}
    />
  );
}

export function SkeletonCard({ style }) {
  return (
    <View style={[s.card, style]}>
      <View style={s.row}>
        <SkeletonBox width={44} height={44} borderRadius={14} />
        <View style={{ flex: 1, gap: 8 }}>
          <SkeletonBox width="70%" height={14} borderRadius={6} />
          <SkeletonBox width="45%" height={11} borderRadius={6} />
        </View>
      </View>
      <SkeletonBox width="100%" height={11} borderRadius={6} style={{ marginTop: 12 }} />
      <SkeletonBox width="80%" height={11} borderRadius={6} style={{ marginTop: 6 }} />
    </View>
  );
}

export function SkeletonStatCard({ style }) {
  return (
    <View style={[s.statCard, style]}>
      <SkeletonBox width={44} height={44} borderRadius={14} />
      <SkeletonBox width={36} height={26} borderRadius={6} style={{ marginTop: 10 }} />
      <SkeletonBox width={50} height={10} borderRadius={6} style={{ marginTop: 6 }} />
    </View>
  );
}

export function SkeletonList({ count = 3, CardComponent = SkeletonCard }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <CardComponent key={i} style={{ marginBottom: 12 }} />
      ))}
    </>
  );
}

const s = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 3,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  statCard: {
    width: '31%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 3,
  },
});
