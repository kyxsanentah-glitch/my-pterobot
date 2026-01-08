import { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { 
  Terminal, Server, Users, Trash2, LogOut, 
  ShieldAlert, Activity, Key, Loader2, Search, X, Zap, Copy, Cpu, Globe
} from 'lucide-react';

export default function Home() {
  const [creds, setCreds] = useState(null);
  const [data, setData] = useState({ users: [], servers: [] });
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState('servers');
  const [searchTerm, setSearchTerm] = useState('');

  // --- INIT DATA ---
  useEffect(() => {
    const saved = localStorage.getItem('saturnz_creds');
    if (saved) setCreds(JSON.parse(saved));
  }, []);

  useEffect(() => {
    if (creds) fetchData();
  }, [creds]);

  const fetchData = () => callApi('get_stats');

  // --- API HANDLER ---
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
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'ACCESS DENIED', text: 'Invalid Host/Keys', background: '#050505', color: '#f87171' });
    } finally {
      setLoading(false);
    }
  };

  const logout = () => { localStorage.removeItem('saturnz_creds'); setCreds(null); };

  // --- ACTIONS ---
  const handleAutoDeploy = async () => {
    const { value: formValues } = await Swal.fire({
      title: 'DEPLOY NODE.JS',
      html:
        '<div style="text-align:left; color:#a5f3fc; font-size:12px; font-weight:bold; margin-bottom:5px;">USERNAME</div>' +
        '<input id="sw-user" class="swal2-input" placeholder="ex: saturnz" style="background:#0f172a; color:#fff; border:1px solid #334155; margin:0; width:100%; box-sizing:border-box;">' +
        '<div style="text-align:left; color:#a5f3fc; font-size:12px; font-weight:bold; margin-top:15px; margin-bottom:5px;">PASSWORD</div>' +
        '<input id="sw-pass" class="swal2-input" type="password" placeholder="••••••" style="background:#0f172a; color:#fff; border:1px solid #334155; margin:0; width:100%; box-sizing:border-box;">',
      background: '#020617',
      color: '#fff',
      showCancelButton: true,
      confirmButtonText: 'LAUNCH INSTANCE',
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
        Swal.fire({
          icon: 'success',
          title: 'DEPLOYED',
          text: 'Credentials copied to clipboard.',
          background: '#020617',
          color: '#22d3ee',
          toast: true,
          position: 'top-end',
          timer: 4000,
          showConfirmButton: false,
          timerProgressBar: true
        });
      }
    }
  };

  const handlePrune = () => {
    if (!creds.ptlc) return Swal.fire({ icon: 'error', title: 'PTLC MISSING', text: 'Client API Key required.', background: '#050505', color: '#f87171' });

    Swal.fire({
      title: 'PRUNE OFFLINE?',
      text: 'This will destroy all offline servers permanently.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ea580c',
      cancelButtonColor: '#334155',
      confirmButtonText: 'START SCAN',
      background: '#020617',
      color: '#fff'
    }).then(async (result) => {
      if (result.isConfirmed) {
        const res = await callApi('delete_offline');
        if (res) Swal.fire({ title: 'REPORT', text: res.msg, icon: 'success', background: '#020617', color: '#22d3ee' });
      }
    });
  };

  const filteredItems = (view === 'servers' ? data.servers : data.users).filter(item => {
    const name = view === 'servers' ? item.attributes.name : item.attributes.email;
    return name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // --- BACKGROUND COMPONENT ---
  const Background = () => (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden bg-[#020617]">
      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)] opacity-20"></div>
      {/* Glowing Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[100px] animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[100px] animate-pulse delay-1000"></div>
    </div>
  );

  // --- RENDER LOGIN ---
  if (!creds) return (
    <div className="min-h-screen flex items-center justify-center font-sans relative text-white">
      <Background />
      <div className="w-full max-w-md bg-white/5 backdrop-blur-2xl border border-white/10 p-10 rounded-3xl shadow-2xl relative z-10 mx-4">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-tr from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(6,182,212,0.5)]">
            <Terminal size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">SATURNZ-X</h1>
          <p className="text-xs text-slate-400 tracking-[0.3em] font-bold mt-2 uppercase">Command Center</p>
        </div>
        
        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-1">
             <label className="text-[10px] font-bold text-cyan-500 uppercase ml-1">Host Endpoint</label>
             <div className="relative">
                <Globe className="absolute left-4 top-3.5 text-slate-500" size={16} />
                <input name="host" required placeholder="https://panel.example.com" className="w-full bg-slate-950/50 border border-slate-800 rounded-xl pl-12 pr-4 py-3 text-sm focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all placeholder:text-slate-700" />
             </div>
          </div>
          <div className="space-y-1">
             <label className="text-[10px] font-bold text-cyan-500 uppercase ml-1">Application Key (PTLA)</label>
             <div className="relative">
                <Key className="absolute left-4 top-3.5 text-slate-500" size={16} />
                <input name="ptla" required placeholder="ptla_xxxxxxxx" className="w-full bg-slate-950/50 border border-slate-800 rounded-xl pl-12 pr-4 py-3 text-sm focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all placeholder:text-slate-700" />
             </div>
          </div>
          <div className="space-y-1">
             <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Client Key (PTLC - Optional)</label>
             <div className="relative">
                <ShieldAlert className="absolute left-4 top-3.5 text-slate-500" size={16} />
                <input name="ptlc" placeholder="ptlc_xxxxxxxx" className="w-full bg-slate-950/50 border border-slate-800 rounded-xl pl-12 pr-4 py-3 text-sm focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all placeholder:text-slate-700" />
             </div>
          </div>
          
          <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold py-4 rounded-xl transition-all flex justify-center items-center gap-2 shadow-lg shadow-cyan-900/20 mt-4">
            {loading ? <Loader2 className="animate-spin" /> : 'INITIALIZE UPLINK'}
          </button>
        </form>
      </div>
    </div>
  );

  // --- RENDER DASHBOARD ---
  return (
    <div className="min-h-screen text-slate-300 font-sans relative overflow-hidden flex flex-col">
      <Background />
      <style jsx>{`
        @keyframes scan { from { width: 0 } to { width: 100% } }
        .scanline { border-bottom: 2px solid #06b6d4; animation: scan 3s infinite linear; opacity: 0.5; }
      `}</style>

      {/* HEADER & NAV */}
      <nav className="relative z-10 border-b border-white/5 bg-slate-950/30 backdrop-blur-md sticky top-0">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
           <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-cyan-500/10 rounded-lg flex items-center justify-center border border-cyan-500/20">
                <Terminal className="text-cyan-400" size={20} />
              </div>
              <div>
                <h1 className="text-xl font-black text-white tracking-tight">SATURNZ-X</h1>
                <div className="flex items-center gap-1.5">
                   <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                   <span className="text-[10px] font-bold text-slate-500 tracking-widest uppercase">System Online</span>
                </div>
              </div>
           </div>

           <div className="flex gap-2">
              <button onClick={handleAutoDeploy} className="flex items-center gap-2 px-4 py-2 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 rounded-lg hover:bg-cyan-500 hover:text-white transition-all text-xs font-bold uppercase tracking-wider">
                 <Zap size={14} /> Create Panel
              </button>
              <button onClick={handlePrune} className="flex items-center gap-2 px-4 py-2 bg-orange-500/10 border border-orange-500/30 text-orange-400 rounded-lg hover:bg-orange-500 hover:text-white transition-all text-xs font-bold uppercase tracking-wider">
                 <Activity size={14} /> Del All Offline
              </button>
              <button onClick={() => Swal.fire({title:'NUKE?', text:'Destroy all server except Admins?', icon:'warning', showCancelButton:true, confirmButtonColor:'#d33', background:'#000', color:'#fff'}).then(r => r.isConfirmed && callApi('nuke_all', {confirm:'CONFIRM'}))} className="px-4 py-2 bg-red-500/10 border border-red-500/30 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all text-xs font-bold uppercase">
                 Del all srv
              </button>
              <button onClick={logout} className="p-2 bg-slate-800 text-slate-400 rounded-lg hover:bg-white hover:text-black transition-all">
                 <LogOut size={16} />
              </button>
           </div>
        </div>
      </nav>

      {/* MAIN CONTENT */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 space-y-6">
        
        {/* STATS CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           {/* === BAGIAN YANG DIUBAH === */}
           <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-6 backdrop-blur-sm flex items-center justify-between group hover:border-cyan-500/30 transition-all">
              <div>
                 <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Total Servers</p>
                 <p className="text-4xl font-black text-white mt-1 group-hover:text-cyan-400 transition-colors">{data.servers.length}</p>
              </div>
              <div className="p-4 bg-cyan-500/10 rounded-xl text-cyan-500 group-hover:scale-110 transition-transform"><Cpu size={32}/></div>
           </div>
           {/* ========================== */}

           <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-6 backdrop-blur-sm flex items-center justify-between group hover:border-purple-500/30 transition-all">
              <div>
                 <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Total Users</p>
                 <p className="text-4xl font-black text-white mt-1 group-hover:text-purple-400 transition-colors">{data.users.length}</p>
              </div>
              <div className="p-4 bg-purple-500/10 rounded-xl text-purple-500 group-hover:scale-110 transition-transform"><Users size={32}/></div>
           </div>
        </div>

        {/* TOOLBAR & SEARCH */}
        <div className="flex flex-col md:flex-row gap-4">
           <div className="bg-slate-900/40 border border-white/5 p-1 rounded-xl flex gap-1 backdrop-blur-sm">
              <button onClick={() => setView('servers')} className={`px-6 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${view==='servers' ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-900/20' : 'text-slate-500 hover:text-white'}`}>Servers</button>
              <button onClick={() => setView('users')} className={`px-6 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${view==='users' ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/20' : 'text-slate-500 hover:text-white'}`}>Users</button>
           </div>
           <div className="flex-1 relative">
              <Search className="absolute left-4 top-3 text-slate-500" size={18} />
              <input 
                type="text" 
                placeholder={`Search database for ${view}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-full bg-slate-900/40 border border-white/5 rounded-xl pl-12 pr-4 text-sm focus:border-cyan-500/50 outline-none text-slate-300 placeholder:text-slate-600 transition-all"
              />
           </div>
        </div>

        {/* TABLE DATA */}
        <div className="bg-slate-900/40 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-md min-h-[400px]">
           <div className="overflow-x-auto">
             <table className="w-full text-left border-collapse">
               <thead>
                 <tr className="bg-white/5 text-slate-400 text-[10px] uppercase tracking-widest border-b border-white/5">
                   <th className="p-4 font-bold">Identity</th>
                   <th className="p-4 font-bold">Details</th>
                   <th className="p-4 font-bold">Status</th>
                   <th className="p-4 font-bold text-right">Actions</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-white/5 text-sm">
                 {filteredItems.map((item) => (
                   <tr key={item.attributes.id} className="group hover:bg-white/[0.02] transition-colors">
                     <td className="p-4 font-mono text-cyan-500/80 text-xs">#{item.attributes.id}</td>
                     <td className="p-4 font-medium text-white">
                        <div className="flex items-center gap-3">
                           <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${view==='servers' ? 'bg-cyan-500/20 text-cyan-400' : 'bg-purple-500/20 text-purple-400'}`}>
                              {view==='servers' ? <Server size={14}/> : <Users size={14}/>}
                           </div>
                           {view === 'servers' ? item.attributes.name : item.attributes.email}
                        </div>
                     </td>
                     <td className="p-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${item.attributes.root_admin ? 'bg-red-500/10 text-red-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                           {view === 'servers' ? 'Node '+item.attributes.node : (item.attributes.root_admin ? 'Admin' : 'Active')}
                        </span>
                     </td>
                     <td className="p-4 text-right">
                       <button 
                         onClick={() => callApi(view === 'servers' ? 'delete_server' : 'delete_user', { id: item.attributes.id })} 
                         className="p-2 text-slate-600 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                       >
                         <Trash2 size={16} />
                       </button>
                     </td>
                   </tr>
                 ))}
                 {filteredItems.length === 0 && (
                   <tr>
                     <td colSpan="4" className="text-center py-20">
                        <div className="flex flex-col items-center opacity-30">
                           <ShieldAlert size={48} className="mb-4 text-slate-500"/>
                           <p className="text-slate-500 text-sm font-mono uppercase tracking-widest">No Records Found</p>
                        </div>
                     </td>
                   </tr>
                 )}
               </tbody>
             </table>
           </div>
        </div>
      </main>
    </div>
  );
}
