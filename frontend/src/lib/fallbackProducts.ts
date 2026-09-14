import { GameProduct, GamePackage } from './api';
import { getGameArtwork } from './gameArtworks';

interface GameItemDef {
  name: string;
  slug: string;
  category: string;
  currency: string;
  image?: string;
}

function makePackages(productId: string, slug: string, currency: string): GamePackage[] {
  if (slug === 'free-fire') {
    return [
      { id: `${slug}-1`, productId, name: `100 ${currency}`, amount: 100, price: 0.99, category: 'BEST_SELLER', isActive: true, badge: 'ពេញនិយម' },
      { id: `${slug}-2`, productId, name: `310 ${currency}`, amount: 310, price: 2.99, category: 'BEST_SELLER', isActive: true, badge: 'Hot 🔥' },
      { id: `${slug}-3`, productId, name: `520 ${currency}`, amount: 520, price: 4.99, category: 'NORMAL', isActive: true, badge: 'Bonus 5%' },
      { id: `${slug}-4`, productId, name: `1060 ${currency}`, amount: 1060, price: 9.99, category: 'NORMAL', isActive: true, badge: 'Bonus 10%' },
      { id: `${slug}-5`, productId, name: `2180 ${currency}`, amount: 2180, price: 19.99, category: 'NORMAL', isActive: true, badge: 'កញ្ចប់ពិសេស 💎' },
      { id: `${slug}-6`, productId, name: `5600 ${currency}`, amount: 5600, price: 49.99, category: 'NORMAL', isActive: true, badge: 'VIP 👑' },
    ];
  }

  return [
    { id: `${slug}-1`, productId, name: `86 ${currency}`, amount: 86, price: 1.49, category: 'BEST_SELLER', isActive: true, badge: 'Hot 🔥' },
    { id: `${slug}-2`, productId, name: `172 ${currency}`, amount: 172, price: 2.99, category: 'BEST_SELLER', isActive: true, badge: 'ពេញនិយម' },
    { id: `${slug}-3`, productId, name: `257 ${currency}`, amount: 257, price: 4.49, category: 'NORMAL', isActive: true, badge: 'Bonus 5%' },
    { id: `${slug}-4`, productId, name: `706 ${currency}`, amount: 706, price: 11.99, category: 'NORMAL', isActive: true, badge: 'Bonus 10%' },
    { id: `${slug}-5`, productId, name: `2195 ${currency}`, amount: 2195, price: 34.99, category: 'NORMAL', isActive: true, badge: 'VIP Pass' },
    { id: `${slug}-6`, productId, name: `Weekly Diamond Pass`, amount: 1, price: 1.99, category: 'BEST_SELLER', isActive: true, badge: 'Special 💎' },
  ];
}

const RAW_CATALOG: GameItemDef[] = [
  { name: 'FREE FIRE | KHMER', slug: 'free-fire-khmer', category: 'MOBILE_GAME', currency: 'Diamonds', image: '/images/games/freefire.png' },
  { name: 'MOBILE LEGENDS | KHMER', slug: 'mobile-legends-khmer', category: 'MOBILE_GAME', currency: 'Diamonds', image: '/images/games/mlbb.png' },
  { name: 'MOBILE LEGENDS | PHILIPPINES', slug: 'mobile-legends-philippines', category: 'MOBILE_GAME', currency: 'Diamonds', image: '/images/games/mlbb.png' },
  { name: 'MOBILE LEGENDS | INDONESIA', slug: 'mobile-legends-indonesia', category: 'MOBILE_GAME', currency: 'Diamonds', image: '/images/games/mlbb.png' },
  { name: 'FREE FIRE | INDONESIA', slug: 'free-fire-indonesia', category: 'MOBILE_GAME', currency: 'Diamonds', image: '/images/games/freefire.png' },
  { name: 'FREE FIRE | VIETNAM', slug: 'free-fire-vietnam', category: 'MOBILE_GAME', currency: 'Diamonds', image: '/images/games/freefire.png' },
  { name: 'FREE FIRE | TAIWAN', slug: 'free-fire-taiwan', category: 'MOBILE_GAME', currency: 'Diamonds', image: '/images/games/freefire.png' },
  { name: 'MAGIC CHESS GOGO', slug: 'magic-chess-gogo', category: 'MOBILE_GAME', currency: 'Gold Coins', image: '/images/games/magicchess.png' },
  { name: 'HONOR OF KINGS', slug: 'honor-of-kings', category: 'MOBILE_GAME', currency: 'Tokens', image: '/images/games/hok.png' },
  { name: 'PUBG MOBILE', slug: 'pubg-mobile', category: 'MOBILE_GAME', currency: 'UC', image: '/images/games/pubgm.png' },
  { name: 'BLOOD STRIKE', slug: 'blood-strike', category: 'MOBILE_GAME', currency: 'Gold', image: '/images/games/bloodstrike.png' },
  { name: 'VALORANT', slug: 'valorant', category: 'PC_GAME', currency: 'VP', image: '/images/games/valorant.png' },
  { name: 'FARLIGHT 84', slug: 'farlight-84', category: 'MOBILE_GAME', currency: 'Diamonds', image: '/images/games/farlight.png' },
  { name: 'DELTA FORCE', slug: 'delta-force', category: 'PC_GAME', currency: 'Delta Coins', image: '/images/games/deltaforce.png' },
  { name: 'SUPER SUS', slug: 'super-sus', category: 'MOBILE_GAME', currency: 'Goldstar', image: '/images/games/roblox.png' },
  { name: 'Free Fire', slug: 'free-fire', category: 'MOBILE_GAME', currency: 'Diamonds', image: '/images/games/freefire.png' },
  { name: 'Mobile Legends: Bang Bang', slug: 'mobile-legends', category: 'MOBILE_GAME', currency: 'Diamonds', image: '/images/games/mlbb.png' },
];

export const FALLBACK_PRODUCTS: GameProduct[] = RAW_CATALOG.map((item, idx) => {
  const prodId = `prod-game-${idx + 1}-${item.slug}`;
  return {
    id: prodId,
    name: item.name,
    slug: item.slug,
    category: item.category,
    image: item.image || getGameArtwork(item.slug, item.name),
    isActive: true,
    packages: makePackages(prodId, item.slug, item.currency),
  };
});
