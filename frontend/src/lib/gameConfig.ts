/**
 * Game configuration helper for Zone ID / Server ID handling
 * Supports Mobile Legends, Server-based RPGs (Genshin, Honkai, ZZZ, etc.),
 * and admin-configured products with hasZoneId.
 */

export interface GameZoneConfig {
  hasZone: boolean;
  required: boolean;
  label: string;
  placeholder: string;
  hint: string;
  isServer: boolean;
  serverOptions?: string[];
}

export function getGameZoneConfig(
  product: {
    slug?: string;
    name?: string;
    hasZoneId?: boolean;
    zoneIdLabel?: string | null;
  } | null | undefined
): GameZoneConfig {
  if (!product) {
    return {
      hasZone: false,
      required: false,
      label: 'Zone ID / Server ID',
      placeholder: 'e.g. 1234',
      hint: '',
      isServer: false,
    };
  }

  const slug = (product.slug || '').toLowerCase();
  const name = (product.name || '').toLowerCase();

  // 1. Mobile Legends Bang Bang & variants
  const isMLBB =
    slug.includes('mobile-legends') ||
    slug.includes('mlbb') ||
    slug.includes('moonton') ||
    name.includes('mobile legends') ||
    name.includes('mlbb');

  if (isMLBB) {
    return {
      hasZone: true,
      required: true,
      label: 'Zone ID (លេខសម្គាល់តំបន់)',
      placeholder: 'e.g. 1234',
      hint: 'Mobile Legends requires 4–5 digit Zone ID inside parentheses, e.g. (1234)',
      isServer: false,
    };
  }

  // 2. Server-based RPGs (Genshin, Star Rail, ZZZ, Wuthering Waves, etc.)
  const isGenshin = slug.includes('genshin') || name.includes('genshin');
  const isStarRail = slug.includes('star-rail') || slug.includes('honkai') || name.includes('star rail');
  const isZZZ = slug.includes('zenless') || name.includes('zenless');
  const isWuthering = slug.includes('wuthering') || name.includes('wuthering');
  const isRagnarok = slug.includes('ragnarok') || name.includes('ragnarok');

  if (isGenshin || isStarRail || isZZZ || isWuthering) {
    return {
      hasZone: true,
      required: true,
      label: 'Server ID / Region (ម៉ាស៊ីនបម្រើ)',
      placeholder: 'e.g. Asia, America, Europe',
      hint: 'Choose or enter your game server region',
      isServer: true,
      serverOptions: ['Asia', 'America', 'Europe', 'TW/HK/MO'],
    };
  }

  if (isRagnarok) {
    return {
      hasZone: true,
      required: true,
      label: 'Server ID (ម៉ាស៊ីនបម្រើ)',
      placeholder: 'e.g. Server Name or ID',
      hint: 'Enter your Ragnarok server name or ID',
      isServer: true,
    };
  }

  const otherServerGames = [
    'tower-of-fantasy',
    'dragon-raja',
    'lifeafter',
    'laplace-m',
    'eggy-party',
    'revelation-mobile',
    'bleach',
    'nikke',
    'identity-v',
    'sword-of-convallaria',
  ];

  if (otherServerGames.some((g) => slug.includes(g) || name.includes(g.replace('-', ' ')))) {
    return {
      hasZone: true,
      required: true,
      label: 'Server ID (ម៉ាស៊ីនបម្រើ)',
      placeholder: 'e.g. Server Name or ID',
      hint: 'Enter your server ID or server name',
      isServer: true,
    };
  }

  // 3. Admin-configured custom hasZoneId product flag
  if (product.hasZoneId) {
    const customLabel = product.zoneIdLabel?.trim() || 'Zone ID / Server ID';
    const isServerLabel = customLabel.toLowerCase().includes('server');
    return {
      hasZone: true,
      required: true,
      label: customLabel,
      placeholder: isServerLabel ? 'e.g. Asia, Server 1' : 'e.g. 1234',
      hint: `Please enter ${customLabel}`,
      isServer: isServerLabel,
    };
  }

  // Default: does not require Zone/Server ID
  return {
    hasZone: false,
    required: false,
    label: '',
    placeholder: '',
    hint: '',
    isServer: false,
  };
}
