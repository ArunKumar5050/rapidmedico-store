import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing } from '../../../theme/tokens';
import { Card } from '../../../components/ui/Card';

export const AnnouncementsScreen = () => {
  const announcements = [
    { id: '1', title: 'Monsoon Delivery Safety Advisory', date: '2026-08-01', text: 'Please ensure waterproof outer packaging for liquid medicines.' },
    { id: '2', title: 'New Fast-Track Pickup System', date: '2026-07-28', text: 'Delivery partners now scan barcode on order pack for instant verification.' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Platform Announcements</Text>
      </View>
      <FlatList
        data={announcements}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <Card style={styles.card}>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.dateText}>{item.date}</Text>
            <Text style={styles.bodyText}>{item.text}</Text>
          </Card>
        )}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.primary },
  header: { padding: spacing.lg },
  title: { ...typography.h1, color: colors.text.primary },
  list: { paddingHorizontal: spacing.lg },
  card: { marginBottom: spacing.md, padding: spacing.lg },
  cardTitle: { ...typography.h2, color: colors.text.primary, marginBottom: 2 },
  dateText: { ...typography.caption, color: colors.text.muted, marginBottom: spacing.xs },
  bodyText: { ...typography.body, color: colors.text.secondary },
});
