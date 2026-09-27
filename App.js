import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import HomeScreen from './screens/HomeScreen';
import ScannerScreen from './screens/ScannerScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerStyle: {
            backgroundColor: '#0A0A12',
          },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: {
            fontWeight: '700',
            fontSize: 17,
          },
          contentStyle: {
            backgroundColor: '#0A0A12',
          },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Scanner"
          component={ScannerScreen}
          options={{
            title: 'MCQ Scanner',
            headerBackTitle: 'Setup',
            headerStyle: {
              backgroundColor: '#000000',
            },
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
