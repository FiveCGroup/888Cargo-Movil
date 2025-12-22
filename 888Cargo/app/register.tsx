// app/register.tsx  (o donde lo tengas la pantalla de registro)

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
  FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../services/api';
import { useCrossPlatformAlert } from '../hooks/useCrossPlatformAlert';
import CountryFlag from 'react-native-country-flag';
import { MaterialIcons } from '@expo/vector-icons';
import { styles } from '../styles/components/register.styles';

// Códigos de país ampliados para empresas de importaciones
const COUNTRY_CODES = [
  { label: '🇦🇫 Afganistán (+93)', code: '+93', country: 'Afganistán', flag: '🇦🇫', iso: 'AF', phoneLength: 9 },
  { label: '🇦🇱 Albania (+355)', code: '+355', country: 'Albania', flag: '🇦🇱', iso: 'AL', phoneLength: 9 },
  { label: '🇩🇿 Argelia (+213)', code: '+213', country: 'Argelia', flag: '🇩🇿', iso: 'DZ', phoneLength: 9 },
  { label: '🇦🇸 Samoa Americana (+1)', code: '+1', country: 'Samoa Americana', flag: '🇦🇸', iso: 'AS', phoneLength: 10 },
  { label: '🇦🇩 Andorra (+376)', code: '+376', country: 'Andorra', flag: '🇦🇩', iso: 'AD', phoneLength: 9 },
  { label: '🇦🇴 Angola (+244)', code: '+244', country: 'Angola', flag: '🇦🇴', iso: 'AO', phoneLength: 9 },
  { label: '🇦🇮 Anguila (+1)', code: '+1', country: 'Anguila', flag: '🇦🇮', iso: 'AI', phoneLength: 10 },
  { label: '🇦🇬 Antigua y Barbuda (+1)', code: '+1', country: 'Antigua y Barbuda', flag: '🇦🇬', iso: 'AG', phoneLength: 10 },
  { label: '🇦🇷 Argentina (+54)', code: '+54', country: 'Argentina', flag: '🇦🇷', iso: 'AR', phoneLength: 10 },
  { label: '🇦🇲 Armenia (+374)', code: '+374', country: 'Armenia', flag: '🇦🇲', iso: 'AM', phoneLength: 8 },
  { label: '🇦🇼 Aruba (+297)', code: '+297', country: 'Aruba', flag: '🇦🇼', iso: 'AW', phoneLength: 7 },
  { label: '🇦🇺 Australia (+61)', code: '+61', country: 'Australia', flag: '🇦🇺', iso: 'AU', phoneLength: 9 },
  { label: '🇦🇹 Austria (+43)', code: '+43', country: 'Austria', flag: '🇦🇹', iso: 'AT', phoneLength: 10 },
  { label: '🇦🇿 Azerbaiyán (+994)', code: '+994', country: 'Azerbaiyán', flag: '🇦🇿', iso: 'AZ', phoneLength: 9 },
  { label: '🇧🇸 Bahamas (+1)', code: '+1', country: 'Bahamas', flag: '🇧🇸', iso: 'BS', phoneLength: 10 },
  { label: '🇧🇭 Baréin (+973)', code: '+973', country: 'Baréin', flag: '🇧🇭', iso: 'BH', phoneLength: 8 },
  { label: '🇧🇩 Bangladés (+880)', code: '+880', country: 'Bangladés', flag: '🇧🇩', iso: 'BD', phoneLength: 10 },
  { label: '🇧🇧 Barbados (+1)', code: '+1', country: 'Barbados', flag: '🇧🇧', iso: 'BB', phoneLength: 10 },
  { label: '🇧🇾 Bielorrusia (+375)', code: '+375', country: 'Bielorrusia', flag: '🇧🇾', iso: 'BY', phoneLength: 9 },
  { label: '🇧🇪 Bélgica (+32)', code: '+32', country: 'Bélgica', flag: '🇧🇪', iso: 'BE', phoneLength: 9 },
  { label: '🇧🇿 Belice (+501)', code: '+501', country: 'Belice', flag: '🇧🇿', iso: 'BZ', phoneLength: 7 },
  { label: '🇧🇯 Benín (+229)', code: '+229', country: 'Benín', flag: '🇧🇯', iso: 'BJ', phoneLength: 8 },
  { label: '🇧🇲 Bermudas (+1)', code: '+1', country: 'Bermudas', flag: '🇧🇲', iso: 'BM', phoneLength: 10 },
  { label: '🇧🇹 Bután (+975)', code: '+975', country: 'Bután', flag: '🇧🇹', iso: 'BT', phoneLength: 8 },
  { label: '🇧🇴 Bolivia (+591)', code: '+591', country: 'Bolivia', flag: '🇧🇴', iso: 'BO', phoneLength: 8 },
  { label: '🇧🇦 Bosnia y Herzegovina (+387)', code: '+387', country: 'Bosnia y Herzegovina', flag: '🇧🇦', iso: 'BA', phoneLength: 8 },
  { label: '🇧🇼 Botsuana (+267)', code: '+267', country: 'Botsuana', flag: '🇧🇼', iso: 'BW', phoneLength: 8 },
  { label: '🇧🇷 Brasil (+55)', code: '+55', country: 'Brasil', flag: '🇧🇷', iso: 'BR', phoneLength: 11 },
  { label: '🇧🇳 Brunéi (+673)', code: '+673', country: 'Brunéi', flag: '🇧🇳', iso: 'BN', phoneLength: 7 },
  { label: '🇧🇬 Bulgaria (+359)', code: '+359', country: 'Bulgaria', flag: '🇧🇬', iso: 'BG', phoneLength: 9 },
  { label: '🇧🇫 Burkina Faso (+226)', code: '+226', country: 'Burkina Faso', flag: '🇧🇫', iso: 'BF', phoneLength: 8 },
  { label: '🇧🇮 Burundi (+257)', code: '+257', country: 'Burundi', flag: '🇧🇮', iso: 'BI', phoneLength: 8 },
  { label: '🇰🇭 Camboya (+855)', code: '+855', country: 'Camboya', flag: '🇰🇭', iso: 'KH', phoneLength: 9 },
  { label: '🇨🇲 Camerún (+237)', code: '+237', country: 'Camerún', flag: '🇨🇲', iso: 'CM', phoneLength: 9 },
  { label: '🇨🇦 Canadá (+1)', code: '+1', country: 'Canadá', flag: '🇨🇦', iso: 'CA', phoneLength: 10 },
  { label: '🇨🇻 Cabo Verde (+238)', code: '+238', country: 'Cabo Verde', flag: '🇨🇻', iso: 'CV', phoneLength: 7 },
  { label: '🇰🇾 Islas Caimán (+1)', code: '+1', country: 'Islas Caimán', flag: '🇰🇾', iso: 'KY', phoneLength: 10 },
  { label: '🇨🇫 República Centroafricana (+236)', code: '+236', country: 'República Centroafricana', flag: '🇨🇫', iso: 'CF', phoneLength: 8 },
  { label: '🇹🇩 Chad (+235)', code: '+235', country: 'Chad', flag: '🇹🇩', iso: 'TD', phoneLength: 8 },
  { label: '🇨🇱 Chile (+56)', code: '+56', country: 'Chile', flag: '🇨🇱', iso: 'CL', phoneLength: 9 },
  { label: '🇨🇳 China (+86)', code: '+86', country: 'China', flag: '🇨🇳', iso: 'CN', phoneLength: 11 },
  { label: '🇨🇴 Colombia (+57)', code: '+57', country: 'Colombia', flag: '🇨🇴', iso: 'CO', phoneLength: 10 },
  { label: '🇰🇲 Comoras (+269)', code: '+269', country: 'Comoras', flag: '🇰🇲', iso: 'KM', phoneLength: 7 },
  { label: '🇨🇬 Congo (+242)', code: '+242', country: 'Congo', flag: '🇨🇬', iso: 'CG', phoneLength: 9 },
  { label: '🇨🇩 República Democrática del Congo (+243)', code: '+243', country: 'República Democrática del Congo', flag: '🇨🇩', iso: 'CD', phoneLength: 9 },
  { label: '🇨🇰 Islas Cook (+682)', code: '+682', country: 'Islas Cook', flag: '🇨🇰', iso: 'CK', phoneLength: 5 },
  { label: '🇨🇷 Costa Rica (+506)', code: '+506', country: 'Costa Rica', flag: '🇨🇷', iso: 'CR', phoneLength: 8 },
  { label: '🇭🇷 Croacia (+385)', code: '+385', country: 'Croacia', flag: '🇭🇷', iso: 'HR', phoneLength: 9 },
  { label: '🇨🇺 Cuba (+53)', code: '+53', country: 'Cuba', flag: '🇨🇺', iso: 'CU', phoneLength: 8 },
  { label: '🇨🇾 Chipre (+357)', code: '+357', country: 'Chipre', flag: '🇨🇾', iso: 'CY', phoneLength: 8 },
  { label: '🇨🇿 República Checa (+420)', code: '+420', country: 'República Checa', flag: '🇨🇿', iso: 'CZ', phoneLength: 9 },
  { label: '🇩🇰 Dinamarca (+45)', code: '+45', country: 'Dinamarca', flag: '🇩🇰', iso: 'DK', phoneLength: 8 },
  { label: '🇩🇯 Yibuti (+253)', code: '+253', country: 'Yibuti', flag: '🇩🇯', iso: 'DJ', phoneLength: 8 },
  { label: '🇩🇲 Dominica (+1)', code: '+1', country: 'Dominica', flag: '🇩🇲', iso: 'DM', phoneLength: 10 },
  { label: '🇩🇴 República Dominicana (+1)', code: '+1', country: 'República Dominicana', flag: '🇩🇴', iso: 'DO', phoneLength: 10 },
  { label: '🇪🇨 Ecuador (+593)', code: '+593', country: 'Ecuador', flag: '🇪🇨', iso: 'EC', phoneLength: 9 },
  { label: '🇪🇬 Egipto (+20)', code: '+20', country: 'Egipto', flag: '🇪🇬', iso: 'EG', phoneLength: 10 },
  { label: '🇸🇻 El Salvador (+503)', code: '+503', country: 'El Salvador', flag: '🇸🇻', iso: 'SV', phoneLength: 8 },
  { label: '🇬🇶 Guinea Ecuatorial (+240)', code: '+240', country: 'Guinea Ecuatorial', flag: '🇬🇶', iso: 'GQ', phoneLength: 9 },
  { label: '🇪🇷 Eritrea (+291)', code: '+291', country: 'Eritrea', flag: '🇪🇷', iso: 'ER', phoneLength: 7 },
  { label: '🇪🇪 Estonia (+372)', code: '+372', country: 'Estonia', flag: '🇪🇪', iso: 'EE', phoneLength: 8 },
  { label: '🇸🇿 Esuatini (+268)', code: '+268', country: 'Esuatini', flag: '🇸🇿', iso: 'SZ', phoneLength: 8 },
  { label: '🇪🇹 Etiopía (+251)', code: '+251', country: 'Etiopía', flag: '🇪🇹', iso: 'ET', phoneLength: 9 },
  { label: '🇫🇰 Islas Malvinas (+500)', code: '+500', country: 'Islas Malvinas', flag: '🇫🇰', iso: 'FK', phoneLength: 5 },
  { label: '🇫🇴 Islas Feroe (+298)', code: '+298', country: 'Islas Feroe', flag: '🇫🇴', iso: 'FO', phoneLength: 6 },
  { label: '🇫🇯 Fiyi (+679)', code: '+679', country: 'Fiyi', flag: '🇫🇯', iso: 'FJ', phoneLength: 7 },
  { label: '🇫🇮 Finlandia (+358)', code: '+358', country: 'Finlandia', flag: '🇫🇮', iso: 'FI', phoneLength: 10 },
  { label: '🇫🇷 Francia (+33)', code: '+33', country: 'Francia', flag: '🇫🇷', iso: 'FR', phoneLength: 9 },
  { label: '🇬🇫 Guayana Francesa (+594)', code: '+594', country: 'Guayana Francesa', flag: '🇬🇫', iso: 'GF', phoneLength: 9 },
  { label: '🇵🇫 Polinesia Francesa (+689)', code: '+689', country: 'Polinesia Francesa', flag: '🇵🇫', iso: 'PF', phoneLength: 6 },
  { label: '🇬🇦 Gabón (+241)', code: '+241', country: 'Gabón', flag: '🇬🇦', iso: 'GA', phoneLength: 7 },
  { label: '🇬🇲 Gambia (+220)', code: '+220', country: 'Gambia', flag: '🇬🇲', iso: 'GM', phoneLength: 7 },
  { label: '🇬🇪 Georgia (+995)', code: '+995', country: 'Georgia', flag: '🇬🇪', iso: 'GE', phoneLength: 9 },
  { label: '🇩🇪 Alemania (+49)', code: '+49', country: 'Alemania', flag: '🇩🇪', iso: 'DE', phoneLength: 10 },
  { label: '🇬🇭 Ghana (+233)', code: '+233', country: 'Ghana', flag: '🇬🇭', iso: 'GH', phoneLength: 9 },
  { label: '🇬🇮 Gibraltar (+350)', code: '+350', country: 'Gibraltar', flag: '🇬🇮', iso: 'GI', phoneLength: 8 },
  { label: '🇬🇷 Grecia (+30)', code: '+30', country: 'Grecia', flag: '🇬🇷', iso: 'GR', phoneLength: 10 },
  { label: '🇬🇱 Groenlandia (+299)', code: '+299', country: 'Groenlandia', flag: '🇬🇱', iso: 'GL', phoneLength: 6 },
  { label: '🇬🇩 Granada (+1)', code: '+1', country: 'Granada', flag: '🇬🇩', iso: 'GD', phoneLength: 10 },
  { label: '🇬🇵 Guadalupe (+590)', code: '+590', country: 'Guadalupe', flag: '🇬🇵', iso: 'GP', phoneLength: 9 },
  { label: '🇬🇺 Guam (+1)', code: '+1', country: 'Guam', flag: '🇬🇺', iso: 'GU', phoneLength: 10 },
  { label: '🇬🇹 Guatemala (+502)', code: '+502', country: 'Guatemala', flag: '🇬🇹', iso: 'GT', phoneLength: 8 },
  { label: '🇬🇬 Guernsey (+44)', code: '+44', country: 'Guernsey', flag: '🇬🇬', iso: 'GG', phoneLength: 10 },
  { label: '🇬🇳 Guinea (+224)', code: '+224', country: 'Guinea', flag: '🇬🇳', iso: 'GN', phoneLength: 9 },
  { label: '🇬🇼 Guinea-Bisáu (+245)', code: '+245', country: 'Guinea-Bisáu', flag: '🇬🇼', iso: 'GW', phoneLength: 7 },
  { label: '🇬🇾 Guyana (+592)', code: '+592', country: 'Guyana', flag: '🇬🇾', iso: 'GY', phoneLength: 7 },
  { label: '🇭🇹 Haití (+509)', code: '+509', country: 'Haití', flag: '🇭🇹', iso: 'HT', phoneLength: 8 },
  { label: '🇭🇳 Honduras (+504)', code: '+504', country: 'Honduras', flag: '🇭🇳', iso: 'HN', phoneLength: 8 },
  { label: '🇭🇰 Hong Kong (+852)', code: '+852', country: 'Hong Kong', flag: '🇭🇰', iso: 'HK', phoneLength: 8 },
  { label: '🇭🇺 Hungría (+36)', code: '+36', country: 'Hungría', flag: '🇭🇺', iso: 'HU', phoneLength: 9 },
  { label: '🇮🇸 Islandia (+354)', code: '+354', country: 'Islandia', flag: '🇮🇸', iso: 'IS', phoneLength: 7 },
  { label: '🇮🇳 India (+91)', code: '+91', country: 'India', flag: '🇮🇳', iso: 'IN', phoneLength: 10 },
  { label: '🇮🇩 Indonesia (+62)', code: '+62', country: 'Indonesia', flag: '🇮🇩', iso: 'ID', phoneLength: 10 },
  { label: '🇮🇷 Irán (+98)', code: '+98', country: 'Irán', flag: '🇮🇷', iso: 'IR', phoneLength: 10 },
  { label: '🇮🇶 Irak (+964)', code: '+964', country: 'Irak', flag: '🇮🇶', iso: 'IQ', phoneLength: 10 },
  { label: '🇮🇪 Irlanda (+353)', code: '+353', country: 'Irlanda', flag: '🇮🇪', iso: 'IE', phoneLength: 9 },
  { label: '🇮🇲 Isla de Man (+44)', code: '+44', country: 'Isla de Man', flag: '🇮🇲', iso: 'IM', phoneLength: 10 },
  { label: '🇮🇱 Israel (+972)', code: '+972', country: 'Israel', flag: '🇮🇱', iso: 'IL', phoneLength: 9 },
  { label: '🇮🇹 Italia (+39)', code: '+39', country: 'Italia', flag: '🇮🇹', iso: 'IT', phoneLength: 10 },
  { label: '🇯🇲 Jamaica (+1)', code: '+1', country: 'Jamaica', flag: '🇯🇲', iso: 'JM', phoneLength: 10 },
  { label: '🇯🇵 Japón (+81)', code: '+81', country: 'Japón', flag: '🇯🇵', iso: 'JP', phoneLength: 10 },
  { label: '🇯🇪 Jersey (+44)', code: '+44', country: 'Jersey', flag: '🇯🇪', iso: 'JE', phoneLength: 10 },
  { label: '🇯🇴 Jordania (+962)', code: '+962', country: 'Jordania', flag: '🇯🇴', iso: 'JO', phoneLength: 9 },
  { label: '🇰🇿 Kazajistán (+7)', code: '+7', country: 'Kazajistán', flag: '🇰🇿', iso: 'KZ', phoneLength: 10 },
  { label: '🇰🇪 Kenia (+254)', code: '+254', country: 'Kenia', flag: '🇰🇪', iso: 'KE', phoneLength: 9 },
  { label: '🇰🇮 Kiribati (+686)', code: '+686', country: 'Kiribati', flag: '🇰🇮', iso: 'KI', phoneLength: 8 },
  { label: '🇰🇷 Corea del Sur (+82)', code: '+82', country: 'Corea del Sur', flag: '🇰🇷', iso: 'KR', phoneLength: 10 },
  { label: '🇰🇼 Kuwait (+965)', code: '+965', country: 'Kuwait', flag: '🇰🇼', iso: 'KW', phoneLength: 8 },
  { label: '🇰🇬 Kirguistán (+996)', code: '+996', country: 'Kirguistán', flag: '🇰🇬', iso: 'KG', phoneLength: 9 },
  { label: '🇱🇦 Laos (+856)', code: '+856', country: 'Laos', flag: '🇱🇦', iso: 'LA', phoneLength: 8 },
  { label: '🇱🇻 Letonia (+371)', code: '+371', country: 'Letonia', flag: '🇱🇻', iso: 'LV', phoneLength: 8 },
  { label: '🇱🇧 Líbano (+961)', code: '+961', country: 'Líbano', flag: '🇱🇧', iso: 'LB', phoneLength: 8 },
  { label: '🇱🇸 Lesoto (+266)', code: '+266', country: 'Lesoto', flag: '🇱🇸', iso: 'LS', phoneLength: 8 },
  { label: '🇱🇷 Liberia (+231)', code: '+231', country: 'Liberia', flag: '🇱🇷', iso: 'LR', phoneLength: 7 },
  { label: '🇱🇾 Libia (+218)', code: '+218', country: 'Libia', flag: '🇱🇾', iso: 'LY', phoneLength: 10 },
  { label: '🇱🇮 Liechtenstein (+423)', code: '+423', country: 'Liechtenstein', flag: '🇱🇮', iso: 'LI', phoneLength: 7 },
  { label: '🇱🇹 Lituania (+370)', code: '+370', country: 'Lituania', flag: '🇱🇹', iso: 'LT', phoneLength: 8 },
  { label: '🇱🇺 Luxemburgo (+352)', code: '+352', country: 'Luxemburgo', flag: '🇱🇺', iso: 'LU', phoneLength: 9 },
  { label: '🇲🇴 Macao (+853)', code: '+853', country: 'Macao', flag: '🇲🇴', iso: 'MO', phoneLength: 8 },
  { label: '🇲🇰 Macedonia del Norte (+389)', code: '+389', country: 'Macedonia del Norte', flag: '🇲🇰', iso: 'MK', phoneLength: 8 },
  { label: '🇲🇬 Madagascar (+261)', code: '+261', country: 'Madagascar', flag: '🇲🇬', iso: 'MG', phoneLength: 9 },
  { label: '🇲🇼 Malaui (+265)', code: '+265', country: 'Malaui', flag: '🇲🇼', iso: 'MW', phoneLength: 9 },
  { label: '🇲🇾 Malasia (+60)', code: '+60', country: 'Malasia', flag: '🇲🇾', iso: 'MY', phoneLength: 9 },
  { label: '🇲🇻 Maldivas (+960)', code: '+960', country: 'Maldivas', flag: '🇲🇻', iso: 'MV', phoneLength: 7 },
  { label: '🇲🇱 Malí (+223)', code: '+223', country: 'Malí', flag: '🇲🇱', iso: 'ML', phoneLength: 8 },
  { label: '🇲🇹 Malta (+356)', code: '+356', country: 'Malta', flag: '🇲🇹', iso: 'MT', phoneLength: 8 },
  { label: '🇲🇭 Islas Marshall (+692)', code: '+692', country: 'Islas Marshall', flag: '🇲🇭', iso: 'MH', phoneLength: 7 },
  { label: '🇲🇶 Martinica (+596)', code: '+596', country: 'Martinica', flag: '🇲🇶', iso: 'MQ', phoneLength: 9 },
  { label: '🇲🇷 Mauritania (+222)', code: '+222', country: 'Mauritania', flag: '🇲🇷', iso: 'MR', phoneLength: 8 },
  { label: '🇲🇺 Mauricio (+230)', code: '+230', country: 'Mauricio', flag: '🇲🇺', iso: 'MU', phoneLength: 8 },
  { label: '🇾🇹 Mayotte (+262)', code: '+262', country: 'Mayotte', flag: '🇾🇹', iso: 'YT', phoneLength: 9 },
  { label: '🇲🇽 México (+52)', code: '+52', country: 'México', flag: '🇲🇽', iso: 'MX', phoneLength: 10 },
  { label: '🇫🇲 Micronesia (+691)', code: '+691', country: 'Micronesia', flag: '🇫🇲', iso: 'FM', phoneLength: 7 },
  { label: '🇲🇩 Moldavia (+373)', code: '+373', country: 'Moldavia', flag: '🇲🇩', iso: 'MD', phoneLength: 8 },
  { label: '🇲🇨 Mónaco (+377)', code: '+377', country: 'Mónaco', flag: '🇲🇨', iso: 'MC', phoneLength: 8 },
  { label: '🇲🇳 Mongolia (+976)', code: '+976', country: 'Mongolia', flag: '🇲🇳', iso: 'MN', phoneLength: 8 },
  { label: '🇲🇪 Montenegro (+382)', code: '+382', country: 'Montenegro', flag: '🇲🇪', iso: 'ME', phoneLength: 8 },
  { label: '🇲🇸 Montserrat (+1)', code: '+1', country: 'Montserrat', flag: '🇲🇸', iso: 'MS', phoneLength: 10 },
  { label: '🇲🇦 Marruecos (+212)', code: '+212', country: 'Marruecos', flag: '🇲🇦', iso: 'MA', phoneLength: 9 },
  { label: '🇲🇿 Mozambique (+258)', code: '+258', country: 'Mozambique', flag: '🇲🇿', iso: 'MZ', phoneLength: 9 },
  { label: '🇲🇲 Myanmar (+95)', code: '+95', country: 'Myanmar', flag: '🇲🇲', iso: 'MM', phoneLength: 9 },
  { label: '🇳🇦 Namibia (+264)', code: '+264', country: 'Namibia', flag: '🇳🇦', iso: 'NA', phoneLength: 9 },
  { label: '🇳🇷 Nauru (+674)', code: '+674', country: 'Nauru', flag: '🇳🇷', iso: 'NR', phoneLength: 7 },
  { label: '🇳🇵 Nepal (+977)', code: '+977', country: 'Nepal', flag: '🇳🇵', iso: 'NP', phoneLength: 10 },
  { label: '🇳🇱 Países Bajos (+31)', code: '+31', country: 'Países Bajos', flag: '🇳🇱', iso: 'NL', phoneLength: 9 },
  { label: '🇳🇨 Nueva Caledonia (+687)', code: '+687', country: 'Nueva Caledonia', flag: '🇳🇨', iso: 'NC', phoneLength: 6 },
  { label: '🇳🇿 Nueva Zelanda (+64)', code: '+64', country: 'Nueva Zelanda', flag: '🇳🇿', iso: 'NZ', phoneLength: 9 },
  { label: '🇳🇮 Nicaragua (+505)', code: '+505', country: 'Nicaragua', flag: '🇳🇮', iso: 'NI', phoneLength: 8 },
  { label: '🇳🇪 Níger (+227)', code: '+227', country: 'Níger', flag: '🇳🇪', iso: 'NE', phoneLength: 8 },
  { label: '🇳🇬 Nigeria (+234)', code: '+234', country: 'Nigeria', flag: '🇳🇬', iso: 'NG', phoneLength: 10 },
  { label: '🇳🇺 Niue (+683)', code: '+683', country: 'Niue', flag: '🇳🇺', iso: 'NU', phoneLength: 4 },
  { label: '🇳🇫 Isla Norfolk (+672)', code: '+672', country: 'Isla Norfolk', flag: '🇳🇫', iso: 'NF', phoneLength: 6 },
  { label: '🇰🇵 Corea del Norte (+850)', code: '+850', country: 'Corea del Norte', flag: '🇰🇵', iso: 'KP', phoneLength: 10 },
  { label: '🇲🇵 Islas Marianas del Norte (+1)', code: '+1', country: 'Islas Marianas del Norte', flag: '🇲🇵', iso: 'MP', phoneLength: 10 },
  { label: '🇳🇴 Noruega (+47)', code: '+47', country: 'Noruega', flag: '🇳🇴', iso: 'NO', phoneLength: 8 },
  { label: '🇴🇲 Omán (+968)', code: '+968', country: 'Omán', flag: '🇴🇲', iso: 'OM', phoneLength: 8 },
  { label: '🇵🇰 Pakistán (+92)', code: '+92', country: 'Pakistán', flag: '🇵🇰', iso: 'PK', phoneLength: 10 },
  { label: '🇵🇼 Palaos (+680)', code: '+680', country: 'Palaos', flag: '🇵🇼', iso: 'PW', phoneLength: 7 },
  { label: '🇵🇸 Palestina (+970)', code: '+970', country: 'Palestina', flag: '🇵🇸', iso: 'PS', phoneLength: 9 },
  { label: '🇵🇦 Panamá (+507)', code: '+507', country: 'Panamá', flag: '🇵🇦', iso: 'PA', phoneLength: 8 },
  { label: '🇵🇬 Papúa Nueva Guinea (+675)', code: '+675', country: 'Papúa Nueva Guinea', flag: '🇵🇬', iso: 'PG', phoneLength: 8 },
  { label: '🇵🇾 Paraguay (+595)', code: '+595', country: 'Paraguay', flag: '🇵🇾', iso: 'PY', phoneLength: 9 },
  { label: '🇵🇪 Perú (+51)', code: '+51', country: 'Perú', flag: '🇵🇪', iso: 'PE', phoneLength: 9 },
  { label: '🇵🇭 Filipinas (+63)', code: '+63', country: 'Filipinas', flag: '🇵🇭', iso: 'PH', phoneLength: 10 },
  { label: '🇵🇱 Polonia (+48)', code: '+48', country: 'Polonia', flag: '🇵🇱', iso: 'PL', phoneLength: 9 },
  { label: '🇵🇹 Portugal (+351)', code: '+351', country: 'Portugal', flag: '🇵🇹', iso: 'PT', phoneLength: 9 },
  { label: '🇵🇷 Puerto Rico (+1)', code: '+1', country: 'Puerto Rico', flag: '🇵🇷', iso: 'PR', phoneLength: 10 },
  { label: '🇶🇦 Catar (+974)', code: '+974', country: 'Catar', flag: '🇶🇦', iso: 'QA', phoneLength: 8 },
  { label: '🇷🇪 Reunión (+262)', code: '+262', country: 'Reunión', flag: '🇷🇪', iso: 'RE', phoneLength: 9 },
  { label: '🇷🇴 Rumania (+40)', code: '+40', country: 'Rumania', flag: '🇷🇴', iso: 'RO', phoneLength: 10 },
  { label: '🇷🇺 Rusia (+7)', code: '+7', country: 'Rusia', flag: '🇷🇺', iso: 'RU', phoneLength: 10 },
  { label: '🇷🇼 Ruanda (+250)', code: '+250', country: 'Ruanda', flag: '🇷🇼', iso: 'RW', phoneLength: 9 },
  { label: '🇰🇳 San Cristóbal y Nieves (+1)', code: '+1', country: 'San Cristóbal y Nieves', flag: '🇰🇳', iso: 'KN', phoneLength: 10 },
  { label: '🇱🇨 Santa Lucía (+1)', code: '+1', country: 'Santa Lucía', flag: '🇱🇨', iso: 'LC', phoneLength: 10 },
  { label: '🇻🇨 San Vicente y las Granadinas (+1)', code: '+1', country: 'San Vicente y las Granadinas', flag: '🇻🇨', iso: 'VC', phoneLength: 10 },
  { label: '🇼🇸 Samoa (+685)', code: '+685', country: 'Samoa', flag: '🇼🇸', iso: 'WS', phoneLength: 7 },
  { label: '🇸🇲 San Marino (+378)', code: '+378', country: 'San Marino', flag: '🇸🇲', iso: 'SM', phoneLength: 10 },
  { label: '🇸🇹 Santo Tomé y Príncipe (+239)', code: '+239', country: 'Santo Tomé y Príncipe', flag: '🇸🇹', iso: 'ST', phoneLength: 7 },
  { label: '🇸🇦 Arabia Saudita (+966)', code: '+966', country: 'Arabia Saudita', flag: '🇸🇦', iso: 'SA', phoneLength: 9 },
  { label: '🇸🇳 Senegal (+221)', code: '+221', country: 'Senegal', flag: '🇸🇳', iso: 'SN', phoneLength: 9 },
  { label: '🇷🇸 Serbia (+381)', code: '+381', country: 'Serbia', flag: '🇷🇸', iso: 'RS', phoneLength: 9 },
  { label: '🇸🇨 Seychelles (+248)', code: '+248', country: 'Seychelles', flag: '🇸🇨', iso: 'SC', phoneLength: 7 },
  { label: '🇸🇱 Sierra Leona (+232)', code: '+232', country: 'Sierra Leona', flag: '🇸🇱', iso: 'SL', phoneLength: 8 },
  { label: '🇸🇬 Singapur (+65)', code: '+65', country: 'Singapur', flag: '🇸🇬', iso: 'SG', phoneLength: 8 },
  { label: '🇸🇽 San Martín (+1)', code: '+1', country: 'San Martín', flag: '🇸🇽', iso: 'SX', phoneLength: 10 },
  { label: '🇸🇰 Eslovaquia (+421)', code: '+421', country: 'Eslovaquia', flag: '🇸🇰', iso: 'SK', phoneLength: 9 },
  { label: '🇸🇮 Eslovenia (+386)', code: '+386', country: 'Eslovenia', flag: '🇸🇮', iso: 'SI', phoneLength: 9 },
  { label: '🇸🇧 Islas Salomón (+677)', code: '+677', country: 'Islas Salomón', flag: '🇸🇧', iso: 'SB', phoneLength: 7 },
  { label: '🇸🇴 Somalia (+252)', code: '+252', country: 'Somalia', flag: '🇸🇴', iso: 'SO', phoneLength: 8 },
  { label: '🇿🇦 Sudáfrica (+27)', code: '+27', country: 'Sudáfrica', flag: '🇿🇦', iso: 'ZA', phoneLength: 9 },
  { label: '🇸🇸 Sudán del Sur (+211)', code: '+211', country: 'Sudán del Sur', flag: '🇸🇸', iso: 'SS', phoneLength: 9 },
  { label: '🇪🇸 España (+34)', code: '+34', country: 'España', flag: '🇪🇸', iso: 'ES', phoneLength: 9 },
  { label: '🇱🇰 Sri Lanka (+94)', code: '+94', country: 'Sri Lanka', flag: '🇱🇰', iso: 'LK', phoneLength: 9 },
  { label: '🇸🇩 Sudán (+249)', code: '+249', country: 'Sudán', flag: '🇸🇩', iso: 'SD', phoneLength: 9 },
  { label: '🇸🇷 Surinam (+597)', code: '+597', country: 'Surinam', flag: '🇸🇷', iso: 'SR', phoneLength: 7 },
  { label: '🇸🇪 Suecia (+46)', code: '+46', country: 'Suecia', flag: '🇸🇪', iso: 'SE', phoneLength: 9 },
  { label: '🇨🇭 Suiza (+41)', code: '+41', country: 'Suiza', flag: '🇨🇭', iso: 'CH', phoneLength: 9 },
  { label: '🇸🇾 Siria (+963)', code: '+963', country: 'Siria', flag: '🇸🇾', iso: 'SY', phoneLength: 9 },
  { label: '🇹🇼 Taiwán (+886)', code: '+886', country: 'Taiwán', flag: '🇹🇼', iso: 'TW', phoneLength: 9 },
  { label: '🇹🇯 Tayikistán (+992)', code: '+992', country: 'Tayikistán', flag: '🇹🇯', iso: 'TJ', phoneLength: 9 },
  { label: '🇹🇿 Tanzania (+255)', code: '+255', country: 'Tanzania', flag: '🇹🇿', iso: 'TZ', phoneLength: 9 },
  { label: '🇹🇭 Tailandia (+66)', code: '+66', country: 'Tailandia', flag: '🇹🇭', iso: 'TH', phoneLength: 9 },
  { label: '🇹🇱 Timor Oriental (+670)', code: '+670', country: 'Timor Oriental', flag: '🇹🇱', iso: 'TL', phoneLength: 8 },
  { label: '🇹🇬 Togo (+228)', code: '+228', country: 'Togo', flag: '🇹🇬', iso: 'TG', phoneLength: 8 },
  { label: '🇹🇴 Tonga (+676)', code: '+676', country: 'Tonga', flag: '🇹🇴', iso: 'TO', phoneLength: 7 },
  { label: '🇹🇹 Trinidad y Tobago (+1)', code: '+1', country: 'Trinidad y Tobago', flag: '🇹🇹', iso: 'TT', phoneLength: 10 },
  { label: '🇹🇳 Túnez (+216)', code: '+216', country: 'Túnez', flag: '🇹🇳', iso: 'TN', phoneLength: 8 },
  { label: '🇹🇷 Turquía (+90)', code: '+90', country: 'Turquía', flag: '🇹🇷', iso: 'TR', phoneLength: 10 },
  { label: '🇹🇲 Turkmenistán (+993)', code: '+993', country: 'Turkmenistán', flag: '🇹🇲', iso: 'TM', phoneLength: 8 },
  { label: '🇹🇨 Islas Turcas y Caicos (+1)', code: '+1', country: 'Islas Turcas y Caicos', flag: '🇹🇨', iso: 'TC', phoneLength: 10 },
  { label: '🇹🇻 Tuvalu (+688)', code: '+688', country: 'Tuvalu', flag: '🇹🇻', iso: 'TV', phoneLength: 6 },
  { label: '🇺🇬 Uganda (+256)', code: '+256', country: 'Uganda', flag: '🇺🇬', iso: 'UG', phoneLength: 9 },
  { label: '🇺🇦 Ucrania (+380)', code: '+380', country: 'Ucrania', flag: '🇺🇦', iso: 'UA', phoneLength: 9 },
  { label: '🇦🇪 Emiratos Árabes Unidos (+971)', code: '+971', country: 'Emiratos Árabes Unidos', flag: '🇦🇪', iso: 'AE', phoneLength: 9 },
  { label: '🇬🇧 Reino Unido (+44)', code: '+44', country: 'Reino Unido', flag: '🇬🇧', iso: 'GB', phoneLength: 10 },
  { label: '🇺🇸 Estados Unidos (+1)', code: '+1', country: 'Estados Unidos', flag: '🇺🇸', iso: 'US', phoneLength: 10 },
  { label: '🇺🇾 Uruguay (+598)', code: '+598', country: 'Uruguay', flag: '🇺🇾', iso: 'UY', phoneLength: 8 },
  { label: '🇺🇿 Uzbekistán (+998)', code: '+998', country: 'Uzbekistán', flag: '🇺🇿', iso: 'UZ', phoneLength: 9 },
  { label: '🇻🇺 Vanuatu (+678)', code: '+678', country: 'Vanuatu', flag: '🇻🇺', iso: 'VU', phoneLength: 7 },
  { label: '🇻🇦 Ciudad del Vaticano (+39)', code: '+39', country: 'Ciudad del Vaticano', flag: '🇻🇦', iso: 'VA', phoneLength: 10 },
  { label: '🇻🇪 Venezuela (+58)', code: '+58', country: 'Venezuela', flag: '🇻🇪', iso: 'VE', phoneLength: 10 },
  { label: '🇻🇳 Vietnam (+84)', code: '+84', country: 'Vietnam', flag: '🇻🇳', iso: 'VN', phoneLength: 9 },
  { label: '🇻🇬 Islas Vírgenes Británicas (+1)', code: '+1', country: 'Islas Vírgenes Británicas', flag: '🇻🇬', iso: 'VG', phoneLength: 10 },
  { label: '🇻🇮 Islas Vírgenes de los Estados Unidos (+1)', code: '+1', country: 'Islas Vírgenes de los Estados Unidos', flag: '🇻🇮', iso: 'VI', phoneLength: 10 },
  { label: '🇼🇫 Wallis y Futuna (+681)', code: '+681', country: 'Wallis y Futuna', flag: '🇼🇫', iso: 'WF', phoneLength: 6 },
  { label: '🇾🇪 Yemen (+967)', code: '+967', country: 'Yemen', flag: '🇾🇪', iso: 'YE', phoneLength: 9 },
  { label: '🇿🇲 Zambia (+260)', code: '+260', country: 'Zambia', flag: '🇿🇲', iso: 'ZM', phoneLength: 9 },
  { label: '🇿🇼 Zimbabue (+263)', code: '+263', country: 'Zimbabue', flag: '🇿🇼', iso: 'ZW', phoneLength: 9 },
];

