import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { JitsiMeeting } from '@jitsi/react-sdk';
import { ArrowLeft, Video, Copy, CheckCircle } from 'lucide-react';

export default function VideoCall() {
  const { user, userProfile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [roomName, setRoomName] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const room = params.get('room');
    if (room) {
      setRoomName(room);
    } else {
      // Generate a random room name if none provided
      const newRoom = `BrighterMonday-${Math.random().toString(36).substring(2, 12)}`;
      navigate(`/video-call?room=${newRoom}`, { replace: true });
      setRoomName(newRoom);
    }
  }, [location.search, navigate]);

  const handleCopyLink = () => {
    const url = `${window.location.origin}/video-call?room=${roomName}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!roomName) {
    return (
      <div className="min-h-screen bg-[#fdfbf7] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-800 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#111] flex flex-col font-sans">
      <header className="bg-[#1a1a1a] border-b border-[#333] p-4 flex items-center justify-between z-10">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-[#333] rounded-full transition-colors text-slate-300"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-2 text-white">
            <Video className="w-5 h-5 text-amber-500" />
            <h1 className="text-lg font-bold tracking-tight">BrighterMonday Video Room</h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleCopyLink}
            className="flex items-center gap-2 text-sm font-medium text-slate-300 hover:text-white bg-[#333] hover:bg-[#444] px-4 py-2 rounded-xl transition-colors"
          >
            {copied ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied!' : 'Copy Invite Link'}
          </button>
        </div>
      </header>

      <main className="flex-1 w-full relative">
        <JitsiMeeting
          domain="meet.jit.si"
          roomName={roomName}
          configOverwrite={{
            startWithAudioMuted: true,
            disableModeratorIndicator: true,
            startScreenSharing: true,
            enableEmailInStats: false,
            prejoinPageEnabled: false
          }}
          interfaceConfigOverwrite={{
            DISABLE_JOIN_LEAVE_NOTIFICATIONS: true,
            SHOW_CHROME_EXTENSION_BANNER: false
          }}
          userInfo={{
            displayName: userProfile?.displayName || user?.email?.split('@')[0] || 'Guest',
            email: user?.email || 'guest@alphahunt.com'
          }}
          onApiReady={(externalApi) => {
            // Here you can attach custom event listeners to the Jitsi Meet External API
            // you can also store it locally to execute commands
          }}
          getIFrameRef={(iframeRef) => {
            iframeRef.style.height = '100%';
            iframeRef.style.width = '100%';
          }}
        />
      </main>
    </div>
  );
}
