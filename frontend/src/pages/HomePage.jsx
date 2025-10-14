import { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import LoginForm from '../components/auth/LoginForm';
import UserProfile from '../components/auth/UserProfile';
import StressSlider from '../components/stress/StressSlider';
import SuperstressButton from '../components/stress/SuperstressButton';
import { StressLevelContainer } from '../components/layout/StressLevelContainer';
function HomePage() {
  const { user, loading, refreshUser } = useAuth();

  // Always fetch user data when the component mounts
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        console.log('HomePage: Fetching user data from /me endpoint');
        await refreshUser();
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchUserData();
  }, []); // Empty dependency array ensures this runs only on mount

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-stone-950 text-stone-300">
        <div className="text-xl font-medium">
          <span className="inline-block animate-pulse text-purple-400">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <StressLevelContainer level={user ? user.lastStressLevel : null}>
      {!user && <LoginForm />}
      {user && (
        <div className="flex flex-col z-20 w-full max-w-xl mx-auto px-3 md:px-0">
          <UserProfile />
          <StressSlider />
          <SuperstressButton />
        </div>
      )}
    </StressLevelContainer>
  );
}

export default HomePage;
