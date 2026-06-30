/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  Briefcase,
  Laptop,
  TrendingUp,
  Gift,
  CircleDollarSign,
  Utensils,
  Car,
  ShoppingBag,
  Receipt,
  Film,
  HeartPulse,
  Home,
  MoreHorizontal,
  DollarSign,
  Calendar,
  Search,
  Filter,
  ArrowUpDown,
  Plus,
  Trash2,
  Edit2,
  Sparkles,
  Info,
  ChevronRight,
  TrendingDown,
  X,
  CheckCircle2,
  Lightbulb,
  Settings,
  XCircle,
  HelpCircle
} from 'lucide-react';

const iconMap = {
  Briefcase,
  Laptop,
  TrendingUp,
  Gift,
  CircleDollarSign,
  Utensils,
  Car,
  ShoppingBag,
  Receipt,
  Film,
  HeartPulse,
  Home,
  MoreHorizontal,
  DollarSign,
  Calendar,
  Search,
  Filter,
  ArrowUpDown,
  Plus,
  Trash2,
  Edit2,
  Sparkles,
  Info,
  ChevronRight,
  TrendingDown,
  X,
  CheckCircle2,
  Lightbulb,
  Settings,
  XCircle,
  HelpCircle
};

export type IconName = keyof typeof iconMap;

interface CategoryIconProps {
  name: string;
  className?: string;
  size?: number;
}

export default function CategoryIcon({ name, className = '', size = 20 }: CategoryIconProps) {
  // Safe lookup: fallback to HelpCircle if icon name is unknown
  const IconComponent = iconMap[name as IconName] || HelpCircle;
  return <IconComponent className={className} size={size} id={`icon-${name}`} />;
}
