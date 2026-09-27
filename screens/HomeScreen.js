import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');
const API_KEY_STORAGE = '@mcq_solver_api_key';

export default function HomeScreen({ navigation }) {
  const [apiKey, setApiKey] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showKey, setShowKey] = useState(false);

  // Animations
  const fadeAnim = new Animated.Value(0);
  const slideAnim = new Animated.Value(40);
  const pulseAnim = new Animated.Value(1);

  useEffect(() => {
    loadSavedKey();
    // Entry animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 700,
        useNativeDriver: true,
      }),
    ]).start();

    // Pulse animation for icon
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.08, duration: 1200, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const loadSavedKey = async () => {
    try {
      const saved = await AsyncStorage.getItem(API_KEY_STORAGE);
      if (saved) {
        setApiKey(saved);
      }
    } catch (e) {
      console.error('Failed to load API key', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStart = async () => {
    if (!apiKey.trim()) return;
    try {
      await AsyncStorage.setItem(API_KEY_STORAGE, apiKey.trim());
      navigation.navigate('Scanner', { apiKey: apiKey.trim() });
    } catch (e) {
      console.error('Failed to save API key', e);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Animated.View
          style={[
            styles.content,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          {/* Background decorative elements */}
          <View style={styles.bgCircle1} />
          <View style={styles.bgCircle2} />
          <View style={styles.bgCircle3} />

          {/* Logo & Title */}
          <View style={styles.header}>
            <Animated.View
              style={[styles.iconContainer, { transform: [{ scale: pulseAnim }] }]}
            >
              <Text style={styles.iconEmoji}>🎯</Text>
            </Animated.View>
            <Text style={styles.title}>MCQ Solver</Text>
            <Text style={styles.subtitle}>AI-Powered Instant Answer Detection</Text>
          </View>

          {/* Features */}
          <View style={styles.featuresRow}>
            {[
              { icon: '📷', label: 'Live Camera' },
              { icon: '⚡', label: 'Instant AI' },
              { icon: '✅', label: 'Highlighted' },
            ].map((f) => (
              <View key={f.label} style={styles.featureChip}>
                <Text style={styles.featureIcon}>{f.icon}</Text>
                <Text style={styles.featureLabel}>{f.label}</Text>
              </View>
            ))}
          </View>

          {/* Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Gemini API Key</Text>
            <Text style={styles.cardDesc}>
              Enter your Google Gemini 2.0 Flash API key to get started.
            </Text>

            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                value={apiKey}
                onChangeText={setApiKey}
                placeholder="AIza..."
                placeholderTextColor="#556"
                secureTextEntry={!showKey}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                style={styles.eyeBtn}
                onPress={() => setShowKey(!showKey)}
              >
                <Text style={styles.eyeIcon}>{showKey ? '🙈' : '👁️'}</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.startBtn, !apiKey.trim() && styles.startBtnDisabled]}
              onPress={handleStart}
              disabled={!apiKey.trim()}
              activeOpacity={0.85}
            >
              <Text style={styles.startBtnText}>Start Scanning →</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                // Open Gemini API key page hint
              }}
            >
              <Text style={styles.getKeyHint}>
                🔗 Get key at aistudio.google.com
              </Text>
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <Text style={styles.footer}>Powered by Gemini 2.0 Flash</Text>
        </Animated.View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A12',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0A0A12',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#8B8FF8',
    fontSize: 16,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  // Background decorative circles
  bgCircle1: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: '#6C63FF22',
    top: -80,
    right: -80,
  },
  bgCircle2: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#FF6B9D15',
    bottom: 100,
    left: -60,
  },
  bgCircle3: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#00D4FF10',
    top: height * 0.3,
    right: -40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: '#1A1A2E',
    borderWidth: 1,
    borderColor: '#6C63FF44',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  iconEmoji: {
    fontSize: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 14,
    color: '#8888AA',
    marginTop: 6,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  featuresRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  featureChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A2E',
    borderWidth: 1,
    borderColor: '#2A2A40',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    gap: 6,
  },
  featureIcon: {
    fontSize: 14,
  },
  featureLabel: {
    color: '#9999BB',
    fontSize: 12,
    fontWeight: '600',
  },
  card: {
    width: '100%',
    backgroundColor: '#12122A',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#2A2A45',
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  cardDesc: {
    fontSize: 13,
    color: '#7777AA',
    marginBottom: 20,
    lineHeight: 18,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0D0D1F',
    borderWidth: 1.5,
    borderColor: '#2A2A50',
    borderRadius: 14,
    marginBottom: 16,
    paddingRight: 12,
  },
  input: {
    flex: 1,
    color: '#EEEEFF',
    fontSize: 15,
    padding: 14,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  eyeBtn: {
    padding: 4,
  },
  eyeIcon: {
    fontSize: 18,
  },
  startBtn: {
    backgroundColor: '#6C63FF',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 14,
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 6,
  },
  startBtnDisabled: {
    backgroundColor: '#3A3A5A',
    shadowOpacity: 0,
  },
  startBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  getKeyHint: {
    color: '#6C8EFF',
    fontSize: 12,
    textAlign: 'center',
  },
  footer: {
    marginTop: 20,
    color: '#44445A',
    fontSize: 12,
    letterSpacing: 0.5,
  },
});
