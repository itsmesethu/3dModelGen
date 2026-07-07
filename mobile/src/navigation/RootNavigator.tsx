import React from 'react';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import BackendConfigScreen from '../screens/BackendConfig/BackendConfigScreen';
import CameraScreen from '../screens/Camera/CameraScreen';
import Create3DScreen from '../screens/Create3D/Create3DScreen';
import HomeScreen from '../screens/Home/HomeScreen';
import ImageReviewScreen from '../screens/ImageReview/ImageReviewScreen';
import ProcessingScreen from '../screens/Processing/ProcessingScreen';
import ResultScreen from '../screens/Result/ResultScreen';
import VisualizeScreen from '../screens/Visualize/VisualizeScreen';
import { colors } from '../theme';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

const navTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.background,
    card: colors.surface,
    border: colors.border,
    primary: colors.primary,
    text: colors.text,
  },
};

export default function RootNavigator() {
  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.text,
          contentStyle: { backgroundColor: colors.background },
        }}>
        <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
        <Stack.Screen name="BackendConfig" component={BackendConfigScreen} options={{ title: 'Backend Configuration' }} />
        <Stack.Screen name="Visualize" component={VisualizeScreen} options={{ title: 'Visualize 3D' }} />
        <Stack.Screen name="Create3D" component={Create3DScreen} options={{ title: 'Create 3D' }} />
        <Stack.Screen name="Camera" component={CameraScreen} options={{ headerShown: false }} />
        <Stack.Screen name="ImageReview" component={ImageReviewScreen} options={{ title: 'Review Images' }} />
        <Stack.Screen
          name="Processing"
          component={ProcessingScreen}
          options={{ title: 'Generating Model', headerBackVisible: false, gestureEnabled: false }}
        />
        <Stack.Screen name="Result" component={ResultScreen} options={{ title: '3D Result', headerBackVisible: false }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
