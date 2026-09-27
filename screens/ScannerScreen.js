import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Alert,
  Animated,
  Platform,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImageManipulator from 'expo-image-manipulator';
import { analyzeMCQFromImage } from '../services/geminiService';
import AnswerOverlay from '../components/AnswerOverlay';

const { width, height } = Dimensions.get('window');
const CAPTURE_INTERVAL_MS = 2500; // capture every 2.5 seconds

export default function ScannerScreen({ route }) {
  const { apiKey } = route.params;
  const cameraRef = useRef(null);

  const [permission, requestPermission] = useCameraPermissions();
  const [isScanning, setIsScanning] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [captureCount, setCaptureCount] = useState(0);
  const [facing, setFacing] = useState('back');

  const intervalRef = useRef(null);
  const isProcessingRef = useRef(false);

  // Animations
  const scanLineAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const statusOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Scan line animation
    Animated.loop(
      Animated.timing(scanLineAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      })
    ).start();

    return () => {
      stopScanning();
    };
  }, []);

  useEffect(() => {
    if (isScanning) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.3, duration: 600, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      ).start();

      Animated.timing(statusOpacity, { toValue: 1, duration: 300, useNativeDriver: true }).start();
    } else {
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);
      Animated.timing(statusOpacity, { toValue: 0, duration: 300, useNativeDriver: true }).start();
    }
  }, [isScanning]);

  const captureAndAnalyze = useCallback(async () => {
    if (!cameraRef.current || isProcessingRef.current) return;

    isProcessingRef.current = true;
    setIsProcessing(true);
    setError(null);

    try {
      // Take a photo
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.7,
        base64: false,
        skipProcessing: true,
      });

      // Compress & resize for faster API calls
      const manipResult = await ImageManipulator.manipulateAsync(
        photo.uri,
        [{ resize: { width: 1024 } }],
        { compress: 0.75, format: ImageManipulator.SaveFormat.JPEG, base64: true }
      );

      setCaptureCount((c) => c + 1);

      // Send to Gemini
      const mcqResult = await analyzeMCQFromImage(manipResult.base64, apiKey);

      if (mcqResult.error) {
        setError(mcqResult.error);
        setResult(null);
      } else {
        setResult(mcqResult);
        setError(null);
      }
    } catch (err) {
      console.error('Capture/analyze error:', err);
      setError(err.message || 'Failed to analyze image');
    } finally {
      isProcessingRef.current = false;
      setIsProcessing(false);
    }
  }, [apiKey]);

  const startScanning = useCallback(() => {
    setIsScanning(true);
    setResult(null);
    setError(null);

    // Immediate first capture
    captureAndAnalyze();

    // Then repeat every CAPTURE_INTERVAL_MS
    intervalRef.current = setInterval(captureAndAnalyze, CAPTURE_INTERVAL_MS);
  }, [captureAndAnalyze]);

  const stopScanning = useCallback(() => {
    setIsScanning(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const handleToggleScanning = () => {
    if (isScanning) {
      stopScanning();
    } else {
      startScanning();
    }
  };

  const handleClearResult = () => {
    setResult(null);
    setError(null);
  };

  const handleFlipCamera = () => {
    setFacing((f) => (f === 'back' ? 'front' : 'back'));
  };

  if (!permission) {
    return (
      <View style={styles.centeredContainer}>
        <Text style={styles.centerText}>Requesting camera permissions...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.centeredContainer}>
        <Text style={styles.permissionIcon}>📷</Text>
        <Text style={styles.permissionTitle}>Camera Access Required</Text>
        <Text style={styles.permissionDesc}>
          MCQ Solver needs camera access to scan questions in real-time.
        </Text>
        <TouchableOpacity style={styles.permissionBtn} onPress={requestPermission}>
          <Text style={styles.permissionBtnText}>Grant Camera Access</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const scanLineTranslateY = scanLineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, height * 0.55],
  });

  return (
    <View style={styles.container}>
      {/* Camera View */}
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing={facing}
        mode="picture"
        animateShutter={false}
        autofocus="on"
      />

      {/* Scan frame overlay */}
      <View style={styles.scanOverlay} pointerEvents="none">
        {/* Corner markers */}
        <View style={styles.scanFrame}>
          <View style={[styles.corner, styles.cornerTL]} />
          <View style={[styles.corner, styles.cornerTR]} />
          <View style={[styles.corner, styles.cornerBL]} />
          <View style={[styles.corner, styles.cornerBR]} />

          {/* Scan line (only when scanning) */}
          {isScanning && (
            <Animated.View
              style={[
                styles.scanLine,
                { transform: [{ translateY: scanLineTranslateY }] },
              ]}
            />
          )}
        </View>

        {/* Hint text */}
        <Text style={styles.hintText}>
          {isScanning
            ? isProcessing
              ? '⚡ Analyzing...'
              : `🔍 Scanning · ${captureCount} frames`
            : 'Point camera at MCQ question'}
        </Text>
      </View>

      {/* Answer Overlay */}
      {result && (
        <AnswerOverlay result={result} onDismiss={handleClearResult} />
      )}

      {/* Error Banner */}
      {error && !result && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>⚠️ {error}</Text>
        </View>
      )}

      {/* Bottom Controls */}
      <View style={styles.controls}>
        {/* Flip Camera */}
        <TouchableOpacity style={styles.sideBtn} onPress={handleFlipCamera}>
          <Text style={styles.sideBtnIcon}>🔄</Text>
        </TouchableOpacity>

        {/* Main Scan Button */}
        <TouchableOpacity
          style={[styles.mainBtn, isScanning && styles.mainBtnActive]}
          onPress={handleToggleScanning}
          activeOpacity={0.85}
        >
          <Animated.View style={{ transform: [{ scale: isScanning ? pulseAnim : 1 }] }}>
            <Text style={styles.mainBtnIcon}>{isScanning ? '⏹' : '▶'}</Text>
          </Animated.View>
          <Text style={styles.mainBtnLabel}>
            {isScanning ? 'Stop' : 'Scan'}
          </Text>
        </TouchableOpacity>

        {/* Clear Result */}
        <TouchableOpacity
          style={[styles.sideBtn, !result && { opacity: 0.3 }]}
          onPress={handleClearResult}
          disabled={!result}
        >
          <Text style={styles.sideBtnIcon}>🗑️</Text>
        </TouchableOpacity>
      </View>

      {/* Status indicator */}
      <Animated.View style={[styles.statusBadge, { opacity: statusOpacity }]}>
        <View style={styles.statusDot} />
        <Text style={styles.statusText}>LIVE</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  centeredContainer: {
    flex: 1,
    backgroundColor: '#0A0A12',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  centerText: {
    color: '#8888AA',
    fontSize: 16,
  },
  permissionIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  permissionDesc: {
    fontSize: 14,
    color: '#8888AA',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 30,
  },
  permissionBtn: {
    backgroundColor: '#6C63FF',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 28,
  },
  permissionBtnText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },
  // Scan overlay
  scanOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanFrame: {
    width: width * 0.88,
    height: height * 0.55,
    position: 'relative',
    overflow: 'hidden',
  },
  corner: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderColor: '#6C63FF',
    borderWidth: 3,
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: 4,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: 4,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: 4,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: 4,
  },
  scanLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#6C63FF',
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 8,
  },
  hintText: {
    marginTop: 16,
    color: '#FFFFFFCC',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    backgroundColor: '#00000055',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    overflow: 'hidden',
  },
  // Error
  errorBanner: {
    position: 'absolute',
    bottom: 120,
    left: 20,
    right: 20,
    backgroundColor: '#FF4B4B22',
    borderWidth: 1,
    borderColor: '#FF4B4B66',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  errorText: {
    color: '#FF8080',
    fontSize: 13,
    textAlign: 'center',
  },
  // Controls
  controls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 110,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 28,
    backgroundColor: '#00000088',
    paddingBottom: Platform.OS === 'ios' ? 24 : 8,
  },
  mainBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#6C63FF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  mainBtnActive: {
    backgroundColor: '#FF4B6E',
    shadowColor: '#FF4B6E',
  },
  mainBtnIcon: {
    fontSize: 24,
  },
  mainBtnLabel: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
  sideBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFFFFF22',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFFFFF33',
  },
  sideBtnIcon: {
    fontSize: 22,
  },
  // Status badge
  statusBadge: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 56 : 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF4B4B',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    gap: 5,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFF',
  },
  statusText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
});
