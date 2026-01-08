import { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { 
  Terminal, Server, Users, Trash2, LogOut, 
  ShieldAlert, Activity, Key, Loader2, Search, X, Zap, Cpu, Globe, Rocket, Hash
} from 'lucide-react';

export default function Home() {
  const [creds, setCreds] = useState(null);
  const [data, setData] = useState({ users: [], servers: [], total_users: 0, total_servers: 0 });
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState('servers');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('saturnz_creds');
    if (saved) setCreds(JSON.parse(saved));
  }, []);

  useEffect(() => {
    if (creds) fetchData();
  }, [creds]);

  const fetchData = () => callApi('get_stats');

  const callApi = async (action, payload = {}) => {
    setLoading(true);
    try {
      const res = await axios.post('/api/panel', { ...creds, action, payload });
      if (action !== 'get_stats') {
        fetchData();
        return res.data;
      } else {
        setData(res.data);
      }
    } catch (err) {
      Swal.fire({ 
        icon: 'error', 
        title: 'SYSTEM ERROR', 
        text: err.response?.data?.detail || err.message, 
        background: '#050505', 
        color: '#f87171' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const newCreds = { host: formData.get('host'), ptla: formData.get('ptla'), ptlc: formData.get('ptlc') };

    try {
      setLoading(true);
      await axios.post('/api/panel', { ...newCreds, action: 'check_connection' });
      localStorage.setItem('saturnz_creds', JSON.stringify(newCreds));
      setCreds(newCreds);
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'ACCESS DENIED', text: 'Invalid Host/Keys', background: '#050505', color: '#f87171' });
    } finally {
      setLoading(false);
    }
  };

  const logout = () => { localStorage.removeItem('saturnz_creds'); setCreds(null); };

  const handleAutoDeploy = async () => {
    const { value: formValues } = await Swal.fire({
      title: 'QUICK DEPLOYMENT',
      html:
        '<div style="text-align:left; color:#a5f3fc; font-size:12px; font-weight:bold; margin-bottom:5px;">USERNAME</div>' +
        '<input id="sw-user" class="swal2-input" placeholder="ex: saturnz" style="background:#0f172a; color:#fff; border:1px solid #334155; margin:0; width:100%; box-sizing:border-box;">' +
        '<div style="text-align:left; color:#a5f3fc; font-size:12px; font-weight:bold; margin-top:15px; margin-bottom:5px;">PASSWORD</div>' +
        '<input id="sw-pass" class="swal2-input" type="password" placeholder="••••••" style="background:#0f172a; color:#fff; border:1px solid #334155; margin:0; width:100%; box-sizing:border-box;">',
      background: '#020617',
      color: '#fff',
      showCancelButton: true,
      confirmButtonText: 'IGNITE ENGINE',
      confirmButtonColor: '#0891b2',
      cancelButtonColor: '#334155',
      preConfirm: () => {
        const username = document.getElementById('sw-user').value;
        const password = document.getElementById('sw-pass').value;
        if (!username || !password) return Swal.showValidationMessage('Credentials Missing');
        return { username, password };
      }
    });

    if (formValues) {
      const result = await callApi('auto_deploy', formValues);
      if (result) {
        navigator.clipboard.writeText(result.detail);
        Swal.fire({ icon: 'success', title: 'UPLINK SUCCESS', text: 'Credentials copied to clipboard.', background: '#020617', color: '#22d3ee', toast: true, position: 'top-end', timer: 4000, showConfirmButton: false });
      }
    }
  };

  const handlePrune = () => {
    if (!creds.ptlc) return Swal.fire({ icon: 'error', title: 'PTLC MISSING', text: 'Client API Key required.', background: '#050505', color: '#f87171' });
    Swal.fire({ title: 'PRUNE SYSTEM?', text: 'Destroy all dead/offline nodes permanently?', icon: 'warning', showCancelButton: true, confirmButtonColor: '#ea580c', confirmButtonText: 'CLEANUP', background: '#020617', color: '#fff' }).then(async (result) => {
      if (result.isConfirmed) {
        const res = await callApi('delete_offline');
        if (res) Swal.fire({ title: 'LOG REPORT', text: res.msg, icon: 'success', background: '#020617', color: '#22d3ee' });
      }
    });
  };

  const filteredItems = (view === 'servers' ? data.servers : data.users).filter(item => {
    const name = view === 'servers' ? item.attributes.name : item.attributes.email;
    return name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const Background = () => (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden bg-[#020617]">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:40px_40px] opacity-10"></div>
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[100px] animate-pulse"></div>
    </div>
  );

  if (!creds) return (
    <div className="min-h-screen flex items-center justify-center font-sans relative text-white bg-[#020617]">
      <Background />
      <div className="w-full max-w-md bg-white/5 backdrop-blur-2xl border border-white/10 p-10 rounded-3xl shadow-2xl relative z-10 mx-4">
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="w-16 h-16 bg-gradient-to-tr from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(6,182,212,0.5)]">
            <Terminal size={32} />
          </div>
          <h1 className="text-3xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 uppercase">Saturnz Connect</h1>
        </div>
        <form onSubmit={handleLogin} className="space-y-5">
          <input name="host" required placeholder="Endpoint URL" className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:border-cyan-500 outline-none transition-all" />
          <input name="ptla" required placeholder="Application PTLA" className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:border-cyan-500 outline-none transition-all" />
          <input name="ptlc" placeholder="Client PTLC (Optional)" className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:border-cyan-500 outline-none transition-all" />
          <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 font-bold py-4 rounded-xl transition-all shadow-lg shadow-cyan-900/20 uppercase tracking-widest text-xs">
            {loading ? <Loader2 className="animate-spin inline mr-2" /> : 'Establish Uplink'}
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen text-slate-300 font-sans relative overflow-hidden flex flex-col bg-[#020617]">
      <Background />
      <nav className="relative z-10 border-b border-white/5 bg-slate-950/50 backdrop-blur-md sticky top-0">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
           <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-cyan-500/10 rounded-lg flex items-center justify-center border border-cyan-500/20 text-cyan-400">
                <Terminal size={20} />
              </div>
              <h1 className="text-xl font-black text-white tracking-tight uppercase">Saturnz-X</h1>
           </div>
           <div className="flex gap-2 flex-wrap justify-center">
              <button onClick={handleAutoDeploy} className="flex items-center gap-2 px-5 py-2.5 bg-cyan-500 text-black rounded-lg hover:bg-cyan-400 transition-all text-xs font-black uppercase tracking-wider shadow-[0_0_15px_rgba(6,182,212,0.4)]">
                 <Rocket size={14} /> Ignite Server
              </button>
              <button onClick={handlePrune} className="flex items-center gap-2 px-5 py-2.5 bg-orange-600 text-white rounded-lg hover:bg-orange-500 transition-all text-xs font-black uppercase tracking-wider">
                 <Activity size={14} /> Prune System
              </button>
              <button onClick={() => Swal.fire({title:'ERASE ALL?', icon:'warning', showCancelButton:true, confirmButtonColor:'#d33', background:'#000', color:'#fff'}).then(r => r.isConfirmed && callApi('nuke_all', {confirm:'CONFIRM'}))} className="px-5 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-500 transition-all text-xs font-black uppercase">
                 Nuke Panel
              </button>
              <button onClick={logout} className="p-2.5 bg-slate-800 text-slate-400 rounded-lg hover:bg-white hover:text-black transition-all">
                 <LogOut size={16} />
              </button>
           </div>
        </div>
      </nav>

      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-6 backdrop-blur-sm flex items-center justify-between group hover:border-cyan-500/30 transition-all">
              <div>
                 <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total Servers</p>
                 {/* Ini angka total fisik server yang ada */}
                 <p className="text-5xl font-black text-white mt-1 group-hover:text-cyan-400 transition-colors">{data.total_servers || 0}</p>
              </div>
              <Cpu size={48} className="text-slate-700 group-hover:text-cyan-500/20 transition-all" />
           </div>
           <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-6 backdrop-blur-sm flex items-center justify-between group hover:border-purple-500/30 transition-all">
              <div>
                 <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Database Users</p>
                 <p className="text-5xl font-black text-white mt-1 group-hover:text-purple-400 transition-colors">{data.total_users || 0}</p>
              </div>
              <Users size={48} className="text-slate-700 group-hover:text-purple-500/20 transition-all" />
           </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4 items-center">
           <div className="bg-slate-900/60 p-1.5 rounded-xl flex gap-1 border border-white/5">
              <button onClick={() => setView('servers')} className={`px-8 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${view==='servers' ? 'bg-cyan-600 text-white' : 'text-slate-500'}`}>Servers</button>
              <button onClick={() => setView('users')} className={`px-8 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${view==='users' ? 'bg-cyan-600 text-white' : 'text-slate-500'}`}>Users</button>
           </div>
           <div className="flex-1 w-full relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
              <input type="text" placeholder={`Scan registry for ${view}...`} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-slate-900/50 border border-white/5 rounded-xl py-3.5 pl-12 pr-4 text-sm outline-none focus:border-cyan-500/50 transition-all" />
           </div>
        </div>

        <div className="bg-slate-950/40 border border-white/5 rounded-3xl overflow-hidden backdrop-blur-md">
           <div className="overflow-x-auto">
             <table className="w-full text-left border-collapse">
               <thead>
                 <tr className="bg-white/5 text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] border-b border-white/5">
                   <th className="p-5">No.</th> {/* Nomor urut buat lu cek akurasi */}
                   <th className="p-5">Node ID</th> {/* ID asli dari Panel */}
                   <th className="p-5">Designation</th>
                   <th className="p-5 text-right">Operation</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-white/5 text-sm">
                 {filteredItems.map((item, index) => (
                   <tr key={item.attributes.id} className="group hover:bg-white/[0.02] transition-colors">
                     {/* Nomor urut 1, 2, 3... */}
                     <td className="p-5 font-bold text-slate-500 text-xs">{index + 1}</td>
                     {/* ID asli database #1, #2, #5, #30... */}
                     <td className="p-5 font-mono text-cyan-500 text-xs tracking-tighter">#{item.attributes.id}</td>
                     <td className="p-5 font-bold text-white uppercase text-xs tracking-wide">
                        {view === 'servers' ? item.attributes.name : item.attributes.email}
                     </td>
                     <td className="p-5 text-right">
                       <button onClick={() => callApi(view === 'servers' ? 'delete_server' : 'delete_user', { id: item.attributes.id })} className="p-2 text-slate-700 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100">
                         <Trash2 size={16} />
                       </button>
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>
        </div>
      </main>
    </div>
  );
}
