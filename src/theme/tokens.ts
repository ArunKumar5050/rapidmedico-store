export const colors = {
  brand: {
    primary: '#0077B6',       // ocean blue — main brand
    primaryLight: '#90E0EF',  // sky blue — light accent
    primaryDark: '#005A8E',   // deep anchor blue
    secondary: '#00B4D8',     // vibrant cyan — secondary accent
    cyan: '#90E0EF',          // soft sky
    cyanMid: '#00B4D8',       // mid cyan
    cyanDeep: '#0077B6',      // same as primary alias
  },
  action: {
    accept: '#10B981',        // keep green for "accept" (semantic success)
    acceptPressed: '#059669',
    reject: '#DC2626',        // red for reject
    rejectPressed: '#B91C1C',
  },
  alert: {
    urgent: '#DC2626',
    urgentLight: '#FEE2E2',
  },
  background: {
    primary: '#F0F7FF',       // blue-tinted white surface
    secondary: '#E3F2FD',     // slightly richer blue tint
    tertiary: '#DBEAFE',      // deeper blue-light
    sageTop: '#F0F7FF',       // renamed but same usage
    sageBottom: '#D6EAF8',    // subtle gradient bottom
  },
  text: {
    primary: '#0D1B2A',       // near-black with blue tint
    secondary: '#3A5F7A',     // muted blue-grey
    muted: '#7A9BB5',         // light blue-grey
    inverse: '#FFFFFF',
  },
  border: {
    default: '#B3D4EA',       // soft blue border
    focus: '#0077B6',         // brand blue focus
    alert: '#FEE2E2',
    glass: 'rgba(255, 255, 255, 0.65)',
  },
  status: {
    warning: '#B45309',
    warningLight: '#FEF3C7',
    success: '#10B981',
    info: '#0077B6',
    neutral: '#7A9BB5',
  }
};

export const typography = {
  display: {
    fontSize: 48,
    fontWeight: '800' as const,
    fontFamily: 'Nunito_800ExtraBold',
    lineHeight: 56,
  },
  h1: {
    fontSize: 32,
    fontWeight: '700' as const,
    fontFamily: 'Nunito_700Bold',
    lineHeight: 40,
  },
  h2: {
    fontSize: 28,
    fontWeight: '700' as const,
    fontFamily: 'Nunito_700Bold',
    lineHeight: 36,
  },
  h3: {
    fontSize: 20,
    fontWeight: '600' as const,
    fontFamily: 'Nunito_600SemiBold',
    lineHeight: 28,
  },
  body: {
    fontSize: 16,
    fontWeight: '400' as const,
    fontFamily: 'Nunito_400Regular',
    lineHeight: 24,
  },
  bodyStrong: {
    fontSize: 16,
    fontWeight: '600' as const,
    fontFamily: 'Nunito_600SemiBold',
    lineHeight: 24,
  },
  caption: {
    fontSize: 12,
    fontWeight: '600' as const,
    fontFamily: 'Nunito_600SemiBold',
    lineHeight: 16,
  },
  button: {
    fontSize: 18,
    fontWeight: '700' as const,
    fontFamily: 'Nunito_700Bold',
    lineHeight: 28,
  }
};

// Font family shorthand — use alongside fontWeight to apply Nunito
export const fonts = {
  regular:   'Nunito_400Regular',
  medium:    'Nunito_500Medium',
  semiBold:  'Nunito_600SemiBold',
  bold:      'Nunito_700Bold',
  extraBold: 'Nunito_800ExtraBold',
  black:     'Nunito_900Black',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 64,
};

export const components = {
  button: {
    minHeightPrimary: 56,
    minHeightSecondary: 48,
    borderRadius: 14,
  },
  card: {
    borderRadius: 24,
    padding: 24,
  },
  badge: {
    borderRadius: 9999,
  },
  shadows: {
    sm: {
      shadowColor: '#0077B6',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 4,
      elevation: 2,
    },
    md: {
      shadowColor: '#0077B6',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 12,
      elevation: 4,
    },
    lg: {
      shadowColor: '#005A8E',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.18,
      shadowRadius: 30,
      elevation: 8,
    }
  }
};
