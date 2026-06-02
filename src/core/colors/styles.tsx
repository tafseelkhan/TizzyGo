// colors.ts
import { Appearance } from 'react-native';

// Define the ColorItem interface
export interface ColorItem {
  name: string;
  hexValues: {
    light: string[];
    dark: string[];
  };
}

// Helper function to get current theme mode
export const getCurrentThemeMode = (): 'light' | 'dark' => {
  const colorScheme = Appearance.getColorScheme();
  return colorScheme === 'dark' ? 'dark' : 'light';
};

// Complete color mapping with both light and dark mode support
export const colors: ColorItem[] = [
  {
    name: 'TEAL',
    hexValues: {
      light: ['#a2ffec', '#c2fff2', '#e6fffa', '#ffffff'],
      dark: ['#4aa89a', '#5cbaac', '#6eccbe', '#80ded0'],
    },
  },
  {
    name: 'BLUE',
    hexValues: {
      light: ['#e0f2fe', '#e6f3ff', '#f0f8ff', '#ffffff'],
      dark: ['#6a8fc9', '#7ca1db', '#8eb3ed', '#a0c5ff'],
    },
  },
  {
    name: 'RED',
    hexValues: {
      light: ['#fee2e2', '#ffe8e8', '#fff0f0', '#ffffff'],
      dark: ['#e68080', '#f89292', '#ffa4a4', '#ffb6b6'],
    },
  },
  {
    name: 'GREEN',
    hexValues: {
      light: ['#dcfce7', '#e6f9ed', '#f0fcf3', '#ffffff'],
      dark: ['#5aa56a', '#6cb77c', '#7ec98e', '#90dba0'],
    },
  },
  {
    name: 'YELLOW',
    hexValues: {
      light: ['#fef9c3', '#fff9e6', '#fffcf0', '#ffffff'],
      dark: ['#e5c85a', '#f7da6c', '#ffec7e', '#fffe90'],
    },
  },
  {
    name: 'ORANGE',
    hexValues: {
      light: ['#ffedd5', '#fff0e0', '#fff5ea', '#ffffff'],
      dark: ['#f5a15f', '#ffb371', '#ffc583', '#ffd795'],
    },
  },
  {
    name: 'PURPLE',
    hexValues: {
      light: ['#f3e8ff', '#f5edff', '#faf5ff', '#ffffff'],
      dark: ['#b389e0', '#c59bf2', '#d7adff', '#e9bfff'],
    },
  },
  {
    name: 'PINK',
    hexValues: {
      light: ['#fce7f3', '#ffe4f0', '#fff0f5', '#ffffff'],
      dark: ['#e985b3', '#fb97c5', '#ffa9d7', '#ffbbe9'],
    },
  },
  {
    name: 'BROWN',
    hexValues: {
      light: ['#f5e8e0', '#f8efe8', '#fcf5f0', '#ffffff'],
      dark: ['#cb8a5f', '#dd9c71', '#efae83', '#ffc095'],
    },
  },
  {
    name: 'GRAY',
    hexValues: {
      light: ['#f3f4f6', '#f7f8f9', '#fafbfc', '#ffffff'],
      dark: ['#8b9aad', '#9dacbf', '#afbed1', '#c1d0e3'],
    },
  },
  {
    name: 'BLACK',
    hexValues: {
      light: ['#e5e5e5', '#efefef', '#f5f5f5', '#ffffff'],
      dark: ['#5a5a5a', '#6c6c6c', '#7e7e7e', '#909090'],
    },
  },
  {
    name: 'WHITE',
    hexValues: {
      light: ['#fafafa', '#fcfcfc', '#fefefe', '#ffffff'],
      dark: ['#f9fafb', '#f3f4f6', '#e5e7eb', '#d1d5db'],
    },
  },
  {
    name: 'CYAN',
    hexValues: {
      light: ['#cffafe', '#e0fcff', '#f0feff', '#ffffff'],
      dark: ['#6ac0dc', '#7cd2ee', '#8ee4ff', '#a0f6ff'],
    },
  },
  {
    name: 'MAGENTA',
    hexValues: {
      light: ['#fae8ff', '#fceeff', '#fff5ff', '#ffffff'],
      dark: ['#d685df', '#e897f1', '#faa9ff', '#ffbbff'],
    },
  },
  {
    name: 'LIME',
    hexValues: {
      light: ['#ecfccb', '#f2fde0', '#f8fef0', '#ffffff'],
      dark: ['#9acd5f', '#acdf71', '#bef183', '#d0ff95'],
    },
  },
  {
    name: 'MAROON',
    hexValues: {
      light: ['#fde5e5', '#ffefef', '#fff5f5', '#ffffff'],
      dark: ['#e98595', '#fb97a7', '#ffa9b9', '#ffbbcb'],
    },
  },
  {
    name: 'NAVY',
    hexValues: {
      light: ['#e0e7ff', '#ecf0ff', '#f5f8ff', '#ffffff'],
      dark: ['#7a8cd5', '#8c9ee7', '#9eb0f9', '#b0c2ff'],
    },
  },
  {
    name: 'OLIVE',
    hexValues: {
      light: ['#f5f5e6', '#f8f8ef', '#fbfbf5', '#ffffff'],
      dark: ['#abab75', '#bdbd87', '#cfcf99', '#e1e1ab'],
    },
  },
  {
    name: 'GOLD',
    hexValues: {
      light: ['#fef9c3', '#fff8e0', '#fffcf0', '#ffffff'],
      dark: ['#f5c55f', '#ffd771', '#ffe983', '#fffb95'],
    },
  },
  {
    name: 'SILVER',
    hexValues: {
      light: ['#f9fafb', '#fbfcfd', '#fdfdfe', '#ffffff'],
      dark: ['#a5b4c4', '#b7c6d6', '#c9d8e8', '#dbeafa'],
    },
  },
  {
    name: 'LAVENDER',
    hexValues: {
      light: ['#f5f0ff', '#f8f5ff', '#fcfaff', '#ffffff'],
      dark: ['#bd9cf0', '#cfaefe', '#e1c0ff', '#f3d2ff'],
    },
  },
  {
    name: 'VIOLET',
    hexValues: {
      light: ['#f3e8ff', '#f7f0ff', '#fbf8ff', '#ffffff'],
      dark: ['#c69dff', '#d8afff', '#eac1ff', '#fcd3ff'],
    },
  },
  {
    name: 'INDIGO',
    hexValues: {
      light: ['#eef2ff', '#f0f4ff', '#f5f8ff', '#ffffff'],
      dark: ['#8f9ef5', '#a1b0ff', '#b3c2ff', '#c5d4ff'],
    },
  },
  {
    name: 'CRIMSON',
    hexValues: {
      light: ['#ffe5e5', '#ffefef', '#fff5f5', '#ffffff'],
      dark: ['#f58da3', '#ff9fb5', '#ffb1c7', '#ffc3d9'],
    },
  },
  {
    name: 'CORAL',
    hexValues: {
      light: ['#fff0ed', '#fff4f2', '#fffaf8', '#ffffff'],
      dark: ['#f5ab89', '#ffbd9b', '#ffcfad', '#ffe1bf'],
    },
  },
  {
    name: 'SALMON',
    hexValues: {
      light: ['#fff0ef', '#fff4f3', '#fffaf9', '#ffffff'],
      dark: ['#f5ab99', '#ffbdab', '#ffcfbd', '#ffe1cf'],
    },
  },
  {
    name: 'KHAKI',
    hexValues: {
      light: ['#fef9e6', '#fffaf0', '#fffcf5', '#ffffff'],
      dark: ['#d7d79f', '#e9e9b1', '#fbfbc3', '#ffffd5'],
    },
  },
  {
    name: 'PLUM',
    hexValues: {
      light: ['#f9ebf9', '#fbf0fb', '#fdf5fd', '#ffffff'],
      dark: ['#da9cf0', '#ecaeff', '#fec0ff', '#ffd2ff'],
    },
  },
  {
    name: 'ORCHID',
    hexValues: {
      light: ['#faf0fa', '#fcf5fc', '#fefafe', '#ffffff'],
      dark: ['#ea9cf0', '#fcaeff', '#ffc0ff', '#ffd2ff'],
    },
  },
  {
    name: 'TURQUOISE',
    hexValues: {
      light: ['#e0fffe', '#edffff', '#f5ffff', '#ffffff'],
      dark: ['#6ad9cd', '#7cebdf', '#8efdf1', '#a0ffff'],
    },
  },
  {
    name: 'PEACH',
    hexValues: {
      light: ['#fff4ed', '#fff7f2', '#fffbf8', '#ffffff'],
      dark: ['#f5b58d', '#ffc79f', '#ffd9b1', '#ffebc3'],
    },
  },
  {
    name: 'MINT',
    hexValues: {
      light: ['#e8f8f0', '#f0faf5', '#f8fdfa', '#ffffff'],
      dark: ['#6ad9cd', '#7cebdf', '#8efdf1', '#a0ffff'],
    },
  },
  {
    name: 'IVORY',
    hexValues: {
      light: ['#fffff5', '#fffff8', '#fffffc', '#ffffff'],
      dark: ['#a5a595', '#b7b7a7', '#c9c9b9', '#dbdbcb'],
    },
  },
  {
    name: 'BEIGE',
    hexValues: {
      light: ['#fdfcf3', '#fefdf8', '#fffefc', '#ffffff'],
      dark: ['#bfbf9b', '#d1d1ad', '#e3e3bf', '#f5f5d1'],
    },
  },
  {
    name: 'TAN',
    hexValues: {
      light: ['#faf6ef', '#fcf8f3', '#fefcf9', '#ffffff'],
      dark: ['#e5b185', '#f7c397', '#ffd5a9', '#ffe7bb'],
    },
  },
  {
    name: 'CHOCOLATE',
    hexValues: {
      light: ['#f5e8e0', '#f8efe8', '#fcf5f0', '#ffffff'],
      dark: ['#e59469', '#f7a67b', '#ffb88d', '#ffca9f'],
    },
  },
  {
    name: 'SKYBLUE',
    hexValues: {
      light: ['#e0f7ff', '#eefbff', '#f5fdff', '#ffffff'],
      dark: ['#7abde7', '#8ccff9', '#9ee1ff', '#b0f3ff'],
    },
  },
  {
    name: 'STEELBLUE',
    hexValues: {
      light: ['#e6f0ff', '#eff5ff', '#f5f9ff', '#ffffff'],
      dark: ['#8aabe9', '#9cbdfb', '#aecfff', '#c0e1ff'],
    },
  },
  {
    name: 'LIGHTGREEN',
    hexValues: {
      light: ['#e8f9e8', '#f0fbf0', '#f8fdf8', '#ffffff'],
      dark: ['#8dc58a', '#9fd79c', '#b1e9ae', '#c3fbc0'],
    },
  },
  {
    name: 'AQUA',
    hexValues: {
      light: ['#e0ffff', '#edffff', '#f5ffff', '#ffffff'],
      dark: ['#7ae9f5', '#8cfbff', '#9effff', '#b0ffff'],
    },
  },
  {
    name: 'AQUAMARINE',
    hexValues: {
      light: ['#e0fff0', '#edfff5', '#f5fffa', '#ffffff'],
      dark: ['#6ae9cd', '#7cfbdf', '#8efff1', '#a0ffff'],
    },
  },
  {
    name: 'AZURE',
    hexValues: {
      light: ['#e0f5ff', '#eef9ff', '#f5fcff', '#ffffff'],
      dark: ['#7acaf9', '#8cdcff', '#9eeeff', '#b0ffff'],
    },
  },
  {
    name: 'BISQUE',
    hexValues: {
      light: ['#fff5ea', '#fff8f0', '#fffcf8', '#ffffff'],
      dark: ['#f5cfaa', '#ffe1bc', '#fff3ce', '#ffffe0'],
    },
  },
  {
    name: 'BURGUNDY',
    hexValues: {
      light: ['#ffe5ec', '#ffeff3', '#fff5f8', '#ffffff'],
      dark: ['#f593a9', '#ffa5bb', '#ffb7cd', '#ffc9df'],
    },
  },
  {
    name: 'CADETBLUE',
    hexValues: {
      light: ['#e6f0f2', '#eff5f7', '#f5fafc', '#ffffff'],
      dark: ['#8ab5c8', '#9cc7da', '#aed9ec', '#c0ebfe'],
    },
  },
  {
    name: 'CHARTREUSE',
    hexValues: {
      light: ['#f0ffe0', '#f5ffe8', '#fafff0', '#ffffff'],
      dark: ['#bbde7a', '#cdf08c', '#dfff9e', '#f1ffb0'],
    },
  },
  {
    name: 'CHERRY',
    hexValues: {
      light: ['#ffe5ec', '#ffeff3', '#fff5f8', '#ffffff'],
      dark: ['#f593a9', '#ffa5bb', '#ffb7cd', '#ffc9df'],
    },
  },
  {
    name: 'CHESTNUT',
    hexValues: {
      light: ['#f5e8e5', '#f8efec', '#fcf5f2', '#ffffff'],
      dark: ['#f5ab89', '#ffbd9b', '#ffcfad', '#ffe1bf'],
    },
  },
  {
    name: 'COBALT',
    hexValues: {
      light: ['#e0e8ff', '#eef2ff', '#f5f8ff', '#ffffff'],
      dark: ['#8a9ef5', '#9cb0ff', '#aec2ff', '#c0d4ff'],
    },
  },
  {
    name: 'COPPER',
    hexValues: {
      light: ['#ffe8e0', '#fff0e8', '#fff8f0', '#ffffff'],
      dark: ['#f5bf9a', '#ffd1ac', '#ffe3be', '#fff5d0'],
    },
  },
  {
    name: 'CREAM',
    hexValues: {
      light: ['#ffffe0', '#ffffec', '#fffff5', '#ffffff'],
      dark: ['#e5e5aa', '#f7f7bc', '#ffffce', '#ffffe0'],
    },
  },
  {
    name: 'DARKGREEN',
    hexValues: {
      light: ['#e5f5e5', '#eef8ee', '#f5fcf5', '#ffffff'],
      dark: ['#7ac57a', '#8cd78c', '#9ee99e', '#b0fbb0'],
    },
  },
  {
    name: 'DENIM',
    hexValues: {
      light: ['#e5f0ff', '#eef5ff', '#f5faff', '#ffffff'],
      dark: ['#8aafef', '#9cc1ff', '#aed3ff', '#c0e5ff'],
    },
  },
  {
    name: 'EBONY',
    hexValues: {
      light: ['#e5e5e0', '#efefe8', '#f5f5f0', '#ffffff'],
      dark: ['#8a8a7a', '#9c9c8c', '#aeae9e', '#c0c0b0'],
    },
  },
  {
    name: 'ECRU',
    hexValues: {
      light: ['#fefcf0', '#fffdf5', '#fffefa', '#ffffff'],
      dark: ['#d0d0aa', '#e2e2bc', '#f4f4ce', '#ffffe0'],
    },
  },
  {
    name: 'EGGPLANT',
    hexValues: {
      light: ['#f5e5f5', '#f8eef8', '#fcf5fc', '#ffffff'],
      dark: ['#cf9acf', '#e1ace1', '#f3bef3', '#ffd0ff'],
    },
  },
  {
    name: 'EMERALD',
    hexValues: {
      light: ['#e0f8e8', '#eefcf0', '#f5fef8', '#ffffff'],
      dark: ['#6cd8ab', '#7eeabd', '#90fccf', '#a2ffe1'],
    },
  },
  {
    name: 'FUCHSIA',
    hexValues: {
      light: ['#ffe5ff', '#ffefff', '#fff5ff', '#ffffff'],
      dark: ['#f5a0f5', '#ffb2ff', '#ffc4ff', '#ffd6ff'],
    },
  },
  {
    name: 'GINGER',
    hexValues: {
      light: ['#fff0e0', '#fff5e8', '#fffaf0', '#ffffff'],
      dark: ['#f5bf9a', '#ffd1ac', '#ffe3be', '#fff5d0'],
    },
  },
  {
    name: 'GRAPE',
    hexValues: {
      light: ['#f0e8ff', '#f5f0ff', '#faf8ff', '#ffffff'],
      dark: ['#cf9af0', '#e1acff', '#f3beff', '#ffd0ff'],
    },
  },
];

