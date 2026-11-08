/**
 * SoundEqualizerEngine
 * Studio Equalizer volume and dynamic gain compensator.
 * Modulates volume levels based on selected preset (Night Mode, Bass Heavy, Vocals, etc.)
 * without generating synthetic background noise or oscillators.
 */

class SoundEqualizerEngine {
  constructor() {
    this.activePreset = 'flat';
    this.gains = { band60: 0, band250: 0, band1k: 0, band4k: 0, band16k: 0 };
  }

  updateProfile({ preset, gains } = {}) {
    this.activePreset = preset || 'flat';
    this.gains = gains || { band60: 0, band250: 0, band1k: 0, band4k: 0, band16k: 0 };
  }

  /**
   * Calculates player volume compensation based on active EQ faders and presets
   */
  getCompensatedVolume(baseVolume) {
    const vol = Math.max(0, Math.min(100, Number(baseVolume) || 75));
    if (this.activePreset === 'night') {
      return Math.round(vol * 0.82);
    }
    if (this.activePreset === 'bass_heavy') {
      return Math.min(100, Math.round(vol * 1.07));
    }
    if (this.activePreset === 'vocals') {
      return Math.min(100, Math.round(vol * 1.04));
    }
    if (this.activePreset === 'acoustic') {
      return Math.min(100, Math.round(vol * 1.03));
    }

    const totalBoost =
      (Number(this.gains.band60 || 0) * 1.2 +
        Number(this.gains.band250 || 0) * 0.8 +
        Number(this.gains.band1k || 0) * 0.5 +
        Number(this.gains.band4k || 0) * 0.5 +
        Number(this.gains.band16k || 0) * 0.3) /
      30;

    const adjusted = Math.round(vol * (1 + totalBoost * 0.12));
    return Math.max(5, Math.min(100, adjusted));
  }
}

export const soundEqualizerEngine = new SoundEqualizerEngine();
export default soundEqualizerEngine;
