import mongoose, { Schema, Document } from 'mongoose';

export interface IThemeConfig extends Document {
  isActive: boolean;
  name: string;
  type: 'default' | 'christmas' | 'tet' | 'valentine';
  startDate?: Date;
  endDate?: Date;
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
  createdAt: Date;
  updatedAt: Date;
}

const themeConfigSchema = new Schema<IThemeConfig>(
  {
    isActive: { type: Boolean, default: false },
    name: { type: String, required: true },
    type: {
      type: String,
      enum: ['default', 'christmas', 'tet', 'valentine'],
      default: 'default'
    },
    startDate: { type: Date },
    endDate: { type: Date },
    header: {
      variant: {
        type: String,
        enum: ['transparent', 'solid', 'gradient'],
        default: 'transparent'
      },
      textColor: { type: String },
      accentColor: { type: String },
      logoUrl: { type: String }
    },
    hero: {
      title: { type: String, required: true },
      subtitle: { type: String, required: true },
      ctaText: { type: String, required: true },
      ctaLink: { type: String, required: true },
      backgroundImage: { type: String, required: true },
      overlayOpacity: { type: Number, default: 0.3, min: 0, max: 1 }
    }
  },
  { timestamps: true }
);

// Ensure only one active theme exists at a time (application logic should enforce this, but index helps)
themeConfigSchema.index({ isActive: 1 });

export const ThemeConfig = mongoose.model<IThemeConfig>('ThemeConfig', themeConfigSchema);
