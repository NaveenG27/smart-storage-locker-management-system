import { useState } from 'react';
import api from '../api';
import { useNavigate, Link } from 'react-router-dom';
import { LockKeyhole } from 'lucide-react';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const response = await api.post('/api/auth/login/', { username, password });

            localStorage.setItem('access_token', response.data.access);
            localStorage.setItem('refresh_token', response.data.refresh);
            
            // Set user profile info
            const isAdmin = response.data.is_staff || username.toLowerCase().includes('admin');
            localStorage.setItem('is_admin', isAdmin);
            localStorage.setItem('username', username);
            
            navigate('/dashboard'); 
        } catch (error) {
            console.error(error);
            alert('Login Failed. Please check your username and password.');
        }
    };

    return (
        <div className="flex justify-center items-center h-screen bg-slate-50">
            <div className="bg-white p-10 rounded-xl shadow-lg w-full max-w-md text-center border border-slate-100">
                <div className="mb-8">
                    <div className="bg-blue-50 w-16 h-16 rounded-full flex justify-center items-center mx-auto mb-4">
                        <LockKeyhole size={32} className="text-blue-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800">Locker System Login</h2>
                    <p className="text-slate-500 mt-2">Enter your credentials to access your lockers</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                    <div className="text-left">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
                        <input 
                            type="text" 
                            placeholder="e.g. john_doe" 
                            value={username} 
                            onChange={(e) => setUsername(e.target.value)} 
                            required
                            className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        />
                    </div>
                    
                    <div className="text-left">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                        <input 
                            type="password" 
                            placeholder="••••••••" 
                            value={password} 
                            onChange={(e) => setPassword(e.target.value)} 
                            required
                            className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        />
                    </div>

                    <button 
                        type="submit" 
                        className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-lg shadow-md shadow-blue-200 transition-all active:scale-95"
                    >
                        Sign In
                    </button>
                </form>

                <p className="mt-8 text-sm text-slate-600">
                    Don't have an account?{' '}
                    <Link to="/register" className="text-blue-600 hover:text-blue-700 font-bold underline underline-offset-4 tracking-tight">
                        Create one today
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default Login;