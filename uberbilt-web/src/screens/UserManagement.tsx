import { ShieldCheck, Key } from 'lucide-react';
import { useApp } from '../store';
import { GoogleIcon } from '../components/GoogleIcon';
import { IndustryAutocomplete } from '../components/IndustryAutocomplete';

export function UserManagement() {
  const { users, updateUserAccess, currentUser } = useApp();

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-col gap-1 px-4 py-6 md:px-8">
        <h1 className="text-2xl font-bold text-ink">User Management</h1>
        <p className="text-sm text-muted">Manage roles and access levels for all platform users.</p>
      </div>

      <div className="flex-1 overflow-auto p-4 md:p-8">
        <div className="mx-auto max-w-6xl">
          <div className="rounded-2xl border border-line bg-surface shadow-soft">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[13px]">
                <thead className="border-b border-line bg-canvas">
                  <tr>
                    <th className="px-6 py-4 font-semibold text-muted uppercase tracking-wider text-[11px]">User</th>
                    <th className="px-6 py-4 font-semibold text-muted uppercase tracking-wider text-[11px]">Provider</th>
                    <th className="px-6 py-4 font-semibold text-muted uppercase tracking-wider text-[11px]">Role</th>
                    <th className="px-6 py-4 font-semibold text-muted uppercase tracking-wider text-[11px]">Industry Access</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {users.map((user) => (
                    <tr key={user.id} className="transition-colors hover:bg-canvas/50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand/10 font-bold text-brand">
                            {user.name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-bold text-ink">{user.name}</p>
                              {user.isFixedAdmin && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-brand/15 px-1.5 py-0.5 text-[9px] font-bold uppercase text-brand">
                                  <ShieldCheck className="h-3 w-3" />
                                  Fixed
                                </span>
                              )}
                              {currentUser?.id === user.id && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-1.5 py-0.5 text-[9px] font-bold uppercase text-success">
                                  You
                                </span>
                              )}
                            </div>
                            <p className="text-[12px] font-mono text-muted">{user.email || 'N/A'}</p>
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4">
                        {user.authProvider === 'google' ? (
                          <div className="flex items-center gap-1.5 text-muted">
                            <GoogleIcon className="h-4 w-4" />
                            <span className="capitalize">{user.authProvider}</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-muted">
                            <Key className="h-4 w-4" />
                            <span className="capitalize">{user.authProvider || 'password'}</span>
                          </div>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        <select
                          disabled={user.isFixedAdmin}
                          value={user.role}
                          onChange={(e) => updateUserAccess(user.id, { role: e.target.value as any })}
                          className={`rounded-xl border border-line bg-canvas px-3 py-2 text-[13px] font-medium outline-none transition-colors ${
                            user.isFixedAdmin ? 'opacity-60 cursor-not-allowed' : 'focus:border-brand hover:border-line-hover'
                          }`}
                        >
                          <option value="operator">Operator</option>
                          <option value="supervisor">Supervisor</option>
                          <option value="service">Service Technician</option>
                          <option value="admin">Platform Admin</option>
                        </select>
                      </td>

                      <td className="px-6 py-4 align-top">
                        {user.isFixedAdmin || user.role === 'admin' ? (
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2 text-brand">
                              <ShieldCheck className="h-4 w-4" />
                              <span className="text-[13px] font-medium">Full Platform Access (Super Admin)</span>
                            </div>
                            <p className="text-[11px] text-muted">All industries and plants unlocked.</p>
                          </div>
                        ) : (
                          <IndustryAutocomplete user={user} />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
