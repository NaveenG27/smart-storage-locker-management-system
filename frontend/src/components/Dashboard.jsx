import { useEffect, useState } from 'react';
import api from '../api';
import { 
    Lock, Unlock, LogOut, ShieldCheck, 
    Search, Plus, Calendar, MapPin, 
    User as UserIcon, Clock, XCircle 
} from 'lucide-react'; 
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
    const [lockers, setLockers] = useState([]);
    const [reservations, setReservations] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [activeLocker, setActiveLocker] = useState(null);
    const [reservedUntil, setReservedUntil] = useState(""); 
    const [showAddModal, setShowAddModal] = useState(false);
    const [newLocker, setNewLocker] = useState({ locker_number: '', location: '' });
    const [loading, setLoading] = useState(true);
    
    const navigate = useNavigate();
    const isAdmin = String(localStorage.getItem('is_admin')) === 'true';
    const currentUsername = localStorage.getItem('username');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [lockersRes, reservationsRes] = await Promise.all([
                api.get('/api/lockers/'),
                api.get('/api/reservations/')
            ]);
            setLockers(lockersRes.data);
            setReservations(reservationsRes.data);
        } catch (error) {
            console.error("Fetch Error:", error);
            if (error.response?.status === 401) {
                localStorage.clear();
                navigate('/login');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleReserve = (locker) => {
        setActiveLocker(locker);
        // Set default reserved_until to 1 hour from now
        const defaultTime = new Date();
        defaultTime.setHours(defaultTime.getHours() + 1);
        // Format for datetime-local: YYYY-MM-DDTHH:mm
        const formatted = defaultTime.toISOString().slice(0, 16);
        setReservedUntil(formatted);
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
            console.error("Backend Error:", error.response?.data);
            const serverMsg = error.response?.data?.error || "Locker might already be taken.";
            alert("Reservation Failed: " + serverMsg);
        }
    };

    const handleRelease = async (reservationId) => {
        if (!window.confirm("Are you sure you want to release this locker?")) return;
        try {
            // Requirement-compliant PUT method
            await api.put(`/api/reservations/${reservationId}/release/`);
            fetchData();
            alert("Locker released successfully!");
        } catch (error) {
            console.error("Release Error:", error);
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
            alert("New locker added successfully!");
        } catch (error) {
            alert("Failed to add locker. Ensure the number is unique.");
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
            {/* Top Navigation */}
            <nav className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16 items-center">
                        <div className="flex items-center gap-2">
                            <div className="bg-blue-600 p-2 rounded-lg text-white">
                                <Lock size={20} />
                            </div>
                            <span className="text-xl font-bold tracking-tight text-slate-800">SmartLocker</span>
                        </div>

                        <div className="hidden md:flex items-center gap-6">
                            <div className="relative">
                                <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
                                <input 
                                    type="text" 
                                    placeholder="Search lockers..." 
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10 pr-4 py-2 bg-slate-100 border-none rounded-full w-64 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-sm"
                                />
                            </div>
                            <div className="h-6 w-px bg-slate-200"></div>
                            <div className="flex items-center gap-3">
                                {isAdmin && (
                                    <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-xs font-bold border border-amber-100">
                                        <ShieldCheck size={14} /> ADMIN
                                    </div>
                                )}
                                <span className="text-sm font-medium text-slate-600">Hi, {currentUsername}</span>
                                <button 
                                    onClick={handleLogout}
                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                                    title="Logout"
                                >
                                    <LogOut size={20} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header Information */}
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">System Dashboard</h1>
                        <p className="text-slate-500 mt-1">Manage and monitor storage locker availability in real-time.</p>
                    </div>
                    {isAdmin && (
                        <button 
                            onClick={() => setShowAddModal(true)}
                            className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-200 active:scale-95"
                        >
                            <Plus size={20} /> Add New Locker
                        </button>
                    )}
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* Left Column: Locker Grid (2/3 width on desktop) */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                                <h2 className="text-lg font-bold flex items-center gap-2">
                                    <MapPin size={18} className="text-blue-500" /> Locker Availability
                                </h2>
                                <span className="text-xs font-semibold px-2 py-1 bg-slate-200 text-slate-600 rounded">
                                    {filteredLockers.length} Total
                                </span>
                            </div>
                            
                            <div className="p-6">
                                {loading ? (
                                    <div className="flex justify-center py-12">
                                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                                    </div>
                                ) : filteredLockers.length > 0 ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                                        {filteredLockers.map(locker => (
                                            <div key={locker.id} className={`group p-5 rounded-2xl border-2 transition-all duration-200 ${
                                                locker.status === 'available' 
                                                ? 'border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/30' 
                                                : 'border-slate-100 bg-slate-50 opacity-80'
                                            }`}>
                                                <div className="flex justify-between items-start mb-4">
                                                    <div className={`p-3 rounded-xl ${
                                                        locker.status === 'available' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-500'
                                                    }`}>
                                                        {locker.status === 'available' ? <Unlock size={24} /> : <Lock size={24} />}
                                                    </div>
                                                    <span className={`text-[10px] uppercase font-black px-2 py-1 rounded tracking-widest ${
                                                        locker.status === 'available' 
                                                        ? 'bg-emerald-100 text-emerald-700' 
                                                        : 'bg-rose-100 text-rose-700'
                                                    }`}>
                                                        {locker.status}
                                                    </span>
                                                </div>
                                                
                                                <h3 className="font-bold text-lg text-slate-800">Locker #{locker.locker_number}</h3>
                                                <div className="flex items-center gap-1.5 text-slate-500 text-sm mt-1 mb-6">
                                                    <MapPin size={14} /> {locker.location}
                                                </div>

                                                <button
                                                    onClick={() => locker.status === 'available' ? handleReserve(locker) : null}
                                                    disabled={locker.status !== 'available'}
                                                    className={`w-full py-2.5 rounded-xl font-bold text-sm transition-all ${
                                                        locker.status === 'available' 
                                                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-100' 
                                                        : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                                                    }`}
                                                >
                                                    {locker.status === 'available' ? 'Reserve Now' : 'Occupied'}
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12">
                                        <Search size={48} className="mx-auto text-slate-200 mb-4" />
                                        <p className="text-slate-400 font-medium">No lockers match your search.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Reservation Sidebar (1/3 width on desktop) */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden sticky top-24">
                            <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                                <h2 className="text-lg font-bold flex items-center gap-2">
                                    <Calendar size={18} className="text-indigo-500" /> 
                                    {isAdmin ? 'System Reservations' : 'My Reservations'}
                                </h2>
                            </div>
                            
                            <div className="p-6 max-h-[calc(100vh-250px)] overflow-y-auto">
                                {activeReservations.length > 0 ? (
                                    <div className="space-y-4">
                                        {activeReservations.map(res => (
                                            <div key={res.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:shadow-md transition-all">
                                                <div className="flex justify-between items-start mb-3">
                                                    <div>
                                                        <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                                                            Locker #{res.locker_number}
                                                        </span>
                                                        {isAdmin && (
                                                            <div className="flex items-center gap-1 mt-1.5 text-xs font-medium text-slate-600">
                                                                <UserIcon size={12} strokeWidth={3} /> {res.user_username}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <button 
                                                        onClick={() => handleRelease(res.id)}
                                                        className="text-slate-300 hover:text-red-500 transition-colors"
                                                        title="Cancel/Release"
                                                    >
                                                        <XCircle size={18} />
                                                    </button>
                                                </div>
                                                
                                                <div className="flex items-center gap-3 text-xs text-slate-500">
                                                    <div className="flex items-center gap-1">
                                                        <Clock size={12} /> Until: {new Date(res.reserved_until).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                    <div className="h-1 w-1 bg-slate-300 rounded-full"></div>
                                                    <div className="text-indigo-500 font-semibold italic">Active</div>
                                                </div>

                                                {!isAdmin && (
                                                    <button 
                                                        onClick={() => handleRelease(res.id)}
                                                        className="w-full mt-4 py-2 bg-white text-rose-600 border border-rose-100 rounded-lg text-xs font-bold hover:bg-rose-50 transition-colors uppercase tracking-tight"
                                                    >
                                                        Release Locker
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8">
                                        <Calendar size={32} className="mx-auto text-slate-200 mb-3" />
                                        <p className="text-slate-400 text-sm">No active reservations.</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Recent History (Optional/Admin only) */}
                        {isAdmin && reservations.filter(r => !r.is_active).length > 0 && (
                            <div className="bg-slate-100 rounded-xl p-4">
                                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Recent Releases</h3>
                                <div className="space-y-2 opacity-60">
                                    {reservations.filter(r => !r.is_active).slice(0, 3).map(res => (
                                        <div key={res.id} className="text-xs flex justify-between text-slate-600">
                                            <span>#{res.locker_number} by {res.user_username}</span>
                                            <span>Ended</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* ADD LOCKER MODAL (ADMIN) */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-slate-800">Add New Locker</h2>
                            <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                                <XCircle size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleAddLocker} className="p-8 space-y-6">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Locker Identifier</label>
                                <input 
                                    type="text" 
                                    placeholder="e.g. L-104" 
                                    required 
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    onChange={(e) => setNewLocker({...newLocker, locker_number: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Facility Location</label>
                                <input 
                                    type="text" 
                                    placeholder="e.g. Level 3, Hallway B" 
                                    required 
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    onChange={(e) => setNewLocker({...newLocker, location: e.target.value})}
                                />
                            </div>
                            <div className="flex gap-4 pt-4">
                                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 px-6 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors">Cancel</button>
                                <button type="submit" className="flex-1 px-6 py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-100 active:scale-95 transition-all">Create</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* RESERVE LOCKER MODAL */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-8 text-center">
                            <div className="bg-emerald-50 w-20 h-20 rounded-full flex justify-center items-center mx-auto mb-6">
                                <Unlock size={40} className="text-emerald-600" />
                            </div>
                            <h2 className="text-2xl font-black text-slate-800">Secure Locker</h2>
                            <p className="text-slate-500 mt-2">You are reserving <span className="font-bold text-slate-700">#{activeLocker?.locker_number}</span> at {activeLocker?.location}.</p>
                            
                            <div className="mt-8 text-left">
                                <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-3 text-center text-wrap">Release Time (Locker will be freed then)</label>
                                <input 
                                    type="datetime-local"
                                    value={reservedUntil}
                                    min={new Date().toISOString().slice(0, 16)}
                                    onChange={(e) => setReservedUntil(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono text-center"
                                />
                            </div>
                        </div>
                        <div className="flex bg-slate-50 border-t border-slate-100">
                            <button onClick={() => setShowModal(false)} className="flex-1 px-8 py-5 text-slate-500 font-bold hover:text-slate-700 transition-colors">Cancel</button>
                            <button onClick={confirmReservation} className="flex-1 px-8 py-5 bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition-all active:scale-95">Confirm</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;