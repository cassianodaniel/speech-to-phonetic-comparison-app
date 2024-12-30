'use client'

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { phrases } from '@/data/phrases'
import { Mic, MicOff, Play, RefreshCw } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

const scrollableTextArea = "max-h-32 overflow-y-auto"

// Previous ipaMap remains unchanged
const ipaMap: { [key: string]: string } = {
  'a': 'æ', 'e': 'ɛ', 'i': 'ɪ', 'o': 'ɒ', 'u': 'ʌ',
  'aa': 'ɑː', 'ee': 'iː', 'oo': 'uː',
  'ch': 'tʃ', 'sh': 'ʃ', 'th': 'θ', 'ng': 'ŋ',
}

export default function SpeechToPhoneticComparison() {
  const [isListening, setIsListening] = useState(false)
  const [spokenText, setSpokenText] = useState('')
  const [phoneticText, setPhoneticText] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [currentPhrase, setCurrentPhrase] = useState(phrases[0])
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])

  useEffect(() => {
    if (!('SpeechRecognition' in window) && !('webkitSpeechRecognition' in window)) {
      setError('Speech recognition is not supported in this browser.')
      return
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    recognitionRef.current = new SpeechRecognition()

    if (recognitionRef.current) {
      recognitionRef.current.continuous = true
      recognitionRef.current.interimResults = false
      recognitionRef.current.lang = 'en-US'

      recognitionRef.current.onstart = () => {
        setIsListening(true)
        setError(null)
      }

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error)
        setError(`Speech recognition error: ${event.error}`)
        setIsListening(false)
      }

      recognitionRef.current.onend = () => {
        setIsListening(false)
      }

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript
        setSpokenText(transcript)
        const phonetic = convertToPhonetic(transcript)
        setPhoneticText(phonetic)
        compareAndSetResults(transcript, phonetic)
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
    }
  }, [])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaRecorderRef.current = new MediaRecorder(stream)
      audioChunksRef.current = []

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data)
      }

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' })
        setAudioBlob(audioBlob)
      }

      mediaRecorderRef.current.start()
      recognitionRef.current?.start()
    } catch (err) {
      console.error('Error accessing microphone:', err)
      setError('Error accessing microphone. Please check your permissions.')
    }
  }

  const stopRecording = () => {
    mediaRecorderRef.current?.stop()
    recognitionRef.current?.stop()
  }

  const toggleListening = () => {
    if (isListening) {
      stopRecording()
    } else {
      startRecording()
    }
  }

  const convertToPhonetic = (text: string): string => {
    return text.toLowerCase().split(' ').map(word => {
      let phonetic = ''
      for (let i = 0; i < word.length; i++) {
        if (i < word.length - 1 && ipaMap[word.substr(i, 2)]) {
          phonetic += ipaMap[word.substr(i, 2)]
          i++
        } else if (ipaMap[word[i]]) {
          phonetic += ipaMap[word[i]]
        } else {
          phonetic += word[i]
        }
      }
      return phonetic
    }).join(' ')
  }

  const compareAndSetResults = (spokenText: string, phoneticSpoken: string) => {
    // This function is now empty as we've removed the comparison logic
  }

  const getNewPhrase = () => {
    const newPhrase = phrases[Math.floor(Math.random() * phrases.length)]
    setCurrentPhrase(newPhrase)
    setSpokenText('')
    setPhoneticText('')
    setAudioBlob(null)
  }

  const playSpokenAudio = () => {
    if (audioBlob) {
      const audioUrl = URL.createObjectURL(audioBlob)
      const audio = new Audio(audioUrl)
      audio.play()
    }
  }

  const playExpectedAudio = () => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(currentPhrase.text)
      utterance.lang = 'en-US'
      window.speechSynthesis.speak(utterance)
    }
  }

  return (
    <div className="container mx-auto p-4">
      <Card className="w-full max-w-6xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Pronunciation Practice</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-6">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Expected Phrase:</h3>
                <p className={`bg-muted p-4 rounded-md ${scrollableTextArea}`}>{currentPhrase.text}</p>
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Expected Phonetic (IPA):</h3>
                <p className={`font-mono bg-muted p-4 rounded-md ${scrollableTextArea}`}>{currentPhrase.ipa}</p>
              </div>
              <Button onClick={playExpectedAudio} className="w-full">
                <Play className="mr-2 h-4 w-4" /> Play Expected Audio
              </Button>
            </div>
            <div className="space-y-6">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Your Spoken Text:</h3>
                <p className={`bg-muted p-4 rounded-md ${scrollableTextArea}`}>{spokenText || 'Your spoken text will appear here.'}</p>
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Your Phonetic (IPA):</h3>
                <p className={`font-mono bg-muted p-4 rounded-md ${scrollableTextArea}`}>{phoneticText || 'Your phonetic transcription will appear here.'}</p>
              </div>
              <Button onClick={playSpokenAudio} className="w-full" disabled={!audioBlob}>
                <Play className="mr-2 h-4 w-4" /> Play Your Audio
              </Button>
            </div>
          </div>
          <Separator className="my-6" />
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={toggleListening}
              variant={isListening ? "destructive" : "default"}
              className="flex-1"
              size="lg"
            >
              {isListening ? (
                <>
                  <MicOff className="mr-2 h-5 w-5" /> Stop Recording
                </>
              ) : (
                <>
                  <Mic className="mr-2 h-5 w-5" /> Start Recording
                </>
              )}
            </Button>
            <Button onClick={getNewPhrase} variant="outline" size="lg">
              <RefreshCw className="mr-2 h-5 w-5" /> New Phrase
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

