import { create } from 'zustand'

type SessionStatus = 'idle' | 'connecting' | 'connected' | 'ended' | 'error'

interface LiveSessionState {
  sessionId: string | null
  status: SessionStatus
  localStream: MediaStream | null
  remoteStream: MediaStream | null
  isMuted: boolean
  isCameraOff: boolean
  error: string | null
  setSessionId: (id: string) => void
  setStatus: (status: SessionStatus) => void
  setLocalStream: (stream: MediaStream | null) => void
  setRemoteStream: (stream: MediaStream | null) => void
  setError: (error: string | null) => void
  toggleMute: () => void
  toggleCamera: () => void
  reset: () => void
}

export const useLiveSessionStore = create<LiveSessionState>((set, get) => ({
  sessionId: null,
  status: 'idle',
  localStream: null,
  remoteStream: null,
  isMuted: false,
  isCameraOff: false,
  error: null,
  setSessionId: (id) => set({ sessionId: id }),
  setStatus: (status) => set({ status }),
  setLocalStream: (stream) => set({ localStream: stream }),
  setRemoteStream: (stream) => set({ remoteStream: stream }),
  setError: (error) => set({ error }),
  toggleMute: () => {
    const { localStream, isMuted } = get()
    localStream?.getAudioTracks().forEach((t) => { t.enabled = isMuted })
    set({ isMuted: !isMuted })
  },
  toggleCamera: () => {
    const { localStream, isCameraOff } = get()
    localStream?.getVideoTracks().forEach((t) => { t.enabled = isCameraOff })
    set({ isCameraOff: !isCameraOff })
  },
  reset: () => {
    const { localStream } = get()
    localStream?.getTracks().forEach((t) => t.stop())
    set({ sessionId: null, status: 'idle', localStream: null, remoteStream: null, isMuted: false, isCameraOff: false, error: null })
  },
}))
