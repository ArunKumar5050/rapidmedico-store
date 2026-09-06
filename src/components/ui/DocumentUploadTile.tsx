import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { colors, typography, spacing } from '../../theme/tokens';
import { KycDocumentType } from '../../types/enums';

interface DocumentUploadTileProps {
  title: string;
  docType: KycDocumentType;
  description?: string;
  imageUri: string | null;
  onImageSelected: (uri: string) => void;
  required?: boolean;
}

export const DocumentUploadTile: React.FC<DocumentUploadTileProps> = ({
  title,
  docType,
  description,
  imageUri,
  onImageSelected,
  required = true,
}) => {
  const pickImageFromGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'RapidMedicoco needs gallery access to attach an existing photo.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsEditing: true,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      onImageSelected(result.assets[0].uri);
    }
  };

  const takePhotoWithCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'RapidMedicoco needs camera access to capture your documents and photos.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      quality: 0.8,
      allowsEditing: true,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      onImageSelected(result.assets[0].uri);
    }
  };

  const handlePressTile = () => {
    Alert.alert(
      `Attach ${title}`,
      'Choose image source:',
      [
        { text: '📷 Take Photo (Camera)', onPress: takePhotoWithCamera },
        { text: '🖼️ Choose from Gallery', onPress: pickImageFromGallery },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.titleRow}>
        <Text style={styles.title}>{title} {required && '*'}</Text>
      </View>
      {description && <Text style={styles.description}>{description}</Text>}

      <TouchableOpacity activeOpacity={0.8} onPress={handlePressTile} style={styles.tile}>
        {imageUri ? (
          <View style={styles.previewContainer}>
            <Image source={{ uri: imageUri }} style={styles.previewImage} />
            <Text style={styles.changeBadge}>Tap to Retake / Change</Text>
          </View>
        ) : (
          <View style={styles.placeholderContainer}>
            <Text style={styles.uploadIcon}>📷</Text>
            <Text style={styles.uploadText}>Tap to Capture or Upload Document</Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginBottom: spacing.lg },
  titleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
  title: { ...typography.bodyStrong, color: colors.text.primary },
  description: { ...typography.caption, color: colors.text.secondary, marginBottom: spacing.xs },
  tile: {
    backgroundColor: colors.background.secondary,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.border.default,
    borderStyle: 'dashed',
    minHeight: 140,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  placeholderContainer: { alignItems: 'center', padding: spacing.md },
  uploadIcon: { fontSize: 32, marginBottom: spacing.xs },
  uploadText: { ...typography.caption, color: colors.brand.primary, fontWeight: '600' },
  previewContainer: { width: '100%', height: 160, position: 'relative' },
  previewImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  changeBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.7)',
    color: '#FFF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    fontSize: 12,
    fontWeight: '600',
  },
});
