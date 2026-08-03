// src/utils/iconUtils.jsx
import React from 'react';
import {
  LayoutDashboard,
  Video,
  Clock,
  CheckCircle,
  UserCog,
  Download,
  CreditCard,
  Package,
  Heart,
  Droplets,
  Wind,
  BarChart2,
  Brain,
  TrendingUp,
  LineChart,
  DollarSign,
  FileText,
  PieChart,
  BookOpen,
  GraduationCap,
  ClipboardList,
  Award,
} from 'lucide-react';

const iconMap = {
  LayoutDashboard: <LayoutDashboard className="db-sidebar-icon" />,
  Video: <Video className="db-sidebar-icon" />,
  Clock: <Clock className="db-sidebar-icon" />,
  CheckCircle: <CheckCircle className="db-sidebar-icon" />,
  UserCog: <UserCog className="db-sidebar-icon" />,
  Download: <Download className="db-sidebar-icon" />,
  CreditCard: <CreditCard className="db-sidebar-icon" />,
  Package: <Package className="db-sidebar-icon" />,
  Heart: <Heart className="db-sidebar-icon" />,
  Droplets: <Droplets className="db-sidebar-icon" />,
  Wind: <Wind className="db-sidebar-icon" />,
  BarChart2: <BarChart2 className="db-sidebar-icon" />,
  Brain: <Brain className="db-sidebar-icon" />,
  TrendingUp: <TrendingUp className="db-sidebar-icon" />,
  LineChart: <LineChart className="db-sidebar-icon" />,
  DollarSign: <DollarSign className="db-sidebar-icon" />,
  FileText: <FileText className="db-sidebar-icon" />,
  PieChart: <PieChart className="db-sidebar-icon" />,
  BookOpen: <BookOpen className="db-sidebar-icon" />,
  GraduationCap: <GraduationCap className="db-sidebar-icon" />,
  ClipboardList: <ClipboardList className="db-sidebar-icon" />,
  Award: <Award className="db-sidebar-icon" />,
};

export function getIcon(iconName) {
  return iconMap[iconName] || null;
}