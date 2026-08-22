import { ImageQualityResult, ScreeningResultData } from '../../types/screening';

export type MockQualityMode = 'good' | 'poor';
export type MockConfidenceMode = 'high' | 'medium' | 'low';

class MockScreeningEngine {
  private qualityMode: MockQualityMode = 'good';
  private confidenceMode: MockConfidenceMode = 'high';

  setQualityMode(mode: MockQualityMode) {
    this.qualityMode = mode;
  }

  setConfidenceMode(mode: MockConfidenceMode) {
    this.confidenceMode = mode;
  }

  getQualityMode(): MockQualityMode {
    return this.qualityMode;
  }

  getConfidenceMode(): MockConfidenceMode {
    return this.confidenceMode;
  }

  async checkImageQuality(_imageBase64: string): Promise<ImageQualityResult> {
    // Realistic analysis delay (1.2s)
    await new Promise((res) => setTimeout(res, 1200));

    if (this.qualityMode === 'poor') {
      return {
        image_quality: 'poor',
        quality_score: 0.42,
        checks: {
          eye_visible: true,
          sharpness: false,
          lighting: false,
          conjunctiva_visible: false,
        },
        message: 'Image is too blurry or lighting is insufficient to resolve the palpebral conjunctiva.',
      };
    }

    return {
      image_quality: 'good',
      quality_score: 0.91,
      checks: {
        eye_visible: true,
        sharpness: true,
        lighting: true,
        conjunctiva_visible: true,
      },
      message: 'Optimal image quality captured with clear conjunctiva exposure.',
    };
  }

  async analyzeScreening(
    _imageBase64: string,
    symptoms: string[] = ['Fatigue', 'Dizziness']
  ): Promise<ScreeningResultData> {
    // Realistic AI inference latency (1.5s)
    await new Promise((res) => setTimeout(res, 1500));

    const screeningId = Math.floor(100000 + Math.random() * 900000);

    if (this.confidenceMode === 'low') {
      return {
        screening_id: screeningId,
        estimated_hb: 11.2,
        confidence: 0.48,
        status: 'possible_anemia',
        image_quality: 'poor',
        reported_symptoms: symptoms,
        created_at: new Date().toISOString(),
      };
    }

    if (this.confidenceMode === 'medium') {
      return {
        screening_id: screeningId,
        estimated_hb: 11.5,
        confidence: 0.68,
        status: 'possible_anemia',
        image_quality: 'good',
        reported_symptoms: symptoms,
        created_at: new Date().toISOString(),
      };
    }

    // High confidence default
    return {
      screening_id: screeningId,
      estimated_hb: 10.8,
      confidence: 0.86,
      status: 'possible_anemia',
      image_quality: 'good',
      reported_symptoms: symptoms,
      created_at: new Date().toISOString(),
    };
  }
}

export const mockScreeningService = new MockScreeningEngine();
