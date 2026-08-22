import { apiRequest, USE_MOCK } from './apiClient';
import { ProfileData, ProfileUpdateRequest, SexType } from '../../types/health';
import { mockProfileService } from '../mocks/mockProfileService';

export const profileService = {
  /**
   * Fetch current user profile
   * GET /api/users/me & /api/users/me/summary
   */
  async getProfile(): Promise<ProfileData> {
    if (USE_MOCK) {
      return mockProfileService.getProfile();
    }

    const userRes = await apiRequest<any>('/api/users/me');
    if (userRes.error || !userRes.data) {
      // Try alias
      const aliasRes = await apiRequest<any>('/api/profile');
      if (aliasRes.error || !aliasRes.data) {
        throw new Error(userRes.error || 'Failed to fetch user profile');
      }
      userRes.data = aliasRes.data;
    }

    const userData = userRes.data;
    let summaryData: any = {};
    try {
      const summaryRes = await apiRequest<any>('/api/users/me/summary');
      if (summaryRes.data) {
        summaryData = summaryRes.data;
      }
    } catch {
      // Summary optional if no checkups yet
    }

    const createdDate = userData.created_at ? new Date(userData.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recent';
    const lastDate = summaryData.latest_screening_date ? new Date(summaryData.latest_screening_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : createdDate;

    return {
      id: String(userData.id),
      name: userData.name || 'User',
      mobile: userData.mobile_number || userData.mobile || '',
      age: Number(userData.age) || 25,
      sex: (userData.sex as SexType) || 'female',
      memberSince: createdDate,
      totalScreenings: summaryData.total_screenings ?? 0,
      latestEstimatedHb: summaryData.latest_estimated_hb ?? 0,
      lastScreeningDate: lastDate,
      email: userData.email,
      bloodGroup: userData.blood_group,
    };
  },

  /**
   * Update profile data
   * PUT /api/users/me
   */
  async updateProfile(payload: ProfileUpdateRequest): Promise<ProfileData> {
    if (USE_MOCK) {
      return mockProfileService.updateProfile(payload);
    }

    const body: any = {};
    if (payload.name) body.name = payload.name;
    if (payload.age) body.age = Number(payload.age);
    if (payload.sex) body.sex = payload.sex;

    const res = await apiRequest<any>('/api/users/me', {
      method: 'PUT',
      body: JSON.stringify(body),
    });

    if (res.error || !res.data) {
      throw new Error(res.error || 'Failed to update user profile');
    }

    return this.getProfile();
  },
};
