import { Outlet } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function Layout() {
  const logout = () => {
    localStorage.removeItem("authToken");
    window.location.href = "/login";
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white shadow px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">Nova Learn</h1>
        <Button variant="outline" onClick={logout}>Log out</Button>
      </header>
      <main className="flex-1 p-6">
        <Outlet />
      </main>
    </div>
  );
}
