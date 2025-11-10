import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, ActivityIndicator, Modal, ScrollView } from 'react-native';
import { Mic, X, CheckCircle } from 'lucide-react-native';
import { Audio } from 'expo-av';
import { Colors } from '@/constants/colors';


interface VoiceOrderButtonProps {
  onTranscript: (text: string) => void;
}

export default function VoiceOrderButton({ onTranscript }: VoiceOrderButtonProps) {
  const recordingRef = useRef<Audio.Recording | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [transcript, setTranscript] = useState<string>('');
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const prepareAudio = async () => {
      if (Platform.OS === 'web') {
        return;
      }

      try {
        const { status } = await Audio.requestPermissionsAsync();
        if (status !== 'granted' && !cancelled) {
          alert('Microphone permission is required for voice orders.');
        }

        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
        });
      } catch (error) {
        console.error('Failed to configure audio recording', error);
      }
    };

    prepareAudio();

    return () => {
      cancelled = true;
      const activeRecording = recordingRef.current;
      if (activeRecording) {
        activeRecording.stopAndUnloadAsync().catch(() => undefined);
        recordingRef.current = null;
      }
      const activeMediaRecorder = mediaRecorderRef.current;
      if (activeMediaRecorder && activeMediaRecorder.state === 'recording') {
        activeMediaRecorder.stop();
      }
    };
  }, []);

  const startRecordingMobile = async () => {
    try {
      console.log('Starting recording...');
      const recording = recordingRef.current;
      if (recording) {
        await recording.stopAndUnloadAsync().catch(() => undefined);
      }

      const { recording: freshRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      recordingRef.current = freshRecording;
      setIsRecording(true);
      console.log('Recording started');
    } catch (err) {
      console.error('Failed to start recording', err);
      alert('Failed to start recording');
    }
  };

  const stopRecordingMobile = async () => {
    try {
      console.log('Stopping recording...');
      const recording = recordingRef.current;
      if (!recording) {
        return;
      }

      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      recordingRef.current = null;
      setIsRecording(false);
      console.log('Recording stopped, stored at', uri);

      if (uri) {
        await processAudio(uri);
      }
    } catch (err) {
      console.error('Failed to stop recording', err);
    }
  };

  const startRecordingWeb = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const audioChunks: Blob[] = [];

      recorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        stream.getTracks().forEach(track => track.stop());
        await processAudioBlob(audioBlob);
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setMediaRecorder(recorder);
      console.log('Web recording started');
    } catch (err) {
      console.error('Failed to start web recording', err);
      alert('Failed to access microphone');
    }
  };

  const stopRecordingWeb = () => {
    const activeMediaRecorder = mediaRecorderRef.current;
    if (activeMediaRecorder && activeMediaRecorder.state === 'recording') {
      activeMediaRecorder.stop();
      mediaRecorderRef.current = null;
      setMediaRecorder(null);
      console.log('Web recording stopped');
    }
  };

  const processAudioBlob = async (blob: Blob) => {
    setIsProcessing(true);

    try {
      const formData = new FormData();
      formData.append('audio', blob, 'recording.webm');

      const response = await fetch('https://toolkit.rork.com/stt/transcribe/', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Transcription failed');
      }

      const data = await response.json();
      console.log('Transcription:', data.text);
      
      setTranscript(data.text);
      setShowModal(true);
      onTranscript(data.text);
    } catch (error) {
      console.error('Error processing audio:', error);
      alert('Failed to transcribe audio');
    } finally {
      setIsProcessing(false);
    }
  };

  const processAudio = async (uri: string) => {
    setIsProcessing(true);

    try {
      const uriParts = uri.split('.');
      const fileType = uriParts[uriParts.length - 1];

      const formData = new FormData();
      const audioFile = {
        uri,
        name: `recording.${fileType}`,
        type: `audio/${fileType}`,
      } as any;

      formData.append('audio', audioFile);

      const response = await fetch('https://toolkit.rork.com/stt/transcribe/', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Transcription failed');
      }

      const data = await response.json();
      console.log('Transcription:', data.text);
      
      setTranscript(data.text);
      setShowModal(true);
      onTranscript(data.text);
    } catch (error) {
      console.error('Error processing audio:', error);
      alert('Failed to transcribe audio');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePress = async () => {
    const recordingActive = Platform.OS === 'web'
      ? mediaRecorder?.state === 'recording'
      : isRecording;

    if (recordingActive) {
      if (Platform.OS === 'web') {
        stopRecordingWeb();
      } else {
        await stopRecordingMobile();
      }
    } else {
      if (Platform.OS === 'web') {
        await startRecordingWeb();
      } else {
        await startRecordingMobile();
      }
    }
  };

  return (
    <>
      <TouchableOpacity
        style={[
          styles.button,
          (Platform.OS === 'web' ? mediaRecorder?.state === 'recording' : isRecording) && styles.buttonRecording,
          isProcessing && styles.buttonDisabled,
        ]}
        onPress={handlePress}
        disabled={isProcessing}
      >
        {isProcessing ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Mic size={20} color="#fff" />
        )}
        <Text style={styles.buttonText}>
          {isProcessing
            ? 'Processing...'
            : (Platform.OS === 'web' ? mediaRecorder?.state === 'recording' : isRecording)
            ? 'Stop Recording'
            : 'Voice Order'}
        </Text>
      </TouchableOpacity>

      <Modal
        visible={showModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <CheckCircle size={32} color={Colors.success} />
              <Text style={styles.modalTitle}>Voice Order Captured</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <X size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              <Text style={styles.transcriptText}>{transcript}</Text>
            </ScrollView>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setShowModal(false)}
            >
              <Text style={styles.modalButtonText}>Continue</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  buttonRecording: {
    backgroundColor: '#ef4444',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700' as const,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: Colors.background,
    borderRadius: 20,
    width: '100%',
    maxWidth: 500,
    maxHeight: '80%',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: Colors.text,
    flex: 1,
  },
  modalBody: {
    padding: 20,
    maxHeight: 300,
  },
  transcriptText: {
    fontSize: 16,
    lineHeight: 24,
    color: Colors.text,
  },
  modalButton: {
    backgroundColor: Colors.primary,
    padding: 16,
    margin: 20,
    marginTop: 0,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700' as const,
  },
});
