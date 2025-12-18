import React, { useState } from 'react';
import { Alert, Platform } from 'react-native';
import { Dialog, Portal, Button, Text } from 'react-native-paper';

interface AlertConfig {
  title: string;
  message: string;
  buttons?: Array<{
    text: string;
    onPress?: () => void;
    style?: 'default' | 'cancel' | 'destructive';
  }>;
}

export const useCrossPlatformAlert = () => {
  const [dialogVisible, setDialogVisible] = useState(false);
  const [currentAlert, setCurrentAlert] = useState<AlertConfig | null>(null);

  const showAlert = (config: AlertConfig) => {
    if (Platform.OS === 'web') {
      // Usar Dialog de react-native-paper en web
      setCurrentAlert(config);
      setDialogVisible(true);
    } else {
      // Usar Alert nativo en móvil
      Alert.alert(config.title, config.message, config.buttons?.map(btn => ({
        text: btn.text,
        onPress: btn.onPress,
        style: btn.style === 'destructive' ? 'destructive' : btn.style === 'cancel' ? 'cancel' : 'default'
      })));
    }
  };

  const hideDialog = () => {
    setDialogVisible(false);
    setCurrentAlert(null);
  };

  const AlertDialog = () => {
    if (!currentAlert) return null;

    return (
      <Portal>
        <Dialog visible={dialogVisible} onDismiss={hideDialog}>
          <Dialog.Title>{currentAlert.title}</Dialog.Title>
          <Dialog.Content>
            <Text>{currentAlert.message}</Text>
          </Dialog.Content>
          <Dialog.Actions>
            {currentAlert.buttons?.map((btn, index) => (
              <Button
                key={index}
                onPress={() => {
                  btn.onPress?.();
                  hideDialog();
                }}
                textColor={btn.style === 'destructive' ? '#d32f2f' : undefined}
              >
                {btn.text}
              </Button>
            )) || (
              <Button onPress={hideDialog}>OK</Button>
            )}
          </Dialog.Actions>
        </Dialog>
      </Portal>
    );
  };

  return {
    showAlert,
    AlertDialog
  };
};