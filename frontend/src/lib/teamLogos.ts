import type { Team } from '../types/cricket';

/**
 * Team logos are resolved from the team name because the Sportradar cricket
 * feed carries no image data. National sides get their flag (flagcdn.com);
 * franchises and counties get their club logo from Wikipedia. Anything not
 * listed here falls back to the initials badge in <TeamMark>.
 */

export type TeamLogo = { src: string; kind: 'flag' | 'logo' };

const FLAGS: Record<string, string> = {
  india: 'in',
  australia: 'au',
  england: 'gb-eng',
  'south africa': 'za',
  'new zealand': 'nz',
  pakistan: 'pk',
  'sri lanka': 'lk',
  bangladesh: 'bd',
  afghanistan: 'af',
  zimbabwe: 'zw',
  ireland: 'ie',
  netherlands: 'nl',
  scotland: 'gb-sct',
  wales: 'gb-wls',
  nepal: 'np',
  oman: 'om',
  'united arab emirates': 'ae',
  uae: 'ae',
  usa: 'us',
  'united states': 'us',
  'united states of america': 'us',
  namibia: 'na',
  canada: 'ca',
  italy: 'it',
  'papua new guinea': 'pg',
  'hong kong': 'hk',
  'hong kong china': 'hk',
  uganda: 'ug',
  kenya: 'ke',
  jersey: 'je',
  guernsey: 'gg',
  germany: 'de',
  denmark: 'dk',
  singapore: 'sg',
  malaysia: 'my',
  thailand: 'th',
  qatar: 'qa',
  kuwait: 'kw',
  bahrain: 'bh',
  'saudi arabia': 'sa',
  tanzania: 'tz',
  rwanda: 'rw',
  nigeria: 'ng',
  botswana: 'bw',
  bermuda: 'bm',
  'cayman islands': 'ky',
  argentina: 'ar',
  brazil: 'br',
  mexico: 'mx',
  japan: 'jp',
  china: 'cn',
  vanuatu: 'vu',
  fiji: 'fj',
  samoa: 'ws',
  'cook islands': 'ck',
  indonesia: 'id',
  philippines: 'ph',
  belgium: 'be',
  france: 'fr',
  spain: 'es',
  portugal: 'pt',
  austria: 'at',
  sweden: 'se',
  norway: 'no',
  finland: 'fi',
  'czech republic': 'cz',
  czechia: 'cz',
  romania: 'ro',
  bulgaria: 'bg',
  serbia: 'rs',
  croatia: 'hr',
  greece: 'gr',
  cyprus: 'cy',
  malta: 'mt',
  gibraltar: 'gi',
  'isle of man': 'im',
  hungary: 'hu',
  luxembourg: 'lu',
  switzerland: 'ch',
  estonia: 'ee',
  israel: 'il',
  turkey: 'tr',
  maldives: 'mv',
  bhutan: 'bt',
  myanmar: 'mm',
  cambodia: 'kh',
  mongolia: 'mn',
  'south korea': 'kr',
  'sierra leone': 'sl',
  ghana: 'gh',
  mozambique: 'mz',
  malawi: 'mw',
  cameroon: 'cm',
  eswatini: 'sz',
  lesotho: 'ls',
  gambia: 'gm',
  panama: 'pa',
  peru: 'pe',
  chile: 'cl',
  'costa rica': 'cr',
  belize: 'bz',
  bahamas: 'bs',
  suriname: 'sr',
  iran: 'ir',
};

