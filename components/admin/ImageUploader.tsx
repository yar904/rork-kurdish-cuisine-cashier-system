import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Platform, ActivityIndicator, Image, Alert } from 'react-native';
import { Text } from '@/components/CustomText';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { X, Image as ImageIcon } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';

type ImageUploaderProps = {
  value: string | null;
  onChange: (url: string) => void;
  bucketName?: string;
  folderPath?: string;
};

export function ImageUploader({ 
  value, 
  onChange, 
  bucketName = 'menu-images',
  folderPath = '',
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState<boolean>(false);
  const [imageUri, setImageUri] = useState<string | null>(value);

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow access to your photo library to upload images.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const uri = result.assets[0].uri;
        setImageUri(uri);
        await compressAndUploadImage(uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const compressAndUploadImage = async (uri: string) => {
    setUploading(true);
    
    try {
      let compressedUri: string;

      if (Platform.OS === 'web') {
        compressedUri = await compressImageWeb(uri);
      } else {
        const manipulated = await ImageManipulator.manipulateAsync(
          uri,
          [{ resize: { width: 1200 } }],
          { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
        );
        compressedUri = manipulated.uri;
      }

      await uploadImage(compressedUri);
    } catch (error: any) {
      console.error('Error compressing image:', error);
      Alert.alert('Error', error?.message || 'Failed to compress image');
      setImageUri(null);
      setUploading(false);
    }
  };

  const compressImageWeb = async (uri: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new window.Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > 1200) {
          height = (height * 1200) / width;
          width = 1200;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const url = URL.createObjectURL(blob);
              resolve(url);
            } else {
              reject(new Error('Failed to create blob'));
            }
          },
          'image/jpeg',
          0.7
        );
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = uri;
    });
  };

  const uploadImage = async (uri: string) => {
    try {
      let fileData: Blob;
      let fileName: string;

      const response = await fetch(uri);
      const blob = await response.blob();
      fileData = blob;
      fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;

      const filePath = folderPath ? `${folderPath}/${fileName}` : fileName;

      const { error } = await supabase.storage
        .from(bucketName)
        .upload(filePath, fileData, {
          contentType: 'image/jpeg',
          cacheControl: '3600',
          upsert: false,
        });

      if (error) {
        console.error('Upload error:', error);
        throw error;
      }

      const { data: { publicUrl } } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);

      onChange(publicUrl);
      Alert.alert('Success', 'Image uploaded successfully');
    } catch (error: any) {
      console.error('Error uploading image:', error);
      Alert.alert('Error', error?.message || 'Failed to upload image');
      setImageUri(null);
    } finally {
      setUploading(false);
    }
  };

  const removeImage = () => {
    setImageUri(null);
    onChange('');
  };

  return (
    <View style={styles.container}>
      {imageUri ? (
        <View style={styles.previewContainer}>
          <Image 
            source={{ uri: imageUri }} 
            style={styles.preview}
            resizeMode="cover"
          />
          <TouchableOpacity 
            style={styles.removeButton}
            onPress={removeImage}
            disabled={uploading}
          >
            <X size={16} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity 
          style={styles.uploadButton}
          onPress={pickImage}
          disabled={uploading}
        >
          {uploading ? (
            <ActivityIndicator color="#5C0000" size="large" />
          ) : (
            <>
              <View style={styles.uploadIcon}>
                <ImageIcon size={32} color="#5C0000" />
              </View>
              <Text style={styles.uploadText}>Upload Image</Text>
              <Text style={styles.uploadSubtext}>Tap to select from gallery</Text>
            </>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  uploadButton: {
    backgroundColor: '#F6EEDD',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E5E5',
    borderStyle: 'dashed',
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 180,
  },
  uploadIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  uploadText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#3A3A3A',
    marginBottom: 4,
  },
  uploadSubtext: {
    fontSize: 14,
    color: '#8E8E93',
  },
  previewContainer: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#F6EEDD',
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  preview: {
    width: '100%',
    height: 200,
    backgroundColor: '#E5E5E5',
  },
  removeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#DC2626',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0 2px 4px rgba(0,0,0,0.25)',
      },
    }),
  },
});
