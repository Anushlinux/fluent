import { Server, Users, Database, Cloud, Brain, Zap, Globe, Network, LucideIcon } from 'lucide-react';

export const iconMap: Record<string, LucideIcon> = {
  Server,
  Users,
  Database,
  Cloud,
  Brain,
  Zap,
  Globe,
  Network,
};

export const getIconComponent = (iconName: string): LucideIcon => {
  return iconMap[iconName] || Server;
};
