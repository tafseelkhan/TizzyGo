import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';

const EmiOption: React.FC = () => {
  return (
    <TouchableOpacity style={styles.emiButton}>
      <FontAwesome5 name="credit-card" size={15} color="#FFFFFF" />
      <Text style={styles.emiButtonText}>EMI</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  emiButton: {
    width: '80%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 140, 255, 1)',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  emiButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default EmiOption;