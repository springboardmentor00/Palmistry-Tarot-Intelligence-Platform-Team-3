import React, { useState } from 'react';
import { UserProfile, UserRole } from '../../types';
import { INITIAL_USERS, INITIAL_ANALYTICS } from '../../data/mockDatabase';
import { 
  ShieldAlert, 
  Users, 
  Activity, 
  Server, 
  BarChart3, 
  UserCheck, 
  CheckCircle2, 
  Lock, 
  Clock, 
  Download,
  Search
} from 'lucide-react';

interface AdminDashboardProps {
  currentUser: UserProfile;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ currentUser }) => {
  const [userList, setUserList] = useState<UserProfile[]>(INITIAL_USERS);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const handleRoleChange = (userId: string, newRole: UserRole) => {
    setUserList(userList.map(u => u.id === userId ? { ...u, role: newRole } : u));
  };

  const filteredUsers = userList.filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 text-slate-100">
      
      {/* Admin Header */}
      <div className="bg-gradient-to-r from-amber-950 via-slate-900 to-amber-950 border border-amber-800/60 rounded-2xl p-6 shadow-xl flex items-center justify-between">
        <div>
          <div className="text-xs uppercase font-bold text-amber-300 tracking-wider">System Command Center</div>
          <h2 className="text-2xl font-bold text-white">Platform Administration</h2>
          <p className="text-xs text-slate-300 mt-1">
            Manage user roles, platform performance metrics, computer vision pipeline latency, and reading analytics.
          </p>
        </div>

        <div className="p-3 bg-amber-900/40 border border-amber-700/60 rounded-xl text-xs text-center shrink-0">
          <div className="text-xl font-bold text-emerald-400">99.98%</div>
          <div className="text-[10px] text-amber-200">System Uptime</div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1">
          <div className="text-xs text-slate-400 uppercase font-semibold">Total Platform Readings</div>
          <div className="text-2xl font-black text-white font-mono">{INITIAL_ANALYTICS.totalReadingsCount.toLocaleString()}</div>
          <div className="text-[10px] text-emerald-400 font-semibold">↑ +1,240 this week</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1">
          <div className="text-xs text-slate-400 uppercase font-semibold">Active User Base</div>
          <div className="text-2xl font-black text-amber-400 font-mono">{INITIAL_ANALYTICS.activeUsersCount.toLocaleString()}</div>
          <div className="text-[10px] text-slate-400">4 User Roles Active</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1">
          <div className="text-xs text-slate-400 uppercase font-semibold">API Latency</div>
          <div className="text-2xl font-black text-indigo-400 font-mono">{INITIAL_ANALYTICS.avgResponseTimeMs} ms</div>
          <div className="text-[10px] text-emerald-400 font-semibold">Fast Response</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1">
          <div className="text-xs text-slate-400 uppercase font-semibold">Satisfaction Score</div>
          <div className="text-2xl font-black text-emerald-400 font-mono">{INITIAL_ANALYTICS.avgSatisfactionScore} / 5.0</div>
          <div className="text-[10px] text-slate-400">Validated Reviews</div>
        </div>

      </div>

      {/* User Management & Role Control Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-base text-white">User Management & Role Permissions (RBAC)</h3>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search user or email..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                <th className="py-2.5 px-3">User</th>
                <th className="py-2.5 px-3">Email</th>
                <th className="py-2.5 px-3">Current Role</th>
                <th className="py-2.5 px-3">Modify Role</th>
                <th className="py-2.5 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredUsers.map((usr) => (
                <tr key={usr.id} className="hover:bg-slate-850/60 transition-colors">
                  <td className="py-3 px-3 font-semibold text-white flex items-center space-x-2">
                    <img src={usr.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&q=80'} alt="" className="w-7 h-7 rounded-lg object-cover" />
                    <span>{usr.name}</span>
                  </td>
                  <td className="py-3 px-3 text-slate-300 font-mono">{usr.email}</td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded border text-[10px] font-bold uppercase bg-slate-800 border-slate-700 text-amber-300">
                      {usr.role}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <select
                      value={usr.role}
                      onChange={(e) => handleRoleChange(usr.id, e.target.value as UserRole)}
                      className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                    >
                      <option value="user">User (Seeker)</option>
                      <option value="reader">Tarot Reader</option>
                      <option value="consultant">Spiritual Consultant</option>
                      <option value="admin">Administrator</option>
                    </select>
                  </td>
                  <td className="py-3 px-3 text-emerald-400 font-medium">Active</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