export default function RegisterScreen() {
  const router = useRouter();
  const { showAlert, AlertDialog } = useCrossPlatformAlert();
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [filteredCountries, setFilteredCountries] = useState(COUNTRY_CODES);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  React.useEffect(() => {
    const filtered = COUNTRY_CODES.filter(item =>
      item.country.toLowerCase().includes(searchText.toLowerCase()) ||
      item.code.includes(searchText)
    );
    setFilteredCountries(filtered);
  }, [searchText]);

  const [form, setForm] = useState({
    name: '',
    lastname: '',
    email: '',
    countryCode: '+57', // Colombia por defecto
    phone: '',
    country: 'Colombia',
    flag: '🇨🇴',
    iso: 'CO',
    password: '',
    confirmPassword: '',
  });

  const selectedCountry = COUNTRY_CODES.find(c => c.iso === form.iso);

  const handleRegister = async () => {
    // Validaciones rápidas
    if (!form.name || !form.lastname || !form.email || !form.phone || !form.password) {
      showAlert({
        title: 'Error',
        message: 'Completa todos los campos obligatorios'
      });
      return;
    }
    if (form.password !== form.confirmPassword) {
      showAlert({
        title: 'Error',
        message: 'Las contraseñas no coinciden'
      });
      return;
    }
    if (form.password.length < 6) {
      showAlert({
        title: 'Error',
        message: 'La contraseña debe tener al menos 6 caracteres'
      });
      return;
    }
    // Validar que el teléfono tenga al menos 7 dígitos
    const phoneDigits = form.phone.replace(/\D/g, '');
    if (phoneDigits.length < 7) {
      showAlert({
        title: 'Error',
        message: 'El teléfono debe tener al menos 7 dígitos'
      });
      return;
    }
    // Validar longitud exacta según el país
    if (selectedCountry && phoneDigits.length !== selectedCountry.phoneLength) {
      showAlert({
        title: 'Error',
        message: `El teléfono debe tener exactamente ${selectedCountry.phoneLength} dígitos para ${selectedCountry.country}`
      });
      return;
    }

    setLoading(true);

    try {
      const fullPhone = `${form.countryCode}${form.phone.replace(/\D/g, '')}`;
      const response = await api.post('/auth/register', {
        username: form.name.trim(),
        full_name: `${form.name.trim()} ${form.lastname.trim()}`,
        email: form.email.trim().toLowerCase(),
        phone: fullPhone,
        country: form.country,
        password: form.password,
      });

      console.log('✅ Registro exitoso:', response);

      // El backend NO devuelve token en el registro, hay que hacer login
      showAlert({
        title: 'Registro exitoso',
        message: 'Tu cuenta ha sido creada. Ahora debes iniciar sesión.',
        buttons: [
          {
            text: 'Ir a Login',
            onPress: () => router.replace('/login')
          }
        ]
      });

    } catch (error: any) {
      console.error('❌ Error registro:', error);
      let msg = error.message || 'Error al crear la cuenta, email o número ya en uso';
      
      // Si el mensaje contiene "HTTP", extraer solo el JSON
      if (msg.includes('HTTP')) {
        try {
          const jsonMatch = msg.match(/\{.*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            msg = parsed.message || msg;
          }
        } catch (e) {
          // Si no se puede parsear, usar el mensaje original
        }
      }
      
      showAlert({
        title: 'Error',
        message: msg
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Completa tu registro y descarga tu cotización</Text>

        <TextInput
          style={styles.input}
          placeholder="Nombre *"
          value={form.name}
          onChangeText={v => setForm({ ...form, name: v })}
          autoCapitalize="words"
        />

        <TextInput
          style={styles.input}
          placeholder="Apellido *"
          value={form.lastname}
          onChangeText={v => setForm({ ...form, lastname: v })}
          autoCapitalize="words"
        />

        <TextInput
          style={styles.input}
          placeholder="Correo *"
          value={form.email}
          onChangeText={v => setForm({ ...form, email: v })}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Text style={styles.label}>Código de País *</Text>
        <TouchableOpacity
          style={styles.pickerContainer}
          onPress={() => setModalVisible(true)}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <CountryFlag isoCode={form.iso} size={24} />
            <Text style={styles.pickerText}> {form.country} ({form.countryCode})</Text>
          </View>
        </TouchableOpacity>

        <Modal
          visible={modalVisible}
          animationType="slide"
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar por nombre o código"
              value={searchText}
              onChangeText={setSearchText}
            />
            <FlatList
              data={filteredCountries}
              keyExtractor={(item) => item.code + item.country}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.countryItem}
                  onPress={() => {
                    setForm({ ...form, countryCode: item.code, country: item.country, flag: item.flag, iso: item.iso });
                    setModalVisible(false);
                    setSearchText('');
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <CountryFlag isoCode={item.iso} size={24} />
                    <Text style={styles.countryText}> {item.country} ({item.code})</Text>
                  </View>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </Modal>

        <TextInput
          style={styles.input}
          placeholder={`Teléfono (${selectedCountry?.phoneLength || 10} dígitos) *`}
          value={form.phone}
          onChangeText={v => setForm({ ...form, phone: v.replace(/\D/g, '') })}
          keyboardType="phone-pad"
          maxLength={selectedCountry?.phoneLength || 10}
        />

        <View style={styles.inputContainer}>
          <TextInput
            style={{
              flex: 1,
              color: '#0b2032',
              fontSize: 16,
              paddingRight: 10,
            }}
            placeholder="Contraseña *"
            placeholderTextColor="#0b2032"
            value={form.password}
            onChangeText={v => setForm({ ...form, password: v })}
            secureTextEntry={!showPassword}
          />
          <TouchableOpacity
            style={styles.eyeButton}
            onPress={() => setShowPassword(!showPassword)}
          >
            <MaterialIcons
              name={showPassword ? 'visibility' : 'visibility-off'}
              size={24}
              color="#0b2032"
            />
          </TouchableOpacity>
        </View>

        <View style={styles.inputContainer}>
          <TextInput
            style={{
              flex: 1,
              color: '#0b2032',
              fontSize: 16,
              paddingRight: 10,
            }}
            placeholder="Confirmar contraseña *"
            placeholderTextColor="#0b2032"
            value={form.confirmPassword}
            onChangeText={v => setForm({ ...form, confirmPassword: v })}
            secureTextEntry={!showConfirmPassword}
          />
          <TouchableOpacity
            style={styles.eyeButton}
            onPress={() => setShowConfirmPassword(!showConfirmPassword)}
          >
            <MaterialIcons
              name={showConfirmPassword ? 'visibility' : 'visibility-off'}
              size={24}
              color="#0b2032"
            />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.btn, loading && styles.btnDisabled]}
          onPress={handleRegister}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.btnText}>CREAR CUENTA</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.linkContainer}
          onPress={() => router.push('/login')}
        >
          <Text style={styles.linkText}>¿Ya tienes cuenta? Inicia sesión</Text>
        </TouchableOpacity>
      </View>
      <AlertDialog />
    </ScrollView>
  );
}