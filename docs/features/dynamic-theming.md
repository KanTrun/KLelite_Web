# Dynamic Banner & Header Theming System

**Date:** January 5, 2026
**Status:** Released

## Overview

The Dynamic Banner & Header Theming System allows administrators to control the visual atmosphere of the storefront. This includes customizing the Hero Banner (content and image) and switching between pre-defined seasonal themes (e.g., Default, Christmas, Tet).

## Features

### 1. Dynamic Hero Banner
-   **Customizable Content:** Admins can update the Title, Subtitle, CTA Text, and CTA Link of the homepage hero section.
-   **Image Management:** Admins can upload and set the background image for the hero section.
-   **Overlay Control:** Adjustable opacity for the hero overlay to ensure text readability.

### 2. Seasonal Themes
-   **Theme Variants:** Support for `Default`, `Christmas`, `Tet`, and `Valentine` themes.
-   **Visual Changes:**
    -   **Header:** Changes background color, text color, and logo styling based on the active theme.
    -   **Hero Tagline:** Updates the tagline (e.g., "Merry Christmas & Happy New Year").
    -   **Styling:** Applies specific SCSS classes (`.christmas`, `.tet`) to the header for deep styling control.

### 3. Admin Management
-   **Theme Dashboard:** A new "Giao diện" section in the Admin Dashboard.
-   **CRUD Operations:** Create, Read, Update, and Delete theme configurations.
-   **Activation:** One-click activation of a theme. Only one theme can be active at a time.

## Technical Architecture

### Backend
-   **Model:** `ThemeConfig` (MongoDB) stores theme settings.
-   **Routes:**
    -   `GET /api/v1/themes/current`: Public endpoint for the active theme.
    -   `GET /api/v1/themes`: Admin list of all themes.
    -   `POST/PUT/DELETE`: Admin management endpoints.
    -   `PATCH /activate`: Endpoint to set a theme as active.

### Frontend
-   **State Management:** `themeSlice` (Redux Toolkit) manages `currentTheme` and the list of available themes.
-   **Components:**
    -   `Home`: Subscribes to `currentTheme` to render the Hero section.
    -   `Header`: Applies dynamic classes based on `currentTheme.type`.
    -   `ThemeManager`: Admin UI for managing themes.

## Usage Guide

1.  **Access:** Log in as an Admin and navigate to `/admin/themes`.
2.  **Create/Edit:** Click "Thêm mới" or the Edit icon to configure a theme.
3.  **Activate:** Click the "Kích hoạt" button on a theme card to make it live.
4.  **Verify:** Visit the homepage to see the changes immediately.

## Future Enhancements
-   **Scheduling:** Automate theme activation based on date ranges (e.g., auto-activate Christmas on Dec 20).
-   **Advanced Styling:** Allow admins to pick custom colors for the header without using presets.
