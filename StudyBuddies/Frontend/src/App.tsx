import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import Sidebar from "./components/layout/Sidebar";
import { syncGoogleUser } from "./api/syncGoogleUser";
import { supabase } from "./supabase";
import { EventProvider } from "./context/EventContext";
import { GroupsProvider } from "./context/GroupsContext";
import { UserProvider } from "./context/UserContext";
import CalendarPage from "./features/Calendar/CalendarPage";
import ForgotPassword from "./features/auth/pages/ForgotPassword";
import Login from "./features/auth/pages/Login";
import ResetPassword from "./features/auth/pages/ResetPassword";
import Signup from "./features/auth/pages/SignUp";
import ChatsPage from "./features/chats/ChatsPage";
import Dashboard from "./features/dashboard/pages/Dashboard";
import FilesPage from "./features/files/FilesPage";
import GroupsPage from "./features/groups/GroupsPage";

function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="app-shell">
      <Sidebar />
      <div className="page-area">{children}</div>
    </div>
  );
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => !!localStorage.getItem("user"),
  );
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    const persistGoogleUser = async (user: {
      id: string;
      email?: string;
      user_metadata?: { full_name?: string };
    }) => {
      const fullName = user.user_metadata?.full_name ?? "";
      const [firstName = user.email?.split("@")[0] ?? "User", ...rest] = fullName.split(" ");
      const lastName = rest.join(" ");

      try {
        const syncedUser = await syncGoogleUser({
          email: user.email ?? "",
          firstName,
          lastName,
          supabaseId: user.id,
        });

        localStorage.setItem(
          "user",
          JSON.stringify(syncedUser),
        );
        if (syncedUser.token) {
          localStorage.setItem("token", syncedUser.token);
        }
        window.dispatchEvent(new Event("auth-changed"));
      } catch {
        localStorage.removeItem("token");
        localStorage.setItem(
          "user",
          JSON.stringify({
            id: user.id,
            firstName,
            lastName,
            email: user.email ?? "",
          }),
        );
        window.dispatchEvent(new Event("auth-changed"));
      }
    };

    const syncGoogleSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        setIsAuthReady(true);
        return;
      }

      const user = session.user;
      await persistGoogleUser(user);
      setIsAuthenticated(true);
      setIsAuthReady(true);
    };

    void syncGoogleSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session?.user) {
        if (event !== "SIGNED_OUT") {
          setIsAuthReady(true);
          return;
        }

        localStorage.removeItem("user");
        localStorage.removeItem("token");
        window.dispatchEvent(new Event("auth-changed"));
        setIsAuthenticated(false);
        setIsAuthReady(true);
        return;
      }

      const user = session.user;
      void persistGoogleUser(user).finally(() => {
        setIsAuthenticated(true);
        setIsAuthReady(true);
      });
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    function syncAuthFromStorage() {
      setIsAuthenticated(!!localStorage.getItem("user"));
    }

    window.addEventListener("storage", syncAuthFromStorage);
    window.addEventListener("auth-changed", syncAuthFromStorage);

    return () => {
      window.removeEventListener("storage", syncAuthFromStorage);
      window.removeEventListener("auth-changed", syncAuthFromStorage);
    };
  }, []);

  if (!isAuthReady) {
    return null;
  }

  return (
    <BrowserRouter>
      <UserProvider>
        <GroupsProvider>
          <EventProvider>
            <Routes>
              <Route
                path="/"
                element={
                  isAuthenticated ? (
                    <Navigate to="/dashboard" replace />
                  ) : (
                    <Login setIsAuthenticated={setIsAuthenticated} />
                  )
                }
              />
              <Route
                path="/signup"
                element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Signup />}
              />
              <Route
                path="/forgot-password"
                element={<ForgotPassword />}
              />
              <Route
                path="/reset-password"
                element={<ResetPassword />}
              />
              <Route
                path="/dashboard"
                element={
                  isAuthenticated ? (
                    <AppShell>
                      <Dashboard />
                    </AppShell>
                  ) : (
                    <Navigate to="/" replace />
                  )
                }
              />
              <Route
                path="/groups"
                element={
                  isAuthenticated ? (
                    <AppShell>
                      <GroupsPage />
                    </AppShell>
                  ) : (
                    <Navigate to="/" replace />
                  )
                }
              />
              <Route
                path="/calendar"
                element={
                  isAuthenticated ? (
                    <AppShell>
                      <CalendarPage />
                    </AppShell>
                  ) : (
                    <Navigate to="/" replace />
                  )
                }
              />
              <Route
                path="/chats"
                element={
                  isAuthenticated ? (
                    <AppShell>
                      <ChatsPage />
                    </AppShell>
                  ) : (
                    <Navigate to="/" replace />
                  )
                }
              />
              <Route
                path="/files"
                element={
                  isAuthenticated ? (
                    <AppShell>
                      <FilesPage />
                    </AppShell>
                  ) : (
                    <Navigate to="/" replace />
                  )
                }
              />
              <Route path="*" element={<Navigate to={isAuthenticated ? "/dashboard" : "/"} replace />} />
            </Routes>
          </EventProvider>
        </GroupsProvider>
      </UserProvider>
    </BrowserRouter>
  );
}

export default App;
