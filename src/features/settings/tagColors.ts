export const SETTINGS_PRESET_COLORS = [
  '#E03131', '#C92A2A', '#F03E3E', '#FF6B6B',
  '#D9480F', '#E8590C', '#F08C00', '#FAB005',
  '#FCC419', '#FFD43B', '#82C91E', '#74B816',
  '#2F9E44', '#37B24D', '#51CF66', '#065F46',
  '#0CA678', '#12B886', '#20C997', '#0B7285',
  '#1098AD', '#15AABF', '#3BC9DB', '#1864AB',
  '#1C7ED6', '#3A82F8', '#4DABF7', '#1E40AF',
  '#1E3A8A', '#364FC7', '#4F46E5', '#6741D9',
  '#7E22CE', '#8B5CF6', '#BE4BDB', '#DA77F2',
  '#C2255C', '#D6336C', '#F06595', '#F783AC',
  '#374151', '#495057', '#868E96', '#2F4F4F',
  '#556B2F', '#795548', '#A16207', '#BC8F8F',
];

export function getTagHexColor(tag: string, customColors?: Record<string, string>) {
  if (customColors && customColors[tag]) return customColors[tag];
  const hash = tag.split('').reduce((acc, char) => char.charCodeAt(0) + ((acc << 5) - acc), 0);
  const hue = Math.abs(hash % 360);
  return `hsl(${hue}, 65%, 45%)`;
}

export function getTagSoftColor(tag: string, customColors?: Record<string, string>) {
  if (customColors && customColors[tag]) return `${customColors[tag]}15`;
  const hash = tag.split('').reduce((acc, char) => char.charCodeAt(0) + ((acc << 5) - acc), 0);
  const hue = Math.abs(hash % 360);
  return `hsl(${hue}, 65%, 95%)`;
}
