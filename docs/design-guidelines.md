# KL'élite Luxury Bakery - Design Guidelines

**Version:** 2.0
**Last Updated:** January 12, 2026
**Design System:** Luxury Premium Aesthetic

---

## Design Philosophy

KL'élite Luxury Bakery embodies **sophisticated elegance** with a **premium user experience**. The design system blends:

- **Luxury aesthetics** - Gold accents, refined typography, professional photography principles
- **Seasonal adaptability** - Dynamic theming for Christmas, Tet, Valentine's, and other celebrations
- **Mobile-first approach** - Responsive from 320px to 4K displays
- **Accessibility focus** - WCAG 2.1 AA compliance, reduced motion support
- **Performance optimization** - Smooth 60fps animations, optimized assets

---

## Color System

### Primary Palette - Luxury Gold

```scss
$gold-primary: #C9A857;      // Primary gold - luxury accent
$gold-light: #E5D4A6;        // Light gold - highlights
$gold-muted: #B8985A;        // Muted gold - secondary elements
$gold-dark: #A8924B;         // Dark gold - depth
```

**Usage:**
- Primary CTAs, branding, logo accents
- Interactive element highlights
- Premium feature indicators
- Badge backgrounds

### Neutral Palette

```scss
$dark-primary: #1A1A2E;      // Deep charcoal - text, headers
$dark-secondary: #2E2E48;    // Slate - backgrounds
$dark-tertiary: #3A3A54;     // Lighter slate - surfaces

$light-primary: #F8F9FA;     // Off-white - light backgrounds
$light-secondary: #E9ECEF;   // Light gray - dividers
$light-tertiary: #DEE2E6;    // Mid gray - borders
```

**Usage:**
- Text hierarchy (dark variants)
- Background layers (light/dark variants based on theme)
- Surface elevations
- Borders and dividers

### Semantic Colors

```scss
$success: #10B981;           // Green - success states
$warning: #F59E0B;           // Amber - warning states
$error: #EF4444;             // Red - error states
$info: #3B82F6;              // Blue - informational states
```

---

## Seasonal Themes

### Christmas Theme - Elegant Winter Wonderland

