import { ProfileData, ProfileUpdateRequest } from '../../types/health';

/**
 * In-memory / Session-backed mock profile service for Arogya Lens
 */
class MockProfileService {
  private STORAGE_KEY = 'arogya_mock_profile_v2';

  private defaultProfile: ProfileData = {
    id: 'usr_849201',
    name: 'Priya Sharma',
    mobile: '+91 98765 43210',
    age: 21,
    sex: 'female',
    memberSince: '21 Aug 2026',
    totalScreenings: 4,
    latestEstimatedHb: 10.8,
    lastScreeningDate: '21 Aug 2026',
    email: 'priya.sharma@example.com',
    bloodGroup: 'B+',
    createdAt: '2026-08-21T09:00:00Z',
    updatedAt: '2026-08-21T14:30:00Z',
  };

  private getStoredProfile(): ProfileData {
    try {
      const stored = sessionStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // ignore storage error
    }
    return { ...this.defaultProfile };
  }

  private saveProfile(profile: ProfileData): void {
    try {
      sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify(profile));
    } catch {
      // ignore storage error
    }
  }

  async getProfile(): Promise<ProfileData> {
    await new Promise((res) => setTimeout(res, 250)); // simulate brief network latency
    return this.getStoredProfile();
  }

  async updateProfile(updates: ProfileUpdateRequest): Promise<ProfileData> {
    await new Promise((res) => setTimeout(res, 350));
    const current = this.getStoredProfile();
    const updated: ProfileData = {
      ...current,
      name: updates.name !== undefined ? updates.name.trim() : current.name,
      age: updates.age !== undefined ? Number(updates.age) : current.age,
      sex: updates.sex !== undefined ? updates.sex : current.sex,
      mobile: updates.mobile !== undefined ? updates.mobile.trim() : current.mobile,
      email: updates.email !== undefined ? updates.email.trim() : current.email,
      bloodGroup: updates.bloodGroup !== undefined ? updates.bloodGroup.trim() : current.bloodGroup,
      updatedAt: new Date().toISOString(),
    };
    this.saveProfile(updated);
    return updated;
  }

  async updateScreeningStats(totalScreenings: number, latestHb: number, lastDate: string): Promise<void> {
    const current = this.getStoredProfile();
    const updated: ProfileData = {
      ...current,
      totalScreenings,
      latestEstimatedHb: latestHb,
      lastScreeningDate: lastDate,
      updatedAt: new Date().toISOString(),
    };
    this.saveProfile(updated);
  }
}

export const mockProfileService = new MockProfileService();
