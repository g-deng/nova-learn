import { useState, useEffect } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import axios from "axios"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { motion } from "framer-motion"
import { ChevronLeft, ChevronRight } from "lucide-react"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"

type Flashcard = {
  id: string
  front: string
  back: string
  explanation?: string
}

export default function FlashcardViewer() {
  const [generating, setGenerating] = useState(false)
  const [flashcards, setFlashcards] = useState<Flashcard[] | null>(null)
  const [flipped, setFlipped] = useState<Record<string, boolean>>({})
  const location = useLocation()
  const navigate = useNavigate()

  const token = localStorage.getItem("authToken")
  if (!token) {
    navigate("/login")
    return
  }

  useEffect(() => {
    const getFlashcards = async () => {
      try {
        const result = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/flashcards/${location.hash.replace(
            "#",
            ""
          )}`,
          { headers: { Authorization: `Bearer ${token}` } }
        )
        if (result.status === 200) {
          setFlashcards(result.data)
        }
      } catch (error) {
        console.error("Failed to fetch flashcards:", error)
        if (axios.isAxiosError(error)) {
          if (error.response?.status === 401) {
            navigate("/login")
          }
        }
      }
    }

    getFlashcards()
  }, [location])

  const handleFlip = (id: string) => {
    setFlipped((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const handleGenerate = async () => {
    try {
      setGenerating(true)
      const result = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/flashcards/${location.hash.replace(
          "#",
          ""
        )}/generate`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      )
      if (result.status === 200) {
        setFlashcards(result.data)
        setFlipped({})
      }
    } catch (error) {
      console.error("Failed to fetch flashcards:", error)
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          navigate("/login")
        }
      }
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="w-full h-full flex flex-col items-center justify-center">
      {flashcards && flashcards.length === 0 && (
        <div className="flex flex-col items-center gap-4">
          <div className="text-gray-500">
            No flashcards available for this topic.
          </div>
          <Button
            disabled={generating || (flashcards?.length !== 0)}
            onClick={handleGenerate}
          >
            Generate
          </Button>
        </div>
      )}

      {(flashcards === null || flashcards.length > 0) && (
        <div className="flex flex-col justify-center items-center gap-4 w-full">
          {!flashcards && <Skeleton className="w-96 h-64 rounded-2xl" />}

          {flashcards && flashcards.length > 0 && (
            <Carousel className="w-96">
              <CarouselContent>
                {flashcards.map((card) => {
                  const isFlipped = flipped[card.id] || false
                  return (
                    <CarouselItem
                      key={card.id}
                      className="flex justify-center cursor-pointer"
                      onClick={() => handleFlip(card.id)}
                    >
                      <motion.div
                        className="w-96 h-64"
                        initial={false}
                        animate={{ rotateX: isFlipped ? 360 : 0 }}
                        transition={{ duration: 0.3 }}
                        style={{ perspective: 1000 }}
                      >
                        <Card className="w-full h-full flex items-center justify-center text-center text-lg font-medium rounded-2xl bg-white">
                          <CardContent className="flex items-center justify-center h-full">
                            <motion.div
                              className="absolute w-full px-4 font-bold"
                              style={{ backfaceVisibility: "hidden" }}
                              animate={{ opacity: isFlipped ? 0 : 1 }}
                            >
                              {card.front}
                            </motion.div>
                            <motion.div
                              className="absolute w-full px-4"
                              style={{ backfaceVisibility: "hidden" }}
                              animate={{ opacity: isFlipped ? 1 : 0 }}
                            >
                              {card.back}
                            </motion.div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    </CarouselItem>
                  )
                })}
              </CarouselContent>
              <CarouselPrevious>
                <ChevronLeft className="w-5 h-5" />
              </CarouselPrevious>
              <CarouselNext>
                <ChevronRight className="w-5 h-5" />
              </CarouselNext>
            </Carousel>
          )}

          {(!flashcards || flashcards.length === 0) && (
            <Skeleton className="w-24 h-5 rounded" />
          )}
        </div>
      )}
    </div>
  )
}
