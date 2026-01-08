import { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { 
  Terminal, Server, Users, Trash2, LogOut, 
  ShieldAlert, Activity, Key, Loader2, Search, X
} from 'lucide-react';

export default function Home() {
  const [creds, setCreds] = useState(null);
  const [data, setData] = useState({ users: [], servers: [] });
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState('servers');
  const [searchTerm, setSearchTerm] = useState(''); // State untuk Search

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
      Swal.fire({ icon: 'error', title: 'CONNECTION REFUSED', background: '#000', color: '#f87171' });
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
        Swal.fire({ icon: 'success', title: 'SUCCESS', background: '#000', color: '#06b6d4', timer: 1000 });
        fetchData();
      } else {
        setData(res.data);
      }
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'ERROR', text: err.response?.data?.error || 'Failed', background: '#000', color: '#f87171' });
    }
    setLoading(false);
  };

  const fetchData = () => callApi('get_stats');

  // Logika Filter Search
  const filteredItems = (view === 'servers' ? data.servers : data.users).filter(item => {
    const name = view === 'servers' ? item.attributes.name : item.attributes.email;
    return name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  if (!creds) return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6 font-mono text-white relative overflow-hidden">
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-cyan-900/20 rounded-full blur-[120px]"></div>
      <div className="z-10 w-full max-w-md bg-gray-900/40 backdrop-blur-2xl border border-white/10 p-8 rounded-3xl shadow-2xl">
        <div className="flex flex-col items-center mb-8">
           <Terminal size={40} className="text-cyan-400 mb-4 animate-pulse" />
           <h1 className="text-3xl font-black tracking-tighter">SATURNZ-X</h1>
           <p className="text-[10px] text-gray-500 tracking-[0.3em] uppercase mt-2">Remote Gateway v2.0</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <input name="host" required placeholder="Panel URL" className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-cyan-500 outline-none transition-all" />
          <input name="ptla" required placeholder="API Key (PTLA)" className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-cyan-500 outline-none transition-all" />
          <button type="submit" className="w-full bg-cyan-500 text-black font-black py-4 rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.4)]">ACCESS SYSTEM</button>
        </form>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#050505] text-gray-300 font-sans p-4 md:p-10 relative overflow-hidden">
      <style jsx>{`
        @keyframes typing { from { width: 0 } to { width: 100% } }
        .typewriter {
          overflow: hidden;
          white-space: nowrap;
          border-right: 4px solid #06b6d4;
          animation: typing 2s steps(20, end), blink .75s step-end infinite;
        }
        @keyframes blink { from, to { border-color: transparent } 50% { border-color: #06b6d4 } }
      `}</style>

      <div className="relative z-10 max-w-6xl mx-auto">
        <header className="flex flex-col md:flex-row justify-between items-center mb-10 gap-6 bg-white/5 p-6 rounded-3xl border border-white/5 backdrop-blur-lg">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-cyan-500/10 rounded-2xl border border-cyan-500/20 text-cyan-400">
              <Terminal size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white tracking-tighter typewriter">SATURNZ-X MANAGER</h1>
              <p className="text-[10px] text-cyan-500 font-bold tracking-widest">ENCRYPTED CONNECTION ACTIVE</p>
            </div>
          </div>
          <div className="flex gap-3">
             <button onClick={() => callApi('delete_offline')} className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl hover:text-orange-400 transition-all text-[10px] font-black uppercase">Prune Offline</button>
             <button onClick={logout} className="p-3 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all"><LogOut size={18} /></button>
          </div>
        </header>

        {/* SEARCH BAR SECTION */}
        <div className="relative mb-8 group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-500 group-focus-within:text-cyan-400">
            <Search size={18} />
          </div>
          <input 
            type="text" 
            placeholder={`Search ${view === 'servers' ? 'Server Name' : 'User Email'}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white/5 border border-white/5 rounded-2xl py-4 pl-12 pr-12 text-sm focus:border-cyan-500/50 outline-none backdrop-blur-md transition-all placeholder:text-gray-700"
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-500 hover:text-white">
              <X size={18} />
            </button>
          )}
        </div>

        <div className="bg-gray-900/30 border border-white/5 rounded-[32px] overflow-hidden backdrop-blur-xl">
          <div className="flex bg-black/40 p-1.5 gap-1.5">
            <button onClick={() => {setView('servers'); setSearchTerm('')}} className={`flex-1 py-3 rounded-2xl text-[10px] font-black tracking-widest transition-all ${view === 'servers' ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/20' : 'text-gray-500 hover:text-white'}`}>SERVERS</button>
            <button onClick={() => {setView('users'); setSearchTerm('')}} className={`flex-1 py-3 rounded-2xl text-[10px] font-black tracking-widest transition-all ${view === 'users' ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/20' : 'text-gray-500 hover:text-white'}`}>USERS</button>
          </div>

          <div className="p-6 overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-gray-500 text-[9px] uppercase tracking-[0.2em] border-b border-white/5">
                  <th className="pb-4 px-2">ID</th>
                  <th className="pb-4 px-2">{view === 'servers' ? 'Node Name' : 'Email Account'}</th>
                  <th className="pb-4 px-2 text-right">Delete</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredItems.map((item) => (
                  <tr key={item.attributes.id} className="group hover:bg-white/[0.03] transition-all">
                    <td className="py-4 px-2 font-mono text-cyan-600 text-xs">#{item.attributes.id}</td>
                    <td className="py-4 px-2 font-bold text-white text-sm">
                      {view === 'servers' ? item.attributes.name : item.attributes.email}
                    </td>
                    <td className="py-4 px-2 text-right">
                      <button onClick={() => callApi(view === 'servers' ? 'delete_server' : 'delete_user', { id: item.attributes.id })} className="p-2 text-gray-700 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredItems.length === 0 && (
                  <tr>
                    <td colSpan="3" className="py-10 text-center text-xs text-gray-600 uppercase tracking-widest">No matching results found</td>
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
