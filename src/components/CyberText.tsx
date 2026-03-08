import { useState, useEffect } from 'react';

interface CyberTextProps {
  textEn: string;
  textCn: string;
  interval?: number;
  theme: 'dark' | 'light';
}

export function CyberText({ textEn, textCn, interval = 4000, theme }: CyberTextProps) {
  const [displayText, setDisplayText] = useState('');
  const [targetText, setTargetText] = useState(textEn);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showEn, setShowEn] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  
  // Typewriter logic
  useEffect(() => {
    if (isHovered) return; // Pause on hover

    const typingSpeed = isDeleting ? 30 : 50; // Deleting is faster
    const pauseTime = 2000; // Pause when fully typed

    const handleType = () => {
      const currentText = displayText;
      
      if (isDeleting) {
        // Deleting
        setDisplayText(currentText.substring(0, currentText.length - 1));
        if (currentText.length === 0) {
          setIsDeleting(false);
          setShowEn(!showEn);
          setTargetText(!showEn ? textEn : textCn);
        }
      } else {
        // Typing
        setDisplayText(targetText.substring(0, currentText.length + 1));
        if (currentText === targetText) {
          // Finished typing, wait before deleting
          // We handle the pause with a timeout outside this tight loop usually,
          // but here we can just set a timeout to toggle isDeleting
          // However, using setTimeout inside useEffect with deps is tricky.
          // Let's use a simpler approach:
        }
      }
    };

    // Advanced Typewriter Hook
    let timer: any;
    
    if (!isDeleting && displayText === targetText) {
      // Pause at the end
      timer = setTimeout(() => setIsDeleting(true), pauseTime);
    } else if (isDeleting && displayText === '') {
      // Pause at the start (already handled by state change, but small delay feels natural)
      timer = setTimeout(handleType, 200);
    } else {
      // Typing or Deleting
      timer = setTimeout(handleType, typingSpeed);
    }

    return () => clearTimeout(timer);
  }, [displayText, isDeleting, targetText, isHovered, showEn, textEn, textCn]);

  // Manual toggle
  const handleClick = () => {
    setIsDeleting(true); // Trigger delete immediately
  };

  return (
    <div 
      className={`
        pointer-events-auto cursor-pointer 
        relative overflow-hidden
        px-4 py-2 rounded-full border 
        transition-all duration-300
        backdrop-blur-md  /* Frosted Glass Effect */
        group
        ${theme === 'dark' 
          ? 'bg-black/40 border-white/10 hover:border-cyan-500/50 hover:bg-black/60 hover:shadow-[0_0_15px_rgba(6,182,212,0.3)]' 
          : 'bg-white/60 border-black/5 hover:border-blue-500/30 hover:bg-white/80 hover:shadow-[0_0_15px_rgba(59,130,246,0.2)]'
        }
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
    >
      <div className="relative flex items-center justify-center min-w-[350px] h-4">
        <div 
          className={`
            font-mono text-xs tracking-wide
            ${theme === 'dark' ? 'text-gray-300 group-hover:text-cyan-400' : 'text-gray-600 group-hover:text-blue-600'}
          `}
        >
          <span className="opacity-50 mr-2">{showEn ? 'NAV:' : '指南:'}</span>
          {displayText}
          <span className="animate-pulse ml-1 inline-block w-1.5 h-3 bg-current align-middle"></span>
        </div>
      </div>
    </div>
  );
}