// Wikipedia logo thumbnails (120px), keyed by the normalized Sportradar team name.
const LOGOS: Record<string, string> = {
  'west indies': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/1/1b/Cricket_West_Indies_Logo_2017.svg/120px-Cricket_West_Indies_Logo_2017.svg.png',

  // Indian Premier League / Women's Premier League
  'sunrisers hyderabad': 'https://thumb.wikimedia.org/wikipedia/en/thumb/5/51/Sunrisers_Hyderabad_Logo.svg/120px-Sunrisers_Hyderabad_Logo.svg.png',
  'mumbai indians': 'https://thumb.wikimedia.org/wikipedia/en/thumb/c/cd/Mumbai_Indians_Logo.svg/120px-Mumbai_Indians_Logo.svg.png',
  'kolkata knight riders': 'https://thumb.wikimedia.org/wikipedia/en/thumb/4/4c/Kolkata_Knight_Riders_Logo.svg/120px-Kolkata_Knight_Riders_Logo.svg.png',
  'punjab kings': 'https://thumb.wikimedia.org/wikipedia/en/thumb/d/d4/Punjab_Kings_Logo.svg/120px-Punjab_Kings_Logo.svg.png',
  'rajasthan royals': 'https://thumb.wikimedia.org/wikipedia/en/thumb/5/5c/This_is_the_logo_for_Rajasthan_Royals%2C_a_cricket_team_playing_in_the_Indian_Premier_League_%28IPL%29.svg/120px-This_is_the_logo_for_Rajasthan_Royals%2C_a_cricket_team_playing_in_the_Indian_Premier_League_%28IPL%29.svg.png',
  'chennai super kings': 'https://thumb.wikimedia.org/wikipedia/en/thumb/2/2b/Chennai_Super_Kings_Logo.svg/120px-Chennai_Super_Kings_Logo.svg.png',
  'royal challengers bengaluru': 'https://thumb.wikimedia.org/wikipedia/en/thumb/d/d4/Royal_Challengers_Bengaluru_Logo.svg/120px-Royal_Challengers_Bengaluru_Logo.svg.png',
  'royal challengers bangalore': 'https://thumb.wikimedia.org/wikipedia/en/thumb/d/d4/Royal_Challengers_Bengaluru_Logo.svg/120px-Royal_Challengers_Bengaluru_Logo.svg.png',
  'delhi capitals': 'https://thumb.wikimedia.org/wikipedia/en/thumb/2/2f/Delhi_Capitals.svg/120px-Delhi_Capitals.svg.png',
  'gujarat titans': 'https://thumb.wikimedia.org/wikipedia/en/thumb/0/09/Gujarat_Titans_Logo.svg/120px-Gujarat_Titans_Logo.svg.png',
  'lucknow super giants': 'https://thumb.wikimedia.org/wikipedia/en/thumb/3/34/Lucknow_Super_Giants_Logo.svg/120px-Lucknow_Super_Giants_Logo.svg.png',
  'gujarat giants': 'https://thumb.wikimedia.org/wikipedia/en/thumb/d/da/Gujarat_Giants_WPL_logo.svg/120px-Gujarat_Giants_WPL_logo.svg.png',
  'up warriorz': 'https://thumb.wikimedia.org/wikipedia/en/thumb/a/a0/UP_Warriors%28z%29_WPL_logo.png/120px-UP_Warriors%28z%29_WPL_logo.png',

  // Big Bash League
  'perth scorchers': 'https://thumb.wikimedia.org/wikipedia/en/thumb/1/15/Perth_Scorchers_logo.svg/120px-Perth_Scorchers_logo.svg.png',
  'sydney thunder': 'https://thumb.wikimedia.org/wikipedia/en/thumb/8/86/Sydney_Thunder_logo.svg/120px-Sydney_Thunder_logo.svg.png',
  'sydney sixers': 'https://thumb.wikimedia.org/wikipedia/en/thumb/9/95/Sydney_Sixers_logo.svg/120px-Sydney_Sixers_logo.svg.png',
  'adelaide strikers': 'https://thumb.wikimedia.org/wikipedia/en/thumb/7/72/Adelaide_Strikers_logo.svg/120px-Adelaide_Strikers_logo.svg.png',
  'melbourne renegades': 'https://thumb.wikimedia.org/wikipedia/en/thumb/6/63/Melbourne_Renegades_Logo.svg/120px-Melbourne_Renegades_Logo.svg.png',
  'brisbane heat': 'https://thumb.wikimedia.org/wikipedia/en/thumb/c/cf/Brisbane_Heat_logo.svg/120px-Brisbane_Heat_logo.svg.png',
  'melbourne stars': 'https://thumb.wikimedia.org/wikipedia/en/thumb/7/74/Melbourne_Stars_logo.svg/120px-Melbourne_Stars_logo.svg.png',
  'hobart hurricanes': 'https://thumb.wikimedia.org/wikipedia/en/thumb/c/c3/Hobart_Hurricanes_logo.svg/120px-Hobart_Hurricanes_logo.svg.png',

  // Pakistan Super League
  'islamabad united': 'https://thumb.wikimedia.org/wikipedia/en/thumb/9/92/Islamabad_United.png/120px-Islamabad_United.png',
  'quetta gladiators': 'https://thumb.wikimedia.org/wikipedia/en/thumb/d/d2/Quetta_Gladiators.png/120px-Quetta_Gladiators.png',
  'karachi kings': 'https://thumb.wikimedia.org/wikipedia/en/thumb/2/2a/Karachi_Kings.png/120px-Karachi_Kings.png',
  'lahore qalandars': 'https://thumb.wikimedia.org/wikipedia/en/thumb/6/63/Lahore_Qalandars.png/120px-Lahore_Qalandars.png',
  'peshawar zalmi': 'https://thumb.wikimedia.org/wikipedia/en/thumb/9/9c/Peshawar_Zalmi_logo.png/120px-Peshawar_Zalmi_logo.png',
  'rawalpindi pindiz': 'https://thumb.wikimedia.org/wikipedia/en/thumb/1/16/Rawalpindiz_Logo.png/120px-Rawalpindiz_Logo.png',
  'multan sultans': 'https://thumb.wikimedia.org/wikipedia/en/thumb/c/c2/Multan_Sultans.svg/120px-Multan_Sultans.svg.png',
  'hyderabad kingsmen': 'https://thumb.wikimedia.org/wikipedia/en/thumb/2/24/Hyderabad_Kingsmen_logo.svg/120px-Hyderabad_Kingsmen_logo.svg.png',

  // Caribbean Premier League
  'guyana amazon warriors': 'https://thumb.wikimedia.org/wikipedia/en/thumb/e/eb/Guyana_Amazon_Warriors_%28logo%29.svg/120px-Guyana_Amazon_Warriors_%28logo%29.svg.png',
  'trinbago knight riders': 'https://thumb.wikimedia.org/wikipedia/en/thumb/b/bf/Trinbago_Knight_Riders_logo.svg/120px-Trinbago_Knight_Riders_logo.svg.png',
  'barbados tridents': 'https://thumb.wikimedia.org/wikipedia/en/thumb/d/d7/Barbados_Tridents_New_Logo.svg/120px-Barbados_Tridents_New_Logo.svg.png',
  'barbados royals': 'https://thumb.wikimedia.org/wikipedia/en/thumb/d/d7/Barbados_Tridents_New_Logo.svg/120px-Barbados_Tridents_New_Logo.svg.png',
  'st lucia kings': 'https://thumb.wikimedia.org/wikipedia/en/thumb/7/77/Saint_Lucia_Kings_svg_logo.svg/120px-Saint_Lucia_Kings_svg_logo.svg.png',
  'st kitts and nevis patriots': 'https://thumb.wikimedia.org/wikipedia/en/thumb/d/dc/St_Kitts_and_Nevis_Patriots.png/120px-St_Kitts_and_Nevis_Patriots.png',
  'antigua and barbuda falcons': 'https://thumb.wikimedia.org/wikipedia/en/thumb/8/83/Antigua_%26_Barbuda_Falcon.png/120px-Antigua_%26_Barbuda_Falcon.png',
  'jamaica kingsmen': 'https://thumb.wikimedia.org/wikipedia/en/thumb/d/d3/Jamaica_Kingsmen.png/120px-Jamaica_Kingsmen.png',
  'jamaica tallawahs': 'https://thumb.wikimedia.org/wikipedia/en/thumb/4/4f/CPL_JAM.svg/120px-CPL_JAM.svg.png',

  // SA20
  'sunrisers eastern cape': 'https://thumb.wikimedia.org/wikipedia/en/thumb/8/82/Sunrisers_Eastern_Cape_Logo.svg/120px-Sunrisers_Eastern_Cape_Logo.svg.png',
  'paarl royals': 'https://thumb.wikimedia.org/wikipedia/en/thumb/8/8e/Paarl_Royals_logo_%282%29.svg/120px-Paarl_Royals_logo_%282%29.svg.png',
  'pretoria capitals': 'https://thumb.wikimedia.org/wikipedia/en/thumb/f/fa/Pretoria_Capitals_logo.svg/120px-Pretoria_Capitals_logo.svg.png',
  'mi cape town': 'https://thumb.wikimedia.org/wikipedia/en/thumb/5/53/MI_Cape_Town_%E2%80%93_Logo.svg/120px-MI_Cape_Town_%E2%80%93_Logo.svg.png',
  'joburg super kings': 'https://thumb.wikimedia.org/wikipedia/en/thumb/c/ca/Joburg_Super_Kings_Logo.svg/120px-Joburg_Super_Kings_Logo.svg.png',
  'durban super giants': "Durban's_Super_Giants_Logo.svg",
  'durbans super giants': "Durban's_Super_Giants_Logo.svg",

  // The Hundred
  'manchester super giants': 'https://thumb.wikimedia.org/wikipedia/en/thumb/4/43/Manchester_Super_Giants.svg/120px-Manchester_Super_Giants.svg.png',
  'manchester originals': 'https://thumb.wikimedia.org/wikipedia/en/thumb/4/43/Manchester_Super_Giants.svg/120px-Manchester_Super_Giants.svg.png',
  'mi london': 'https://thumb.wikimedia.org/wikipedia/en/thumb/0/0f/MI_London_Logo_svg.svg/120px-MI_London_Logo_svg.svg.png',
  'oval invincibles': 'https://thumb.wikimedia.org/wikipedia/en/thumb/0/0f/MI_London_Logo_svg.svg/120px-MI_London_Logo_svg.svg.png',
  'sunrisers leeds': 'https://thumb.wikimedia.org/wikipedia/en/thumb/d/d7/Sunrisers_Leeds_Logo.svg/120px-Sunrisers_Leeds_Logo.svg.png',
  'northern superchargers': 'https://thumb.wikimedia.org/wikipedia/en/thumb/d/d7/Sunrisers_Leeds_Logo.svg/120px-Sunrisers_Leeds_Logo.svg.png',
  'southern brave': 'https://thumb.wikimedia.org/wikipedia/en/thumb/e/e5/Southern_Brave_logo.svg/120px-Southern_Brave_logo.svg.png',
  'trent rockets': 'https://thumb.wikimedia.org/wikipedia/en/thumb/6/6d/Trent_Rockets_svg_logo.svg/120px-Trent_Rockets_svg_logo.svg.png',
  'welsh fire': 'https://thumb.wikimedia.org/wikipedia/en/thumb/7/7c/Welsh_Fire_logo.svg/120px-Welsh_Fire_logo.svg.png',
  'birmingham phoenix': 'https://thumb.wikimedia.org/wikipedia/en/thumb/d/d1/Birmingham_Phoenix_logo.svg/120px-Birmingham_Phoenix_logo.svg.png',
  'london spirit': 'https://thumb.wikimedia.org/wikipedia/en/thumb/d/d2/London_Spirit_new_logo.svg/120px-London_Spirit_new_logo.svg.png',

  // International League T20
  'abu dhabi knight riders': 'https://thumb.wikimedia.org/wikipedia/en/thumb/e/e2/AbuDhabiKnightRiders_Logo.svg/120px-AbuDhabiKnightRiders_Logo.svg.png',
  'mi emirates': 'https://thumb.wikimedia.org/wikipedia/en/thumb/d/d4/MI_Emirates_%E2%80%93_Logo.svg/120px-MI_Emirates_%E2%80%93_Logo.svg.png',
  'sharjah warriors': 'https://thumb.wikimedia.org/wikipedia/en/thumb/5/57/Sharjah_Warriors_Logo.png/120px-Sharjah_Warriors_Logo.png',
  'sharjah warriorz': 'https://thumb.wikimedia.org/wikipedia/en/thumb/5/57/Sharjah_Warriors_Logo.png/120px-Sharjah_Warriors_Logo.png',
  'gulf giants': 'https://thumb.wikimedia.org/wikipedia/en/thumb/8/8a/Gulf_Giants_Logo.svg/120px-Gulf_Giants_Logo.svg.png',

  // Major League Cricket
  'los angeles knight riders': 'https://thumb.wikimedia.org/wikipedia/en/thumb/3/39/Los_Angeles_Knight_Riders_official_logo.svg/120px-Los_Angeles_Knight_Riders_official_logo.svg.png',
  'mi new york': 'https://thumb.wikimedia.org/wikipedia/en/thumb/2/2c/MI_New_York_logo.png/120px-MI_New_York_logo.png',
  'seattle orcas': 'https://thumb.wikimedia.org/wikipedia/en/thumb/1/1f/Seattle_Orcas_Logo.svg/120px-Seattle_Orcas_Logo.svg.png',
  'texas super kings': 'https://thumb.wikimedia.org/wikipedia/en/thumb/2/23/Texas_Super_Kings_Logo.svg/120px-Texas_Super_Kings_Logo.svg.png',
  'washington freedom': 'https://thumb.wikimedia.org/wikipedia/en/thumb/d/db/Washington_Freedom_Logo.svg/120px-Washington_Freedom_Logo.svg.png',

  // Bangladesh Premier League
  'chattogram royals': 'https://thumb.wikimedia.org/wikipedia/en/thumb/b/b8/Chattogram_Royals_logo.png/120px-Chattogram_Royals_logo.png',
  'dhaka capital': 'https://thumb.wikimedia.org/wikipedia/en/thumb/a/a4/Logo_of_Dhaka_Capitals.svg/120px-Logo_of_Dhaka_Capitals.svg.png',
  'dhaka capitals': 'https://thumb.wikimedia.org/wikipedia/en/thumb/a/a4/Logo_of_Dhaka_Capitals.svg/120px-Logo_of_Dhaka_Capitals.svg.png',
  'rajshahi warriors': 'https://thumb.wikimedia.org/wikipedia/en/thumb/5/5f/Rajshahi_Warriors_logo.png/120px-Rajshahi_Warriors_logo.png',
  'rangpur riders': 'https://thumb.wikimedia.org/wikipedia/en/thumb/2/2e/Rangpur_Riders_logo.svg/120px-Rangpur_Riders_logo.svg.png',
  'sylhet titans': 'https://thumb.wikimedia.org/wikipedia/en/thumb/4/43/Sylhet_Titans_logo.jpg/120px-Sylhet_Titans_logo.jpg',
  'noakhali express': 'https://thumb.wikimedia.org/wikipedia/en/thumb/4/42/Noakhali_Express_logo.jpg/120px-Noakhali_Express_logo.jpg',

  // Lanka Premier League
  'colombo kaps': 'https://thumb.wikimedia.org/wikipedia/en/thumb/a/ac/Colombo_Kaps_logo.png/120px-Colombo_Kaps_logo.png',
  'kandy royals': 'https://thumb.wikimedia.org/wikipedia/en/thumb/8/8e/Logo_of_Kandy_Royals.png/120px-Logo_of_Kandy_Royals.png',
  'dambulla sixers': 'https://thumb.wikimedia.org/wikipedia/en/thumb/4/4c/Dambulla_Sixers.png/120px-Dambulla_Sixers.png',
  'galle gallants': 'https://thumb.wikimedia.org/wikipedia/en/thumb/7/7f/Galle_Gallants.png/120px-Galle_Gallants.png',

  // Super Smash
  'otago volts': 'https://thumb.wikimedia.org/wikipedia/en/thumb/9/9d/Otago_cricket.png/120px-Otago_cricket.png',
  'auckland aces': 'https://thumb.wikimedia.org/wikipedia/en/thumb/3/3f/Auckland_cricket_team_logo.png/120px-Auckland_cricket_team_logo.png',
  'canterbury kings': 'https://thumb.wikimedia.org/wikipedia/en/thumb/2/24/CanterburyCricket.png/120px-CanterburyCricket.png',
  'northern brave': "Northern_Brave_women's_cricket_logo.png",
  'central stags': 'https://thumb.wikimedia.org/wikipedia/en/thumb/9/91/Central_Stags_logo_transparent.png/120px-Central_Stags_logo_transparent.png',
  'wellington firebirds': 'https://thumb.wikimedia.org/wikipedia/en/thumb/1/13/Wellington_Firebirds_logo.png/120px-Wellington_Firebirds_logo.png',

  // English counties (T20 Blast)
  gloucestershire: 'https://thumb.wikimedia.org/wikipedia/en/thumb/8/8d/Gloucest_cricket_logo.png/120px-Gloucest_cricket_logo.png',
  somerset: 'https://thumb.wikimedia.org/wikipedia/en/thumb/7/78/SomersetCCCLogo.svg/120px-SomersetCCCLogo.svg.png',
  worcestershire: 'https://thumb.wikimedia.org/wikipedia/en/thumb/6/6c/Worcestershire_County_Cricket_Club_logo.svg/120px-Worcestershire_County_Cricket_Club_logo.svg.png',
  warwickshire: 'https://thumb.wikimedia.org/wikipedia/en/thumb/2/25/Warwickshire_County_Cricket_Club_logo.svg/120px-Warwickshire_County_Cricket_Club_logo.svg.png',
  glamorgan: 'https://thumb.wikimedia.org/wikipedia/en/thumb/d/dc/GlamorganCCCLogo.svg/120px-GlamorganCCCLogo.svg.png',
  northamptonshire: 'https://thumb.wikimedia.org/wikipedia/en/thumb/c/cb/NorthamptonshireCCCLogo.svg/120px-NorthamptonshireCCCLogo.svg.png',
  yorkshire: 'https://thumb.wikimedia.org/wikipedia/en/thumb/a/a3/Yorkshire_County_Cricket_Club_logo.svg/120px-Yorkshire_County_Cricket_Club_logo.svg.png',
  derbyshire: 'https://thumb.wikimedia.org/wikipedia/en/thumb/f/fe/Derbyshire_County_Cricket_Club_logo.svg/120px-Derbyshire_County_Cricket_Club_logo.svg.png',
  durham: 'https://thumb.wikimedia.org/wikipedia/en/thumb/5/59/Durham_Cricket_Logos.svg/120px-Durham_Cricket_Logos.svg.png',
  nottinghamshire: 'https://thumb.wikimedia.org/wikipedia/en/thumb/9/9f/NottinghamshireCountyCricketClubLogo.svg/120px-NottinghamshireCountyCricketClubLogo.svg.png',
  lancashire: 'https://thumb.wikimedia.org/wikipedia/en/thumb/7/72/Lancashire_County_Cricket_Club_logo.svg/120px-Lancashire_County_Cricket_Club_logo.svg.png',
  leicestershire: 'https://thumb.wikimedia.org/wikipedia/en/thumb/b/bc/Leicestershire_County_Cricket_Club_logo.svg/120px-Leicestershire_County_Cricket_Club_logo.svg.png',
  essex: 'https://thumb.wikimedia.org/wikipedia/en/thumb/e/ef/EssexCountyCricketLogo2023.svg/120px-EssexCountyCricketLogo2023.svg.png',
  kent: 'https://thumb.wikimedia.org/wikipedia/en/thumb/2/23/KentCCCLogo.svg/120px-KentCCCLogo.svg.png',
  sussex: 'https://thumb.wikimedia.org/wikipedia/en/thumb/7/7f/SussexCCCLogo.svg/120px-SussexCCCLogo.svg.png',
  surrey: 'https://thumb.wikimedia.org/wikipedia/en/thumb/a/a3/Surrey_County_Cricket_1_Club.svg/120px-Surrey_County_Cricket_1_Club.svg.png',
  middlesex: 'https://thumb.wikimedia.org/wikipedia/en/thumb/2/2b/Middlesex_County_Cricket_Club_logo.svg/120px-Middlesex_County_Cricket_Club_logo.svg.png',
  hampshire: 'https://thumb.wikimedia.org/wikipedia/en/thumb/9/9a/Hampshire_CCC_logo.svg/120px-Hampshire_CCC_logo.svg.png',
};

// Squad qualifiers Sportradar appends to a side's name ("India Women", "Pakistan U19").
const SQUAD_SUFFIX = /\s+(women|w|u-?19|under-?19|a|xi|emerging)$/;

export function normalizeTeamName(name: string): string {
  let key = name
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/\bsaint\b/g, 'st')
    .replace(/['’.,()]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  while (SQUAD_SUFFIX.test(key)) key = key.replace(SQUAD_SUFFIX, '');
  return key;
}

export function teamLogo(team?: Team): TeamLogo | undefined {
  if (!team?.name || team.virtual) return undefined;
  const key = normalizeTeamName(team.name);
  const logo = LOGOS[key];
  if (logo) return { src: logo, kind: 'logo' };
  const flag = FLAGS[key];
  if (flag) return { src: `https://flagcdn.com/${flag}.svg`, kind: 'flag' };
  return undefined;
}
