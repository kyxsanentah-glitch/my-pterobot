import { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { 
  Terminal, Server, Users, Trash2, LogOut, 
  ShieldAlert, Activity, Key, Loader2, Search, X, Zap, Copy
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
        background: '#000', 
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
      Swal.fire({ icon: 'error', title: 'CONNECTION REFUSED', text: 'Cek URL atau API Key', background: '#000', color: '#f87171' });
    } finally {
      setLoading(false);
    }
  };

  const logout = () => { localStorage.removeItem('saturnz_creds'); setCreds(null); };

  // --- FITUR: QUICK DEPLOY (MANUAL INPUT + AUTO COPY) ---
  const handleAutoDeploy = async () => {
    const { value: formValues } = await Swal.fire({
      title: 'QUICK DEPLOY (NODEJS)',
      html:
        '<label style="color:#06b6d4; font-size:12px; display:block; text-align:left;">USERNAME</label>' +
        '<input id="sw-user" class="swal2-input" placeholder="ex: saturnz" style="background:#111; color:#fff; border:1px solid #333; margin-top:5px;">' +
        '<label style="color:#06b6d4; font-size:12px; display:block; text-align:left; margin-top:10px;">PASSWORD</label>' +
        '<input id="sw-pass" class="swal2-input" type="password" placeholder="***" style="background:#111; color:#fff; border:1px solid #333; margin-top:5px;">',
      background: '#050505',
      color: '#06b6d4',
      showCancelButton: true,
      confirmButtonText: 'EXECUTE',
      confirmButtonColor: '#06b6d4',
      cancelButtonColor: '#333',
      preConfirm: () => {
        const username = document.getElementById('sw-user').value;
        const password = document.getElementById('sw-pass').value;
        if (!username || !password) return Swal.showValidationMessage('Isi Username & Password!');
        return { username, password };
      }
    });

    if (formValues) {
      const result = await callApi('auto_deploy', formValues);
      if (result) {
        navigator.clipboard.writeText(result.detail);
        Swal.fire({
          icon: 'success',
          title: 'DEPLOYED & COPIED',
          text: result.detail,
          background: '#000',
          color: '#06b6d4',
          toast: true,
          position: 'top-end',
          timer: 5000,
          showConfirmButton: false,
          timerProgressBar: true
        });
      }
    }
  };

  // --- FITUR: PRUNE OFFLINE (VALIDASI PTLC) ---
  const handlePrune = () => {
    if (!creds.ptlc) {
      return Swal.fire({
        icon: 'error',
        title: 'PTLC MISSING',
        text: 'Masukkan Client API Key (PTLC) saat login untuk menggunakan fitur ini.',
        background: '#000',
        color: '#f87171'
      });
    }

    Swal.fire({
      title: 'PRUNE PROTOCOL',
      text: 'Scan & Hapus semua server OFFLINE?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ea580c',
      cancelButtonColor: '#333',
      confirmButtonText: 'START SCAN',
      background: '#050505',
      color: '#fff'
    }).then(async (result) => {
      if (result.isConfirmed) {
        const res = await callApi('delete_offline');
        if (res) {
          Swal.fire({
            title: 'CLEANUP REPORT',
            text: res.msg,
            icon: 'success',
            background: '#000',
            color: '#06b6d4'
          });
        }
      }
    });
  };

  // --- FILTER SEARCH ---
  const filteredItems = (view === 'servers' ? data.servers : data.users).filter(item => {
    const name = view === 'servers' ? item.attributes.name : item.attributes.email;
    return name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // --- RENDER LOGIN SCREEN ---
  if (!creds) return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6 font-mono text-white">
      <div className="w-full max-w-md bg-gray-900/40 backdrop-blur-2xl border border-white/10 p-8 rounded-3xl shadow-2xl">
        <div className="flex flex-col items-center mb-6">
          <Terminal size={40} className="text-cyan-400 mb-2 animate-pulse" />
          <h1 className="text-2xl font-black tracking-tighter">SATURNZ-X LOGIN</h1>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <input name="host" required placeholder="Panel URL (https://panel.xy.com)" className="w-full bg-black/50 border border-white/5 rounded-xl px-4 py-3 text-sm focus:border-cyan-500 outline-none transition-all" />
          <input name="ptla" required placeholder="API Key (PTLA)" className="w-full bg-black/50 border border-white/5 rounded-xl px-4 py-3 text-sm focus:border-cyan-500 outline-none transition-all" />
          <input name="ptlc" placeholder="API Key (PTLC) - Opsional (Wajib utk Prune)" className="w-full bg-black/50 border border-white/5 rounded-xl px-4 py-3 text-sm focus:border-cyan-500 outline-none transition-all" />
          <button type="submit" disabled={loading} className="w-full bg-cyan-600 hover:bg-cyan-500 text-black font-black py-4 rounded-xl transition-all flex justify-center items-center gap-2">
            {loading ? <Loader2 className="animate-spin" /> : 'CONNECT SYSTEM'}
          </button>
        </form>
      </div>
    </div>
  );

  // --- RENDER DASHBOARD ---
  return (
    <div className="min-h-screen bg-[#050505] text-gray-300 font-sans p-4 md:p-10 relative overflow-hidden">
      <style jsx>{`
        @keyframes typing { from { width: 0 } to { width: 100% } }
        .typewriter { overflow: hidden; white-space: nowrap; border-right: 3px solid #06b6d4; animation: typing 2s steps(20, end), blink .75s step-end infinite; }
        @keyframes blink { from, to { border-color: transparent } 50% { border-color: #06b6d4 } }
      `}</style>

      <div className="max-w-6xl mx-auto relative z-10">
        
        {/* HEADER */}
        <header className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 bg-white/5 p-6 rounded-3xl border border-white/5 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 rounded-2xl"><Terminal size={24} /></div>
            <div>
              <h1 className="text-2xl font-black text-white typewriter">SATURNZ-X MANAGER</h1>
              <p className="text-[9px] text-cyan-500 tracking-widest font-bold uppercase">NodeJS Deployer Active</p>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap justify-center">
            
            {/* Quick Deploy */}
            <button onClick={handleAutoDeploy} className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-black rounded-xl text-xs font-black transition-all shadow-lg shadow-cyan-900/20">
              <Zap size={14} fill="currentColor" /> QUICK DEPLOY
            </button>
            
            {/* Prune Offline */}
            <button onClick={handlePrune} className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl hover:bg-orange-500/20 hover:text-orange-400 transition-all text-[10px] font-bold">
              PRUNE
            </button>
            
            {/* Nuke All */}
            <button onClick={() => 
              Swal.fire({
                title: 'NUKE PANEL', 
                text: 'Hapus SEMUA Server & User (Kecuali Admin)?',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#d33',
                cancelButtonColor: '#333',
                confirmButtonText: 'CONFIRM NUKE',
                background: '#000',
                color: '#f87171'
              }).then((res) => {
                if(res.isConfirmed) callApi('nuke_all', { confirm: 'CONFIRM' });
              })
            } className="px-4 py-2 bg-red-900/10 border border-red-900/30 text-red-500 rounded-xl hover:bg-red-600 hover:text-white transition-all text-[10px] font-bold">
              NUKE
            </button>

            {/* Logout */}
            <button onClick={logout} className="p-2.5 bg-gray-800 text-gray-400 border border-gray-700 rounded-xl hover:bg-white hover:text-black transition-all">
              <LogOut size={18} />
            </button>
          </div>
        </header>

        {/* SEARCH BAR */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" size={18} />
          <input 
            type="text" 
            placeholder={`Filter ${view}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white/5 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-sm focus:border-cyan-500/30 outline-none transition-all placeholder:text-gray-700"
          />
        </div>

        {/* DATA TABLE */}
        <div className="bg-gray-900/30 border border-white/5 rounded-[32px] overflow-hidden backdrop-blur-xl">
          <div className="flex bg-black/40 p-1.5 gap-1.5">
            <button onClick={() => setView('servers')} className={`flex-1 py-3 rounded-2xl text-[10px] font-black tracking-widest transition-all ${view === 'servers' ? 'bg-cyan-500 text-black' : 'text-gray-500'}`}>SERVERS ({data.servers.length})</button>
            <button onClick={() => setView('users')} className={`flex-1 py-3 rounded-2xl text-[10px] font-black tracking-widest transition-all ${view === 'users' ? 'bg-cyan-500 text-black' : 'text-gray-500'}`}>USERS ({data.users.length})</button>
          </div>

          <div className="p-4 overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-gray-500 text-[9px] uppercase tracking-widest border-b border-white/5">
                  <th className="pb-4 px-2">Identification</th>
                  <th className="pb-4 px-2">Label / Email</th>
                  <th className="pb-4 px-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm">
                {filteredItems.map((item) => (
                  <tr key={item.attributes.id} className="group hover:bg-white/[0.02] transition-all">
                    <td className="py-4 px-2 font-mono text-cyan-600 text-xs">#{item.attributes.id}</td>
                    <td className="py-4 px-2 font-bold text-white">
                      {view === 'servers' ? item.attributes.name : item.attributes.email}
                    </td>
                    <td className="py-4 px-2 text-right">
                      <button 
                        onClick={() => callApi(view === 'servers' ? 'delete_server' : 'delete_user', { id: item.attributes.id })} 
                        className="p-2 text-gray-700 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredItems.length === 0 && (
                  <tr>
                    <td colSpan="3" className="text-center py-10 text-gray-600 text-xs tracking-widest italic">NO MATCHING DATA FOUND</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        
      </div>
    </div>
  );
}
