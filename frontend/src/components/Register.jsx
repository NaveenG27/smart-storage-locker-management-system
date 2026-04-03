import { useState } from 'react';
import api from '../api';
import { useNavigate, Link } from 'react-router-dom';
import { UserPlus, User, Mail, Lock } from 'lucide-react';

const Register = () => {
    const [formData, setFormData] = useState({ 
        username: '', 
        email: '', 
        password: '',
        name: ''
    });
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/api/auth/register/', formData);
            alert("Account created successfully! Please login.");
            navigate('/login');
        } catch (error) {
            alert(error.response?.data?.error || "Registration failed. Try a different username.");
        }
    };

    return (
        <div className="flex justify-center items-center h-screen bg-slate-50">
            <div className="bg-white p-10 rounded-xl shadow-lg w-full max-w-md border border-slate-100">
                <div className="text-center mb-8">
                    <div className="bg-emerald-50 w-16 h-16 rounded-full flex justify-center items-center mx-auto mb-4">
                        <UserPlus size={40} className="text-emerald-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800">Create Account</h2>
                    <p className="text-slate-500 mt-2">Join our smart locker network</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="relative">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                        <div className="relative">
                            <span className="absolute left-3 top-3.5 text-slate-400">
                                <User size={18} />
                            </span>
                            <input 
                                type="text" 
                                placeholder="e.g. John Doe" 
                                required 
                                className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                                onChange={(e) => setFormData({...formData, name: e.target.value})} 
                            />
                        </div>
                    </div>

                    <div className="relative">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
                        <div className="relative">
                            <span className="absolute left-3 top-3.5 text-slate-400">
                                <User size={18} />
                            </span>
                            <input 
                                type="text" 
                                placeholder="e.g. john_doe" 
                                required 
                                className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                                onChange={(e) => setFormData({...formData, username: e.target.value})} 
                            />
                        </div>
                    </div>
                    
                    <div className="relative">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                        <div className="relative">
                            <span className="absolute left-3 top-3.5 text-slate-400">
                                <Mail size={18} />
                            </span>
                            <input 
                                type="email" 
                                placeholder="john@example.com" 
                                required 
                                className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                                onChange={(e) => setFormData({...formData, email: e.target.value})} 
                            />
                        </div>
                    </div>
                    
                    <div className="relative">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                        <div className="relative">
                            <span className="absolute left-3 top-3.5 text-slate-400">
                                <Lock size={18} />
                            </span>
                            <input 
                                type="password" 
                                placeholder="••••••••" 
                                required 
                                className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                                onChange={(e) => setFormData({...formData, password: e.target.value})} 
                            />
                        </div>
                    </div>
                    
                    <button 
                        type="submit" 
                        className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-lg shadow-md shadow-emerald-200 transition-all active:scale-95 mt-4"
                    >
                        Create Account
                    </button>
                </form>
                
                <p className="text-center mt-6 text-sm text-slate-600">
                    Already have an account?{' '}
                    <Link to="/login" className="text-emerald-600 hover:text-emerald-700 font-bold underline underline-offset-4 tracking-tight">
                        Login
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default Register;