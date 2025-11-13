// Alternativa para usar MaterialIcons en Android y web.

import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { SymbolWeight, SymbolViewProps } from 'expo-symbols';
import { ComponentProps } from 'react';
import { OpaqueColorValue, type StyleProp, type TextStyle } from 'react-native';

type IconMapping = Record<SymbolViewProps['name'], ComponentProps<typeof MaterialIcons>['name']>;
type IconSymbolName = keyof typeof MAPPING;

/**
 * Agrega aquí tus mapeos de SF Symbols a Material Icons.
 * - ver Material Icons en el [Directorio de Iconos](https://icons.expo.fyi).
 * - ver SF Symbols en la app [SF Symbols](https://developer.apple.com/sf-symbols/).
 */
const MAPPING = {
  'house.fill': 'home',
  'paperplane.fill': 'send',
  'chevron.left.forwardslash.chevron.right': 'code',
  'chevron.right': 'chevron-right',
  'cube.box.fill': 'inventory-2',
  'qrcode.viewfinder': 'qr-code-scanner',
  'person.fill': 'person',
  'book.fill': 'description', // Icono de documento/documentación
  'power': 'power-settings-new',
} as IconMapping;

/**
 * Un componente de icono que usa SF Symbols nativos en iOS, y Material Icons en Android y web.
 * Esto asegura una apariencia consistente entre plataformas y un uso óptimo de recursos.
 * Los `name`s de iconos están basados en SF Symbols y requieren mapeo manual a Material Icons.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  return <MaterialIcons color={color} size={size} name={MAPPING[name]} style={style} />;
}
