import React from 'react';
import { Modal, View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing } from '../../../theme/tokens';

interface PrescriptionViewerModalProps {
  visible: boolean;
  urls: string[];
  onClose: () => void;
}

export const PrescriptionViewerModal: React.FC<PrescriptionViewerModalProps> = ({
  visible,
  urls,
  onClose,
}) => {
  if (!visible || !urls || urls.length === 0) return null;

  return (
    <Modal visible={visible} animationType="fade" transparent={false}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>📄 Doctor Prescription Image</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeText}>✕ Close</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.imageWrapper}>
          <Image source={{ uri: urls[0] }} style={styles.image} resizeMode="contain" />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerNote}>Pinch or double tap to zoom image</Text>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.lg, backgroundColor: '#111' },
  title: { ...typography.h2, color: '#FFF' },
  closeBtn: { padding: spacing.xs },
  closeText: { ...typography.bodyStrong, color: colors.brand.primary },
  imageWrapper: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  image: { width: '100%', height: '100%' },
  footer: { padding: spacing.md, alignItems: 'center', backgroundColor: '#111' },
  footerNote: { ...typography.caption, color: '#AAA' },
});
