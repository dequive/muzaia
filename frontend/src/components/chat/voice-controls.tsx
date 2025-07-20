
'use client'

import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Volume2,
  VolumeX,
  Pause,
  Play,
  RotateCcw,
  Settings,
  Mic,
  MicOff,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

interface VoiceControlsProps {
  text: string
  onSpeechStart?: () => void
  onSpeechEnd?: () => void
  className?: string
}

export function VoiceControls({
  text,
  onSpeechStart,
  onSpeechEnd,
  className
}: VoiceControlsProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [volume, setVolume] = useState([1])
  const [rate, setRate] = useState([1])
  const [pitch, setPitch] = useState([1])
  const [selectedVoice, setSelectedVoice] = useState<string>('')
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)

  // Load available voices
  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = speechSynthesis.getVoices()
      setVoices(availableVoices)
      
      // Select first Portuguese voice or default
      const ptVoice = availableVoices.find(voice => 
        voice.lang.startsWith('pt') || voice.lang.startsWith('en')
      )
      if (ptVoice && !selectedVoice) {
        setSelectedVoice(ptVoice.name)
      }
    }

    loadVoices()
    speechSynthesis.addEventListener('voiceschanged', loadVoices)
    
    return () => {
      speechSynthesis.removeEventListener('voiceschanged', loadVoices)
    }
  }, [selectedVoice])

  const handleSpeak = () => {
    if (!text.trim()) return

    if (isPlaying) {
      speechSynthesis.cancel()
      setIsPlaying(false)
      onSpeechEnd?.()
      return
    }

    const utterance = new SpeechSynthesisUtterance(text)
    const voice = voices.find(v => v.name === selectedVoice)
    
    if (voice) {
      utterance.voice = voice
    }
    
    utterance.volume = isMuted ? 0 : volume[0]
    utterance.rate = rate[0]
    utterance.pitch = pitch[0]

    utterance.onstart = () => {
      setIsPlaying(true)
      onSpeechStart?.()
    }

    utterance.onend = () => {
      setIsPlaying(false)
      onSpeechEnd?.()
    }

    utterance.onerror = () => {
      setIsPlaying(false)
      onSpeechEnd?.()
    }

    utteranceRef.current = utterance
    speechSynthesis.speak(utterance)
  }

  const handleStop = () => {
    speechSynthesis.cancel()
    setIsPlaying(false)
    onSpeechEnd?.()
  }

  const toggleMute = () => {
    setIsMuted(!isMuted)
    if (utteranceRef.current) {
      // Update current utterance volume
      speechSynthesis.cancel()
      if (isPlaying) {
        handleSpeak()
      }
    }
  }

  return (
    <div className={cn("flex items-center space-x-2", className)}>
      {/* Play/Pause button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={handleSpeak}
        disabled={!text.trim()}
        className="h-8 w-8 p-0"
      >
        {isPlaying ? (
          <Pause className="h-4 w-4" />
        ) : (
          <Play className="h-4 w-4" />
        )}
      </Button>

      {/* Mute button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={toggleMute}
        className="h-8 w-8 p-0"
      >
        {isMuted ? (
          <VolumeX className="h-4 w-4" />
        ) : (
          <Volume2 className="h-4 w-4" />
        )}
      </Button>

      {/* Voice settings */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <Settings className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80">
          <DropdownMenuLabel>Configurações de Voz</DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          {/* Voice selection */}
          <div className="p-2">
            <label className="text-sm font-medium mb-2 block">Voz</label>
            <select
              value={selectedVoice}
              onChange={(e) => setSelectedVoice(e.target.value)}
              className="w-full p-1 text-sm border rounded"
            >
              {voices.map((voice) => (
                <option key={voice.name} value={voice.name}>
                  {voice.name} ({voice.lang})
                </option>
              ))}
            </select>
          </div>

          {/* Volume control */}
          <div className="p-2">
            <label className="text-sm font-medium mb-2 block">
              Volume: {Math.round(volume[0] * 100)}%
            </label>
            <Slider
              value={volume}
              onValueChange={setVolume}
              max={1}
              min={0}
              step={0.1}
              className="w-full"
            />
          </div>

          {/* Rate control */}
          <div className="p-2">
            <label className="text-sm font-medium mb-2 block">
              Velocidade: {rate[0]}x
            </label>
            <Slider
              value={rate}
              onValueChange={setRate}
              max={2}
              min={0.1}
              step={0.1}
              className="w-full"
            />
          </div>

          {/* Pitch control */}
          <div className="p-2">
            <label className="text-sm font-medium mb-2 block">
              Tom: {pitch[0]}
            </label>
            <Slider
              value={pitch}
              onValueChange={setPitch}
              max={2}
              min={0}
              step={0.1}
              className="w-full"
            />
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Status indicator */}
      {isPlaying && (
        <Badge variant="secondary" className="text-xs">
          Reproduzindo...
        </Badge>
      )}
    </div>
  )
}
