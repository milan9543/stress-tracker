import { useAuth } from '../../contexts/AuthContext';
import LogoutButton from './LogoutButton';

export default function UserProfile() {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  return (
    <div className="bg-stone-900 rounded-lg shadow-lg shadow-stone-950/50 p-3 md:p-6 mb-4 md:mb-6 border border-stone-800 text-stone-100">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-base md:text-xl font-semibold">
            Hello, <span className="text-purple-400">{user.user.username}!</span>
          </h2>
        </div>
        <LogoutButton />
      </div>
    </div>
  );
}
