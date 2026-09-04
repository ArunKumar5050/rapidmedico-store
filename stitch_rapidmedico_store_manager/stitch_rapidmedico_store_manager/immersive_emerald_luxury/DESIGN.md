---
name: Immersive Emerald Luxury
colors:
  surface: '#f2fcf4'
  surface-dim: '#d3dcd5'
  surface-bright: '#f2fcf4'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#ecf6ef'
  surface-container: '#e7f0e9'
  surface-container-high: '#e1eae3'
  surface-container-highest: '#dbe5de'
  on-surface: '#151d19'
  on-surface-variant: '#3d4a42'
  inverse-surface: '#2a322e'
  inverse-on-surface: '#eaf3ec'
  outline: '#6d7a71'
  outline-variant: '#bccac0'
  surface-tint: '#006c49'
  primary: '#006a47'
  on-primary: '#ffffff'
  primary-container: '#00855a'
  on-primary-container: '#f5fff6'
  inverse-primary: '#65dca6'
  secondary: '#406654'
  on-secondary: '#ffffff'
  secondary-container: '#bfe9d2'
  on-secondary-container: '#446a58'
  tertiary: '#825100'
  on-tertiary: '#ffffff'
  tertiary-container: '#a36700'
  on-tertiary-container: '#fffbff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#82f9c0'
  primary-fixed-dim: '#65dca6'
  on-primary-fixed: '#002113'
  on-primary-fixed-variant: '#005236'
  secondary-fixed: '#c2ecd5'
  secondary-fixed-dim: '#a6d0ba'
  on-secondary-fixed: '#002114'
  on-secondary-fixed-variant: '#284e3d'
  tertiary-fixed: '#ffddb8'
  tertiary-fixed-dim: '#ffb95f'
  on-tertiary-fixed: '#2a1700'
  on-tertiary-fixed-variant: '#653e00'
  background: '#f2fcf4'
  on-background: '#151d19'
  surface-variant: '#dbe5de'
  emerald-lush: '#10B981'
  emerald-deep: '#059669'
  sage-top: '#F4F7F5'
  sage-bottom: '#E2E8E4'
  glass-border: rgba(255, 255, 255, 0.6)
typography:
  display-lg:
    fontFamily: Hanken Grotesk
    fontSize: 48px
    fontWeight: '800'
    lineHeight: 56px
    letterSpacing: -0.03em
  headline-lg:
    fontFamily: Hanken Grotesk
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Hanken Grotesk
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
  title-lg:
    fontFamily: Hanken Grotesk
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 8px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 64px
  container-max: 1280px
---

## Brand & Style
The brand personality is defined by an uncompromising "Immersive Emerald Luxury"—a high-fidelity aesthetic that merges the precision of modern SaaS with the tactile richness of premium lifestyle editorial. The design system targets an audience that values wellness and professional excellence, evoking feelings of serenity, growth, and exclusivity.

The visual style is a fusion of **Glassmorphism** and **High-Contrast Boldness**. It rejects flat, utilitarian surfaces in favor of lush, vibrant gradients and deep, multi-layered depth. Every interaction should feel like navigating a high-end physical space, utilizing glowing borders and tinted shadows to create a sophisticated, tech-forward atmosphere.

## Colors
The color strategy revolves around a monochromatic emerald foundation supported by warm amber accents. The background is no longer static white; it is a deep, immersive vertical transition from light sage to saturated emerald-tinted gray.

Primary actions must utilize the multi-stop emerald gradient to ensure they stand out against the soft background. Secondary surfaces leverage translucent "glass" properties, allowing the background gradient to bleed through slightly, maintaining a cohesive environmental feel.

## Typography
The system uses **Hanken Grotesk** for headlines to provide a sharp, contemporary edge that feels tech-forward yet premium. **Inter** is retained for body text to ensure maximum legibility within complex glass containers.

High-fidelity depth is achieved by applying a very subtle text-shadow to display headings (0px 1px 2px rgba(0,0,0,0.1)) and using color contrast to guide the eye. Use tighter letter spacing on larger displays to maintain a sophisticated, "locked-in" look.

## Layout & Spacing
The layout follows a **fluid grid** model with generous margins to emphasize the "luxury" aspect of whitespace. Elements are organized on an 8px rhythmic scale. 

On desktop, use a 12-column grid with wide 24px gutters to allow the glass cards room to breathe. On mobile, transition to a single-column layout with 16px safe-area margins. Content should be grouped in elevated clusters (cards) rather than separated by lines, using spacing alone to define hierarchy.

## Elevation & Depth
Depth is the core of this design system. It is achieved through three specific layers:
1.  **Backdrop:** The immersive emerald-to-sage gradient.
2.  **Mid-ground (Glass):** Cards use a backdrop-blur (12px to 20px) and a semi-transparent top-down white gradient. Every card must have a 1px "glowing border"—a semi-transparent white-to-transparent linear gradient that mimics light catching the edge of glass.
3.  **Top-ground (Action):** Primary buttons and active states use high-contrast shadows tinted with a deep green (`rgba(5, 150, 105, 0.2)`) to make them feel physically lifted above the glass.

## Shapes
The shape language is "Rounded," utilizing a 0.5rem (8px) base radius. However, for the signature "Premium Gradient" look, large containers (cards) should use `rounded-xl` (1.5rem / 24px) to soften the overall appearance and feel more approachable and modern. Buttons and input fields should maintain a consistent 12px-14px radius to balance the organic feel of the gradients with structural precision.

## Components
- **Buttons:** Primary buttons must use the `emerald-lush` to `emerald-deep` gradient. They feature a white label and a high-contrast green shadow. Secondary buttons use a glass effect with a subtle `emerald-lush` border.
- **Cards:** No card should have a solid background. Use the glass-morphism effect: `background: linear-gradient(135deg, rgba(255,255,255,0.7), rgba(255,255,255,0.3))`, a `backdrop-filter: blur(16px)`, and a 1px border.
- **Input Fields:** Use a subtle glass background with a focus state that activates a glowing emerald border and a soft inner shadow.
- **Chips:** Small, pill-shaped elements with a solid `primary-container` background or a very light emerald tint for categorizing content without competing with primary buttons.
- **Lists:** Items within lists should be separated by space or a very faint 1px white line (low-contrast), never a dark or heavy divider.
- **Gradients in UI:** Use the mesh gradient or the vertical sage-emerald transition for page-level headers to create a sense of immersion upon entry.