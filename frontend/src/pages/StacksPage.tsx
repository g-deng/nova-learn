import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default function StacksPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-6">Hi, Grace.</h1>
        <p className="text-lg mb-4">What do you want to study today?</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 max-w-4xl w-full px-4">
        <Card>
          <CardHeader>
            <CardTitle>Example Stack 1</CardTitle>
            <CardDescription>
              Example stack description goes here.
            </CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Example Stack 2</CardTitle>
            <CardDescription>
              Example stack description goes here.
            </CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Example Stack 3</CardTitle>
            <CardDescription>
              Example stack description goes here.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}