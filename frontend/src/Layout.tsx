import React from "react";
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
  SidebarTrigger,
  useSidebar
} from "./components/ui/sidebar";

const items = [{ title: "Stacks", url: "/stacks" }];

function AppSidebar() {
  const { setOpen } = useSidebar();

  React.useEffect(() => {
    setOpen(false);
  }, [setOpen]);
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
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      <SidebarProvider>
        <AppSidebar />
        <div className="flex flex-col flex-1">
          <header className="flex-none bg-white shadow px-4 py-2 flex items-center justify-between">
            <SidebarTrigger />
            <h1 className="text-xl font-bold">Nova Learn</h1>
            <Button variant="outline" onClick={logout}>
              Log out
            </Button>
          </header>

          <main className="flex-1 overflow-auto">
            <Outlet />
          </main>
        </div>
      </SidebarProvider>
    </div>
  );
}
