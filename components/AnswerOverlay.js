import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  ScrollView,
  Platform,
} from 'react-native';

const { width, height } = Dimensions.get('window');

const OPTION_COLORS = {
  correct: {
    bg: '#00C87722',
    border: '#00C877',
    text: '#00FF99',
    label: '#00FF99',
    badge: '#00C877',
  },
  neutral: {
    bg: '#1A1A2E',
    border: '#2A2A45',
    text: '#CCCCDD',
    label: '#8888AA',
    badge: '#2A2A45',
  },
};

export default function AnswerOverlay({ result, onDismiss }) {
  const slideAnim = useRef(new Animated.Value(height)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 70,
        friction: 10,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 80,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, [result]);

  const handleDismiss = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: height,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => onDismiss());
  };

  if (!result) return null;

  const { question, options, correctAnswer, reason } = result;

  return (
    <Animated.View
      style={[
        styles.backdrop,
        { opacity: fadeAnim },
      ]}
    >
      <Animated.View
        style={[
          styles.sheet,
          {
            transform: [
              { translateY: slideAnim },
              { scale: scaleAnim },
            ],
          },
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.handle} />
          <View style={styles.headerRow}>
            <View style={styles.solvedBadge}>
              <Text style={styles.solvedBadgeText}>✓ SOLVED</Text>
            </View>
            <TouchableOpacity onPress={handleDismiss} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Question */}
          {question && (
            <View style={styles.questionBox}>
              <Text style={styles.questionLabel}>QUESTION</Text>
              <Text style={styles.questionText}>{question}</Text>
            </View>
          )}

          {/* Options */}
          {options && options.length > 0 && (
            <View style={styles.optionsSection}>
              <Text style={styles.sectionLabel}>OPTIONS</Text>
              {options.map((option, idx) => {
                const isCorrect =
                  option.label?.toUpperCase() === correctAnswer?.toUpperCase();
                const colors = isCorrect ? OPTION_COLORS.correct : OPTION_COLORS.neutral;

                return (
                  <Animated.View
                    key={idx}
                    style={[
                      styles.optionRow,
                      {
                        backgroundColor: colors.bg,
                        borderColor: colors.border,
                        transform: isCorrect ? [{ scale: 1.01 }] : [],
                      },
                    ]}
                  >
                    {/* Label badge */}
                    <View
                      style={[styles.labelBadge, { backgroundColor: colors.badge }]}
                    >
                      <Text
                        style={[
                          styles.labelText,
                          { color: isCorrect ? '#001F0F' : '#AAAACC' },
                        ]}
                      >
                        {option.label}
                      </Text>
                    </View>

                    {/* Option text */}
                    <Text style={[styles.optionText, { color: colors.text }]}>
                      {option.text}
                    </Text>

                    {/* Correct indicator */}
                    {isCorrect && (
                      <View style={styles.correctBadge}>
                        <Text style={styles.correctBadgeText}>✓</Text>
                      </View>
                    )}
                  </Animated.View>
                );
              })}
            </View>
          )}

          {/* Answer highlight */}
          <View style={styles.answerHighlight}>
            <Text style={styles.answerLabel}>CORRECT ANSWER</Text>
            <Text style={styles.answerValue}>{correctAnswer}</Text>
          </View>

          {/* Reason */}
          {reason && (
            <View style={styles.reasonBox}>
              <Text style={styles.reasonLabel}>💡 EXPLANATION</Text>
              <Text style={styles.reasonText}>{reason}</Text>
            </View>
          )}
        </ScrollView>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#00000088',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#0E0E1F',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: height * 0.82,
    borderWidth: 1,
    borderColor: '#2A2A45',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 20,
  },
  header: {
    paddingTop: 12,
    paddingHorizontal: 20,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A30',
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#3A3A55',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  solvedBadge: {
    backgroundColor: '#00C87733',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#00C87755',
  },
  solvedBadgeText: {
    color: '#00FF99',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2A2A40',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtnText: {
    color: '#9999BB',
    fontSize: 14,
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  // Question
  questionBox: {
    backgroundColor: '#12122A',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2A2A45',
  },
  questionLabel: {
    color: '#6C63FF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  questionText: {
    color: '#EEEEFF',
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '500',
  },
  // Options
  optionsSection: {
    marginBottom: 16,
  },
  sectionLabel: {
    color: '#6666AA',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 10,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 14,
    marginBottom: 8,
    gap: 12,
  },
  labelBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  labelText: {
    fontSize: 14,
    fontWeight: '800',
  },
  optionText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  correctBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#00C877',
    justifyContent: 'center',
    alignItems: 'center',
  },
  correctBadgeText: {
    color: '#001F0F',
    fontSize: 13,
    fontWeight: '900',
  },
  // Answer highlight
  answerHighlight: {
    backgroundColor: '#00C87718',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#00C87755',
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  answerLabel: {
    color: '#00C877',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  answerValue: {
    color: '#00FF99',
    fontSize: 28,
    fontWeight: '900',
  },
  // Reason
  reasonBox: {
    backgroundColor: '#16162E',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#6C63FF33',
    padding: 14,
  },
  reasonLabel: {
    color: '#6C63FF',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  reasonText: {
    color: '#AAAACC',
    fontSize: 13,
    lineHeight: 20,
  },
});
