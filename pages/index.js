import { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { 
  Terminal, Server, Users, Trash2, LogOut, 
  ShieldAlert, Activity, Key, Loader2, Globe, Cpu
} from 'lucide-react';

export default function Home() {
  const [creds, setCreds] = useState(null);
  const [data, setData] = useState({ users: [], servers: [] });
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState('servers');

  useEffect(() => {
    const saved = localStorage.getItem('saturnz_creds');
    if (saved) setCreds(JSON.parse(saved));
  }, []);

  useEffect(() => {
    if (creds) fetchData();
  }, [creds]);

  const handleLogin = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const newCreds = {
      host: formData.get('host'),
      ptla: formData.get('ptla'),
      ptlc: formData.get('ptlc')
    };

    try {
      setLoading(true);
      await axios.post('/api/panel', { ...newCreds, action: 'check_connection' });
      localStorage.setItem('saturnz_creds', JSON.stringify(newCreds));
      setCreds(newCreds);
      Swal.fire({ icon: 'success', title: 'ACCESS GRANTED', background: '#000', color: '#06b6d4' });
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'CONNECTION REFUSED', text: 'Invalid Host or API Key', background: '#000', color: '#f87171' });
    }
    setLoading(false);
  };

  const logout = () => {
    localStorage.removeItem('saturnz_creds');
    setCreds(null);
  };

  const callApi = async (action, payload = {}) => {
    setLoading(true);
    try {
      const res = await axios.post('/api/panel', { ...creds, action, payload });
      if (action !== 'get_stats') {
        Swal.fire({ icon: 'success', title: 'SUCCESS', text: res.data.msg || 'Done', background: '#000', color: '#06b6d4', timer: 1500 });
        fetchData();
      } else {
        setData(res.data);
      }
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'ERROR', text: err.response?.data?.error || 'Operation Failed', background: '#000', color: '#f87171' });
    }
    setLoading(false);
  };

  const fetchData = () => callApi('get_stats');

  if (!creds) return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6 font-mono relative overflow-hidden text-white">
      {/* Background Glow */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-cyan-900/20 rounded-full blur-[120px]"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-blue-900/20 rounded-full blur-[120px]"></div>

      <div className="z-10 w-full max-w-md">
        <div className="bg-gray-900/40 backdrop-blur-2xl border border-white/10 p-8 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.5)]">
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-cyan-500/10 border border-cyan-500/30 rounded-2xl flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(6,182,212,0.2)]">
              <Terminal size={32} className="text-cyan-400" />
            </div>
            <h1 className="text-3xl font-black tracking-tighter text-white">SATURNZ<span className="text-cyan-500">-X</span></h1>
            <p className="text-gray-500 text-xs mt-1 tracking-widest uppercase">Pterodactyl Bypass Gateway</p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-[10px] text-cyan-500 uppercase font-bold ml-1">Panel Endpoint</label>
              <input name="host" required placeholder="https://panel.example.com" className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-sm focus:border-cyan-500/50 focus:outline-none transition-all placeholder:text-gray-700" />
            </div>
            <div>
              <label className="text-[10px] text-cyan-500 uppercase font-bold ml-1">Application Key (PTLA)</label>
              <input name="ptla" required placeholder="ptla_xxxxxxxx" className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-sm focus:border-cyan-500/50 focus:outline-none transition-all placeholder:text-gray-700" />
            </div>
            <div>
              <label className="text-[10px] text-gray-500 uppercase font-bold ml-1">Client Key (PTLC - Optional)</label>
              <input name="ptlc" placeholder="ptlc_xxxxxxxx" className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-sm focus:border-cyan-500/50 focus:outline-none transition-all placeholder:text-gray-700" />
            </div>
            
            <button type="submit" disabled={loading} className="w-full bg-cyan-500 hover:bg-cyan-400 text-black font-black py-4 rounded-xl transition-all flex justify-center items-center gap-2 mt-6 shadow-[0_0_20px_rgba(6,182,212,0.3)]">
              {loading ? <Loader2 className="animate-spin" /> : <Key size={18} />} ACCESS SYSTEM
            </button>
          </form>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#050505] text-gray-300 font-sans selection:bg-cyan-500 selection:text-black">
      <div className="fixed inset-0 pointer-events-none opacity-40">
         <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-purple-900/10 rounded-full blur-[120px]"></div>
         <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-cyan-900/10 rounded-full blur-[120px]"></div>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto p-4 md:p-10">
        <header className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6 bg-white/5 p-6 rounded-3xl border border-white/5 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-cyan-500/10 rounded-2xl border border-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.1)]">
              <Terminal className="text-cyan-400" size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white tracking-tighter">SATURNZ-X <span className="text-cyan-500 text-sm font-mono tracking-normal">MANAGER</span></h1>
              <div className="flex items-center gap-2 text-[10px] text-cyan-500 font-bold uppercase tracking-widest">
                <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse"></span>
                System Authorized
              </div>
            </div>
          </div>
          <div className="flex gap-3">
             <button onClick={() => callApi('delete_offline')} className="flex items-center gap-2 px-5 py-2.5 bg-white/5 border border-white/10 rounded-xl hover:bg-orange-500/10 hover:border-orange-500/50 hover:text-orange-400 transition-all text-xs font-bold uppercase tracking-wider">
               <Activity size={14} /> Prune Offline
             </button>
             <button onClick={logout} className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all">
               <LogOut size={18} />
             </button>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          <div className="group bg-gradient-to-br from-gray-900/50 to-black/50 border border-white/5 p-8 rounded-3xl hover:border-cyan-500/30 transition-all relative overflow-hidden">
            <Server className="absolute right-[-20px] bottom-[-20px] text-white/5 group-hover:text-cyan-500/10 transition-all" size={150} />
            <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">Active Nodes</p>
            <p className="text-6xl font-black text-white mt-2">{data.servers.length}</p>
          </div>
          <div className="group bg-gradient-to-br from-gray-900/50 to-black/50 border border-white/5 p-8 rounded-3xl hover:border-purple-500/30 transition-all relative overflow-hidden">
            <Users className="absolute right-[-20px] bottom-[-20px] text-white/5 group-hover:text-purple-500/10 transition-all" size={150} />
            <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">Database Users</p>
            <p className="text-6xl font-black text-white mt-2">{data.users.length}</p>
          </div>
        </div>

        <div className="bg-gray-900/30 border border-white/5 rounded-[40px] overflow-hidden backdrop-blur-xl">
          <div className="flex bg-black/20 p-2">
            <button onClick={() => setView('servers')} className={`flex-1 py-4 rounded-2xl text-xs font-black tracking-widest transition-all ${view === 'servers' ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/20' : 'text-gray-500 hover:text-white'}`}>SERVERS</button>
            <button onClick={() => setView('users')} className={`flex-1 py-4 rounded-2xl text-xs font-black tracking-widest transition-all ${view === 'users' ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/20' : 'text-gray-500 hover:text-white'}`}>USERS</button>
          </div>

          <div className="p-8">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-xl font-black text-white">MAPPING {view.toUpperCase()}</h3>
              <button onClick={view === 'servers' ? () => {} : () => {}} className="px-6 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-black tracking-widest uppercase">Create {view.slice(0, -1)}</button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-gray-500 text-[10px] uppercase tracking-[0.2em] border-b border-white/5">
                    <th className="pb-4 px-2">Identification</th>
                    <th className="pb-4 px-2">{view === 'servers' ? 'Label' : 'Email Address'}</th>
                    <th className="pb-4 px-2">Authority</th>
                    <th className="pb-4 px-2 text-right">Delete</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {(view === 'servers' ? data.servers : data.users).map((item) => (
                    <tr key={item.attributes.id} className="group hover:bg-white/[0.02] transition-all">
                      <td className="py-5 px-2 font-mono text-cyan-500 text-xs">#{item.attributes.id}</td>
                      <td className="py-5 px-2 font-bold text-white text-sm">
                        {view === 'servers' ? item.attributes.name : item.attributes.email}
                      </td>
                      <td className="py-5 px-2">
                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter ${item.attributes.root_admin ? 'bg-purple-500/20 text-purple-400' : 'bg-gray-800 text-gray-400'}`}>
                          {view === 'servers' ? `Node: ${item.attributes.node}` : (item.attributes.root_admin ? 'ROOT' : 'MEMBER')}
                        </span>
                      </td>
                      <td className="py-5 px-2 text-right">
                        {!(view === 'users' && item.attributes.root_admin) && (
                          <button onClick={() => callApi(view === 'servers' ? 'delete_server' : 'delete_user', { id: item.attributes.id })} className="p-2 text-gray-600 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100">
                            <Trash2 size={16} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        
        <div className="mt-10 text-center">
            <button onClick={() => callApi('nuke_all', { confirm: 'CONFIRM' })} className="text-[10px] font-black tracking-[0.3em] text-red-900 hover:text-red-500 transition-all uppercase">
              [ Initiate Terminal Wipeout Protocol ]
            </button>
        </div>
      </div>
    </div>
  );
}
