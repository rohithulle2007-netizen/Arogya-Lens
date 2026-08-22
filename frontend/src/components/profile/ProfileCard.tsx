import React, { useState } from 'react';
import {
  User,
  Phone,
  Calendar,
  Activity,
  ClipboardCheck,
  Edit3,
  Heart,
  Shield,
  Clock,
  Sparkles,
} from 'lucide-react';
import { ProfileData, ProfileUpdateRequest, getStatusMeta } from '../../types/health';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { EditProfileModal } from './EditProfileModal';

interface ProfileCardProps {
  profile: ProfileData;
  onUpdateProfile: (updated: ProfileUpdateRequest) => Promise<void>;
}

export const ProfileCard: React.FC<ProfileCardProps> = ({ profile, onUpdateProfile }) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const statusMeta = getStatusMeta('possible_anemia', profile.latestEstimatedHb);

  // Format date nicely if ISO
  const formattedMemberSince = (() => {
    try {
      const d = new Date(profile.memberSince);
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
      }
    } catch {}
    return profile.memberSince;
  })();

  const formattedLastScreening = (() => {
    try {
      const d = new Date(profile.lastScreeningDate);
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
      }
    } catch {}
    return profile.lastScreeningDate;
  })();

  return (
    <div className="w-full space-y-4 text-left">
      {/* Top Banner Card with Avatar and Primary Demographics */}
      <Card className="relative overflow-hidden bg-gradient-to-br from-white to-teal-50/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* Avatar Initials Badge */}
            <div className="w-16 h-16 rounded-2xl bg-teal-600 text-white font-extrabold text-2xl flex items-center justify-center shadow-md shadow-teal-600/20 ring-4 ring-teal-50 flex-shrink-0">
              {profile.name
                .split(' ')
                .map((n) => n[0])
                .join('')
                .slice(0, 2)
                .toUpperCase() || 'U'}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-slate-900 tracking-tight">{profile.name}</h2>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 border border-teal-200">
                  Active Patient
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">{profile.mobile}</p>
              <div className="flex items-center gap-3 text-xs text-slate-600 mt-1.5 font-medium">
                <span>
                  <strong>{profile.age}</strong> yrs
                </span>
                <span className="text-slate-300">•</span>
                <span className="capitalize">
                  <strong>{profile.sex}</strong>
                </span>
                {profile.bloodGroup && (
                  <>
                    <span className="text-slate-300">•</span>
                    <span>
                      Blood: <strong>{profile.bloodGroup}</strong>
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditModalOpen(true)}
            leftIcon={<Edit3 className="w-3.5 h-3.5" />}
            className="self-start sm:self-center"
          >
            Edit Profile
          </Button>
        </div>
      </Card>

      {/* Profile Details List */}
      <Card className="divide-y divide-slate-100 p-0 overflow-hidden">
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
              <User className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Name
              </span>
              <span className="text-sm font-semibold text-slate-800">{profile.name}</span>
            </div>
          </div>
        </div>

        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
              <Phone className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Mobile
              </span>
              <span className="text-sm font-semibold text-slate-800">{profile.mobile}</span>
            </div>
          </div>
        </div>

        <div className="p-4 grid grid-cols-2 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
              <Heart className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Age
              </span>
              <span className="text-sm font-semibold text-slate-800">{profile.age} years</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Sex
              </span>
              <span className="text-sm font-semibold text-slate-800 capitalize">{profile.sex}</span>
            </div>
          </div>
        </div>

        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Member since
              </span>
              <span className="text-sm font-semibold text-slate-800">{formattedMemberSince}</span>
            </div>
          </div>
        </div>

        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
              <ClipboardCheck className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Total screenings
              </span>
              <span className="text-sm font-semibold text-slate-800">
                {profile.totalScreenings} screenings
              </span>
            </div>
          </div>
        </div>

        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Latest estimated Hb
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-base font-extrabold text-slate-900">
                  {profile.latestEstimatedHb.toFixed(1)}
                </span>
                <span className="text-xs font-bold text-slate-500">g/dL</span>
                <span className={`text-[10px] font-bold ml-1.5 px-2 py-0.5 rounded-full ${statusMeta.bgColor} ${statusMeta.textColor}`}>
                  {statusMeta.label}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Last screening
              </span>
              <span className="text-sm font-semibold text-slate-800">{formattedLastScreening}</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Edit Profile Modal */}
      <EditProfileModal
        profile={profile}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={onUpdateProfile}
      />
    </div>
  );
};
