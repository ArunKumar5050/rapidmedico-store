import './src/theme/globalFont';
import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { registerRootComponent } from 'expo';
import App from './App';

// Global JS error handler: forwards all unhandled JS errors directly to console.error
// so they print to your Metro terminal on your PC in real-time
if (global.ErrorUtils) {
  const previousHandler = global.ErrorUtils.getGlobalHandler
    ? global.ErrorUtils.getGlobalHandler()
    : global.ErrorUtils._globalHandler;

  global.ErrorUtils.setGlobalHandler((error, isFatal) => {
    console.error('\n🚨 ==================== [GLOBAL APP ERROR] ====================');
    console.error(`Is Fatal Crash: ${isFatal}`);
    console.error(`Error Message: ${error?.message || error}`);
    if (error?.stack) {
      console.error(`Stack Trace:\n${error.stack}`);
    }
    console.error('===============================================================\n');

    if (previousHandler) {
      previousHandler(error, isFatal);
    }
  });
}

// Error boundary to catch and display React render crash reasons on screen
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error('🚨 [ErrorBoundary] React Component Render Crash:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={ebStyles.container}>
          <Text style={ebStyles.title}>⚠️ App Component Error</Text>
          <Text style={ebStyles.subtitle}>The app encountered a runtime render error:</Text>
          <ScrollView style={ebStyles.scroll}>
            <Text style={ebStyles.error}>
              {this.state.error?.toString?.() || 'Unknown error'}
            </Text>
            <Text style={ebStyles.stack}>
              {this.state.error?.stack || ''}
            </Text>
            {this.state.errorInfo && (
              <Text style={ebStyles.stack}>
                {this.state.errorInfo.componentStack}
              </Text>
            )}
          </ScrollView>
        </View>
      );
    }
    return this.props.children;
  }
}

const ebStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e', padding: 20, paddingTop: 60 },
  title: { fontSize: 24, fontWeight: '700', color: '#e94560', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#eee', marginBottom: 16 },
  scroll: { flex: 1 },
  error: { fontSize: 14, color: '#ff6b6b', fontFamily: 'monospace', marginBottom: 12 },
  stack: { fontSize: 11, color: '#aaa', fontFamily: 'monospace' },
});

function Root() {
  return (
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );
}

registerRootComponent(Root);
