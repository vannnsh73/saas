import { useState, useEffect } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import api from '../api';

interface TeamMember {
  id: string;
  email: string;
  role: string;
  createdAt: string;
}

export default function Team() {
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('STAFF');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [tempPassword, setTempPassword] = useState('');

  async function fetchTeam() {
    try {
      const response = await api.get('/api/team');
      setTeam(response.data);
    } catch (error) {
      console.error('Failed to fetch team', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchTeam(); }, []);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setInviteLoading(true);
    try {
      const response = await api.post('/api/team/invite', { email: inviteEmail, role: inviteRole });
      setSuccessMsg(response.data.message);
      setTempPassword(response.data.tempPassword);
      setInviteEmail('');
      setInviteRole('STAFF');
      fetchTeam();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to invite member');
    } finally {
      setInviteLoading(false);
    }
  };

  const handleRemove = async (id: string, email: string) => {
    if (!confirm(`Remove ${email} from the workspace?`)) return;
    try {
      await api.delete(`/api/team/${id}`);
      setTeam(team.filter(m => m.id !== id));
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to remove member');
    }
  };

  const roleBadgeClass = (role: string) => {
    switch (role) {
      case 'OWNER': return 'bg-primary-container text-on-primary-container';
      case 'STAFF': return 'bg-secondary-container text-on-secondary-container';
      default: return 'bg-surface-variant text-on-surface-variant';
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-on-surface tracking-tight">Team Members</h1>
            <p className="text-sm text-on-surface-variant mt-1">Manage who has access to this workspace.</p>
          </div>
          <button
            onClick={() => { setShowModal(true); setError(''); setSuccessMsg(''); setTempPassword(''); }}
            className="px-4 py-2 bg-primary text-on-primary text-sm font-medium rounded-md hover:opacity-90 transition-opacity"
          >
            + Invite Member
          </button>
        </div>

        {/* Team Table */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-outline-variant">
            <thead className="bg-surface-container text-on-surface-variant text-xs uppercase font-medium tracking-wider">
              <tr>
                <th scope="col" className="px-6 py-3 text-left">Email</th>
                <th scope="col" className="px-6 py-3 text-left">Role</th>
                <th scope="col" className="px-6 py-3 text-left">Joined</th>
                <th scope="col" className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant text-sm text-on-surface">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-on-surface-variant">Loading team members...</td>
                </tr>
              ) : team.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-on-surface-variant">No team members yet. Invite someone!</td>
                </tr>
              ) : (
                team.map((member) => (
                  <tr key={member.id} className="hover:bg-surface-container-low transition-colors">
                    <td className="px-6 py-4">{member.email}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${roleBadgeClass(member.role)}`}>
                        {member.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-on-surface-variant">
                      {new Date(member.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleRemove(member.id, member.email)}
                        className="text-xs text-error hover:underline"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invite Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-inverse-surface/40">
          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-lg w-full max-w-md mx-4 p-6">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-lg font-semibold text-on-surface">Invite Team Member</h2>
              <button onClick={() => setShowModal(false)} className="text-on-surface-variant hover:text-on-surface text-xl leading-none">&times;</button>
            </div>

            {successMsg ? (
              <div className="space-y-3">
                <div className="p-3 rounded-md bg-secondary-container text-on-secondary-container text-sm">{successMsg}</div>
                {tempPassword && (
                  <div className="p-3 rounded-md bg-surface-container border border-outline-variant text-sm">
                    <p className="text-on-surface-variant text-xs mb-1 font-medium uppercase tracking-wider">Temp Password (Dev Only)</p>
                    <p className="font-mono text-on-surface font-bold">{tempPassword}</p>
                  </div>
                )}
                <button onClick={() => { setShowModal(false); setSuccessMsg(''); setTempPassword(''); }} className="w-full mt-2 px-4 py-2 bg-primary text-on-primary text-sm font-medium rounded-md">
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleInvite} className="space-y-4">
                {error && <div className="p-3 rounded-md bg-error-container text-on-error-container text-sm">{error}</div>}

                <div>
                  <label className="block text-xs font-medium text-on-surface-variant mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="colleague@company.com"
                    className="w-full px-3 py-2 border border-outline-variant rounded-md text-sm text-on-surface bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-on-surface-variant mb-1">Role</label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    className="w-full px-3 py-2 border border-outline-variant rounded-md text-sm text-on-surface bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="STAFF">Staff — Can create invoices &amp; customers</option>
                    <option value="VIEWER">Viewer — Read-only access</option>
                    <option value="OWNER">Owner — Full admin access</option>
                  </select>
                </div>

                <div className="flex gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-4 py-2 border border-outline-variant text-on-surface text-sm font-medium rounded-md hover:bg-surface-container transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={inviteLoading}
                    className="flex-1 px-4 py-2 bg-primary text-on-primary text-sm font-medium rounded-md hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    {inviteLoading ? 'Inviting...' : 'Send Invite'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

