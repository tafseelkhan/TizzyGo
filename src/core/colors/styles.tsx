// Define the ColorItem type
export interface ColorItem {
  name: string;
  hexValues: string[];
}

// Complete color mapping with arrays of hex values (only light shades, no dark)
export const colors: ColorItem[] = [
  {
    name: 'TEAL',
    hexValues: ['#a2ffec', '#c2fff2', '#e6fffa', '#ffffff'],
  },
  {
    name: 'BLUE',
    hexValues: ['#e0f2fe', '#e6f3ff', '#f0f8ff', '#ffffff'],
  },
  {
    name: 'RED',
    hexValues: ['#fee2e2', '#ffe8e8', '#fff0f0', '#ffffff'],
  },
  {
    name: 'GREEN',
    hexValues: ['#dcfce7', '#e6f9ed', '#f0fcf3', '#ffffff'],
  },
  {
    name: 'YELLOW',
    hexValues: ['#fef9c3', '#fff9e6', '#fffcf0', '#ffffff'],
  },
  {
    name: 'ORANGE',
    hexValues: ['#ffedd5', '#fff0e0', '#fff5ea', '#ffffff'],
  },
  {
    name: 'PURPLE',
    hexValues: ['#f3e8ff', '#f5edff', '#faf5ff', '#ffffff'],
  },
  {
    name: 'PINK',
    hexValues: ['#fce7f3', '#ffe4f0', '#fff0f5', '#ffffff'],
  },
  {
    name: 'BROWN',
    hexValues: ['#f5e8e0', '#f8efe8', '#fcf5f0', '#ffffff'],
  },
  {
    name: 'GRAY',
    hexValues: ['#f3f4f6', '#f7f8f9', '#fafbfc', '#ffffff'],
  },
  {
    name: 'BLACK',
    hexValues: ['#e5e5e5', '#efefef', '#f5f5f5', '#ffffff'],
  },
  {
    name: 'WHITE',
    hexValues: ['#fafafa', '#fcfcfc', '#fefefe', '#ffffff'],
  },
  {
    name: 'CYAN',
    hexValues: ['#cffafe', '#e0fcff', '#f0feff', '#ffffff'],
  },
  {
    name: 'MAGENTA',
    hexValues: ['#fae8ff', '#fceeff', '#fff5ff', '#ffffff'],
  },
  {
    name: 'LIME',
    hexValues: ['#ecfccb', '#f2fde0', '#f8fef0', '#ffffff'],
  },
  {
    name: 'MAROON',
    hexValues: ['#fde5e5', '#ffefef', '#fff5f5', '#ffffff'],
  },
  {
    name: 'NAVY',
    hexValues: ['#e0e7ff', '#ecf0ff', '#f5f8ff', '#ffffff'],
  },
  {
    name: 'OLIVE',
    hexValues: ['#f5f5e6', '#f8f8ef', '#fbfbf5', '#ffffff'],
  },
  {
    name: 'GOLD',
    hexValues: ['#fef9c3', '#fff8e0', '#fffcf0', '#ffffff'],
  },
  {
    name: 'SILVER',
    hexValues: ['#f9fafb', '#fbfcfd', '#fdfdfe', '#ffffff'],
  },
  {
    name: 'LAVENDER',
    hexValues: ['#f5f0ff', '#f8f5ff', '#fcfaff', '#ffffff'],
  },
  {
    name: 'VIOLET',
    hexValues: ['#f3e8ff', '#f7f0ff', '#fbf8ff', '#ffffff'],
  },
  {
    name: 'INDIGO',
    hexValues: ['#eef2ff', '#f0f4ff', '#f5f8ff', '#ffffff'],
  },
  {
    name: 'CRIMSON',
    hexValues: ['#ffe5e5', '#ffefef', '#fff5f5', '#ffffff'],
  },
  {
    name: 'CORAL',
    hexValues: ['#fff0ed', '#fff4f2', '#fffaf8', '#ffffff'],
  },
  {
    name: 'SALMON',
    hexValues: ['#fff0ef', '#fff4f3', '#fffaf9', '#ffffff'],
  },
  {
    name: 'KHAKI',
    hexValues: ['#fef9e6', '#fffaf0', '#fffcf5', '#ffffff'],
  },
  {
    name: 'PLUM',
    hexValues: ['#f9ebf9', '#fbf0fb', '#fdf5fd', '#ffffff'],
  },
  {
    name: 'ORCHID',
    hexValues: ['#faf0fa', '#fcf5fc', '#fefafe', '#ffffff'],
  },
  {
    name: 'TURQUOISE',
    hexValues: ['#e0fffe', '#edffff', '#f5ffff', '#ffffff'],
  },
  {
    name: 'PEACH',
    hexValues: ['#fff4ed', '#fff7f2', '#fffbf8', '#ffffff'],
  },
  {
    name: 'MINT',
    hexValues: ['#e8f8f0', '#f0faf5', '#f8fdfa', '#ffffff'],
  },
  {
    name: 'IVORY',
    hexValues: ['#fffff5', '#fffff8', '#fffffc', '#ffffff'],
  },
  {
    name: 'BEIGE',
    hexValues: ['#fdfcf3', '#fefdf8', '#fffefc', '#ffffff'],
  },
  {
    name: 'TAN',
    hexValues: ['#faf6ef', '#fcf8f3', '#fefcf9', '#ffffff'],
  },
  {
    name: 'CHOCOLATE',
    hexValues: ['#f5e8e0', '#f8efe8', '#fcf5f0', '#ffffff'],
  },
  {
    name: 'SKYBLUE',
    hexValues: ['#e0f7ff', '#eefbff', '#f5fdff', '#ffffff'],
  },
  {
    name: 'STEELBLUE',
    hexValues: ['#e6f0ff', '#eff5ff', '#f5f9ff', '#ffffff'],
  },
  {
    name: 'LIGHTGREEN',
    hexValues: ['#e8f9e8', '#f0fbf0', '#f8fdf8', '#ffffff'],
  },
  {
    name: 'AQUA',
    hexValues: ['#e0ffff', '#edffff', '#f5ffff', '#ffffff'],
  },
  {
    name: 'AQUAMARINE',
    hexValues: ['#e0fff0', '#edfff5', '#f5fffa', '#ffffff'],
  },
  {
    name: 'AZURE',
    hexValues: ['#e0f5ff', '#eef9ff', '#f5fcff', '#ffffff'],
  },
  {
    name: 'BISQUE',
    hexValues: ['#fff5ea', '#fff8f0', '#fffcf8', '#ffffff'],
  },
  {
    name: 'BLANCHEDALMOND',
    hexValues: ['#fff5e6', '#fff8ef', '#fffcf7', '#ffffff'],
  },
  {
    name: 'BURGUNDY',
    hexValues: ['#ffe5ec', '#ffeff3', '#fff5f8', '#ffffff'],
  },
  {
    name: 'CADETBLUE',
    hexValues: ['#e6f0f2', '#eff5f7', '#f5fafc', '#ffffff'],
  },
  {
    name: 'CHARTREUSE',
    hexValues: ['#f0ffe0', '#f5ffe8', '#fafff0', '#ffffff'],
  },
  {
    name: 'CHERRY',
    hexValues: ['#ffe5ec', '#ffeff3', '#fff5f8', '#ffffff'],
  },
  {
    name: 'CHESTNUT',
    hexValues: ['#f5e8e5', '#f8efec', '#fcf5f2', '#ffffff'],
  },
  {
    name: 'COBALT',
    hexValues: ['#e0e8ff', '#eef2ff', '#f5f8ff', '#ffffff'],
  },
  {
    name: 'COPPER',
    hexValues: ['#ffe8e0', '#fff0e8', '#fff8f0', '#ffffff'],
  },
  {
    name: 'CREAM',
    hexValues: ['#ffffe0', '#ffffec', '#fffff5', '#ffffff'],
  },
  {
    name: 'DARKGREEN',
    hexValues: ['#e5f5e5', '#eef8ee', '#f5fcf5', '#ffffff'],
  },
  {
    name: 'DENIM',
    hexValues: ['#e5f0ff', '#eef5ff', '#f5faff', '#ffffff'],
  },
  {
    name: 'EBONY',
    hexValues: ['#e5e5e0', '#efefe8', '#f5f5f0', '#ffffff'],
  },
  {
    name: 'ECRU',
    hexValues: ['#fefcf0', '#fffdf5', '#fffefa', '#ffffff'],
  },
  {
    name: 'EGGPLANT',
    hexValues: ['#f5e5f5', '#f8eef8', '#fcf5fc', '#ffffff'],
  },
  {
    name: 'EMERALD',
    hexValues: ['#e0f8e8', '#eefcf0', '#f5fef8', '#ffffff'],
  },
  {
    name: 'FUCHSIA',
    hexValues: ['#ffe5ff', '#ffefff', '#fff5ff', '#ffffff'],
  },
  {
    name: 'GINGER',
    hexValues: ['#fff0e0', '#fff5e8', '#fffaf0', '#ffffff'],
  },
  {
    name: 'GRAPE',
    hexValues: ['#f0e8ff', '#f5f0ff', '#faf8ff', '#ffffff'],
  },
  {
    name: 'HEATHER',
    hexValues: ['#f0e8f5', '#f5eff8', '#faf5fc', '#ffffff'],
  },
  {
    name: 'HONEY',
    hexValues: ['#fff5e0', '#fff8e8', '#fffcf0', '#ffffff'],
  },
  {
    name: 'HOTPINK',
    hexValues: ['#ffe5f0', '#ffeff5', '#fff5fa', '#ffffff'],
  },
  {
    name: 'JADE',
    hexValues: ['#e0f8f0', '#eefcf5', '#f5fefa', '#ffffff'],
  },
  {
    name: 'JASMINE',
    hexValues: ['#fff8e0', '#fffae8', '#fffdf0', '#ffffff'],
  },
  {
    name: 'JET',
    hexValues: ['#e0e0e0', '#ececec', '#f5f5f5', '#ffffff'],
  },
  {
    name: 'KELP',
    hexValues: ['#e8f0e0', '#f0f5e8', '#f8faf0', '#ffffff'],
  },
  {
    name: 'LATTE',
    hexValues: ['#f8f0e5', '#faf5ec', '#fcfaf5', '#ffffff'],
  },
  {
    name: 'LEMON',
    hexValues: ['#fff8e0', '#fffae8', '#fffdf0', '#ffffff'],
  },
  {
    name: 'LILAC',
    hexValues: ['#f5e8ff', '#f8f0ff', '#fcf8ff', '#ffffff'],
  },
  {
    name: 'MAHOGANY',
    hexValues: ['#f5e5e0', '#f8ece8', '#fcf5f0', '#ffffff'],
  },
  {
    name: 'MALACHITE',
    hexValues: ['#e0ffe0', '#edffed', '#f5fff5', '#ffffff'],
  },
  {
    name: 'MANDARIN',
    hexValues: ['#fff0e0', '#fff5e8', '#fffaf0', '#ffffff'],
  },
  {
    name: 'MANGO',
    hexValues: ['#fff0d0', '#fff5e0', '#fffaf0', '#ffffff'],
  },
  {
    name: 'MAUVE',
    hexValues: ['#f0e8ff', '#f5f0ff', '#faf8ff', '#ffffff'],
  },
  {
    name: 'MUSTARD',
    hexValues: ['#fff0c0', '#fff5d0', '#fffae8', '#ffffff'],
  },
  {
    name: 'OCHRE',
    hexValues: ['#fff0e5', '#fff5ec', '#fffaf5', '#ffffff'],
  },
  {
    name: 'OLIVINE',
    hexValues: ['#f0f5e0', '#f5f8e8', '#fafcf0', '#ffffff'],
  },
  {
    name: 'ONYX',
    hexValues: ['#e0e0e5', '#ececf0', '#f5f5f8', '#ffffff'],
  },
  {
    name: 'OPAL',
    hexValues: ['#e8f5ff', '#f0f8ff', '#f8fcff', '#ffffff'],
  },
  {
    name: 'PEARL',
    hexValues: ['#fff8f0', '#fffaf5', '#fffdfa', '#ffffff'],
  },
  {
    name: 'PERIWINKLE',
    hexValues: ['#e8e8ff', '#f0f0ff', '#f8f8ff', '#ffffff'],
  },
  {
    name: 'PISTACHIO',
    hexValues: ['#f0f8e8', '#f5faf0', '#fafdf8', '#ffffff'],
  },
  {
    name: 'RASPBERRY',
    hexValues: ['#ffe5f0', '#ffeff5', '#fff5fa', '#ffffff'],
  },
  {
    name: 'ROSE',
    hexValues: ['#ffe5f0', '#ffeff5', '#fff5fa', '#ffffff'],
  },
  {
    name: 'RUBY',
    hexValues: ['#ffe5e8', '#ffeff0', '#fff5f8', '#ffffff'],
  },
  {
    name: 'RUST',
    hexValues: ['#ffe8e0', '#fff0e8', '#fff8f0', '#ffffff'],
  },
  {
    name: 'SAGE',
    hexValues: ['#e8f0e5', '#f0f5ec', '#f8faf5', '#ffffff'],
  },
  {
    name: 'SANDALWOOD',
    hexValues: ['#f8f0e8', '#faf5f0', '#fcfaf8', '#ffffff'],
  },
  {
    name: 'SAPPHIRE',
    hexValues: ['#e5f0ff', '#eef5ff', '#f5faff', '#ffffff'],
  },
  {
    name: 'SCARLET',
    hexValues: ['#ffe5e5', '#ffefef', '#fff5f5', '#ffffff'],
  },
  {
    name: 'SEAFOAM',
    hexValues: ['#e0fff0', '#edfff5', '#f5fffa', '#ffffff'],
  },
  {
    name: 'SEPIA',
    hexValues: ['#f8f0e5', '#faf5ec', '#fcfaf5', '#ffffff'],
  },
  {
    name: 'SIENNA',
    hexValues: ['#f5e8e0', '#f8efe8', '#fcf5f0', '#ffffff'],
  },
  {
    name: 'TANGERINE',
    hexValues: ['#fff0e0', '#fff5e8', '#fffaf0', '#ffffff'],
  },
  {
    name: 'TAUPE',
    hexValues: ['#f5f0e8', '#f8f5f0', '#fcfaf8', '#ffffff'],
  },
  {
    name: 'THYME',
    hexValues: ['#e8f0e5', '#f0f5ec', '#f8faf5', '#ffffff'],
  },
  {
    name: 'TOPAZ',
    hexValues: ['#fff0e0', '#fff5e8', '#fffaf0', '#ffffff'],
  },
  {
    name: 'TUSCANY',
    hexValues: ['#fff0e5', '#fff5ec', '#fffaf5', '#ffffff'],
  },
  {
    name: 'ULTRAMARINE',
    hexValues: ['#e5e8ff', '#eff0ff', '#f5f8ff', '#ffffff'],
  },
  {
    name: 'VANILLA',
    hexValues: ['#fff8e8', '#fffaf0', '#fffdf8', '#ffffff'],
  },
  {
    name: 'VERMILION',
    hexValues: ['#ffe8e5', '#fff0ec', '#fff8f5', '#ffffff'],
  },
  {
    name: 'WHEAT',
    hexValues: ['#fff5e0', '#fff8e8', '#fffcf0', '#ffffff'],
  },
  {
    name: 'WISTERIA',
    hexValues: ['#f0e8ff', '#f5f0ff', '#faf8ff', '#ffffff'],
  },
  {
    name: 'ZINC',
    hexValues: ['#f0f0f0', '#f5f5f5', '#fafafa', '#ffffff'],
  },
  {
    name: 'ALMOND',
    hexValues: ['#fff8f0', '#fffaf5', '#fffdfa', '#ffffff'],
  },
  {
    name: 'AMBER',
    hexValues: ['#fff0c0', '#fff5d0', '#fffae8', '#ffffff'],
  },
  {
    name: 'APRICOT',
    hexValues: ['#fff0e5', '#fff5ec', '#fffaf5', '#ffffff'],
  },
  {
    name: 'ARCTIC',
    hexValues: ['#e8ffff', '#f0ffff', '#f8ffff', '#ffffff'],
  },
  {
    name: 'BAMBOO',
    hexValues: ['#f8f5e8', '#faf8f0', '#fcfcf8', '#ffffff'],
  },
  {
    name: 'BRONZE',
    hexValues: ['#fff0e5', '#fff5ec', '#fffaf5', '#ffffff'],
  },
  {
    name: 'CAMELLIA',
    hexValues: ['#ffe5f0', '#ffeff5', '#fff5fa', '#ffffff'],
  },
  {
    name: 'CINNAMON',
    hexValues: ['#fff0e5', '#fff5ec', '#fffaf5', '#ffffff'],
  },
  {
    name: 'CLAY',
    hexValues: ['#f8f0e8', '#faf5f0', '#fcfaf8', '#ffffff'],
  },
  {
    name: 'COBALTBLUE',
    hexValues: ['#e0e8ff', '#eef2ff', '#f5f8ff', '#ffffff'],
  },
  {
    name: 'COFFEE',
    hexValues: ['#f8f0e5', '#faf5ec', '#fcfaf5', '#ffffff'],
  },
  {
    name: 'CORALPINK',
    hexValues: ['#fff0ed', '#fff4f2', '#fffaf8', '#ffffff'],
  },
  {
    name: 'DOVE',
    hexValues: ['#f0f0f0', '#f5f5f5', '#fafafa', '#ffffff'],
  },
  {
    name: 'FLAMINGO',
    hexValues: ['#ffe5f0', '#ffeff5', '#fff5fa', '#ffffff'],
  },
  {
    name: 'FLINT',
    hexValues: ['#f0f0f0', '#f5f5f5', '#fafafa', '#ffffff'],
  },
  {
    name: 'FOREST',
    hexValues: ['#e5f0e5', '#eef8ee', '#f5fcf5', '#ffffff'],
  },
  {
    name: 'FUCHSIAPINK',
    hexValues: ['#ffe5ff', '#ffefff', '#fff5ff', '#ffffff'],
  },
  {
    name: 'GARNET',
    hexValues: ['#ffe5e8', '#ffeff0', '#fff5f8', '#ffffff'],
  },
  {
    name: 'GINGHAM',
    hexValues: ['#fff5e8', '#fff8f0', '#fffcf8', '#ffffff'],
  },
  {
    name: 'GLACIER',
    hexValues: ['#e8ffff', '#f0ffff', '#f8ffff', '#ffffff'],
  },
  {
    name: 'HARVEST',
    hexValues: ['#fff5e0', '#fff8e8', '#fffcf0', '#ffffff'],
  },
  {
    name: 'HAZEL',
    hexValues: ['#f8f0e8', '#faf5f0', '#fcfaf8', '#ffffff'],
  },
  {
    name: 'HELIOTROPE',
    hexValues: ['#f0e8ff', '#f5f0ff', '#faf8ff', '#ffffff'],
  },
  {
    name: 'HICKORY',
    hexValues: ['#f8f0e5', '#faf5ec', '#fcfaf5', '#ffffff'],
  },
  {
    name: 'HONEYDEW',
    hexValues: ['#f0fff0', '#f5fff5', '#fafffa', '#ffffff'],
  },
  {
    name: 'INDIGO BLUE',
    hexValues: ['#eef2ff', '#f0f4ff', '#f5f8ff', '#ffffff'],
  },
  {
    name: 'IRIS',
    hexValues: ['#f0e8ff', '#f5f0ff', '#faf8ff', '#ffffff'],
  },
  {
    name: 'IVY',
    hexValues: ['#e8f0e5', '#f0f5ec', '#f8faf5', '#ffffff'],
  },
  {
    name: 'JASPER',
    hexValues: ['#ffe8e5', '#fff0ec', '#fff8f5', '#ffffff'],
  },
  {
    name: 'JONQUIL',
    hexValues: ['#fff8e0', '#fffae8', '#fffdf0', '#ffffff'],
  },
  {
    name: 'LAPIS',
    hexValues: ['#e5e8ff', '#eff0ff', '#f5f8ff', '#ffffff'],
  },
  {
    name: 'LARKSPUR',
    hexValues: ['#e0e8ff', '#eef2ff', '#f5f8ff', '#ffffff'],
  },
  {
    name: 'LAVENDERBLUE',
    hexValues: ['#f0e8ff', '#f5f0ff', '#faf8ff', '#ffffff'],
  },
  {
    name: 'LAVENDERPINK',
    hexValues: ['#f5e8ff', '#f8f0ff', '#fcf8ff', '#ffffff'],
  },
  {
    name: 'LEMONGRASS',
    hexValues: ['#f0f8e8', '#f5faf0', '#fafdf8', '#ffffff'],
  },
  {
    name: 'LICHEN',
    hexValues: ['#e8f0e5', '#f0f5ec', '#f8faf5', '#ffffff'],
  },
  {
    name: 'LILYPAD',
    hexValues: ['#e0fff0', '#edfff5', '#f5fffa', '#ffffff'],
  },
  {
    name: 'LINDEN',
    hexValues: ['#f0f8e8', '#f5faf0', '#fafdf8', '#ffffff'],
  },
  {
    name: 'LOBSTER',
    hexValues: ['#ffe5e8', '#ffeff0', '#fff5f8', '#ffffff'],
  },
  {
    name: 'MAGNOLIA',
    hexValues: ['#fff8f0', '#fffaf5', '#fffdfa', '#ffffff'],
  },
  {
    name: 'MALLOW',
    hexValues: ['#f5e8ff', '#f8f0ff', '#fcf8ff', '#ffffff'],
  },
  {
    name: 'MANDARINORANGE',
    hexValues: ['#fff0e0', '#fff5e8', '#fffaf0', '#ffffff'],
  },
  {
    name: 'MAPLE',
    hexValues: ['#fff0e5', '#fff5ec', '#fffaf5', '#ffffff'],
  },
  {
    name: 'MARIGOLD',
    hexValues: ['#fff0c0', '#fff5d0', '#fffae8', '#ffffff'],
  },
  {
    name: 'MELON',
    hexValues: ['#fff0e5', '#fff5ec', '#fffaf5', '#ffffff'],
  },
  {
    name: 'MIMOSA',
    hexValues: ['#fff8e0', '#fffae8', '#fffdf0', '#ffffff'],
  },
  {
    name: 'MISTYROSE',
    hexValues: ['#ffe5e5', '#ffefef', '#fff5f5', '#ffffff'],
  },
  {
    name: 'MOSS',
    hexValues: ['#e8f0e0', '#f0f5e8', '#f8faf0', '#ffffff'],
  },
  {
    name: 'MULBERRY',
    hexValues: ['#f5e8ff', '#f8f0ff', '#fcf8ff', '#ffffff'],
  },
  {
    name: 'MUSHROOM',
    hexValues: ['#f8f0e8', '#faf5f0', '#fcfaf8', '#ffffff'],
  },
  {
    name: 'MYRTLE',
    hexValues: ['#e0f8e8', '#eefcf0', '#f5fef8', '#ffffff'],
  },
  {
    name: 'NARCISSUS',
    hexValues: ['#fff8e0', '#fffae8', '#fffdf0', '#ffffff'],
  },
  {
    name: 'NECTARINE',
    hexValues: ['#fff0e0', '#fff5e8', '#fffaf0', '#ffffff'],
  },
  {
    name: 'OAK',
    hexValues: ['#f8f0e5', '#faf5ec', '#fcfaf5', '#ffffff'],
  },
  {
    name: 'OCEAN',
    hexValues: ['#e0f0ff', '#eef5ff', '#f5faff', '#ffffff'],
  },
  {
    name: 'OLIVEGREEN',
    hexValues: ['#f0f5e0', '#f5f8e8', '#fafcf0', '#ffffff'],
  },
  {
    name: 'ORCHIDPINK',
    hexValues: ['#faf0fa', '#fcf5fc', '#fefafe', '#ffffff'],
  },
  {
    name: 'PANSY',
    hexValues: ['#f0e8ff', '#f5f0ff', '#faf8ff', '#ffffff'],
  },
  {
    name: 'PAPAYA',
    hexValues: ['#fff0e5', '#fff5ec', '#fffaf5', '#ffffff'],
  },
  {
    name: 'PAPYRUS',
    hexValues: ['#fff8f0', '#fffaf5', '#fffdfa', '#ffffff'],
  },
  {
    name: 'PARROT',
    hexValues: ['#e0ffe0', '#edffed', '#f5fff5', '#ffffff'],
  },
  {
    name: 'PEACOCK',
    hexValues: ['#e0ffff', '#edffff', '#f5ffff', '#ffffff'],
  },
  {
    name: 'PEONY',
    hexValues: ['#ffe5f0', '#ffeff5', '#fff5fa', '#ffffff'],
  },
  {
    name: 'PEPPERMINT',
    hexValues: ['#e0fff0', '#edfff5', '#f5fffa', '#ffffff'],
  },
  {
    name: 'PERIDOT',
    hexValues: ['#f0ffe0', '#f5ffe8', '#fafff0', '#ffffff'],
  },
  {
    name: 'PERSIMMON',
    hexValues: ['#fff0e0', '#fff5e8', '#fffaf0', '#ffffff'],
  },
  {
    name: 'PETROL',
    hexValues: ['#e0f5f5', '#eefafa', '#f5fefe', '#ffffff'],
  },
  {
    name: 'PINE',
    hexValues: ['#e8f0e5', '#f0f5ec', '#f8faf5', '#ffffff'],
  },
  {
    name: 'POPPY',
    hexValues: ['#ffe5e5', '#ffefef', '#fff5f5', '#ffffff'],
  },
  {
    name: 'PRIMROSE',
    hexValues: ['#fff8e0', '#fffae8', '#fffdf0', '#ffffff'],
  },
  {
    name: 'QUARTZ',
    hexValues: ['#f8f8ff', '#fafaff', '#fdfdfd', '#ffffff'],
  },
  {
    name: 'RANUNCULUS',
    hexValues: ['#fff0c0', '#fff5d0', '#fffae8', '#ffffff'],
  },
  {
    name: 'RHUBARB',
    hexValues: ['#ffe5e8', '#ffeff0', '#fff5f8', '#ffffff'],
  },
  {
    name: 'ROSEWOOD',
    hexValues: ['#ffe5ec', '#ffeff3', '#fff5f8', '#ffffff'],
  },
  {
    name: 'RUSSET',
    hexValues: ['#fff0e5', '#fff5ec', '#fffaf5', '#ffffff'],
  },
  {
    name: 'SAFFRON',
    hexValues: ['#fff0c0', '#fff5d0', '#fffae8', '#ffffff'],
  },
  {
    name: 'SANDAL',
    hexValues: ['#f8f0e5', '#faf5ec', '#fcfaf5', '#ffffff'],
  },
  {
    name: 'SANDSTONE',
    hexValues: ['#f8f0e8', '#faf5f0', '#fcfaf8', '#ffffff'],
  },
  {
    name: 'SAPPHIREBLUE',
    hexValues: ['#e5f0ff', '#eef5ff', '#f5faff', '#ffffff'],
  },
  {
    name: 'SORREL',
    hexValues: ['#f0e8e0', '#f5efe8', '#faf5f0', '#ffffff'],
  },
  {
    name: 'SPRUCE',
    hexValues: ['#e8f0e5', '#f0f5ec', '#f8faf5', '#ffffff'],
  },
  {
    name: 'STONE',
    hexValues: ['#f8f8f0', '#fafaf5', '#fdfdfa', '#ffffff'],
  },
  {
    name: 'SUGAR',
    hexValues: ['#fff8f0', '#fffaf5', '#fffdfa', '#ffffff'],
  },
  {
    name: 'SUNFLOWER',
    hexValues: ['#fff8c0', '#fffad0', '#fffde8', '#ffffff'],
  },
  {
    name: 'SUNSET',
    hexValues: ['#fff0e0', '#fff5e8', '#fffaf0', '#ffffff'],
  },
  {
    name: 'TANGERINEORANGE',
    hexValues: ['#fff0e0', '#fff5e8', '#fffaf0', '#ffffff'],
  },
  {
    name: 'TARO',
    hexValues: ['#f0e8ff', '#f5f0ff', '#faf8ff', '#ffffff'],
  },
  {
    name: 'TEAK',
    hexValues: ['#f8f0e5', '#faf5ec', '#fcfaf5', '#ffffff'],
  },
  {
    name: 'TERRACOTTA',
    hexValues: ['#fff0e5', '#fff5ec', '#fffaf5', '#ffffff'],
  },
  {
    name: 'THISTLE',
    hexValues: ['#f8f0ff', '#faf5ff', '#fdfaff', '#ffffff'],
  },
  {
    name: 'THYME GREEN',
    hexValues: ['#e8f0e5', '#f0f5ec', '#f8faf5', '#ffffff'],
  },
  {
    name: 'TIGERLILY',
    hexValues: ['#fff0e0', '#fff5e8', '#fffaf0', '#ffffff'],
  },
  {
    name: 'TITANIUM',
    hexValues: ['#f0f0f0', '#f5f5f5', '#fafafa', '#ffffff'],
  },
  {
    name: 'TOMATO',
    hexValues: ['#ffe5e5', '#ffefef', '#fff5f5', '#ffffff'],
  },
  {
    name: 'TURF',
    hexValues: ['#e8f0e5', '#f0f5ec', '#f8faf5', '#ffffff'],
  },
  {
    name: 'TURMERIC',
    hexValues: ['#fff0c0', '#fff5d0', '#fffae8', '#ffffff'],
  },
  {
    name: 'ULTRAMARINEBLUE',
    hexValues: ['#e5e8ff', '#eff0ff', '#f5f8ff', '#ffffff'],
  },
  {
    name: 'UMBER',
    hexValues: ['#f8f0e5', '#faf5ec', '#fcfaf5', '#ffffff'],
  },
  {
    name: 'VALENCIA',
    hexValues: ['#fff0e0', '#fff5e8', '#fffaf0', '#ffffff'],
  },
  {
    name: 'VERDIGRIS',
    hexValues: ['#e0fff0', '#edfff5', '#f5fffa', '#ffffff'],
  },
  {
    name: 'VERONA',
    hexValues: ['#e0f8ff', '#eefcff', '#f5feff', '#ffffff'],
  },
  {
    name: 'VIOLETBLUE',
    hexValues: ['#f0e8ff', '#f5f0ff', '#faf8ff', '#ffffff'],
  },
  {
    name: 'WALNUT',
    hexValues: ['#f8f0e5', '#faf5ec', '#fcfaf5', '#ffffff'],
  },
  {
    name: 'WISTERIAPURPLE',
    hexValues: ['#f0e8ff', '#f5f0ff', '#faf8ff', '#ffffff'],
  },
  {
    name: 'WOODLAND',
    hexValues: ['#e8f0e5', '#f0f5ec', '#f8faf5', '#ffffff'],
  },
  {
    name: 'XANTHIC',
    hexValues: ['#fff8e0', '#fffae8', '#fffdf0', '#ffffff'],
  },
  {
    name: 'YELLOWGREEN',
    hexValues: ['#f0ffe0', '#f5ffe8', '#fafff0', '#ffffff'],
  },
  {
    name: 'ZINNIA',
    hexValues: ['#fff0e0', '#fff5e8', '#fffaf0', '#ffffff'],
  },
  {
    name: 'ZIRCON',
    hexValues: ['#f8f8ff', '#fafaff', '#fdfdfd', '#ffffff'],
  },
];
