import { useTheme } from 'react-native-paper';
import { CustomTheme } from '../constants/theme';

export const usePaperTheme = () => useTheme<CustomTheme>();

export const useCustomTheme = () => {
  const theme = useTheme<CustomTheme>();
  return theme;
};