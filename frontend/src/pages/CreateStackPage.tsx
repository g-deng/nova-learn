import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import api from "@/lib/api";
import { useNavigate } from "react-router-dom";

const formSchema = z.object({
  title: z.string().min(2).max(50),
  description: z.string().max(200).optional(),
  notes: z.string().max(500).optional(),
  attach: z.string().url().optional()
});

export default function CreateStackPage() {
  const navigate = useNavigate();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: ""
    }
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values);
    try {
      const res = await api.post("/stacks/add_stack", {
        name: values.title,
        description: values.description
      });
      console.log("Stack created successfully");
      navigate(`/stack/${res.data.id}`, {
        state: { description: values.description }
      });
    } catch (error) {
      console.error("Failed to create stack");
    }
  }

  return (
    <div className="flex flex-col gap-2 items-center justify-center min-h-screen">
      <h1 className="text-2xl font-bold p-4">Create a New Study Stack</h1>
      <Card className="min-w-1/2">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col gap-6 p-4"
          >
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input required placeholder="Biomechanics" {...field} />
                  </FormControl>
                  <FormDescription>Name your study stack!</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input
                      required
                      placeholder="How we quantify and predict the mechanical properties of biological materials."
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>Describe your study stack.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Study goals and notes</FormLabel>
                  <FormControl>
                    <Textarea
                      className="resize-none"
                      placeholder="I want to focus on..."
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>What do you want to learn?</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="attach"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Attachments</FormLabel>
                  <FormControl>
                    <Input
                      type="file"
                      accept=".pdf,.docx,.txt"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          field.onChange(file.name);
                        }
                      }}
                    />
                  </FormControl>
                  {field.value && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Selected: {field.value}
                    </p>
                  )}
                  <FormDescription>Attach a syllabus or notes.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex flex-col gap-2">
              <Button type="submit">Submit</Button>
              <Button
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate("/stacks");
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Form>
      </Card>
    </div>
  );
}
