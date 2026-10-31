interface BannerItem {
  id: string;
  text: string;
  image: string;
  ctaText?: string;
  ctaLink?: string;
}

const staticBannerData = {
  text: 'Limited Time Deals - Shop Now & Save Big!',
  image:
    'https://plus.unsplash.com/premium_photo-1714226833097-93888dcc63cd?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=870',
};

export { staticBannerData };
