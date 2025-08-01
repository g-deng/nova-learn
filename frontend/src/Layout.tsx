import { Outlet } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger
} from "./components/ui/sidebar";

const items = [
  { title: "Stacks", url: "/stacks" }
]

function AppSidebar() {
  return (
    <Sidebar>
      <SidebarHeader />
      <SidebarContent>
        <SidebarGroup>
        <SidebarGroupLabel>Navigation</SidebarGroupLabel>
        <SidebarGroupContent>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild>
                <a href={item.url}>
                  <span>{item.title}</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter />
    </Sidebar>
  );
}

export default function Layout() {
  const logout = () => {
    localStorage.removeItem("authToken");
    window.location.href = "/login";
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <div className="min-h-screen w-full flex flex-col">
        <header className="bg-white shadow px-6 py-4 flex items-center justify-between">
          <SidebarTrigger />
          <h1 className="text-xl font-bold">Nova Learn</h1>
          <Button variant="outline" onClick={logout}>Log out</Button>
        </header>
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </SidebarProvider>
  );
}
