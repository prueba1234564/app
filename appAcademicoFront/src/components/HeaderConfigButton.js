import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function HeaderConfigButton({ navigation }) {
  return (
    <Pressable
      accessibilityLabel="Abrir configuración"
      onPress={() => navigation.navigate('Config')}
      style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
    >
      <Ionicons name="settings-outline" size={22} color="#ffffff" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.24)',
  },
  buttonPressed: {
    opacity: 0.75,
  },
});
