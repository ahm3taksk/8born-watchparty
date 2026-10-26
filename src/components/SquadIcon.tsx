import React from 'react';
import {
  Shield,
  Crosshair,
  Eye,
  Star,
  Crown,
  Radio,
  Skull,
  Briefcase,
  Flame,
  Car,
  Wrench,
  Activity,
  Zap,
  Target,
  LucideProps,
} from 'lucide-react';

interface SquadIconProps extends LucideProps {
  name: string;
}

export function SquadIcon({ name, ...props }: SquadIconProps) {
  switch (name) {
    case 'shield':
      return <Shield {...props} />;
    case 'crosshair':
      return <Crosshair {...props} />;
    case 'eye':
      return <Eye {...props} />;
    case 'crown':
      return <Crown {...props} />;
    case 'radio':
      return <Radio {...props} />;
    case 'skull':
      return <Skull {...props} />;
    case 'briefcase':
      return <Briefcase {...props} />;
    case 'flame':
      return <Flame {...props} />;
    case 'car':
      return <Car {...props} />;
    case 'wrench':
      return <Wrench {...props} />;
    case 'activity':
      return <Activity {...props} />;
    case 'zap':
      return <Zap {...props} />;
    case 'target':
      return <Target {...props} />;
    case 'star':
    default:
      return <Star {...props} />;
  }
}
