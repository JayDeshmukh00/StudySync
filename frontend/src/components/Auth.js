import React, { useState } from 'react';

// The shared AuthForm component remains the same as it is logically correct.
export const AuthForm = ({ isLogin, onSubmit, onSwitch, error }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = (e) => {
      e.preventDefault();
      // For login, name will be an empty string, which is fine.
      onSubmit({ name, email, password });
    };

    return (
      <div className="h-screen w-screen flex items-center justify-center">
        <div className="bg-white/10 dark:bg-black/50 backdrop-blur-sm p-8 rounded-xl shadow-2xl shadow-blue-900/20 border border-blue-800/30 w-full max-w-md">
          <h2 className="text-3xl font-bold text-center mb-8">{isLogin ? 'Login' : 'Sign Up'}</h2>
          <form onSubmit={handleSubmit}>
            {!isLogin && (
              <div className="mb-4">
                <label className="block text-gray-400 text-sm font-bold mb-2" htmlFor="name">Name</label>
                <input value={name} onChange={e => setName(e.target.value)} className="w-full px-3 py-2 text-gray-300 bg-gray-900/50 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500" id="name" type="text" placeholder="Name" required />
              </div>
            )}
            <div className="mb-4">
              <label className="block text-gray-400 text-sm font-bold mb-2" htmlFor="email">Email</label>
              <input value={email} onChange={e => setEmail(e.target.value)} className="w-full px-3 py-2 text-gray-300 bg-gray-900/50 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500" id="email" type="email" placeholder="Email" required />
            </div>
            <div className="mb-6">
              <label className="block text-gray-400 text-sm font-bold mb-2" htmlFor="password">Password</label>
              <input value={password} onChange={e => setPassword(e.target.value)} className="w-full px-3 py-2 text-gray-300 bg-gray-900/50 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500" id="password" type="password" placeholder="Password" required />
            </div>
            {error && <p className="text-red-400 text-xs italic mb-4">{error}</p>}
            <div className="flex items-center justify-between">
              <button className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded-lg focus:outline-none" type="submit">
                {isLogin ? 'Sign In' : 'Create Account'}
              </button>
              <button type="button" className="inline-block align-baseline font-bold text-sm text-blue-500 hover:text-blue-400" onClick={onSwitch}>
                {isLogin ? 'Create an Account' : 'Already have an account?'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
};

export const LoginPage = ({ onLoginSuccess, onSwitchToSignUp }) => {
    const [error, setError] = useState('');
    const handleLogin = async (credentials) => {
      try {
        const res = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(credentials),
        });
        const data = await res.json();
        if (res.ok) {
          localStorage.setItem('token', data.token);
          onLoginSuccess();
        } else {
          // FIX: Changed data.msg to data.message to match the backend response
          setError(data.message || 'Login failed');
        }
      } catch (err) {
        setError('Server error. Is the backend running?');
      }
    };
    return <AuthForm isLogin={true} onSubmit={handleLogin} onSwitch={onSwitchToSignUp} error={error} />;
};
 
export const SignUpPage = ({ onSignUpSuccess, onSwitchToLogin }) => {
    const [error, setError] = useState('');
    const handleSignUp = async (credentials) => {
      try {
        const res = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/api/auth/signup`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(credentials),
        });
        const data = await res.json();
        if (res.ok) {
          localStorage.setItem('token', data.token);
          onSignUpSuccess();
        } else {
          // FIX: Changed data.msg to data.message to match the backend response
          setError(data.message || 'Sign up failed');
        }
      } catch (err) {
        setError('Server error. Is the backend running?');
      }
    };
    return <AuthForm isLogin={false} onSubmit={handleSignUp} onSwitch={onSwitchToLogin} error={error} />;
};
