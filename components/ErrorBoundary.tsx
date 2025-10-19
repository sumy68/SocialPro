import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage?: string;
}

export default class ErrorBoundary extends React.Component<React.PropsWithChildren, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    const message = error instanceof Error ? error.message : 'Unexpected error';
    return { hasError: true, errorMessage: message };
  }

  componentDidCatch(error: unknown, info: React.ErrorInfo) {
    console.log('[ErrorBoundary] Caught error:', error);
    console.log('[ErrorBoundary] Component stack:', info?.componentStack);
  }

  handleReload = () => {
    this.setState({ hasError: false, errorMessage: undefined });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container} testID="error-boundary">
          <Text style={styles.title}>Etwas ist schiefgelaufen</Text>
          <Text style={styles.subtitle} numberOfLines={3}>
            {this.state.errorMessage ?? 'Unbekannter Fehler'}
          </Text>
          <TouchableOpacity style={styles.button} onPress={this.handleReload} activeOpacity={0.8}>
            <Text style={styles.buttonText}>Neu laden</Text>
          </TouchableOpacity>
          {Platform.OS === 'web' && (
            <Text style={styles.hint}>
              Wenn das Problem weiterhin besteht, öffnen Sie die DevTools-Konsole für Details.
            </Text>
          )}
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#FFF8F6',
  },
  title: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: '#B91C1C',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#7F1D1D',
    textAlign: 'center',
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700' as const,
  },
  hint: {
    marginTop: 12,
    fontSize: 12,
    color: '#7F1D1D',
    textAlign: 'center',
  },
});
