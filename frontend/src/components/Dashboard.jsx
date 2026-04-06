import { useEffect, useState } from 'react';
import api from '../api';
import { 
    Lock, Unlock, LogOut, ShieldCheck, 
    Search, Plus, Calendar, MapPin, 
    User as UserIcon, Clock, XCircle, Trash2, Menu, History
} from 'lucide-react'; 
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
    const [lockers, setLockers] = useState([]);
    const [reservations, setReservations] = useState([]);
    const [recentReleases, setRecentReleases] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [activeLocker, setActiveLocker] = useState(null);
    const [reservedUntil, setReservedUntil] = useState(""); 
    const [showAddModal, setShowAddModal] = useState(false);
    const [newLocker, setNewLocker] = useState({ locker_number: '', location: '' });
    const [loading, setLoading] = useState(true);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    
    const navigate = useNavigate();
    const isAdmin = String(localStorage.getItem('is_admin')) === 'true';
    const currentUsername = localStorage.getItem('username');

    useEffect(() => {
        fetchData(true);
        const intervalId = setInterval(() => {
            fetchData();
        }, 5000);
        return () => clearInterval(intervalId);
    }, []);

    const fetchData = async (showLoading = false) => {
        if (showLoading) setLoading(true);
        try {
            const requests = [
                api.get('/api/lockers/'),
                api.get('/api/reservations/')
            ];

            if (isAdmin) {
                requests.push(api.get('/api/reservations/recent_releases/'));
            }

            const [lockersRes, reservationsRes, historyRes] = await Promise.all(requests);
            
            setLockers(lockersRes.data);
            setReservations(reservationsRes.data);
            if (historyRes) setRecentReleases(historyRes.data);
        } catch (error) {
            console.error("Fetch Error:", error);
            if (error.response?.status === 401) {
                localStorage.clear();
                navigate('/login');
            }
        } finally {
            if (showLoading) setLoading(false);
        }
    };

    const handleReserve = (locker) => {
        setActiveLocker(locker);
        const defaultTime = new Date();
        defaultTime.setHours(defaultTime.getHours() + 1);
        setReservedUntil(defaultTime.toISOString().slice(0, 16));
        setShowModal(true);
    };

    const confirmReservation = async () => {
        try {
            await api.post('/api/reservations/', {
                locker: activeLocker.id,
                reserved_until: new Date(reservedUntil).toISOString()
            });
            setShowModal(false);
            fetchData(); 
            alert(`Locker #${activeLocker.locker_number} reserved successfully!`);
        } catch (error) {
            alert("Reservation Failed: " + (error.response?.data?.error || "Locker taken."));
        }
    };

    const handleRelease = async (reservationId) => {
        if (!window.confirm("Are you sure you want to release this locker?")) return;
        try {
            await api.put(`/api/reservations/${reservationId}/release/`);
            fetchData();
            alert("Locker released successfully!");
        } catch (error) {
            alert("Failed to release locker.");
        }
    };

    const handleAddLocker = async (e) => {
        e.preventDefault();
        try {
            await api.post('/api/lockers/', { ...newLocker, status: 'available' });
            setShowAddModal(false);
            setNewLocker({ locker_number: '', location: '' });
            fetchData();
            alert("New locker added!");
        } catch (error) {
            alert("Failed to add locker. Ensure number is unique.");
        }
    };

    const handleDeleteLocker = async (lockerId, lockerNumber) => {
        if (!window.confirm(`Permanently delete Locker #${lockerNumber}?`)) return;
        try {
            await api.delete(`/api/lockers/${lockerId}/`);
            fetchData();
            alert("Locker deleted.");
        } catch (error) {
            alert("Cannot delete locker with active history.");
        }
    };

    const handleLogout = () => {
        localStorage.clear();
        navigate('/login');
    };

    const filteredLockers = lockers.filter(locker => 
        locker.locker_number.toString().includes(searchTerm) || 
        locker.location.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const activeReservations = reservations.filter(r => r.is_active);

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
            {/* NAVIGATION BAR */}
            <nav className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16 items-center">
                        <div className="flex items-center gap-2">
                            <div className="bg-blue-600 p-2 rounded-lg text-white"><Lock size={20} /></div>
                            <span className="text-xl font-bold tracking-tight text-slate-800">SmartLocker</span>
                        </div>

                        {/* Desktop Nav */}
                        <div className="hidden md:flex items-center gap-6 flex-1 justify-end">
                            <div className="relative">
                                <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
                                <input 
                                    type="text" placeholder="Search lockers..." 
                                    value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10 pr-4 py-2 bg-slate-100 border-none rounded-full w-64 focus:ring-2 focus:ring-blue-500 text-sm"
                                />
                            </div>
                            <div className="flex items-center gap-3">
                                {isAdmin && <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-xs font-bold border border-amber-100"><ShieldCheck size={14} /> ADMIN</div>}
                                <span className="text-sm font-medium text-slate-600">Hi, {currentUsername}</span>
                                <button onClick={handleLogout} className="p-2 text-slate-400 hover:text-red-600 rounded-full"><LogOut size={20} /></button>
                            </div>
                        </div>

                        {/* Mobile Nav Toggle */}
                        <div className="md:hidden flex items-center gap-4">
                            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 text-slate-600"><Menu size={24} /></button>
                        </div>
                    </div>

                    {/* MOBILE MENU UPDATED */}
                    {isMenuOpen && (
                        <div className="md:hidden pb-4 space-y-4 border-t pt-4">
                            {/* User Profile Section for Mobile */}
                            <div className="px-4 py-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
                                        <UserIcon size={18} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] uppercase font-bold text-slate-400 leading-none mb-1">Signed in as</p>
                                        <p className="text-sm font-bold text-slate-800">{currentUsername}</p>
                                    </div>
                                </div>
                                {isAdmin && <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-bold">ADMIN</span>}
                            </div>

                            <div className="relative">
                                <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
                                <input 
                                    type="text" placeholder="Search lockers..." 
                                    value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 bg-slate-100 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 border-none"
                                />
                            </div>
                            
                            <button onClick={handleLogout} className="w-full py-3 text-red-600 bg-red-50 hover:bg-red-100 rounded-xl font-bold flex items-center justify-center gap-2 transition-all">
                                <LogOut size={18} /> Logout
                            </button>
                        </div>
                    )}
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* HEADER SECTION */}
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">System Dashboard</h1>
                        <p className="text-slate-500 mt-1">Manage and monitor storage lockers in real-time.</p>
                    </div>
                    {isAdmin && (
                        <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-200">
                            <Plus size={20} /> Add New Locker
                        </button>
                    )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* MAIN CONTENT: LOCKER GRID */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                                <h2 className="text-lg font-bold flex items-center gap-2"><MapPin size={18} className="text-blue-500" /> Locker Availability</h2>
                                <span className="text-xs font-semibold px-2 py-1 bg-slate-200 text-slate-600 rounded">{filteredLockers.length} Total</span>
                            </div>
                            
                            <div className="p-6">
                                {loading ? (
                                    <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>
                                ) : filteredLockers.length > 0 ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                                        {filteredLockers.map(locker => (
                                            <div key={locker.id} className={`p-5 rounded-2xl border-2 transition-all ${locker.status === 'available' ? 'border-slate-100 hover:border-emerald-200' : 'bg-slate-50 opacity-80'}`}>
                                                <div className="flex justify-between items-start mb-4">
                                                    <div className={`p-3 rounded-xl ${locker.status === 'available' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-500'}`}>
                                                        {locker.status === 'available' ? <Unlock size={24} /> : <Lock size={24} />}
                                                    </div>
                                                    {isAdmin && <button onClick={() => handleDeleteLocker(locker.id, locker.locker_number)} className="p-1.5 text-slate-400 hover:text-red-600"><Trash2 size={16} /></button>}
                                                </div>
                                                <h3 className="font-bold text-lg text-slate-800">Locker #{locker.locker_number}</h3>
                                                <div className="flex items-center gap-1.5 text-slate-500 text-sm mt-1 mb-6"><MapPin size={14} /> {locker.location}</div>
                                                <button
                                                    onClick={() => handleReserve(locker)}
                                                    disabled={locker.status !== 'available'}
                                                    className={`w-full py-2.5 rounded-xl font-bold text-sm transition-all ${locker.status === 'available' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-slate-300 text-slate-500'}`}
                                                >
                                                    {locker.status === 'available' ? 'Reserve Now' : 'Occupied'}
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                ) : <div className="text-center py-12 text-slate-400">No lockers found.</div>}
                            </div>
                        </div>
                    </div>

                    {/* SIDEBAR: ACTIVE & RECENT RELEASES */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                            <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                                <h2 className="text-lg font-bold flex items-center gap-2"><Calendar size={18} className="text-indigo-500" /> {isAdmin ? 'System Active' : 'My Active'}</h2>
                            </div>
                            <div className="p-6 space-y-4 max-h-[400px] overflow-y-auto">
                                {activeReservations.length > 0 ? activeReservations.map(res => (
                                    <div key={res.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50 shadow-sm transition-all hover:border-indigo-100">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">Locker #{res.locker_number}</span>
                                                <div className="text-sm font-medium text-slate-700 mt-1 flex items-center gap-1"><UserIcon size={12} /> {res.user_username}</div>
                                            </div>
                                            {(isAdmin || res.user_username === currentUsername) && (
                                                <button onClick={() => handleRelease(res.id)} className="text-slate-300 hover:text-red-500 transition-colors">
                                                    <XCircle size={18} />
                                                </button>
                                            )}
                                        </div>
                                        <div className="text-[10px] text-slate-400 flex items-center gap-1 mb-3"><Clock size={10} /> Until: {new Date(res.reserved_until).toLocaleTimeString()}</div>
                                        
                                        {(isAdmin || res.user_username === currentUsername) && (
                                            <button 
                                                onClick={() => handleRelease(res.id)}
                                                className="w-full py-1.5 bg-red-50 text-red-600 text-[10px] font-bold rounded-lg border border-red-100 hover:bg-red-600 hover:text-white transition-all uppercase tracking-wider"
                                            >
                                                Release Locker
                                            </button>
                                        )}
                                    </div>
                                )) : <p className="text-center text-slate-400 text-sm py-4">No active reservations.</p>}
                            </div>
                        </div>

                        {/* UPDATED RECENT RELEASES SECTION */}
                        {isAdmin && (
                            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                                <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                                    <h2 className="text-lg font-bold flex items-center gap-2 text-slate-700"><History size={18} className="text-slate-500" /> Recent Releases</h2>
                                </div>
                                <div className="p-6 space-y-3 max-h-[400px] overflow-y-auto">
                                    {recentReleases.length > 0 ? recentReleases.map(history => (
                                        <div key={history.id} className="p-3 rounded-lg border border-slate-100 bg-slate-50/30">
                                            <div className="flex justify-between text-xs font-bold">
                                                <span className="text-slate-700">Locker #{history.locker_number}</span>
                                                <span className="text-emerald-600">Released</span>
                                            </div>
                                            <p className="text-[10px] text-slate-500 mt-1">User: {history.user_username}</p>
                                            
                                            {/* N/A REMOVAL LOGIC */}
                                            {history.released_at && history.released_at !== "N/A" && (
                                                <p className="text-[10px] text-slate-400">
                                                    {new Date(history.released_at).toLocaleString()}
                                                </p>
                                            )}
                                        </div>
                                    )) : <p className="text-center text-slate-400 text-sm py-4">No recent history.</p>}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* MODALS (UNTOUCHED) */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
                        <h2 className="text-xl font-bold mb-6">Add New Locker</h2>
                        <form onSubmit={handleAddLocker} className="space-y-4">
                            <input 
                                placeholder="Locker Number" required
                                value={newLocker.locker_number} onChange={(e) => setNewLocker({...newLocker, locker_number: e.target.value})}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                            <input 
                                placeholder="Location" required
                                value={newLocker.location} onChange={(e) => setNewLocker({...newLocker, location: e.target.value})}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-2 bg-slate-100 rounded-lg font-bold">Cancel</button>
                                <button type="submit" className="flex-1 py-2 bg-blue-600 text-white rounded-lg font-bold">Create</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden p-8 text-center">
                        <div className="bg-emerald-50 w-16 h-16 rounded-full flex justify-center items-center mx-auto mb-4"><Unlock size={32} className="text-emerald-600" /></div>
                        <h2 className="text-xl font-bold">Secure Locker</h2>
                        <p className="text-sm text-slate-500 mb-6">Reserving Locker #{activeLocker?.locker_number}</p>
                        <input 
                            type="datetime-local" value={reservedUntil}
                            onChange={(e) => setReservedUntil(e.target.value)}
                            className="w-full px-4 py-2 border rounded-lg mb-6 outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <div className="flex gap-3">
                            <button onClick={() => setShowModal(false)} className="flex-1 py-2 font-bold text-slate-500">Cancel</button>
                            <button onClick={confirmReservation} className="flex-1 py-2 bg-emerald-600 text-white rounded-lg font-bold">Confirm</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;