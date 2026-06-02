// services/soundService.ts
import { Platform, PermissionsAndroid } from 'react-native';
import Sound from 'react-native-sound';

class SoundService {
  private soundRef: Sound | null = null;
  private soundLoaded: boolean = false;
  private soundError: string | null = null;

  async requestAndroidPermission(): Promise<boolean> {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
          {
            title: 'Storage Permission',
            message: 'App needs access to storage to play sounds',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn(err);
        return false;
      }
    }
    return true;
  }

  async loadSound(soundPath: string): Promise<boolean> {
    try {
      console.log('🔊 INITIALIZING REACT-NATIVE-SOUND...');

      const hasPermission = await this.requestAndroidPermission();
      if (!hasPermission && Platform.OS === 'android') {
        console.log('⚠️ Permission not granted, sound may not work');
      }

      if (Platform.OS === 'ios') {
        Sound.setCategory('Playback', true);
      }

      Sound.setActive(true);

      return new Promise(resolve => {
        const sound = new Sound(soundPath, error => {
          if (error) {
            console.log('❌ SOUND LOAD FAILED:', error);
            this.soundError = `Load failed: ${error.message}`;
            this.soundLoaded = false;
            resolve(false);
            return;
          }

          console.log('✅ SOUND LOADED SUCCESSFULLY');
          this.soundRef = sound;
          this.soundLoaded = true;
          this.soundError = null;
          resolve(true);
        });
      });
    } catch (error: any) {
      console.log('🔥 Audio setup crashed:', error);
      this.soundError = `Setup error: ${error.message}`;
      return false;
    }
  }

  playSound(): boolean {
    if (!this.soundRef || !this.soundLoaded) {
      console.log('❌ Sound not ready to play');
      return false;
    }

    try {
      this.soundRef.setCurrentTime(0);
      this.soundRef.play(success => {
        if (success) {
          console.log('✅ SOUND PLAYED SUCCESSFULLY!');
        } else {
          console.log('❌ SOUND PLAYBACK FAILED');
        }
      });
      return true;
    } catch (error: any) {
      console.log('💥 Exception in playSound:', error);
      this.soundError = `Playback exception: ${error.message}`;
      return false;
    }
  }

  releaseSound(): void {
    if (this.soundRef) {
      this.soundRef.release();
      this.soundRef = null;
      this.soundLoaded = false;
      console.log('✅ Sound released');
    }
  }

  isSoundLoaded(): boolean {
    return this.soundLoaded;
  }

  getSoundError(): string | null {
    return this.soundError;
  }
}

export default new SoundService();
