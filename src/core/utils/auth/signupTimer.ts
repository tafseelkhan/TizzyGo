// utiles/signupTimer.ts
import { useEffect } from 'react';

export const useCountdownTimer = (
  waitTime: number,
  setWaitTime: (time: number) => void,
) => {
  useEffect(() => {
    if (waitTime > 0) {
      const timer = setTimeout(() => setWaitTime(waitTime - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [waitTime, setWaitTime]);
};
