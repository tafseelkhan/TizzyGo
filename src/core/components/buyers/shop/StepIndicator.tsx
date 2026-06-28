// components/StepIndicator.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../../../contexts/theme/ThemeContext'; // Adjust path as needed

// Define the step type
interface Step {
  title: string;
  key: string;
}

// Define the component props interface
interface StepIndicatorProps {
  currentStep: number;
  steps: Step[];
  onStepPress: (index: number) => void;
  isDark?: boolean; // Optional override
}

const StepIndicator: React.FC<StepIndicatorProps> = ({
  currentStep,
  steps,
  onStepPress,
  isDark: propIsDark,
}) => {
  // Get theme from context if available
  const { isDark: contextIsDark } = useTheme();
  const isDark = propIsDark !== undefined ? propIsDark : contextIsDark;

  // Dynamic styles based on theme
  const dynamicStyles = getDynamicStyles(isDark);

  return (
    <View style={[styles.container, dynamicStyles.container]}>
      {steps.map((step: Step, index: number) => (
        <TouchableOpacity
          key={step.key}
          style={styles.stepItem}
          onPress={() => onStepPress(index)}
          disabled={index > currentStep}
        >
          <View
            style={[
              styles.stepCircle,
              index === currentStep && styles.activeStepCircle,
              index < currentStep && styles.completedStepCircle,
              dynamicStyles.stepCircle,
              index === currentStep && dynamicStyles.activeStepCircle,
              index < currentStep && dynamicStyles.completedStepCircle,
            ]}
          >
            {index < currentStep ? (
              <Text
                style={[
                  styles.completedStepText,
                  dynamicStyles.completedStepText,
                ]}
              >
                ✓
              </Text>
            ) : (
              <Text
                style={[
                  styles.stepNumber,
                  index === currentStep && styles.activeStepText,
                  dynamicStyles.stepNumber,
                  index === currentStep && dynamicStyles.activeStepText,
                ]}
              >
                {index + 1}
              </Text>
            )}
          </View>
          <Text
            style={[
              styles.stepTitle,
              index === currentStep && styles.activeStepTitle,
              index < currentStep && styles.completedStepTitle,
              dynamicStyles.stepTitle,
              index === currentStep && dynamicStyles.activeStepTitle,
              index < currentStep && dynamicStyles.completedStepTitle,
            ]}
          >
            {step.title}
          </Text>
        </TouchableOpacity>
      ))}

      {/* Connecting Lines */}
      <View style={[styles.lineContainer, dynamicStyles.lineContainer]}>
        {steps.slice(0, steps.length - 1).map((_: Step, index: number) => (
          <View
            key={`line-${index}`}
            style={[
              styles.connectingLine,
              index < currentStep && styles.completedLine,
              dynamicStyles.connectingLine,
              index < currentStep && dynamicStyles.completedLine,
            ]}
          />
        ))}
      </View>
    </View>
  );
};

const getDynamicStyles = (isDark: boolean) => {
  return StyleSheet.create({
    container: {
      backgroundColor: isDark ? '#1E293B' : '#fff',
    },
    stepCircle: {
      backgroundColor: isDark ? '#2D3748' : '#f0f0f0',
      borderColor: isDark ? '#4A5568' : '#ddd',
    },
    activeStepCircle: {
      backgroundColor: isDark ? '#38A169' : '#2ecc71',
      borderColor: isDark ? '#2F855A' : '#27ae60',
    },
    completedStepCircle: {
      backgroundColor: isDark ? '#38A169' : '#2ecc71',
      borderColor: isDark ? '#2F855A' : '#27ae60',
    },
    stepNumber: {
      color: isDark ? '#CBD5E0' : '#666',
    },
    activeStepText: {
      color: '#fff',
    },
    completedStepText: {
      color: '#fff',
    },
    stepTitle: {
      color: isDark ? '#A0AEC0' : '#999',
    },
    activeStepTitle: {
      color: isDark ? '#68D391' : '#2ecc71',
    },
    completedStepTitle: {
      color: isDark ? '#68D391' : '#2ecc71',
    },
    lineContainer: {
      left: 20,
      right: 20,
    },
    connectingLine: {
      backgroundColor: isDark ? '#4A5568' : '#ddd',
    },
    completedLine: {
      backgroundColor: isDark ? '#68D391' : '#2ecc71',
    },
  });
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    position: 'relative',
  },
  stepItem: {
    alignItems: 'center',
    zIndex: 2,
  },
  stepCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 2,
  },
  activeStepCircle: {},
  completedStepCircle: {},
  stepNumber: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  activeStepText: {},
  completedStepText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  stepTitle: {
    fontSize: 12,
    fontWeight: '500',
  },
  activeStepTitle: {
    fontWeight: 'bold',
  },
  completedStepTitle: {
    fontWeight: 'bold',
  },
  lineContainer: {
    position: 'absolute',
    top: 34,
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 1,
  },
  connectingLine: {
    flex: 1,
    height: 2,
    marginHorizontal: 18,
  },
  completedLine: {},
});

export default StepIndicator;