**Color Scheme:**
- Background: Deep crimson gradient (rgba(139, 0, 0) to rgba(165, 42, 42))
- Accents: Gold (#FFD700), White (#FFFFFF)
- Border: Golden glow (rgba(255, 215, 0, 0.3))

**Effects:**
- Snowfall animation with sparkle
- Radial gradient pattern overlays
- Text shadows for depth
- Golden glow on interactive elements

**Typography:**
- Logo: White-to-gold gradient with drop shadow
- Nav links: White with gold hover states
- Buttons: Gold gradient backgrounds

**Implementation:**
```scss
.christmas.header {
  background: linear-gradient(135deg,
    rgba(139, 0, 0, 0.95) 0%,
    rgba(165, 42, 42, 0.92) 50%,
    rgba(139, 0, 0, 0.95) 100%
  );
  box-shadow: 0 4px 24px rgba(139, 0, 0, 0.4);
}
```

### Tet Theme - Vibrant Prosperity

**Color Scheme:**
- Background: Red-orange gradient (rgba(211, 47, 47) to rgba(239, 83, 80))
- Accents: Yellow (#FFEB3B), Gold (#FFD700), Orange (#FF9800)
- Border: Golden yellow glow

**Effects:**
- Fireworks sparkle animation
- Festive pattern overlays
- Multi-directional sparkle bursts
- Enhanced glow effects

**Typography:**
- Logo: Gold-to-yellow gradient with orange accents
- Nav links: Cream with yellow hover
- Buttons: Gold-to-orange gradients

### Valentine Theme - Romantic Luxury

**Color Scheme:**
- Background: Deep magenta gradient (rgba(136, 14, 79) to rgba(194, 24, 91))
- Accents: Light pink (#FFB6C1), Hot pink (#FF69B4), Pink (#FFC0CB)
- Border: Soft pink glow

**Effects:**
- Floating hearts with glow pulse
- Romantic pattern overlays
- Heart color variations for depth
- Soft pulsing animations

**Typography:**
- Logo: White-to-pink gradient with hot pink accents
- Nav links: White with light pink hover
- Buttons: Pink gradient backgrounds

---

## Typography

### Font Stack

**Heading Font (Playfair Display):**
```scss
$font-heading: 'Playfair Display', serif;
```
- Use for: H1-H6, brand name, luxury headers
- Weights: 400 (regular), 600 (semibold), 700 (bold), 800 (extra bold)

**Body Font (Inter):**
```scss
$font-body: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
```
- Use for: Body text, UI elements, navigation
- Weights: 400 (regular), 500 (medium), 600 (semibold), 700 (bold)

**Accent Font (Montserrat):**
```scss
$font-accent: 'Montserrat', sans-serif;
```
- Use for: Taglines, special callouts, logo subtext
- Weights: 300 (light), 400 (regular), 500 (medium), 600 (semibold)

### Type Scale

```scss
$text-xs: 0.75rem;      // 12px - Fine print, badges
$text-sm: 0.875rem;     // 14px - Secondary text, captions
$text-base: 1rem;       // 16px - Body text (default)
$text-md: 1.125rem;     // 18px - Lead paragraphs
$text-lg: 1.25rem;      // 20px - Large body, small headers
$text-xl: 1.5rem;       // 24px - Section headers
$text-2xl: 1.875rem;    // 30px - Page titles
$text-3xl: 2.25rem;     // 36px - Hero titles
$text-4xl: 3rem;        // 48px - Display headers
$text-5xl: 3.75rem;     // 60px - Marketing headers
```

### Line Heights

```scss
$line-height-tight: 1.2;    // Headings
$line-height-normal: 1.5;   // Body text
$line-height-relaxed: 1.6;  // Long-form content
```

### Letter Spacing

```scss
$letter-spacing-tight: -0.02em;   // Large headings
$letter-spacing-normal: 0;        // Body text
$letter-spacing-wide: 0.02em;     // Navigation
$letter-spacing-wider: 0.05em;    // Uppercase labels
```

---

## Spacing System

### Base Unit: 4px (0.25rem)

```scss
$spacing-xs: 0.25rem;     // 4px
$spacing-sm: 0.5rem;      // 8px
$spacing-md: 0.75rem;     // 12px
$spacing-lg: 1rem;        // 16px
$spacing-xl: 1.5rem;      // 24px
$spacing-2xl: 2rem;       // 32px
$spacing-3xl: 3rem;       // 48px
$spacing-4xl: 4rem;       // 64px
```

**Usage Principles:**
- Component padding: Use lg (16px) to xl (24px)
- Section spacing: Use 2xl (32px) to 4xl (64px)
- Element gaps: Use sm (8px) to md (12px)
- Micro-spacing: Use xs (4px)

---

## Border Radius

```scss
$radius-sm: 6px;          // Small elements (badges, tags)
$radius-md: 10px;         // Default (buttons, inputs)
$radius-lg: 16px;         // Cards, modals
$radius-xl: 20px;         // Large containers
$radius-full: 9999px;     // Pills, avatars
```

---

## Shadows & Elevation

### Elevation Scale

```scss
$shadow-xs: 0 1px 2px rgba(0, 0, 0, 0.04);
$shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.08);
$shadow-md: 0 4px 16px rgba(0, 0, 0, 0.12);
$shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.16);
$shadow-xl: 0 16px 48px rgba(0, 0, 0, 0.20);
```

### Specialty Shadows

```scss
$shadow-gold: 0 4px 16px rgba(201, 169, 98, 0.35);  // Gold glow for CTAs
$shadow-inset: inset 0 2px 4px rgba(0, 0, 0, 0.06); // Subtle depth
```

**Usage:**
- Cards: shadow-sm to shadow-md
- Modals: shadow-lg to shadow-xl
- Hover states: Increase by one level
- CTAs: Use shadow-gold for gold buttons

---

## Animation & Motion

### Timing Functions

```scss
$ease-in: cubic-bezier(0.4, 0, 1, 1);
$ease-out: cubic-bezier(0, 0, 0.2, 1);
$ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
$ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
```

### Duration Scale

```scss
$transition-micro: 150ms;    // Icon changes, hover states
$transition-fast: 200ms;     // Button animations
$transition-normal: 300ms;   // Modal open/close
$transition-slow: 500ms;     // Page transitions
```

### Motion Principles

1. **Micro-interactions:** 150ms for immediate feedback
2. **Standard transitions:** 200-300ms for UI changes
3. **Page transitions:** 300-500ms for route changes
4. **Reduced motion:** Always respect `prefers-reduced-motion`

**Implementation:**
```scss
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Layout System

### Breakpoints

```scss
$breakpoint-xs: 0px;        // Mobile portrait
$breakpoint-sm: 576px;      // Mobile landscape
$breakpoint-md: 768px;      // Tablet
$breakpoint-lg: 992px;      // Desktop
$breakpoint-xl: 1200px;     // Large desktop
$breakpoint-2xl: 1440px;    // Wide desktop
```

### Container Widths

```scss
$container-sm: 640px;
$container-md: 768px;
$container-lg: 1024px;
$container-xl: 1280px;
$container-2xl: 1440px;
```

### Grid System

- **12-column grid** for desktop layouts
- **Mobile-first approach** - design for 320px first
- **Responsive images** - use srcset and sizes
- **Flexbox & Grid** - prefer CSS Grid for 2D layouts

---

## Component Patterns

### Buttons

**Primary Button (CTA):**
```scss
.primary-button {
  padding: 12px 24px;
  background: linear-gradient(135deg, $gold-primary, $gold-dark);
  color: $dark-primary;
  border-radius: $radius-md;
  font-weight: 600;
  box-shadow: $shadow-gold;
  transition: all $transition-fast $ease-out;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba($gold-primary, 0.45);
  }
}
```

**Secondary Button:**
```scss
.secondary-button {
  padding: 12px 24px;
  background: transparent;
  color: $gold-primary;
  border: 1px solid $gold-primary;
  border-radius: $radius-md;
  transition: all $transition-fast $ease-out;

  &:hover {
    background: rgba($gold-primary, 0.08);
  }
}
```

### Cards

**Product Card:**
- Border radius: $radius-lg (16px)
- Shadow: $shadow-sm, hover to $shadow-md
- Image aspect ratio: 4:3 or 1:1
- Padding: $spacing-lg (16px)
- Hover: Transform translateY(-4px)

**Content Card:**
- Border radius: $radius-xl (20px)
- Shadow: $shadow-md
- Padding: $spacing-2xl (32px)
- Background: Surface color with subtle gradient

---

## Admin Panel Design

### Sidebar (Always Visible)

**Design Specifications:**
- Width: 260px (desktop), 240px (tablet)
- Background: Fixed dark (#111827)
- Position: Fixed, always visible on desktop
- Collapse: Not available (requirement: always visible)
- Mobile: Hidden, slide-in on menu toggle

**Navigation Items:**
- Padding: 10px 14px
- Border radius: 8px
- Active state: Solid gold background with shadow
- Hover: Subtle white background (rgba(255, 255, 255, 0.04))
- Icon size: 1.1rem
- Font size: 0.875rem (14px)

**User Section:**
- Avatar: 40px circle with gold gradient
- Name: 0.85rem, white, truncated
- Role: 0.7rem, muted white

### Main Content Area

**Layout:**
- Margin left: 260px (to account for sidebar)
- Padding: 32px
- Max width: 1600px
- Background: Light neutral

**Stats Cards:**
- Grid: 4 columns (desktop), 2 (tablet), 1 (mobile)
- Border radius: 20px
- Padding: 24px
- Hover: Transform translateY(-4px)
- Icon: 56px with colored background

**Data Tables:**
- Border radius: 16px
- Row hover: Light background
- Header: Uppercase, 0.75rem, muted
- Cell padding: 14px 20px

---

## Accessibility Guidelines

### WCAG 2.1 AA Compliance

**Color Contrast:**
- Normal text: 4.5:1 minimum
- Large text (18pt+): 3:1 minimum
- UI components: 3:1 minimum

**Interactive Elements:**
- Minimum touch target: 44x44px
- Focus indicators: 2px solid gold outline, 2px offset
- Keyboard navigation: All interactive elements accessible

**Typography:**
- Minimum font size: 14px (0.875rem)
- Line height: 1.5 for body text
- Paragraph width: Max 75 characters

**Motion:**
- Respect `prefers-reduced-motion`
- Provide alternatives to motion-dependent interactions
- Disable seasonal effects for reduced motion users

---

## Performance Standards

### Load Times

- First Contentful Paint (FCP): &lt; 1.8s
- Largest Contentful Paint (LCP): &lt; 2.5s
- Cumulative Layout Shift (CLS): &lt; 0.1
- First Input Delay (FID): &lt; 100ms

### Optimization Techniques

**Images:**
- Use WebP with fallback
- Lazy load below-fold images
- Responsive images with srcset
- Compress to 80% quality

**CSS:**
- Use CSS modules for scoping
- Extract critical CSS
- Minimize animations (use transform/opacity only)
- Use will-change sparingly

**Fonts:**
- Subset fonts to Latin + Vietnamese
- Use font-display: swap
- Preload critical fonts
- Limit to 3 font families

---

## Seasonal Effects Implementation

### Snowfall (Christmas)

**Particle Count:**
- Light: 25 snowflakes
- Medium: 40 snowflakes
- Heavy: 60 snowflakes

**Animation:**
- Duration: 8-16s (randomized)
- Movement: Vertical fall with horizontal drift
- Rotation: 0-360deg
- Opacity: Fade in/out

**Visual Effects:**
- Radial gradient with white core
- Blue-tinted sparkle animation
- Box shadow for glow
- Blur filter: 0.8px

### Fireworks (Tet)

**Particle Count:**
- Light: 15 sparkles
- Medium: 25 sparkles
- Heavy: 40 sparkles

**Animation:**
- Duration: 1.5-3.5s
- Explosion pattern: Star burst
- Colors: Gold, red, orange, yellow
- Rotation: 360deg

**Visual Effects:**
- Multi-directional rays
- Box shadow glow in particle color
- Diagonal sparkle variations
- Blur filter: 0.5px

### Hearts (Valentine)

**Particle Count:**
- Light: 15 hearts
- Medium: 25 hearts
- Heavy: 40 hearts

**Animation:**
- Duration: 6-14s
- Movement: Float upward with wobble
- Rotation: -10 to 15deg
- Scale: 0.7 to 1.1

**Visual Effects:**
- Color variations: #FF6B9D, #FFB6C1, #FF69B4
- Text shadow glow
- Pulsing glow animation
- Drop shadow filter

---

## Design Tokens (CSS Variables)

### Implementation

```scss
:root {
  // Colors
  --color-primary: #{$gold-primary};
  --color-text: #{$dark-primary};
  --color-bg: #{$light-primary};
  --color-surface: #FFFFFF;
  --color-border: #{$light-tertiary};

  // Spacing
  --spacing-sm: #{$spacing-sm};
  --spacing-md: #{$spacing-md};
  --spacing-lg: #{$spacing-lg};

  // Typography
  --font-heading: #{$font-heading};
  --font-body: #{$font-body};
  --text-base: #{$text-base};

  // Effects
  --shadow-sm: #{$shadow-sm};
  --shadow-gold: #{$shadow-gold};
  --radius-md: #{$radius-md};
}

// Dark mode adjustments
@media (prefers-color-scheme: dark) {
  :root {
    --color-text: #{$light-primary};
    --color-bg: #{$dark-primary};
    --color-surface: #{$dark-secondary};
    --color-border: #{$dark-tertiary};
  }
}
```

---

## Brand Voice & Visual Language

### Photography Principles

**Product Photography:**
- Studio lighting with soft shadows
- Neutral or branded backgrounds
- Hero angle: 45° from above
- Color grading: Warm, inviting tones

**Lifestyle Photography:**
- Natural lighting preferred
- Lifestyle contexts (cafes, homes, celebrations)
- Candid moments over staged
- Color grading: Warm with gold accents

### Iconography

**Style:**
- Line icons (Feather Icons library)
- Stroke width: 2px
- Size: 20-24px (UI), 32-48px (features)
- Color: Inherit from parent

**Usage:**
- Navigation: Left-aligned with labels
- Buttons: Optional, left of text
- Status indicators: Colored backgrounds
- Features: Large, centered with descriptive text

---

## Quality Checklist

### Before Launch

- [ ] All text meets contrast ratios (WCAG AA)
- [ ] All interactive elements are 44x44px minimum
- [ ] Focus indicators visible on all focusable elements
- [ ] Keyboard navigation works throughout
- [ ] Seasonal effects respect `prefers-reduced-motion`
- [ ] Images optimized and lazy-loaded
- [ ] Fonts subset and preloaded
- [ ] CSS scoped with modules
- [ ] Mobile-first responsive design tested
- [ ] All breakpoints tested (320px to 2560px)
- [ ] Dark mode support (if applicable)
- [ ] Vietnamese diacritical marks render correctly
- [ ] Loading states implemented for async actions
- [ ] Error states handled gracefully
- [ ] Success feedback provided for user actions

---

## Maintenance & Evolution

### Design System Updates

- Review quarterly for improvements
- Document all changes in version history
- Communicate updates to development team
- Test changes across all breakpoints
- Validate accessibility after updates

### Seasonal Theme Schedule

- **Christmas:** December 1 - January 6
- **Tet (Lunar New Year):** 2 weeks before - 2 weeks after
- **Valentine's Day:** February 1-14
- **Custom Events:** As needed (weddings, promotions)

### Feedback Loop

- User testing sessions: Quarterly
- Analytics review: Monthly
- A/B testing: For major changes
- Accessibility audits: Bi-annually
- Performance monitoring: Continuous

---

**Document Owner:** UI/UX Design Team
**Approvers:** Product Manager, Engineering Lead
**Next Review:** April 2026
