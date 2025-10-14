import { useAuth } from '../../contexts/AuthContext';

export default function LogoutButton() {
  const { logout } = useAuth();

  return (
    <button
      onClick={logout}
      className="px-2 py-1 md:px-4 md:py-2 text-xs md:text-sm bg-stone-800 text-stone-300 rounded-md hover:bg-stone-700 
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-stone-600
        transition-colors duration-200 border border-stone-700"
    >
      Logout
    </button>
  );
}
