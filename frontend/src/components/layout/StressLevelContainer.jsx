import './stress-level-container.css';
import clsx from 'clsx';

export const StressLevelContainer = ({ children, level = 100 }) => {
  console.log(level);
  return (
    <div
      id="stress-level-container"
      className="bg-stone-900 h-screen w-screen flex flex-col items-center justify-center relative pl-16 p-4 lg:pl-0 overflow-hidden"
    >
      {children}

      <div className="absolute left-0 top-0 flex h-screen justify-between flex-col-reverse text-stone-700">
        {Array.from({ length: 11 }).map((_, index) => (
          <div key={index} className="flex flex-row relative">
            <div className={`h-[2px] w-4 m-0.5 rounded-full bg-stone-700`}></div>
            {index !== 10 && index !== 0 && (
              <span className="absolute -translate-y-1/2 left-6 mt-0.5 leading-none text-sm">
                {index * 10}
              </span>
            )}
          </div>
        ))}
      </div>
      <div className="absolute left-0 top-0 flex h-screen justify-between flex-col-reverse text-stone-700">
        {Array.from({ length: 101 }).map((_, index) => (
          <div key={index} className="flex flex-row relative">
            <div className={`h-[1px] w-2 m-0.5 rounded-full bg-stone-700`}></div>
          </div>
        ))}
      </div>

      <div
        id="stress-level-indicator"
        className={`absolute bottom-0 left-[2px] right-[2px] transition-all h-[200%] ease-in-out duration-1000 z-10 rounded-t-md`}
        style={{ top: `${100 - level}%` }}
      >
        <div
          className={clsx(
            'w-full h-full border border-b-0 rounded-t-md transition-all ease-in-out duration-1000',
            {
              'bg-green-500/20 border-green-500/50': level <= 20,
              'bg-lime-500/20 border-lime-500/50': level > 20 && level <= 40,
              'bg-yellow-500/20 border-yellow-500/50': level > 40 && level <= 60,
              'bg-amber-500/20 border-amber-500/50': level > 60 && level <= 80,
              'bg-orange-500/20 border-orange-500/50': level > 80 && level <= 99,
              'bg-red-500/20 border-red-500/50': level > 99,
            }
          )}
        />
      </div>
    </div>
  );
};
