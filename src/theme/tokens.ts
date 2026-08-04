export const colors = {
  brand: {
    primary: '#0F9D6C',
    primaryLight: '#E6F5F0',
    primaryDark: '#0B7A54',
  },
  action: {
    accept: '#1E8E5A',
    acceptPressed: '#166E45',
    reject: '#D93025',
    rejectPressed: '#B3261E',
  },
  alert: {
    urgent: '#E53935',
    urgentLight: '#FFEBEE',
  },
  background: {
    primary: '#FFFFFF',
    secondary: '#F5F7F6',
    tertiary: '#EFEFEF',
  },
  text: {
    primary: '#121815',
    secondary: '#5B6B64',
    muted: '#8B9B94',
    inverse: '#FFFFFF',
  },
  border: {
    default: '#E1E7E4',
    focus: '#0F9D6C',
    alert: '#F5C6CB',
  },
  status: {
    warning: '#C97A1F',
    warningLight: '#FFF8E7',
    success: '#1E8E5A',
    info: '#1976D2',
    neutral: '#757575',
  }
};

export const typography = {
  display: {
    fontSize: 30,
    fontWeight: '700' as const,
    lineHeight: 36,
  },
  h1: {
    fontSize: 24,
    fontWeight: '600' as const,
    lineHeight: 30,
  },
  h2: {
    fontSize: 19,
    fontWeight: '600' as const,
    lineHeight: 24,
  },
  body: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 22,
  },
  bodyStrong: {
    fontSize: 16,
    fontWeight: '600' as const,
    lineHeight: 22,
  },
  caption: {
    fontSize: 13,
    fontWeight: '400' as const,
    lineHeight: 18,
  },
  button: {
    fontSize: 17,
    fontWeight: '600' as const,
    lineHeight: 22,
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
  huge: 48,
};

export const components = {
  button: {
    minHeightPrimary: 56, // 56dp per spec section 69
    minHeightSecondary: 48,
    borderRadius: 12,
  },
  card: {
    borderRadius: 16,
    padding: 16,
  },
  badge: {
    borderRadius: 8,
  }
};
