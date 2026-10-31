// colors.ts
import { Appearance } from 'react-native';

// ✅ 2 hex values only
export interface ColorItem {
  name: string;
  hexValues: {
    light: [string, string];  // ✅ Tuple of exactly 2
    dark: [string, string];   // ✅ Tuple of exactly 2
  };
}

// Helper function to get current theme mode
export const getCurrentThemeMode = (): 'light' | 'dark' => {
  const colorScheme = Appearance.getColorScheme();
  return colorScheme === 'dark' ? 'dark' : 'light';
};

// ✅ Complete color mapping — Light mode is DARKER now, only 2 hex values
export const colors: ColorItem[] = [
  {
    name: 'TEAL',
    hexValues: {
      light: ['#5ecfb3', '#a2ffec'],  // darker → lighter
      dark: ['#4aa89a', '#80ded0'],
    },
  },
  {
    name: 'BLUE',
    hexValues: {
      light: ['#7fb2e6', '#e0f2fe'],
      dark: ['#6a8fc9', '#a0c5ff'],
    },
  },
  {
    name: 'RED',
    hexValues: {
      light: ['#f59a9a', '#fee2e2'],
      dark: ['#e68080', '#ffb6b6'],
    },
  },
  {
    name: 'GREEN',
    hexValues: {
      light: ['#86d39a', '#dcfce7'],
      dark: ['#5aa56a', '#90dba0'],
    },
  },
  {
    name: 'YELLOW',
    hexValues: {
      light: ['#e6c96b', '#fef9c3'],
      dark: ['#e5c85a', '#fffe90'],
    },
  },
  {
    name: 'ORANGE',
    hexValues: {
      light: ['#f5a15f', '#ffedd5'],
      dark: ['#f5a15f', '#ffd795'],
    },
  },
  {
    name: 'PURPLE',
    hexValues: {
      light: ['#c59bf2', '#f3e8ff'],
      dark: ['#b389e0', '#e9bfff'],
    },
  },
  {
    name: 'PINK',
    hexValues: {
      light: ['#f7a9c8', '#fce7f3'],
      dark: ['#e985b3', '#ffbbe9'],
    },
  },
  {
    name: 'BROWN',
    hexValues: {
      light: ['#c99676', '#f5e8e0'],
      dark: ['#cb8a5f', '#ffc095'],
    },
  },
  {
    name: 'GRAY',
    hexValues: {
      light: ['#9ca3af', '#f3f4f6'],
      dark: ['#8b9aad', '#c1d0e3'],
    },
  },
  {
    name: 'BLACK',
    hexValues: {
      light: ['#4a4a4a', '#e5e5e5'],
      dark: ['#5a5a5a', '#909090'],
    },
  },
  {
    name: 'WHITE',
    hexValues: {
      light: ['#d4d4d4', '#fafafa'],
      dark: ['#f9fafb', '#d1d5db'],
    },
  },
  {
    name: 'CYAN',
    hexValues: {
      light: ['#6bc9e0', '#cffafe'],
      dark: ['#6ac0dc', '#a0f6ff'],
    },
  },
  {
    name: 'MAGENTA',
    hexValues: {
      light: ['#d685df', '#fae8ff'],
      dark: ['#d685df', '#ffbbff'],
    },
  },
  {
    name: 'LIME',
    hexValues: {
      light: ['#b0d968', '#ecfccb'],
      dark: ['#9acd5f', '#d0ff95'],
    },
  },
  {
    name: 'MAROON',
    hexValues: {
      light: ['#e98595', '#fde5e5'],
      dark: ['#e98595', '#ffbbcb'],
    },
  },
  {
    name: 'NAVY',
    hexValues: {
      light: ['#8998e0', '#e0e7ff'],
      dark: ['#7a8cd5', '#b0c2ff'],
    },
  },
  {
    name: 'OLIVE',
    hexValues: {
      light: ['#c9c988', '#f5f5e6'],
      dark: ['#abab75', '#e1e1ab'],
    },
  },
  {
    name: 'GOLD',
    hexValues: {
      light: ['#e6c55f', '#fef9c3'],
      dark: ['#f5c55f', '#fffb95'],
    },
  },
  {
    name: 'SILVER',
    hexValues: {
      light: ['#c0c8d2', '#f9fafb'],
      dark: ['#a5b4c4', '#dbeafa'],
    },
  },
  {
    name: 'LAVENDER',
    hexValues: {
      light: ['#b79ce0', '#f5f0ff'],
      dark: ['#bd9cf0', '#f3d2ff'],
    },
  },
  {
    name: 'VIOLET',
    hexValues: {
      light: ['#b998ee', '#f3e8ff'],
      dark: ['#c69dff', '#fcd3ff'],
    },
  },
  {
    name: 'INDIGO',
    hexValues: {
      light: ['#95a3f0', '#eef2ff'],
      dark: ['#8f9ef5', '#c5d4ff'],
    },
  },
  {
    name: 'CRIMSON',
    hexValues: {
      light: ['#f5849c', '#ffe5e5'],
      dark: ['#f58da3', '#ffc3d9'],
    },
  },
  {
    name: 'CORAL',
    hexValues: {
      light: ['#f5a289', '#fff0ed'],
      dark: ['#f5ab89', '#ffe1bf'],
    },
  },
  {
    name: 'SALMON',
    hexValues: {
      light: ['#f5a597', '#fff0ef'],
      dark: ['#f5ab99', '#ffe1cf'],
    },
  },
  {
    name: 'KHAKI',
    hexValues: {
      light: ['#d9d9a1', '#fef9e6'],
      dark: ['#d7d79f', '#ffffd5'],
    },
  },
  {
    name: 'PLUM',
    hexValues: {
      light: ['#cf99ec', '#f9ebf9'],
      dark: ['#da9cf0', '#ffd2ff'],
    },
  },
  {
    name: 'ORCHID',
    hexValues: {
      light: ['#dc99ec', '#faf0fa'],
      dark: ['#ea9cf0', '#ffd2ff'],
    },
  },
  {
    name: 'TURQUOISE',
    hexValues: {
      light: ['#6ad9cd', '#e0fffe'],
      dark: ['#6ad9cd', '#a0ffff'],
    },
  },
  {
    name: 'PEACH',
    hexValues: {
      light: ['#f5b58d', '#fff4ed'],
      dark: ['#f5b58d', '#ffebc3'],
    },
  },
  {
    name: 'MINT',
    hexValues: {
      light: ['#8fdfc7', '#e8f8f0'],
      dark: ['#6ad9cd', '#a0ffff'],
    },
  },
  {
    name: 'IVORY',
    hexValues: {
      light: ['#e6e6c8', '#fffff5'],
      dark: ['#a5a595', '#dbdbcb'],
    },
  },
  {
    name: 'BEIGE',
    hexValues: {
      light: ['#dcdcb2', '#fdfcf3'],
      dark: ['#bfbf9b', '#f5f5d1'],
    },
  },
  {
    name: 'TAN',
    hexValues: {
      light: ['#e0c8a5', '#faf6ef'],
      dark: ['#e5b185', '#ffe7bb'],
    },
  },
  {
    name: 'CHOCOLATE',
    hexValues: {
      light: ['#c99676', '#f5e8e0'],
      dark: ['#e59469', '#ffca9f'],
    },
  },
  {
    name: 'SKYBLUE',
    hexValues: {
      light: ['#85c5e8', '#e0f7ff'],
      dark: ['#7abde7', '#b0f3ff'],
    },
  },
  {
    name: 'STEELBLUE',
    hexValues: {
      light: ['#98b2e0', '#e6f0ff'],
      dark: ['#8aabe9', '#c0e1ff'],
    },
  },
  {
    name: 'LIGHTGREEN',
    hexValues: {
      light: ['#a6dba3', '#e8f9e8'],
      dark: ['#8dc58a', '#c3fbc0'],
    },
  },
  {
    name: 'AQUA',
    hexValues: {
      light: ['#7ae9f5', '#e0ffff'],
      dark: ['#7ae9f5', '#b0ffff'],
    },
  },
  {
    name: 'AQUAMARINE',
    hexValues: {
      light: ['#7ae9c8', '#e0fff0'],
      dark: ['#6ae9cd', '#a0ffff'],
    },
  },
  {
    name: 'AZURE',
    hexValues: {
      light: ['#88ccee', '#e0f5ff'],
      dark: ['#7acaf9', '#b0ffff'],
    },
  },
  {
    name: 'BISQUE',
    hexValues: {
      light: ['#e0c2a5', '#fff5ea'],
      dark: ['#f5cfaa', '#ffffe0'],
    },
  },
  {
    name: 'BURGUNDY',
    hexValues: {
      light: ['#f58a9c', '#ffe5ec'],
      dark: ['#f593a9', '#ffc9df'],
    },
  },
  {
    name: 'CADETBLUE',
    hexValues: {
      light: ['#95b8c8', '#e6f0f2'],
      dark: ['#8ab5c8', '#c0ebfe'],
    },
  },
  {
    name: 'CHARTREUSE',
    hexValues: {
      light: ['#b5d977', '#f0ffe0'],
      dark: ['#bbde7a', '#f1ffb0'],
    },
  },
  {
    name: 'CHERRY',
    hexValues: {
      light: ['#f58a9c', '#ffe5ec'],
      dark: ['#f593a9', '#ffc9df'],
    },
  },
  {
    name: 'CHESTNUT',
    hexValues: {
      light: ['#d9a089', '#f5e8e5'],
      dark: ['#f5ab89', '#ffe1bf'],
    },
  },
  {
    name: 'COBALT',
    hexValues: {
      light: ['#95a3f0', '#e0e8ff'],
      dark: ['#8a9ef5', '#c0d4ff'],
    },
  },
  {
    name: 'COPPER',
    hexValues: {
      light: ['#e0a289', '#ffe8e0'],
      dark: ['#f5bf9a', '#fff5d0'],
    },
  },
  {
    name: 'CREAM',
    hexValues: {
      light: ['#e6e6a5', '#ffffe0'],
      dark: ['#e5e5aa', '#ffffe0'],
    },
  },
  {
    name: 'DARKGREEN',
    hexValues: {
      light: ['#86c98a', '#e5f5e5'],
      dark: ['#7ac57a', '#b0fbb0'],
    },
  },
  {
    name: 'DENIM',
    hexValues: {
      light: ['#98b8e0', '#e5f0ff'],
      dark: ['#8aafef', '#c0e5ff'],
    },
  },
  {
    name: 'EBONY',
    hexValues: {
      light: ['#a5a595', '#e5e5e0'],
      dark: ['#8a8a7a', '#c0c0b0'],
    },
  },
  {
    name: 'ECRU',
    hexValues: {
      light: ['#d9d9a5', '#fefcf0'],
      dark: ['#d0d0aa', '#ffffe0'],
    },
  },
  {
    name: 'EGGPLANT',
    hexValues: {
      light: ['#cf99cf', '#f5e5f5'],
      dark: ['#cf9acf', '#ffd0ff'],
    },
  },
  {
    name: 'EMERALD',
    hexValues: {
      light: ['#7ad9a5', '#e0f8e8'],
      dark: ['#6cd8ab', '#a2ffe1'],
    },
  },
  {
    name: 'FUCHSIA',
    hexValues: {
      light: ['#f5a0f5', '#ffe5ff'],
      dark: ['#f5a0f5', '#ffd6ff'],
    },
  },
  {
    name: 'GINGER',
    hexValues: {
      light: ['#e0a289', '#fff0e0'],
      dark: ['#f5bf9a', '#fff5d0'],
    },
  },
  {
    name: 'GRAPE',
    hexValues: {
      light: ['#cf99f0', '#f0e8ff'],
      dark: ['#cf9af0', '#ffd0ff'],
    },
  },
];

