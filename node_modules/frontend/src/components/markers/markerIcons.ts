import { FaMapMarkerAlt, FaRegStar, FaUser, FaFlag, FaSkull, FaCrown, FaBook, FaHome } from 'react-icons/fa';

export type MarkerIconKey =
  | ''
  | 'pin'
  | 'star'
  | 'user'
  | 'flag'
  | 'skull'
  | 'crown'
  | 'book'
  | 'home';

export const MARKER_ICON_OPTIONS: { key: MarkerIconKey; label: string; Icon: any }[] = [
  { key: '', label: 'По типу (авто)', Icon: FaMapMarkerAlt },
  { key: 'pin', label: 'Пин', Icon: FaMapMarkerAlt },
  { key: 'star', label: 'Звезда', Icon: FaRegStar },
  { key: 'user', label: 'Персонаж', Icon: FaUser },
  { key: 'flag', label: 'Флаг', Icon: FaFlag },
  { key: 'skull', label: 'Череп', Icon: FaSkull },
  { key: 'crown', label: 'Корона', Icon: FaCrown },
  { key: 'book', label: 'Книга', Icon: FaBook },
  { key: 'home', label: 'Дом', Icon: FaHome }
];

export const ICON_BY_KEY: Record<Exclude<MarkerIconKey, ''>, any> = {
  pin: FaMapMarkerAlt,
  star: FaRegStar,
  user: FaUser,
  flag: FaFlag,
  skull: FaSkull,
  crown: FaCrown,
  book: FaBook,
  home: FaHome
};
