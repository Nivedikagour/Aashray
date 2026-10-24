export type OnlineStore = {
  id: 'amazon' | 'pepperfry' | 'ikea' | 'urbanladder' | 'woodenstreet';
  name: string;
  badgeColor: string;
  url: string;
};

export function getOnlineStoreLinks(itemName: string, style?: string): OnlineStore[] {
  const query = style ? `${style} ${itemName}` : itemName;
  const encoded = encodeURIComponent(query);

  return [
    {
      id: 'amazon',
      name: 'Amazon India',
      badgeColor: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20',
      url: `https://www.amazon.in/s?k=${encoded}`,
    },
    {
      id: 'pepperfry',
      name: 'Pepperfry',
      badgeColor: 'bg-orange-500/10 text-orange-700 dark:text-orange-300 border-orange-500/20',
      url: `https://www.pepperfry.com/site_search/search?q=${encoded}`,
    },
    {
      id: 'ikea',
      name: 'IKEA India',
      badgeColor: 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20',
      url: `https://www.ikea.com/in/en/search/?q=${encoded}`,
    },
    {
      id: 'urbanladder',
      name: 'Urban Ladder',
      badgeColor: 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20',
      url: `https://www.urbanladder.com/products/search?keywords=${encoded}`,
    },
    {
      id: 'woodenstreet',
      name: 'WoodenStreet',
      badgeColor: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20',
      url: `https://www.woodenstreet.com/search?keyword=${encoded}`,
    },
  ];
}
