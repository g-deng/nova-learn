import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  Loader2,
  Sparkles,
  Pencil,
  Shuffle,
  Dot
} from "lucide-react";
import { motion } from "framer-motion";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious
} from "@/components/ui/carousel";
import type { CarouselApi } from "@/components/ui/carousel";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Toggle } from "@/components/ui/toggle";
import api from "@/lib/api";
import TopicFilter from "@/components/topic-filter";
import { Textarea } from "@/components/ui/textarea";
import { DiscussionButton } from "@/components/chat-manager";

type Flashcard = {
  id: string;
  front: string;
  back: string;
  explanation?: string;
  topicId?: string;
  topicName?: string;
};

export default function FlashcardPage() {
  const { stackId } = useOutletContext<{ stackId: string }>();
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [topicFilter, setTopicFilter] = useState<string[]>([]);
  const [mode, setMode] = useState<"learn" | "free" | "missed">("free");
  const [topicCounts, setTopicCounts] = useState<TopicCount[]>([]);
  const [flashcardGeneration, setFlashcardGeneration] = useState<number>(0);
  const [shuffleFree, setShuffleFree] = useState(false);
  const [filteredCardsFree, setFilteredCardsFree] = useState<Flashcard[]>([]);

  useEffect(() => {
    const getFlashcards = async () => {
      try {
        const topicsResult = await api.get(`/stacks/${stackId}/topics`);
        const result = await api.get(`/flashcards/stack/${stackId}`);
        const flashcardsData = result.data.map((card: any) => ({
          id: card.id,
          front: card.front,
          back: card.back,
          explanation: card.explanation,
          topicId: card.topic_id,
          topicName:
            topicsResult.data.find((topic: any) => topic.id === card.topic_id)
              ?.name || "Unknown Topic"
        }));
        setFlashcards(flashcardsData);

        // Derive topicCounts from flashcards
        const topicMap: Record<string, TopicCount> = {};
        topicsResult.data.forEach((topic: any) => {
          topicMap[topic.id] = { id: topic.id, name: topic.name, count: 0 };
        });
        flashcardsData.forEach((card: any) => {
          if (card.topicId && topicMap[card.topicId]) {
            topicMap[card.topicId].count += 1;
          }
        });
        setTopicCounts(Object.values(topicMap));
      } catch (error) {
        console.error("Failed to fetch flashcards:", error);
      }
    };
    getFlashcards();
  }, [stackId, flashcardGeneration]);

  useEffect(() => {
    setFilteredCardsFree(
      flashcards
        ? flashcards.filter(
            (c) =>
              topicFilter.length === 0 ||
              (c.topicName && topicFilter.includes(c.topicName))
          )
        : []
    );
    if (shuffleFree) {
      setFilteredCardsFree((prev) => [...prev].sort(() => Math.random() - 0.5));
    }
  }, [flashcards, shuffleFree, topicFilter]);

  return (
    <div className="flex flex-col justify-between h-full w-full p-4">
      <Tabs
        className="flex-1 flex flex-col justify-between items-center"
        defaultValue="free"
        value={mode}
        onValueChange={(val) => setMode(val as any)}
      >
        {/* Header */}
        <div className="flex w-full justify-between items-center mb-2">
          <TabsList onChange={(val) => setMode(val as any)}>
            <TabsTrigger value="learn">Learn</TabsTrigger>
            <TabsTrigger value="free">Free</TabsTrigger>
            <TabsTrigger value="missed">Missed</TabsTrigger>
          </TabsList>
          <div className="flex gap-2">
            {mode === "free" && (
              <Toggle
                className="relative w-9 h-9 flex flex-col items-center justify-center"
                variant="outline"
                pressed={shuffleFree}
                onPressedChange={setShuffleFree}
              >
                <Shuffle className="w-8 h-8" />
                {shuffleFree && (
                  <Dot className="w-2 h-2 absolute top-3/7 mt-1 left-1/2 -translate-x-1/2" />
                )}
              </Toggle>
            )}
            <FlashcardGenerator
              topicCounts={topicCounts}
              setFlashcardGeneration={setFlashcardGeneration}
            />
            <TopicFilter
              topicFilter={topicFilter}
              setTopicFilter={setTopicFilter}
            />
          </div>
        </div>

        <TabsContent value="learn" className="flex flex-col justify-center">
          <LearnViewer topicFilter={topicFilter} />
        </TabsContent>
        <TabsContent
          value="free"
          className="flex flex-col justify-center items-center gap-2"
        >
          <CardViewer cards={filteredCardsFree} />
          <ModeFooter
            mode={mode}
            cardCt={flashcards.length}
            filteredCardCt={filteredCardsFree.length}
            topicFilter={topicFilter}
          />
        </TabsContent>
        <TabsContent value="missed" className="flex flex-col justify-center">
          <MissedViewer topicFilter={topicFilter} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

type TopicCount = {
  id: string;
  name: string;
  count: number;
};

function FlashcardGenerator({
  topicCounts,
  setFlashcardGeneration
}: {
  topicCounts: TopicCount[];
  setFlashcardGeneration: (func: (prev: number) => number) => void;
}) {
  const [openManage, setOpenManage] = useState(false);
  const [overallGenerating, setOverallGenerating] = useState(0);

  return (
    <div>
      <Button variant="outline" onClick={() => setOpenManage(true)}>
        {overallGenerating > 0 && (
          <Loader2 className="inline-block w-4 h-4 animate-spin" />
        )}{" "}
        Manage Flashcards
      </Button>

      <Dialog open={openManage} onOpenChange={setOpenManage}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Manage Flashcards</DialogTitle>
            <DialogDescription>
              View and generate flashcards by topic.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {topicCounts.map((t) => (
              <div key={t.name} className="flex justify-between items-center">
                <span className={t.count <= 0 ? "text-muted-foreground" : ""}>
                  {t.name}{" "}
                  <Badge variant={t.count <= 0 ? "outline" : "secondary"}>
                    {t.count}
                  </Badge>
                </span>
                <FlashcardGeneratorButton
                  topic={t}
                  setFlashcardGeneration={setFlashcardGeneration}
                  setOverallGenerating={setOverallGenerating}
                />
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function FlashcardGeneratorButton({
  topic,
  setFlashcardGeneration,
  setOverallGenerating
}: {
  topic: TopicCount;
  setFlashcardGeneration: (func: (prev: number) => number) => void;
  setOverallGenerating: (func: (prev: number) => number) => void;
}) {
  const [generating, setGenerating] = useState(false);

  const handleGenerate = async () => {
    setGenerating(true);
    setOverallGenerating((prev) => prev + 1);
    try {
      await api.post(`/flashcards/${topic.id}/generate`);
      alert(`Flashcards for ${topic.name} generated successfully!`);
      setFlashcardGeneration((prev) => prev + 1);
    } catch (error) {
      console.error("Failed to generate flashcards:", error);
    } finally {
      setGenerating(false);
      setOverallGenerating((prev) => prev - 1);
    }
  };

  return (
    <Button size="sm" onClick={handleGenerate}>
      {generating && <Loader2 className="inline-block w-4 h-4 animate-spin" />}
      Generate
    </Button>
  );
}

function ModeFooter({
  mode,
  cardCt,
  filteredCardCt,
  topicFilter
}: {
  mode: "learn" | "free" | "missed";
  cardCt: number;
  filteredCardCt: number;
  topicFilter: string[];
}) {
  let message = "";
  if (mode === "learn") {
    message = `${cardCt} cards for review`;
  } else if (mode === "free") {
    message = `Total ${cardCt} cards`;
  } else if (mode === "missed") {
    message = `${cardCt} frequently missed cards`;
  }

  let filterMsg = "";
  if (topicFilter.length > 0) {
    filterMsg = `Showing ${filteredCardCt} cards from topics:`;
  } else {
    filterMsg = `Showing ${filteredCardCt} cards from all topics`;
  }

  return (
    <div className="flex flex-col justify-center text-center text-sm text-muted-foreground m-8 gap-6">
      <div>
        {filterMsg}{" "}
        {topicFilter.length > 0 && <div>{topicFilter.join(", ")}</div>}
      </div>
      <div>{message}</div>
    </div>
  );
}

function LearnViewer({ topicFilter }: { topicFilter: string[] }) {
  const [carouselApi, setCarouselApi] = useState<CarouselApi | null>(null);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!carouselApi) {
      return;
    }
    setCurrent(carouselApi.selectedScrollSnap() + 1);
    carouselApi.on("select", () => {
      setCurrent(carouselApi.selectedScrollSnap() + 1);
    });
  }, [carouselApi]);

  const [flipped, setFlipped] = useState(false);
  const [cards, setCards] = useState<Flashcard[]>([]);
  const { stackId, setLayout } = useOutletContext<{
    stackId: string;
    setLayout: (func: (layout: string) => void) => void;
  }>();

  useEffect(() => {
    console.log("ready to learn");
    const fetchCardsAndTopics = async () => {
      const topicsResponse = await api.get(`/stacks/${stackId}/topics`);
      const response = await api.get(`/flashcards/${stackId}/learn`);
      setCards(
        response.data.map((card: any) => {
          return {
            ...card,
            topicName:
              topicsResponse.data.find(
                (topic: any) => topic.id === card.topic_id
              )?.name || "Unknown Topic"
          };
        })
      );
      console.log(response.data);
    };
    fetchCardsAndTopics();
  }, [stackId]);

  const handleResponse = async (grade: number) => {
    const idx = carouselApi ? carouselApi.selectedScrollSnap() : current;
    console.log(idx);
    if (idx - 1 >= cards.length) return;
    const flashcardId = cards[idx - 1].id;
    console.log("Adding review for flashcard:", cards[idx - 1].front);
    try {
      await api.post(`/flashcards/${flashcardId}/add_review`, {
        grade,
        latency_ms: 0
      });
    } catch (error) {
      console.error("Error adding review:", error);
    }
  };

  const filteredCards = cards.filter(
    (card) =>
      topicFilter.length === 0 ||
      (card.topicName && topicFilter.includes(card.topicName))
  );

  return (
    <div className="flex flex-col items-center gap-10">
      {filteredCards.length === 0 && <div>No cards due for review.</div>}
      <Carousel className="w-108 mx-auto mb-10" setApi={setCarouselApi}>
        <CarouselContent>
          {cards.map((card) => {
            if (
              topicFilter.length > 0 &&
              (!card.topicName || !topicFilter.includes(card.topicName))
            )
              return null;
            return (
              <CarouselItem
                key={card.id}
                className="flex justify-center cursor-pointer"
                onClick={() => setFlipped((prev) => !prev)}
              >
                <motion.div
                  className="w-108 h-72"
                  initial={false}
                  animate={{ rotateX: flipped ? 360 : 0 }}
                  transition={{ duration: 0.3 }}
                  style={{ perspective: 1000 }}
                >
                  <Card className="w-full h-full flex items-center justify-center text-center text-lg font-medium rounded-2xl bg-white">
                    {!flipped && (
                      <CardContent className="flex flex-col items-center justify-center h-full">
                        {card.front}
                      </CardContent>
                    )}
                    {flipped && (
                      <CardContent className="flex flex-col items-center justify-between h-full">
                        <Badge variant="secondary">
                          {card.topicName || "Unknown Topic"}
                        </Badge>
                        {card.back}
                        <div onClick={(e) => e.stopPropagation()}>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className="rounded-full w-8 h-8"
                              >
                                <Sparkles className="w-4 h-4" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-72">
                              <p className="text-sm">
                                {card.explanation || "No explanation provided."}
                              </p>
                            </PopoverContent>
                          </Popover>
                          <DiscussionButton
                            stackId={stackId}
                            type="flashcard"
                            refId={card.id}
                            setLayout={setLayout}
                          />
                        </div>
                      </CardContent>
                    )}
                  </Card>
                </motion.div>
              </CarouselItem>
            );
          })}
          <CarouselItem
            key="final"
            className="flex justify-center cursor-pointer"
          >
            {filteredCards.length > 0 && (
              <Card className="w-full h-full flex items-center justify-center text-center text-lg font-medium rounded-2xl bg-white">
                <CardContent className="flex flex-col items-center justify-center h-full">
                  Done reviewing!
                </CardContent>
              </Card>
            )}
          </CarouselItem>
        </CarouselContent>

        <div
          onClick={() => {
            setFlipped(false);
            handleResponse(0);
          }}
        >
          <CarouselNext
            variant="destructive"
            className="custom-carousel-under -translate-x-16"
          >
            <X />
          </CarouselNext>
        </div>
        <div
          onClick={() => {
            setFlipped(false);
            handleResponse(2);
          }}
        >
          <CarouselNext
            variant="outline"
            className="custom-carousel-under -translate-x-4"
          >
            ?
          </CarouselNext>
        </div>
        <div
          onClick={() => {
            setFlipped(false);
            handleResponse(5);
          }}
        >
          <CarouselNext
            variant="default"
            className="custom-carousel-under translate-x-8"
          >
            <Check className="w-5 h-5" />
          </CarouselNext>
        </div>
      </Carousel>
      <div>
        {filteredCards.length > 0 && current < filteredCards.length && (
          <div className="text-center text-sm text-muted-foreground">
            {current} of {filteredCards.length}
          </div>
        )}
        {filteredCards.length > 0 && current > filteredCards.length && (
          <div className="text-center text-sm text-muted-foreground">
            Nice work~
          </div>
        )}
        <ModeFooter
          mode="learn"
          cardCt={cards.length}
          filteredCardCt={filteredCards.length}
          topicFilter={topicFilter}
        />
      </div>
    </div>
  );
}

function MissedViewer({ topicFilter }: { topicFilter: string[] }) {
  const [cards, setCards] = useState<Flashcard[]>([]);
  const { stackId } = useOutletContext<{ stackId: string }>();

  useEffect(() => {
    const fetchCards = async () => {
      const topicsResponse = await api.get(`/stacks/${stackId}/topics`);
      const response = await api.get(`/flashcards/${stackId}/missed`);
      setCards(
        response.data.map((card: any) => {
          return {
            ...card,
            topicName:
              topicsResponse.data.find(
                (topic: any) => topic.id === card.topic_id
              )?.name || "Unknown Topic"
          };
        })
      );
      console.log(response.data);
    };
    fetchCards();
  }, [stackId]);

  const filteredCards = cards.filter(
    (card) =>
      topicFilter.length === 0 ||
      (card.topicName && topicFilter.includes(card.topicName))
  );

  return (
    <div>
      <CardViewer cards={filteredCards} />
      <ModeFooter
        mode="missed"
        cardCt={cards.length}
        filteredCardCt={filteredCards.length}
        topicFilter={topicFilter}
      />
    </div>
  );
}

function CardViewer({ cards }: { cards: Flashcard[] }) {
  const [flipped, setFlipped] = useState(false);
  const [open, setOpen] = useState("");
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  const [explanation, setExplanation] = useState("");
  const [carouselApi, setCarouselApi] = useState<CarouselApi | null>(null);
  const [curr, setCurr] = useState(0);
  const [deletedCards, setDeletedCards] = useState<Set<string>>(new Set());
  const { stackId, setLayout } = useOutletContext<{
    stackId: string;
    setLayout: (func: (layout: string) => void) => void;
  }>();

  useEffect(() => {
    carouselApi?.scrollTo(0);
    setCurr(0);
    setFlipped(false);
    setDeletedCards(new Set());
  }, [cards]);

  const handleSubmit = async () => {
    try {
      await api.post(`/flashcards/${cards[curr].id}/edit`, {
        front,
        back,
        explanation
      });
      setOpen("");
    } catch (err) {
      console.error("Edit failed:", err);
    }
  };

  const handleDelete = async () => {
    try {
      await api.post(`/flashcards/${cards[curr].id}/delete`, {
        front,
        back,
        explanation
      });
      setOpen("");
      setDeletedCards((prev) => new Set(prev).add(cards[curr].id));
      setFlipped(false);
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  if (!cards) return <Skeleton className="w-108 h-72 rounded-2xl" />;
  if (cards.length === 0)
    return <div className="text-center">No flashcards found. </div>;

  const viewCards = cards.filter((card) => !deletedCards.has(card.id));

  return (
    <Carousel className="w-108 mx-auto" setApi={setCarouselApi}>
      <CarouselContent>
        {viewCards.map((card) => (
          <CarouselItem
            key={card.id}
            className="flex justify-center cursor-pointer"
            onClick={() => setFlipped((prev) => !prev)}
          >
            <motion.div
              className="w-108 h-72"
              initial={false}
              animate={{ rotateX: flipped ? 360 : 0 }}
              transition={{ duration: 0.3 }}
              style={{ perspective: 1000 }}
            >
              <Card className="w-full h-full flex items-center justify-center text-center text-lg font-medium rounded-2xl bg-white">
                {!flipped && (
                  <CardContent className="flex flex-col items-center justify-center h-full">
                    {card.front}
                  </CardContent>
                )}
                {flipped && (
                  <CardContent className="flex flex-col items-center justify-between h-full">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">
                        {card.topicName || "Unknown Topic"}
                      </Badge>
                      <div onClick={(e) => e.stopPropagation()}>
                        <Dialog
                          open={open === card.id}
                          onOpenChange={(open) => setOpen(open ? card.id : "")}
                        >
                          <DialogTrigger asChild>
                            <Button
                              size="icon"
                              variant="outline"
                              className="w-8 h-8 rounded-full"
                              onClick={() => {
                                setCurr(cards.indexOf(card));
                                setFront(card.front);
                                setBack(card.back);
                                setExplanation(card.explanation || "");
                              }}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Edit Flashcard</DialogTitle>
                              <DialogDescription>
                                Make edits to the flashcard content. Flashcard
                                history will be preserved.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <Label className="pb-1">Front</Label>
                                <Input
                                  value={front}
                                  onChange={(e) => setFront(e.target.value)}
                                />
                              </div>
                              <div>
                                <Label className="pb-1">Back</Label>
                                <Input
                                  value={back}
                                  onChange={(e) => setBack(e.target.value)}
                                />
                              </div>
                              <div>
                                <Label className="pb-1">Explanation</Label>
                                <Textarea
                                  value={explanation}
                                  onChange={(e) =>
                                    setExplanation(e.target.value)
                                  }
                                />
                              </div>
                            </div>
                            <DialogFooter>
                              <div className="flex w-full justify-between">
                                <Button
                                  variant="destructive"
                                  onClick={handleDelete}
                                >
                                  Delete Card
                                </Button>
                                <Button onClick={handleSubmit}>Submit</Button>
                              </div>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                    {card.back}
                    <div onClick={(e) => e.stopPropagation()}>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-8 h-8 rounded-full"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Sparkles className="w-4 h-4" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-72">
                          <p className="text-sm">
                            {card.explanation || "No explanation provided."}
                          </p>
                        </PopoverContent>
                      </Popover>
                      <DiscussionButton
                        stackId={stackId}
                        type="flashcard"
                        refId={card.id}
                        setLayout={setLayout}
                      />
                    </div>
                  </CardContent>
                )}
              </Card>
            </motion.div>
          </CarouselItem>
        ))}
      </CarouselContent>

      <div onClick={() => setFlipped(false)}>
        <CarouselPrevious>
          <ChevronLeft className="w-5 h-5" />
        </CarouselPrevious>
      </div>
      <div onClick={() => setFlipped(false)}>
        <CarouselNext>
          <ChevronRight className="w-5 h-5" />
        </CarouselNext>
      </div>
    </Carousel>
  );
}
