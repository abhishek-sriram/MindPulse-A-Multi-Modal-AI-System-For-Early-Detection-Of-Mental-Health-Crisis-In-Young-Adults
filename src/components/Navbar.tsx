import { Link, useNavigate } from "react-router-dom";
import { Brain, LogOut, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./ThemeToggle";
import { getUser, clearUser } from "@/lib/user-session";

export function Navbar() {
  const user = getUser();
  const navigate = useNavigate();

  const handleLogout = () => {
    clearUser();
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
      <div className="container flex h-14 items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-serif font-bold text-lg text-primary">
          <Brain className="h-6 w-6" />
          MindPulse
        </Link>
        <div className="flex items-center gap-2">
          {user && (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/history"><History className="h-4 w-4 mr-1" />History</Link>
              </Button>
              <span className="text-sm text-muted-foreground hidden sm:inline">{user.name}</span>
              <Button variant="ghost" size="icon" onClick={handleLogout} aria-label="Log out">
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          )}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
