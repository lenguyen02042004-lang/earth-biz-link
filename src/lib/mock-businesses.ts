// Demo data so the map shows businesses before users register.
// Replace by querying the businesses table once data flows in.

export type Certification = {
  name: string;
  issuer?: string;
  year?: number;
  icon?: string;
};

export type DemoBusiness = {
  id: string;
  slug: string;
  name: string;
  logo_url: string;
  banner_url: string;
  short_intro: string;
  description?: string;
  certifications?: Certification[];
  address: string;
  country_code: string;
  country_name: string;
  province: string;
  lat: number;
  lng: number;
  phone: string;
  email: string;
  website: string;
  industry: string;
  industry_slug: string;
  views_count: number;
  icon_tier: "standard" | "premium";
  socials: Record<string, string>;
  gallery: string[];
};

// Default sample content so every demo card has rich detail
export const DEFAULT_DESCRIPTION =
  "Chúng tôi là doanh nghiệp tiên phong trong lĩnh vực của mình, cam kết mang lại giá trị bền vững cho khách hàng và đối tác thông qua chất lượng sản phẩm, dịch vụ chuyên nghiệp và đội ngũ nhân sự giàu kinh nghiệm. Hơn một thập kỷ phát triển, chúng tôi đã đồng hành cùng hàng nghìn doanh nghiệp trên khắp khu vực, không ngừng đổi mới và mở rộng quy mô để phục vụ thị trường toàn cầu.";

export const DEFAULT_CERTIFICATIONS: Certification[] = [
  { name: "ISO 9001:2015", issuer: "Bureau Veritas", year: 2022, icon: "🏅" },
  { name: "Top 100 Doanh nghiệp uy tín", issuer: "Vietnam Report", year: 2024, icon: "🏆" },
  { name: "Thương hiệu Quốc gia", issuer: "Bộ Công Thương", year: 2023, icon: "⭐" },
];

const PINK_GRADIENTS = [
  "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&q=80",
  "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80",
  "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&q=80",
  "https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=800&q=80",
  "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=800&q=80",
];

