import { useAppTheme } from '@/context/ThemeContext';
import { useColorScheme as useRNColorScheme } from 'react-native';

export function useColorScheme() {
	const system = useRNColorScheme();
	const { theme } = useAppTheme();
	// theme === null means follow system
	return (theme as 'light' | 'dark' | null) ?? system;
}