// Helper function to get color hex values based on theme
export const getColorHexValues = (
  colorName: string | null,
  isDark: boolean,
): string[] => {
  const theme = isDark ? 'dark' : 'light';

  if (!colorName) {
    // Return default gradient based on theme
    if (isDark) {
      return ['#3a4458', '#4a5568', '#3a4458'];
    }
    return ['#f9fafb', '#ffffff', '#ffffff'];
  }

  const colorMapping = colors.find(
    color => color.name.toLowerCase() === colorName.toLowerCase(),
  );

  if (colorMapping && colorMapping.hexValues[theme]) {
    return colorMapping.hexValues[theme];
  }

  // Return default gradient based on theme if color not found
  if (isDark) {
    return ['#3a4458', '#4a5568', '#3a4458'];
  }
  return ['#f9fafb', '#ffffff', '#ffffff'];
};

// Helper function to get primary color (first hex value) based on theme
export const getPrimaryColor = (
  colorName: string | null,
  isDark: boolean,
): string => {
  const hexValues = getColorHexValues(colorName, isDark);
  return hexValues[0] || (isDark ? '#3a4458' : '#f9fafb');
};

// Helper function to get secondary color based on theme
export const getSecondaryColor = (
  colorName: string | null,
  isDark: boolean,
): string => {
  const hexValues = getColorHexValues(colorName, isDark);
  return hexValues[1] || (isDark ? '#4a5568' : '#ffffff');
};

// Helper function to get tertiary color based on theme
export const getTertiaryColor = (
  colorName: string | null,
  isDark: boolean,
): string => {
  const hexValues = getColorHexValues(colorName, isDark);
  return hexValues[2] || (isDark ? '#3a4458' : '#ffffff');
};

// Export default color object
export default colors;
