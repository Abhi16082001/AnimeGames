# Otaku Blitz Design System

## Overview
This design system establishes UI consistency for the Otaku Blitz anime quiz website. The system is **specifically tailored** to the project's anime/game identity and **must not resemble Vercel** or other SaaS platforms.

## Color Palette

### Core Colors (Dark Theme)
- **Background**: `#0a0a0f` (almost black)
- **Surface**: `#0f0f1a` (very dark blue)
- **Text**: `#fafafa` (white)
- **Text Muted**: `#a1a1aa` (light gray)
- **Border**: `#27272a` (dark gray)

### Brand Colors
- **Primary**: `#dc2626` (red) - primary CTAs, highlights
- **Secondary**: `#7c3aed` (lavender) - secondary elements, gradients
- **Accent Lavender**: `#a78bfa` (lavender) - decorative elements, floating bubbles
- **Accent Red**: `#ef4444` (red) - decorative elements, floating bubbles

### Usage Rules
1. **Single Dark Theme Only**: No light/dark theme toggle exists
2. **Gradient Usage**: Lavender-red gradients for hero and special sections
3. **Red for CTAs**: Primary buttons use red (`#dc2626`) gradient
4. **Lavender for Accents**: Secondary elements and decorative bubbles use lavender

## Typography

### Font Stack
- **Primary**: "DM Sans", "Avenir Next", sans-serif
- **Code/Mono**: "IBM Plex Mono", Consolas, monospace

### Scale
- **Display**: `text-4xl md:text-5xl lg:text-6xl xl:text-7xl` (Hero titles)
- **Heading 1**: `text-3xl md:text-4xl lg:text-5xl` (Section titles)
- **Heading 2**: `text-2xl md:text-3xl` (Card titles)
- **Body Large**: `text-lg md:text-xl` (Lead paragraphs)
- **Body**: `text-base md:text-lg` (Standard text)
- **Small**: `text-sm` (Captions, badges)

### Principles
- **Tight Tracking**: Display headings use `tracking-tight`
- **Semantic HTML**: Proper heading hierarchy required
- **Accessible Contrast**: Ensure WCAG AA compliance with dark theme

## Spacing

### Section Padding
- **Hero**: `py-12 md:py-20`
- **Content Sections**: `py-12 md:py-20`
- **Inner Components**: Use Tailwind spacing scale consistently

### Container
- **Max Width**: `max-w-7xl` with `px-4 sm:px-6 lg:px-8`
- **Center Alignment**: `mx-auto` for containers

### Grid System
- **Default**: `grid` with `gap-4 md:gap-6` or `gap-6 md:gap-8`
- **Responsive**: Use Tailwind responsive prefixes

## Components

### Buttons
- **Primary**: `btn-primary` - Red gradient, white text, full rounded
- **Secondary**: `btn-secondary` - Dark surface, white text, border
- **Badges**: `badge` - Lavender background, white text

### Cards
- **Standard**: `card` - Dark surface with border
- **Gradient Border**: `gradient-border` - Red-lavender gradient outline

### Sections
- **Hero**: Full background image with black overlay on right side
- **About Section**: Lavender-red gradient background
- **Feature Badges**: Dark background with grid layout

## Responsive Design

### Breakpoints
- **Mobile**: `< 640px` - Single column, stacked layouts
- **Tablet**: `640px-1024px` - 2-column grids
- **Desktop**: `>= 1024px` - 3-4 column grids

### Touch Targets
- **Buttons**: Minimum 44px height
- **Controls**: Accessible form elements
- **Game Controls**: Touch-friendly sliders, pickers

## Accessibility

### Required
- **Semantic HTML**: Proper heading structure
- **ARIA Labels**: Descriptive labels for interactive elements
- **Focus States**: Visible focus indicators
- **Color Contrast**: AA compliance with dark theme
- **Keyboard Navigation**: Full keyboard support

### Game-Specific
- **Form Controls**: Proper labels and instructions
- **Feedback**: Clear success/error states
- **Progressive Enhancement**: Function without JavaScript where possible

## Animation

### Micro-interactions
- **Floating Bubbles**: Subtle floating animation in hero
- **Card Flips**: Smooth 3D flip transitions in Description Game
- **Zoom Transitions**: Smooth zoom animations in Zoomed Image Game
- **Color Changes**: Instant changes (no transitions) in Colour Guessing comparison

### Performance
- **CSS Transitions**: Use `transition-all duration-200`
- **GPU Acceleration**: Use `transform` properties
- **Reduce Motion**: Respect user preferences

## Implementation Notes

### Tailwind CSS
- Use utility classes from `src/styles/global.css`
- Extend theme via `@theme` directive
- Maintain consistent component classes

### Astro Components
- **Small Components**: Single responsibility
- **Reusability**: Share common UI patterns
- **Props Interface**: TypeScript interfaces for component props

### Game Consistency
- **Header Pattern**: Consistent game headers with Troll Mode toggle
- **Score Display**: Uniform score summary components
- **Progress Tracking**: Same localStorage patterns across games

## Do's and Don'ts

### Do
- Use the defined color palette consistently
- Maintain proper spacing between sections
- Ensure all interactive elements are accessible
- Follow component patterns from existing code
- Test responsive behavior at all breakpoints
- Respect the anime/game visual identity

### Don't
- Don't introduce light themes or theme toggles
- Don't copy Vercel or generic SaaS patterns
- Don't use colors outside the defined palette
- Don't compromise accessibility for visual effects
- Don't hardcode layout dimensions
- Don't create inconsistent component variations