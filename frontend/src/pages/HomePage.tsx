import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100">
      <h1 className="text-6xl font-bold mb-4">Learn with Nova.</h1>
      <Button>
        <a href="/login" className="text-white">
          Get Started
        </a>
      </Button>
    </div>
  );
}