// ✅ Helper: generate a middle color for LinearGradient (3 colors required by RN)
const generateMiddleColor = (c1: string, c2: string): string => {
  // Ensure hex values are valid
  const clean = (c: string) => c.replace('#', '');
  const r1 = parseInt(clean(c1).substring(0, 2), 16);
  const g1 = parseInt(clean(c1).substring(2, 4), 16);
  const b1 = parseInt(clean(c1).substring(4, 6), 16);
  const r2 = parseInt(clean(c2).substring(0, 2), 16);
  const g2 = parseInt(clean(c2).substring(2, 4), 16);
  const b2 = parseInt(clean(c2).substring(4, 6), 16);

  const midR = Math.round((r1 + r2) / 2);
  const midG = Math.round((g1 + g2) / 2);
  const midB = Math.round((b1 + b2) / 2);

  const hex = (n: number) => n.toString(16).padStart(2, '0');
  return `#${hex(midR)}${hex(midG)}${hex(midB)}`;
};

// ✅ Returns 3 colors for LinearGradient — first → middle → last
export const getColorHexValues = (
  colorName: string | null,
  isDark: boolean,
): string[] => {
  const theme = isDark ? 'dark' : 'light';

  if (!colorName) {
    if (isDark) {
      return ['#3a4458', '#4a5568', '#3a4458'];
    }
    return ['#f9fafb', '#ffffff', '#ffffff'];
  }

  const colorMapping = colors.find(
    color => color.name.toLowerCase() === colorName.toLowerCase(),
  );

  if (colorMapping && colorMapping.hexValues[theme]) {
    const [first, last] = colorMapping.hexValues[theme];
    const middle = generateMiddleColor(first, last);
    return [first, middle, last];
  }

  if (isDark) {
    return ['#3a4458', '#4a5568', '#3a4458'];
  }
  return ['#f9fafb', '#ffffff', '#ffffff'];
};

// ✅ Primary color (first hex)
export const getPrimaryColor = (
  colorName: string | null,
  isDark: boolean,
): string => {
  const hexValues = getColorHexValues(colorName, isDark);
  return hexValues[0] || (isDark ? '#3a4458' : '#f9fafb');
};

// ✅ Secondary color (middle hex — auto-generated)
export const getSecondaryColor = (
  colorName: string | null,
  isDark: boolean,
): string => {
  const hexValues = getColorHexValues(colorName, isDark);
  return hexValues[1] || (isDark ? '#4a5568' : '#ffffff');
};

// ✅ Tertiary color (last hex)
export const getTertiaryColor = (
  colorName: string | null,
  isDark: boolean,
): string => {
  const hexValues = getColorHexValues(colorName, isDark);
  return hexValues[2] || (isDark ? '#3a4458' : '#ffffff');
};

export default colors;