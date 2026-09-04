export const colors = {
  brand: {
    primary: '#006a47', // emerald-deep equivalent
    primaryLight: '#82f9c0', // primary-fixed
    primaryDark: '#005236',
  },
  action: {
    accept: '#10B981', // emerald-lush
    acceptPressed: '#059669', // emerald-deep
    reject: '#ba1a1a', // error
    rejectPressed: '#93000a',
  },
  alert: {
    urgent: '#ba1a1a',
    urgentLight: '#ffdad6',
  },
  background: {
    primary: '#f2fcf4', // surface-bright
    secondary: '#e7f0e9', // surface-container
    tertiary: '#dbe5de', // surface-variant
    sageTop: '#F4F7F5',
    sageBottom: '#E2E8E4',
  },
  text: {
    primary: '#151d19', // on-surface
    secondary: '#3d4a42', // on-surface-variant
    muted: '#6d7a71', // outline
    inverse: '#ffffff', // on-primary
  },
  border: {
    default: '#bccac0', // outline-variant
    focus: '#10B981', // emerald-lush
    alert: '#ffdad6',
    glass: 'rgba(255, 255, 255, 0.6)',
  },
  status: {
    warning: '#825100', // tertiary
    warningLight: '#ffddb8', // tertiary-fixed
    success: '#10B981',
    info: '#00855a', // primary-container
    neutral: '#6d7a71',
  }
};

export const typography = {
  display: {
    fontSize: 48,
    fontWeight: '800' as const,
    lineHeight: 56,
  },
  h1: {
    fontSize: 32,
    fontWeight: '700' as const,
    lineHeight: 40,
  },
  h2: {
    fontSize: 28,
    fontWeight: '700' as const,
    lineHeight: 36,
  },
  h3: {
    fontSize: 20,
    fontWeight: '600' as const,
    lineHeight: 28,
  },
  body: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 24,
  },
  bodyStrong: {
    fontSize: 16,
    fontWeight: '600' as const,
    lineHeight: 24,
  },
  caption: {
    fontSize: 12,
    fontWeight: '600' as const,
    lineHeight: 16,
  },
  button: {
    fontSize: 18,
    fontWeight: '400' as const,
    lineHeight: 28,
  }
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 64, // margin-desktop
};

export const components = {
  button: {
    minHeightPrimary: 56,
    minHeightSecondary: 48,
    borderRadius: 14,
  },
  card: {
    borderRadius: 24, // rounded-xl
    padding: 24,
  },
  badge: {
    borderRadius: 9999, // full
  },
  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 2,
    },
    md: {
      shadowColor: '#059669', // tinted green shadow
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
      elevation: 4,
    },
    lg: {
      shadowColor: '#059669',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.2,
      shadowRadius: 30,
      elevation: 8,
    }
  }
};

