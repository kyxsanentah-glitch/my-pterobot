// pages/index.js
import { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { 
  Terminal, Server, Users, Trash2, Power, 
  LogOut, ShieldAlert, Activity, Key, Loader2 
} from 'lucide-react';

export default function Home() {
  const [creds, setCreds] = useState(null); // { host, ptla, ptlc }
  const [data, setData] = useState({ users: [], servers: [] });
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState('servers'); // 'servers' | 'users'

  // --- AUTH & INIT ---
  useEffect(() => {
    const saved = localStorage.getItem('saturnz_creds');
    if (saved) {
      setCreds(JSON.parse(saved));
    }
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
      Swal.fire({ icon: 'success', title: 'Connected', toast: true, position: 'top-end', timer: 2000, showConfirmButton: false });
    } catch (err) {
      Swal.fire('Connection Failed', 'Check URL or API Keys', 'error');
    }
    setLoading(false);
  };

  const logout = () => {
    localStorage.removeItem('saturnz_creds');
    setCreds(null);
    setData({ users: [], servers: [] });
  };

  // --- API CALLER ---
  const callApi = async (action, payload = {}) => {
    if (!creds) return;
    setLoading(true);
    try {
      const res = await axios.post('/api/panel', { ...creds, action, payload });
      if (action !== 'get_stats') {
        Swal.fire({ icon: 'success', title: 'Success', text: res.data.msg || 'Action executed', toast: true, position: 'top-end', timer: 2000, showConfirmButton: false });
        fetchData(); // Refresh data after action
      } else {
        setData(res.data);
      }
    } catch (err) {
      console.error(err);
      Swal.fire('Error', err.response?.data?.error || err.message, 'error');
    }
    setLoading(false);
  };

  const fetchData = () => callApi('get_stats');

  // --- ACTIONS ---
  const handleCreateUser = async () => {
    const { value: form } = await Swal.fire({
      title: 'New User',
      html: `
        <input id="u" class="swal2-input" placeholder="Username">
        <input id="e" class="swal2-input" placeholder="Email">
        <input id="p" class="swal2-input" type="password" placeholder="Password">
      `,
      background: '#1f2937', color: '#fff',
      preConfirm: () => ({
        username: document.getElementById('u').value,
        email: document.getElementById('e').value,
        password: document.getElementById('p').value
      })
    });
    if (form) callApi('create_user', form);
  };

  const handleCreateServer = async () => {
    const userId = prompt("Enter Owner User ID:");
    if (!userId) return;
    const { value: name } = await Swal.fire({ 
        title: 'Server Name', input: 'text', background: '#1f2937', color: '#fff' 
    });
    if (name) callApi('create_server', { name, userId });
  };

  const handleNuke = () => {
    Swal.fire({
      title: 'NUKE PROTOCOL',
      text: "Delete ALL Servers & Users? (Admins safe)",
      icon: 'warning',
      background: '#000', color: '#f87171',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'EXECUTE'
    }).then((r) => {
      if (r.isConfirmed) callApi('nuke_all', { confirm: 'CONFIRM' });
    });
  };

  // --- UI COMPONENTS ---
  if (!creds) return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 font-mono relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
      <div className="absolute top-0 left-0 w-64 h-64 bg-cyan-500 rounded-full blur-[100px] opacity-20 animate-pulse"></div>
      
      <form onSubmit={handleLogin} className="relative z-10 w-full max-w-md bg-gray-900/80 backdrop-blur-xl border border-gray-800 p-8 rounded-2xl shadow-2xl shadow-cyan-900/20">
        <div className="flex justify-center mb-6">
          <Terminal size={48} className="text-cyan-400" />
        </div>
        <h1 className="text-2xl font-bold text-center text-white mb-2">SATURNZ-X <span className="text-cyan-400">CONNECT</span></h1>
        <p className="text-center text-gray-500 mb-6 text-xs">PTERODACTYL REMOTE GATEWAY</p>
        
        <div className="space-y-4">
          <input name="host" required placeholder="Panel URL (https://panel.example.com)" className="w-full bg-black/50 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-cyan-500 focus:outline-none transition" />
          <input name="ptla" required placeholder="PTLA (Application API Key)" className="w-full bg-black/50 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-cyan-500 focus:outline-none transition" />
          <input name="ptlc" placeholder="PTLC (Client API Key - Optional for Nuke)" className="w-full bg-black/50 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-cyan-500 focus:outline-none transition" />
          
          <button type="submit" disabled={loading} className="w-full bg-cyan-600 hover:bg-cyan-500 text-black font-bold py-3 rounded-lg transition flex justify-center items-center gap-2">
            {loading ? <Loader2 className="animate-spin" /> : <Key size={18} />} ACCESS PANEL
          </button>
        </div>
      </form>
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-gray-300 font-sans selection:bg-cyan-500 selection:text-black">
      {/* BACKGROUND FX */}
      <div className="fixed inset-0 pointer-events-none">
         <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-purple-600 rounded-full blur-[120px] opacity-20"></div>
         <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-cyan-600 rounded-full blur-[120px] opacity-20"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto p-4 md:p-8">
        
        {/* HEADER */}
        <header className="flex flex-col md:flex-row justify-between items-center mb-10 gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-cyan-500/10 rounded-xl border border-cyan-500/20">
              <Terminal className="text-cyan-400" size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-wide">SATURNZ-X</h1>
              <div className="flex items-center gap-2 text-xs text-cyan-500">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                </span>
                SYSTEM ONLINE
              </div>
            </div>
          </div>
          
          <div className="flex gap-3">
             <button onClick={() => callApi('delete_offline')} className="flex items-center gap-2 px-4 py-2 bg-orange-500/10 border border-orange-500/30 text-orange-400 rounded-lg hover:bg-orange-500/20 transition text-sm font-medium">
               <Activity size={16} /> Prune Offline
             </button>
             <button onClick={handleNuke} className="flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg hover:bg-red-500/20 transition text-sm font-medium">
               <ShieldAlert size={16} /> NUKE
             </button>
             <button onClick={logout} className="flex items-center gap-2 px-4 py-2 bg-gray-800 border border-gray-700 text-gray-400 rounded-lg hover:bg-gray-700 transition text-sm">
               <LogOut size={16} />
             </button>
          </div>
        </header>

        {/* STATS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="bg-gray-900/50 backdrop-blur border border-gray-800 p-6 rounded-xl flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">ACTIVE SERVERS</p>
              <p className="text-4xl font-bold text-white mt-1">{data.servers.length}</p>
            </div>
            <Server className="text-gray-600" size={40} />
          </div>
          <div className="bg-gray-900/50 backdrop-blur border border-gray-800 p-6 rounded-xl flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">REGISTERED USERS</p>
              <p className="text-4xl font-bold text-white mt-1">{data.users.length}</p>
            </div>
            <Users className="text-gray-600" size={40} />
          </div>
        </div>

        {/* CONTROLS */}
        <div className="bg-gray-900/60 backdrop-blur-md border border-gray-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="flex border-b border-gray-800">
            <button 
              onClick={() => setView('servers')}
              className={`flex-1 py-4 text-sm font-bold flex justify-center items-center gap-2 ${view === 'servers' ? 'bg-cyan-500/10 text-cyan-400 border-b-2 border-cyan-500' : 'text-gray-500 hover:bg-gray-800'}`}
            >
              <Server size={18} /> SERVERS
            </button>
            <button 
              onClick={() => setView('users')}
              className={`flex-1 py-4 text-sm font-bold flex justify-center items-center gap-2 ${view === 'users' ? 'bg-cyan-500/10 text-cyan-400 border-b-2 border-cyan-500' : 'text-gray-500 hover:bg-gray-800'}`}
            >
              <Users size={18} /> USERS
            </button>
          </div>

          <div className="p-6">
            <div className="flex justify-end mb-4">
              <button 
                onClick={view === 'servers' ? handleCreateServer : handleCreateUser} 
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-black font-bold rounded-lg text-sm transition shadow-[0_0_15px_rgba(8,145,178,0.5)]"
              >
                + CREATE NEW {view === 'servers' ? 'SERVER' : 'USER'}
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-gray-500 text-xs uppercase tracking-wider border-b border-gray-800">
                    <th className="p-3">ID</th>
                    <th className="p-3">{view === 'servers' ? 'Name' : 'Email'}</th>
                    <th className="p-3">{view === 'servers' ? 'Owner ID' : 'Role'}</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {(view === 'servers' ? data.servers : data.users).map((item) => (
                    <tr key={item.attributes.id} className="border-b border-gray-800/50 hover:bg-white/5 transition group">
                      <td className="p-3 font-mono text-cyan-600">#{item.attributes.id}</td>
                      <td className="p-3 font-medium text-white">
                        {view === 'servers' ? item.attributes.name : item.attributes.email}
                      </td>
                      <td className="p-3 text-gray-400">
                        {view === 'servers' 
                          ? `User: ${item.attributes.user}` 
                          : (item.attributes.root_admin ? <span className="text-purple-400 font-bold">ADMIN</span> : 'User')
                        }
                      </td>
                      <td className="p-3 text-right">
                        {/* Protect Admin Deletion */}
                        {!(view === 'users' && item.attributes.root_admin) && (
                          <button 
                            onClick={() => callApi(view === 'servers' ? 'delete_server' : 'delete_user', { id: item.attributes.id })}
                            className="text-gray-600 hover:text-red-500 transition p-2 bg-gray-900 rounded-md opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {(view === 'servers' ? data.servers : data.users).length === 0 && (
                    <tr>
                      <td colSpan="4" className="text-center py-10 text-gray-600 italic">No data found in {view}.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
