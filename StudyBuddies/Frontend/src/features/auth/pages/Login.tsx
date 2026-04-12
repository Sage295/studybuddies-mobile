import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import AuthLayout from "../../../layouts/AuthLayout";
import LoginForm from "../components/LoginForm";

type Props = {
  setIsAuthenticated: (val: boolean) => void;
};

const Login = ({ setIsAuthenticated }: Props) => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const resetToken = params.get("resetToken");

    if (resetToken) {
      navigate(`/reset-password?resetToken=${encodeURIComponent(resetToken)}`, {
        replace: true,
      });
    }
  }, [location.search, navigate]);

  const setPage = (page: "login" | "signup" | "forgot" | "reset") => {
    if (page === "signup") {
      navigate("/signup");
      return;
    }

    if (page === "forgot") {
      navigate("/forgot-password");
      return;
    }

    if (page === "reset") {
      navigate("/reset-password");
      return;
    }

    navigate("/");
  };

  return (
    <AuthLayout>
      <LoginForm setPage={setPage} setIsAuthenticated={setIsAuthenticated} />
    </AuthLayout>
  );
};

export default Login;
