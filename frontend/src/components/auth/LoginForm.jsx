import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

export default function LoginForm() {
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, error } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!username.trim()) return;

    setIsLoading(true);
    try {
      await login(username);
    } catch (error) {
      // Error is handled in the auth context
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-stone-900 text-stone-100 rounded-lg shadow-lg shadow-stone-950/50 p-6 z-20 border border-stone-800">
      <h2 className="text-xl font-semibold mb-4 text-stone-100">Login</h2>

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="username" className="block text-stone-300 text-sm font-medium mb-2">
            Username
          </label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter your username"
            className="w-full px-3 py-2 bg-stone-800 border border-stone-700 text-stone-200 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-stone-500 focus:border-stone-600 placeholder-stone-500"
            disabled={isLoading}
            required
          />
        </div>

        {error && (
          <div className="mb-4 text-sm text-stone-300 bg-red-900/50 p-2 rounded-md border border-red-800">
            {error.includes('username is already taken')
              ? 'This username is already being used from a different location.'
              : error.includes('IP address is already associated')
              ? "You're already logged in with a different username."
              : error}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading || !username.trim()}
          className={`w-full py-2 px-4 rounded-md font-medium text-stone-50 
            ${
              isLoading || !username.trim()
                ? 'bg-purple-800/70 cursor-not-allowed'
                : 'bg-purple-700 hover:bg-purple-600 active:bg-purple-800'
            } 
            focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors duration-200 shadow-md`}
        >
          {isLoading ? 'Logging in...' : 'Login'}
        </button>
      </form>
    </div>
  );
}
