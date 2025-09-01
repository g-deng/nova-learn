import api from "@/lib/api";
import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Filter } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem
} from "@/components/ui/command";
import { cn } from "@/lib/utils";

export default function TopicFilter({
  topicFilter,
  setTopicFilter
}: {
  topicFilter: string[];
  setTopicFilter: (topics: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [topics, setTopics] = useState<string[]>([]);
  const { stackId } = useOutletContext<{ stackId: string }>();

  useEffect(() => {
    const getTopics = async () => {
      try {
        const response = await api.get(`/stacks/${stackId}/topics`);
        setTopics(response.data.map((t: { name: string }) => t.name));
      } catch (error) {
        console.error("Error fetching topics:", error);
      }
    };
    getTopics();
  }, [stackId]);

  const toggleTopic = (topic: string) => {
    setTopicFilter(
      topicFilter.includes(topic)
        ? topicFilter.filter((t) => t !== topic)
        : [...topicFilter, topic]
    );
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <Filter className="h-4 w-4" />
          {topicFilter.length > 0 ? `${topicFilter.length} selected` : "Filter"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-0">
        <Command>
          <CommandInput placeholder="Search topics..." />
          <CommandEmpty>No topics found.</CommandEmpty>
          <CommandGroup className="max-h-48 overflow-y-auto">
            {topics.map((topic) => (
              <CommandItem
                key={topic}
                onSelect={() => toggleTopic(topic)}
                className="flex items-center gap-2"
              >
                <Check
                  className={cn(
                    "h-4 w-4",
                    topicFilter.includes(topic) ? "opacity-100" : "opacity-0"
                  )}
                />
                {topic}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
        {topicFilter.length > 0 && (
          <div className="flex flex-wrap gap-1 border-t p-2">
            {topicFilter.map((topic) => (
              <Badge
                key={topic}
                variant="secondary"
                className="cursor-pointer"
                onClick={() => toggleTopic(topic)}
              >
                {topic} ✕
              </Badge>
            ))}
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto text-xs"
              onClick={() => setTopicFilter([])}
            >
              Clear
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
