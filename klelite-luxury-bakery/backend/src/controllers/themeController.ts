import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { ThemeType } from '@prisma/client';

export const getPublicConfig = async (req: Request, res: Response): Promise<void> => {
  try {
    const activeTheme = await prisma.themeConfig.findFirst({
      where: { isActive: true }
    });

    if (activeTheme) {
      res.json(activeTheme);
      return;
    }

    // Fallback if no active theme found
    res.json({
      name: 'Default Fallback',
      type: ThemeType.LIGHT,
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
    const themes = await prisma.themeConfig.findMany({
      orderBy: { updatedAt: 'desc' }
    });
    res.json(themes);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching themes', error });
  }
};

export const createConfig = async (req: Request, res: Response): Promise<void> => {
  try {
    const newTheme = await prisma.themeConfig.create({
      data: req.body
    });
    res.status(201).json(newTheme);
  } catch (error) {
    res.status(500).json({ message: 'Error creating theme', error });
  }
};

export const updateConfig = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Validate UUID format (basic check)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      res.status(400).json({ message: 'Invalid theme ID format' });
      return;
    }

    const updatedTheme = await prisma.themeConfig.update({
      where: { id },
      data: req.body
    });

    res.json(updatedTheme);
  } catch (error: any) {
    // Prisma error code P2025: Record not found
    if (error.code === 'P2025') {
      res.status(404).json({ message: 'Theme not found' });
      return;
    }

    console.error('Theme update error:', error);
    res.status(500).json({
      message: 'Error updating theme',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const activateConfig = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      res.status(400).json({ message: 'Invalid theme ID format' });
      return;
    }

    // Deactivate all themes
    await prisma.themeConfig.updateMany({
      data: { isActive: false }
    });

    // Activate selected theme
    const activatedTheme = await prisma.themeConfig.update({
      where: { id },
      data: { isActive: true }
    });

    res.json(activatedTheme);
  } catch (error: any) {
    // Prisma error code P2025: Record not found
    if (error.code === 'P2025') {
      res.status(404).json({ message: 'Theme not found' });
      return;
    }

    console.error('Theme activation error:', error);
    res.status(500).json({
      message: 'Error activating theme',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const deleteConfig = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      res.status(400).json({ message: 'Invalid theme ID format' });
      return;
    }

    const deletedTheme = await prisma.themeConfig.delete({
      where: { id }
    });

    res.json({ message: 'Theme deleted successfully', data: deletedTheme });
  } catch (error: any) {
    // Prisma error code P2025: Record not found
    if (error.code === 'P2025') {
      res.status(404).json({ message: 'Theme not found' });
      return;
    }

    console.error('Theme deletion error:', error);
    res.status(500).json({
      message: 'Error deleting theme',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
