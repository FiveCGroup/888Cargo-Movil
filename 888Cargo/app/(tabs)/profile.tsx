import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuthContext } from '../../context/AuthContext';
import { Colors } from '../../constants/Colors';
import { createThemeStyles } from '../../constants/Theme';
import { useColorScheme } from '../../hooks/useColorScheme';
import Logo888Cargo from '../../components/Logo888Cargo';
import { profileScreenStyles } from '../../styles/screens/ProfileScreen.styles';

export default function ProfileScreen() {
    const { user } = useAuthContext();
    const colorScheme = useColorScheme();
    const themeStyles = createThemeStyles(colorScheme ?? 'light');
    const colors = Colors[colorScheme ?? 'light'];

    return (
        <View style={[themeStyles.container, profileScreenStyles.container]}>
            <View style={profileScreenStyles.headerContainer}>
                <Logo888Cargo size="small" layout="horizontal" showText={true} />
            </View>
            
            <View style={[themeStyles.card, profileScreenStyles.profileContainer]}>
                <View style={[profileScreenStyles.avatarContainer, { backgroundColor: colors.primary }]}>
                    <Text style={[profileScreenStyles.avatarText, { color: colors.textLight }]}>
                        {user?.name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'U'}
                    </Text>
                </View>
                
                <Text style={[profileScreenStyles.userName, { color: colors.primary }]}>
                    {user?.name || 'Usuario'}
                </Text>
                
                <Text style={[profileScreenStyles.userEmail, { color: colors.textMuted }]}>
                    {user?.email}
                </Text>

                {user?.role && (
                    <View style={[profileScreenStyles.roleContainer, { backgroundColor: colors.light }]}>
                        <Text style={[profileScreenStyles.roleText, { color: colors.success }]}>
                            {user.role}
                        </Text>
                    </View>
                )}
            </View>

            <View style={[themeStyles.card, profileScreenStyles.menuContainer]}>
                <TouchableOpacity style={[profileScreenStyles.menuItem, { borderBottomColor: colors.borderLight }]}>
                    <View style={profileScreenStyles.menuItemContent}>
                        <MaterialIcons name="settings" size={24} color={colors.primary} />
                        <Text style={[profileScreenStyles.menuItemText, { color: colors.textPrimary }]}>
                            Configuración
                        </Text>
                    </View>
                </TouchableOpacity>
                
                <TouchableOpacity style={[profileScreenStyles.menuItem, { borderBottomColor: colors.borderLight }]}>
                    <View style={profileScreenStyles.menuItemContent}>
                        <MaterialIcons name="analytics" size={24} color={colors.primary} />
                        <Text style={[profileScreenStyles.menuItemText, { color: colors.textPrimary }]}>
                            Estadísticas
                        </Text>
                    </View>
                </TouchableOpacity>
                
                <TouchableOpacity style={[profileScreenStyles.menuItem, { borderBottomColor: colors.borderLight }]}>
                    <View style={profileScreenStyles.menuItemContent}>
                        <MaterialIcons name="help" size={24} color={colors.primary} />
                        <Text style={[profileScreenStyles.menuItemText, { color: colors.textPrimary }]}>
                            Ayuda
                        </Text>
                    </View>
                </TouchableOpacity>
                
                <TouchableOpacity style={[profileScreenStyles.menuItem, { borderBottomWidth: 0 }]}>
                    <View style={profileScreenStyles.menuItemContent}>
                        <MaterialIcons name="info" size={24} color={colors.primary} />
                        <Text style={[profileScreenStyles.menuItemText, { color: colors.textPrimary }]}>
                            Acerca de
                        </Text>
                    </View>
                </TouchableOpacity>
            </View>
        </View>
    );
}