export const DEMO_BUSINESSES: DemoBusiness[] = [
  {
    id: "00000000-0000-0000-0000-000000000001", slug: "nova-tech-vn", name: "Nova Tech Vietnam",
    logo_url: "https://api.dicebear.com/7.x/shapes/svg?seed=nova&backgroundColor=c8102e",
    banner_url: PINK_GRADIENTS[0],
    short_intro: "Giải pháp công nghệ AI hàng đầu cho doanh nghiệp Đông Nam Á.",
    address: "Tòa nhà Bitexco, Quận 1", country_code: "VN", country_name: "Việt Nam", province: "TP. Hồ Chí Minh",
    lat: 10.7715, lng: 106.7044, phone: "+84 28 3823 4567", email: "hello@novatech.vn", website: "https://novatech.vn",
    industry: "Công nghệ thông tin", industry_slug: "technology", views_count: 12480, icon_tier: "premium",
    socials: { linkedin: "https://linkedin.com/company/novatech", facebook: "https://facebook.com/novatech", twitter: "https://x.com/novatech" },
    gallery: PINK_GRADIENTS,
  },
  {
    id: "00000000-0000-0000-0000-000000000002", slug: "sakura-trading", name: "Sakura Trading Co.",
    logo_url: "https://api.dicebear.com/7.x/shapes/svg?seed=sakura&backgroundColor=ff3b5c",
    banner_url: PINK_GRADIENTS[1],
    short_intro: "Xuất nhập khẩu thực phẩm cao cấp từ Nhật Bản ra thế giới.",
    address: "Shibuya City, 1-2-3", country_code: "JP", country_name: "Nhật Bản", province: "Tokyo",
    lat: 35.6595, lng: 139.7004, phone: "+81 3 1234 5678", email: "info@sakura.jp", website: "https://sakura.jp",
    industry: "Thực phẩm & Đồ uống", industry_slug: "food-beverage", views_count: 8920, icon_tier: "standard",
    socials: { instagram: "https://instagram.com/sakura", facebook: "https://facebook.com/sakura" },
    gallery: PINK_GRADIENTS,
  },
  {
    id: "00000000-0000-0000-0000-000000000003", slug: "lion-finance-sg", name: "Lion Finance Singapore",
    logo_url: "https://api.dicebear.com/7.x/shapes/svg?seed=lion&backgroundColor=8b0000",
    banner_url: PINK_GRADIENTS[2],
    short_intro: "Tư vấn đầu tư & quản lý tài sản cho doanh nhân quốc tế.",
    address: "Marina Bay Financial Centre", country_code: "SG", country_name: "Singapore", province: "Singapore",
    lat: 1.2806, lng: 103.8506, phone: "+65 6789 1234", email: "contact@lionfinance.sg", website: "https://lionfinance.sg",
    industry: "Tài chính - Ngân hàng", industry_slug: "finance", views_count: 24300, icon_tier: "premium",
    socials: { linkedin: "https://linkedin.com/company/lionfinance", twitter: "https://x.com/lionfinance" },
    gallery: PINK_GRADIENTS,
  },
  {
    id: "00000000-0000-0000-0000-000000000004", slug: "stellar-design-nyc", name: "Stellar Design Studio",
    logo_url: "https://api.dicebear.com/7.x/shapes/svg?seed=stellar&backgroundColor=c8102e",
    banner_url: PINK_GRADIENTS[3],
    short_intro: "Studio thiết kế thương hiệu cao cấp tại New York.",
    address: "245 5th Ave, Manhattan", country_code: "US", country_name: "Hoa Kỳ", province: "New York",
    lat: 40.7459, lng: -73.9857, phone: "+1 212 555 0100", email: "studio@stellar.nyc", website: "https://stellar.nyc",
    industry: "Truyền thông - Marketing", industry_slug: "marketing", views_count: 15600, icon_tier: "premium",
    socials: { instagram: "https://instagram.com/stellar", behance: "https://behance.net/stellar", linkedin: "https://linkedin.com/company/stellar" },
    gallery: PINK_GRADIENTS,
  },
  {
    id: "00000000-0000-0000-0000-000000000005", slug: "alpine-luxury-ch", name: "Alpine Luxury Hotels",
    logo_url: "https://api.dicebear.com/7.x/shapes/svg?seed=alpine&backgroundColor=ff3b5c",
    banner_url: PINK_GRADIENTS[4],
    short_intro: "Chuỗi khách sạn 5 sao tại các điểm đến danh tiếng châu Âu.",
    address: "Bahnhofstrasse 12", country_code: "CH", country_name: "Thụy Sĩ", province: "Zurich",
    lat: 47.3769, lng: 8.5417, phone: "+41 44 123 4567", email: "reservations@alpine.ch", website: "https://alpine.ch",
    industry: "Du lịch - Khách sạn", industry_slug: "hospitality", views_count: 32100, icon_tier: "premium",
    socials: { instagram: "https://instagram.com/alpine", facebook: "https://facebook.com/alpine" },
    gallery: PINK_GRADIENTS,
  },
  {
    id: "00000000-0000-0000-0000-000000000006", slug: "thames-legal", name: "Thames Legal Advisors",
    logo_url: "https://api.dicebear.com/7.x/shapes/svg?seed=thames&backgroundColor=8b0000",
    banner_url: PINK_GRADIENTS[0],
    short_intro: "Hãng luật quốc tế chuyên về M&A và đầu tư xuyên biên giới.",
    address: "1 Canary Wharf", country_code: "GB", country_name: "Vương quốc Anh", province: "London",
    lat: 51.5054, lng: -0.0235, phone: "+44 20 7946 0958", email: "info@thameslegal.co.uk", website: "https://thameslegal.co.uk",
    industry: "Tư vấn - Pháp lý", industry_slug: "consulting", views_count: 9870, icon_tier: "standard",
    socials: { linkedin: "https://linkedin.com/company/thameslegal" },
    gallery: PINK_GRADIENTS,
  },
  {
    id: "00000000-0000-0000-0000-000000000007", slug: "kanga-build-au", name: "Kanga Construction",
    logo_url: "https://api.dicebear.com/7.x/shapes/svg?seed=kanga&backgroundColor=c8102e",
    banner_url: PINK_GRADIENTS[1],
    short_intro: "Nhà thầu xây dựng dân dụng và công nghiệp tại Úc.",
    address: "George Street, Sydney CBD", country_code: "AU", country_name: "Úc", province: "Sydney",
    lat: -33.8688, lng: 151.2093, phone: "+61 2 9876 5432", email: "build@kanga.au", website: "https://kanga.au",
    industry: "Xây dựng", industry_slug: "construction", views_count: 5430, icon_tier: "standard",
    socials: { facebook: "https://facebook.com/kanga", linkedin: "https://linkedin.com/company/kanga" },
    gallery: PINK_GRADIENTS,
  },
  {
    id: "00000000-0000-0000-0000-000000000008", slug: "samba-coffee-br", name: "Samba Coffee Roasters",
    logo_url: "https://api.dicebear.com/7.x/shapes/svg?seed=samba&backgroundColor=ff3b5c",
    banner_url: PINK_GRADIENTS[2],
    short_intro: "Cà phê đặc sản Brazil — rang xay thủ công cho thị trường toàn cầu.",
    address: "Av. Paulista, 1500", country_code: "BR", country_name: "Brazil", province: "São Paulo",
    lat: -23.5613, lng: -46.6565, phone: "+55 11 3456 7890", email: "hola@sambacoffee.br", website: "https://sambacoffee.br",
    industry: "Thực phẩm & Đồ uống", industry_slug: "food-beverage", views_count: 18200, icon_tier: "premium",
    socials: { instagram: "https://instagram.com/samba", tiktok: "https://tiktok.com/@samba" },
    gallery: PINK_GRADIENTS,
  },
  {
    id: "00000000-0000-0000-0000-000000000009", slug: "desert-pearl-ae", name: "Desert Pearl Real Estate",
    logo_url: "https://api.dicebear.com/7.x/shapes/svg?seed=desert&backgroundColor=8b0000",
    banner_url: PINK_GRADIENTS[3],
    short_intro: "Bất động sản hạng sang tại Dubai và Trung Đông.",
    address: "Sheikh Zayed Road", country_code: "AE", country_name: "UAE", province: "Dubai",
    lat: 25.2048, lng: 55.2708, phone: "+971 4 123 4567", email: "info@desertpearl.ae", website: "https://desertpearl.ae",
    industry: "Bất động sản", industry_slug: "real-estate", views_count: 28900, icon_tier: "premium",
    socials: { instagram: "https://instagram.com/desertpearl", linkedin: "https://linkedin.com/company/desertpearl" },
    gallery: PINK_GRADIENTS,
  },
  {
    id: "00000000-0000-0000-0000-00000000000a", slug: "kimchi-fashion-kr", name: "Kimchi Fashion House",
    logo_url: "https://api.dicebear.com/7.x/shapes/svg?seed=kimchi&backgroundColor=c8102e",
    banner_url: PINK_GRADIENTS[4],
    short_intro: "Thương hiệu thời trang K-style xuất khẩu toàn cầu.",
    address: "Gangnam-gu, Apgujeong", country_code: "KR", country_name: "Hàn Quốc", province: "Seoul",
    lat: 37.5247, lng: 127.0286, phone: "+82 2 1234 5678", email: "hello@kimchifashion.kr", website: "https://kimchifashion.kr",
    industry: "Thời trang - Làm đẹp", industry_slug: "fashion", views_count: 41200, icon_tier: "premium",
    socials: { instagram: "https://instagram.com/kimchifashion", tiktok: "https://tiktok.com/@kimchifashion", youtube: "https://youtube.com/@kimchifashion" },
    gallery: PINK_GRADIENTS,
  },
];
