import { Request, Response } from 'express';
import { ThemeConfig } from '../models/ThemeConfig';

export const getPublicConfig = async (req: Request, res: Response): Promise<void> => {
  try {
    const activeTheme = await ThemeConfig.findOne({ isActive: true });

    if (activeTheme) {
      res.json(activeTheme);
      return;
    }

    // Fallback if no active theme found
    res.json({
      name: 'Default Fallback',
      type: 'default',
      header: { variant: 'transparent' },
      hero: {
        title: "KL'élite Luxury Bakery",
        subtitle: "Experience the Taste of Elegance",
        ctaText: "Shop Now",
        ctaLink: "/products",
        backgroundImage: "https://images.unsplash.com/photo-1579306194872-64d3b7bac4c2?q=80&w=2057&auto=format&fit=crop",
        overlayOpacity: 0.3
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching theme config', error });
  }
};

export const getAllConfigs = async (req: Request, res: Response): Promise<void> => {
  try {
    const themes = await ThemeConfig.find().sort({ updatedAt: -1 });
    res.json(themes);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching themes', error });
  }
};

export const createConfig = async (req: Request, res: Response): Promise<void> => {
  try {
    const newTheme = new ThemeConfig(req.body);
    const savedTheme = await newTheme.save();
    res.status(201).json(savedTheme);
  } catch (error) {
    res.status(500).json({ message: 'Error creating theme', error });
  }
};

export const updateConfig = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updatedTheme = await ThemeConfig.findByIdAndUpdate(id, req.body, { new: true });

    if (!updatedTheme) {
      res.status(404).json({ message: 'Theme not found' });
      return;
    }

    res.json(updatedTheme);
  } catch (error) {
    res.status(500).json({ message: 'Error updating theme', error });
  }
};

export const activateConfig = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Deactivate all themes
    await ThemeConfig.updateMany({}, { isActive: false });

    // Activate selected theme
    const activatedTheme = await ThemeConfig.findByIdAndUpdate(
      id,
      { isActive: true },
      { new: true }
    );

    if (!activatedTheme) {
      res.status(404).json({ message: 'Theme not found' });
      return;
    }

    res.json(activatedTheme);
  } catch (error) {
    res.status(500).json({ message: 'Error activating theme', error });
  }
};

export const deleteConfig = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const deletedTheme = await ThemeConfig.findByIdAndDelete(id);

        if (!deletedTheme) {
            res.status(404).json({ message: 'Theme not found' });
            return;
        }

        res.json({ message: 'Theme deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting theme', error });
    }
};
