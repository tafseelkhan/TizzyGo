interface BannerItem {
  id: string;
  text: string;
  image: string;
  ctaText?: string;
  ctaLink?: string;
}
// ✅ FIXED Banner data - 5 for Girls & 5 for Boys
const rotatingBannerItems: BannerItem[] = [
  // 👧 GIRLS BANNERS (5)
  {
    id: '1',
    text: 'Girls Fashion Festival - 50% Off!',
    image:
      'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=800&q=80',
    ctaText: 'Shop Girls',
    ctaLink: '/list/women-fashion',
  },
  {
    id: '2',
    text: 'Summer Dresses Collection',
    image:
      'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?auto=format&fit=crop&w=800&q=80',
    ctaText: 'Explore Dresses',
    ctaLink: '/list/dresses',
  },
  {
    id: '3',
    text: 'Beauty & Cosmetics Sale',
    image:
      'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=800&q=80',
    ctaText: 'Shop Beauty',
    ctaLink: '/list/beauty',
  },
  {
    id: '4',
    text: 'Handbags & Accessories',
    image:
      'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=800&q=80',
    ctaText: 'View Bags',
    ctaLink: '/list/accessories',
  },
  {
    id: '5',
    text: "Women's Footwear Collection",
    image:
      'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=800&q=80',
    ctaText: 'Browse Shoes',
    ctaLink: '/list/women-shoes',
  },

  // 👦 BOYS BANNERS (5)
  {
    id: '6',
    text: "Men's Casual Wear - 40% Off",
    image:
      'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=800&q=80',
    ctaText: 'Shop Men',
    ctaLink: '/list/men-fashion',
  },
  {
    id: '7',
    text: 'Trendy T-Shirts for Boys',
    image:
      'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=800&q=80',
    ctaText: 'Browse T-Shirts',
    ctaLink: '/list/t-shirts',
  },
  {
    id: '8',
    text: "Men's Footwear Sale",
    image:
      'https://images.unsplash.com/photo-1463100099107-aa0980c362e6?auto=format&fit=crop&w=800&q=80',
    ctaText: 'Shop Shoes',
    ctaLink: '/list/men-shoes',
  },
  {
    id: '9',
    text: 'Gadgets & Electronics',
    image:
      'https://images.unsplash.com/photo-1565849904461-04a58ad377e0?auto=format&fit=crop&w=800&q=80',
    ctaText: 'Explore Gadgets',
    ctaLink: '/list/electronics',
  },
  {
    id: '10',
    text: 'Sports & Fitness Gear',
    image:
      'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=800&q=80',
    ctaText: 'Shop Sports',
    ctaLink: '/list/sports',
  },
];

const staticBannerData = {
  text: 'Limited Time Deals - Shop Now & Save Big!',
  image:
    'https://plus.unsplash.com/premium_photo-1714226833097-93888dcc63cd?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=870',
};

