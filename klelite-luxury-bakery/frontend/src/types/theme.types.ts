export interface IThemeConfig {
  _id: string;
  isActive: boolean;
  name: string;
  type: 'default' | 'christmas' | 'tet' | 'valentine';
  startDate?: string;
  endDate?: string;
  header: {
    variant: 'transparent' | 'solid' | 'gradient';
    textColor?: string;
    accentColor?: string;
    logoUrl?: string;
  };
  hero: {
    title: string;
    subtitle: string;
    ctaText: string;
    ctaLink: string;
    backgroundImage: string;
    overlayOpacity: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface IThemeUpdateData extends Partial<Omit<IThemeConfig, '_id' | 'createdAt' | 'updatedAt'>> {}
