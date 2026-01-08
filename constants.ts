
import { CategoryDef } from './types';

export const INITIAL_CATEGORIES: CategoryDef[] = [
  { id: 'cat_essentials', name: 'Essentials', icon: 'fa-star', colorClass: 'bg-amber-100 text-amber-700' },
  { id: 'cat_clothing', name: 'Clothing', icon: 'fa-shirt', colorClass: 'bg-blue-100 text-blue-700' },
  { id: 'cat_toiletries', name: 'Toiletries', icon: 'fa-pump-soap', colorClass: 'bg-emerald-100 text-emerald-700' },
  { id: 'cat_electronics', name: 'Electronics', icon: 'fa-plug', colorClass: 'bg-purple-100 text-purple-700' },
  { id: 'cat_documents', name: 'Documents', icon: 'fa-passport', colorClass: 'bg-rose-100 text-rose-700' },
  { id: 'cat_health', name: 'Health', icon: 'fa-briefcase-medical', colorClass: 'bg-red-100 text-red-700' },
  { id: 'cat_other', name: 'Other', icon: 'fa-box', colorClass: 'bg-slate-100 text-slate-700' }
];

export const AVAILABLE_ICONS = [
  'fa-star', 'fa-shirt', 'fa-pump-soap', 'fa-plug', 'fa-passport', 
  'fa-briefcase-medical', 'fa-box', 'fa-umbrella-beach', 'fa-mountain', 
  'fa-camera', 'fa-map', 'fa-ticket', 'fa-book', 'fa-headphones', 
  'fa-socks', 'fa-glasses', 'fa-shoe-prints', 'fa-wallet', 'fa-key',
  'fa-car', 'fa-bus', 'fa-bicycle', 'fa-person-swimming', 'fa-wine-glass'
];

export const COLOR_OPTIONS = [
  'bg-slate-100 text-slate-700',
  'bg-red-100 text-red-700',
  'bg-orange-100 text-orange-700',
  'bg-amber-100 text-amber-700',
  'bg-yellow-100 text-yellow-700',
  'bg-lime-100 text-lime-700',
  'bg-emerald-100 text-emerald-700',
  'bg-teal-100 text-teal-700',
  'bg-cyan-100 text-cyan-700',
  'bg-sky-100 text-sky-700',
  'bg-blue-100 text-blue-700',
  'bg-indigo-100 text-indigo-700',
  'bg-violet-100 text-violet-700',
  'bg-purple-100 text-purple-700',
  'bg-pink-100 text-pink-700',
  'bg-rose-100 text-rose-700'
];