// ✅ FIXED: Simplified brand data with working image URLs
const brandsData = [
  // Games & Sports (Your original requested brands)
  {
    id: '1',
    name: 'Apple',
    logo: require('../../../../../assets/Svg/apple.png'),
    category: 'electronics',
  },
  {
    id: '2',
    name: 'Samsung',
    logo: require('../../../../../assets/Svg/samsung.png'),
    category: 'electronics',
  },
  {
    id: '3',
    name: 'Sony',
    logo: require('../../../../../assets/Svg/sony.png'),
    category: 'electronics',
  },
  {
    id: '4',
    name: 'LG',
    logo: require('../../../../../assets/Svg/lg.png'),
    category: 'electronics',
  },
  {
    id: '5',
    name: 'OnePlus',
    logo: require('../../../../../assets/Svg/oneplus.png'),
    category: 'electronics',
  },
  {
    id: '6',
    name: 'Xiaomi',
    logo: require('../../../../../assets/Svg/xiaomi.png'),
    category: 'electronics',
  },
  {
    id: '7',
    name: 'Dell',
    logo: require('../../../../../assets/Svg/dell.png'),
    category: 'electronics',
  },
  {
    id: '8',
    name: 'HP',
    logo: require('../../../../../assets/Svg/hp.png'),
    category: 'electronics',
  },

  // Vehicles
  {
    id: '9',
    name: 'Toyota',
    logo: require('../../../../../assets/Svg/toyota.png'),
    category: 'vehicles',
  },
  {
    id: '10',
    name: 'Honda',
    logo: require('../../../../../assets/Svg/honda.png'),
    category: 'vehicles',
  },
  {
    id: '11',
    name: 'Ford',
    logo: require('../../../../../assets/Svg/ford.png'),
    category: 'vehicles',
  },
  {
    id: '12',
    name: 'Hyundai',
    logo: require('../../../../../assets/Svg/hyundai.png'),
    category: 'vehicles',
  },
  {
    id: '13',
    name: 'Tata',
    logo: require('../../../../../assets/Svg/tata.png'),
    category: 'vehicles',
  },
  {
    id: '14',
    name: 'Mahindra',
    logo: require('../../../../../assets/Svg/mahindra.png'),
    category: 'vehicles',
  },
  {
    id: '15',
    name: 'BMW',
    logo: require('../../../../../assets/Svg/bmw.png'),
    category: 'vehicles',
  },
  {
    id: '16',
    name: 'Mercedes',
    logo: require('../../../../../assets/Svg/mercedes.png'),
    category: 'vehicles',
  },

  // Fashion
  {
    id: '17',
    name: 'Nike',
    logo: require('../../../../../assets/Svg/nike.png'),
    category: 'fashion',
  },
  {
    id: '18',
    name: 'Adidas',
    logo: require('../../../../../assets/Svg/adidas.png'),
    category: 'fashion',
  },
  {
    id: '19',
    name: 'Zara',
    logo: require('../../../../../assets/Svg/zara.png'),
    category: 'fashion',
  },
  {
    id: '20',
    name: 'H&M',
    logo: require('../../../../../assets/Svg/hm.png'),
    category: 'fashion',
  },
  {
    id: '21',
    name: 'Louis Vuitton',
    logo: require('../../../../../assets/Svg/lv.png'),
    category: 'fashion',
  },
  {
    id: '22',
    name: 'Gucci',
    logo: require('../../../../../assets/Svg/gucci.png'),
    category: 'fashion',
  },
  {
    id: '23',
    name: 'Puma',
    logo: require('../../../../../assets/Svg/puma.png'),
    category: 'fashion',
  },
  {
    id: '24',
    name: 'Raymond',
    logo: require('../../../../../assets/Svg/raymond.png'),
    category: 'fashion',
  },
  {
    id: '25',
    name: 'Manyavar',
    logo: require('../../../../../assets/Svg/manyavar.png'),
    category: 'fashion',
  },
  {
    id: '26',
    name: 'Westside',
    logo: require('../../../../../assets/Svg/westside.png'),
    category: 'fashion',
  },
  {
    id: '27',
    name: 'Pantaloons',
    logo: require('../../../../../assets/Svg/pantaloons.png'),
    category: 'fashion',
  },

  // Indian Fashion Brands
  {
    id: '28',
    name: 'FabIndia',
    logo: require('../../../../../assets/Svg/fabindia.png'),
    category: 'fashion',
  },
  {
    id: '29',
    name: 'Biba',
    logo: require('../../../../../assets/Svg/biba.png'),
    category: 'fashion',
  },
  {
    id: '31',
    name: 'Allen Solly',
    logo: require('../../../../../assets/Svg/allensolly.png'),
    category: 'fashion',
  },
  {
    id: '32',
    name: 'Peter England',
    logo: require('../../../../../assets/Svg/peterengland.png'),
    category: 'fashion',
  },
  {
    id: '33',
    name: 'Van Heusen',
    logo: require('../../../../../assets/Svg/vanheusen.png'),
    category: 'fashion',
  },
  {
    id: '34',
    name: 'Max',
    logo: require('../../../../../assets/Svg/max.png'),
    category: 'fashion',
  },

  // Mobile Phones
  {
    id: '36',
    name: 'Vivo',
    logo: require('../../../../../assets/Svg/vivo.png'),
    category: 'electronics',
  },
  {
    id: '37',
    name: 'Oppo',
    logo: require('../../../../../assets/Svg/oppo.png'),
    category: 'electronics',
  },
  {
    id: '38',
    name: 'Realme',
    logo: require('../../../../../assets/Svg/realme.png'),
    category: 'electronics',
  },
  {
    id: '39',
    name: 'Motorola',
    logo: require('../../../../../assets/Svg/motorola.png'),
    category: 'electronics',
  },
  {
    id: '40',
    name: 'Nokia',
    logo: require('../../../../../assets/Svg/nokia.png'),
    category: 'electronics',
  },
  {
    id: '41',
    name: 'Asus',
    logo: require('../../../../../assets/Svg/asus.png'),
    category: 'electronics',
  },

  // Furniture
  {
    id: '42',
    name: 'IKEA',
    logo: require('../../../../../assets/Svg/ikea.png'),
    category: 'furniture',
  },
  {
    id: '43',
    name: 'Godrej Interio',
    logo: require('../../../../../assets/Svg/godrej.png'),
    category: 'furniture',
  },
  {
    id: '44',
    name: 'Pepperfry',
    logo: require('../../../../../assets/Svg/pepperfry.png'),
    category: 'furniture',
  },
  {
    id: '45',
    name: 'Wakefit',
    logo: require('../../../../../assets/Svg/wakefit.png'),
    category: 'furniture',
  },
  {
    id: '47',
    name: 'Spacewood',
    logo: require('../../../../../assets/Svg/spacewood.png'),
    category: 'furniture',
  },

  // Games & Sports
  {
    id: '48',
    name: 'Nintendo',
    logo: require('../../../../../assets/Svg/nintendo.png'),
    category: 'games',
  },
  {
    id: '49',
    name: 'PlayStation',
    logo: require('../../../../../assets/Svg/playstation.png'),
    category: 'games',
  },
  {
    id: '50',
    name: 'Xbox',
    logo: require('../../../../../assets/Svg/xbox.png'),
    category: 'games',
  },
  {
    id: '52',
    name: 'Wilson',
    logo: require('../../../../../assets/Svg/wilson.png'),
    category: 'sports',
  },
  {
    id: '56',
    name: 'Reebok',
    logo: require('../../../../../assets/Svg/reebok.png'),
    category: 'sports',
  },
  {
    id: '57',
    name: 'Yonex',
    logo: require('../../../../../assets/Svg/yonex.png'),
    category: 'sports',
  },
];
export { brandsData, staticBannerData, rotatingBannerItems };
