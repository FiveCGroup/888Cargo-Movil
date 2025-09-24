import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import Modal from 'react-native-modal';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { customAlertStyles } from '../styles/components/CustomAlert.styles';
import { IconSizes } from '../constants/Icons';

const { width } = Dimensions.get('window');

export interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

export interface CustomAlertProps {
  visible: boolean;
  title: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error' | 'confirm';
  buttons?: AlertButton[];
  onClose: () => void;
}

const CustomAlert: React.FC<CustomAlertProps> = ({
  visible,
  title,
  message,
  type = 'info',
  buttons = [{ text: 'OK', style: 'default' }],
  onClose,
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const getIconConfig = () => {
    switch (type) {
      case 'success':
        return { name: 'checkmark.circle.fill', color: '#28a745' };
      case 'warning':
        return { name: 'exclamationmark.triangle.fill', color: '#ffc107' };
      case 'error':
        return { name: 'xmark.circle.fill', color: '#dc3545' };
      case 'confirm':
        return { name: 'questionmark.circle.fill', color: '#17a2b8' };
      default:
        return { name: 'info.circle.fill', color: '#007bff' };
    }
  };

  const getButtonStyle = (buttonStyle: string = 'default') => {
    switch (buttonStyle) {
      case 'cancel':
        return [customAlertStyles.button, customAlertStyles.cancelButton];
      case 'destructive':
        return [customAlertStyles.button, customAlertStyles.destructiveButton];
      default:
        return [customAlertStyles.button, customAlertStyles.defaultButton];
    }
  };

  const getButtonTextStyle = (buttonStyle: string = 'default') => {
    switch (buttonStyle) {
      case 'cancel':
        return [customAlertStyles.buttonText, { color: '#6c757d' }];
      case 'destructive':
        return [customAlertStyles.buttonText, { color: '#ffffff' }];
      default:
        return [customAlertStyles.buttonText, { color: '#ffffff' }];
    }
  };

  const iconConfig = getIconConfig();

  const handleButtonPress = (button: AlertButton) => {
    if (button.onPress) {
      button.onPress();
    }
    onClose();
  };

  return (
    <Modal
      isVisible={visible}
      animationIn="zoomIn"
      animationOut="zoomOut"
      backdropOpacity={0.5}
      onBackdropPress={onClose}
      useNativeDriver={true}
      hideModalContentWhileAnimating={true}
    >
      <View style={[customAlertStyles.container, { backgroundColor: colors.background }]}>
        {/* Ícono */}
        <View style={customAlertStyles.iconContainer}>
          <View style={[customAlertStyles.iconBackground, { backgroundColor: iconConfig.color + '20' }]}>
            <IconSymbol 
              name={iconConfig.name as any} 
              size={32} 
              color={iconConfig.color} 
            />
          </View>
        </View>

        {/* Título */}
        <Text style={[customAlertStyles.title, { color: colors.text }]}>
          {title}
        </Text>

        {/* Mensaje */}
        <Text style={[customAlertStyles.message, { color: colors.textMuted }]}>
          {message}
        </Text>

        {/* Botones */}
        <View style={customAlertStyles.buttonContainer}>
          {buttons.map((button, index) => (
            <TouchableOpacity
              key={index}
              style={getButtonStyle(button.style)}
              onPress={() => handleButtonPress(button)}
              activeOpacity={0.8}
            >
              <Text style={getButtonTextStyle(button.style)}>
                {button.text}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </Modal>
  );
};

export default CustomAlert;
