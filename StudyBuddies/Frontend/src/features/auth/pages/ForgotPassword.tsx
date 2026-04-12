import { useNavigate } from "react-router-dom";
import AuthLayout from "../../../layouts/AuthLayout";
import ForgotPasswordForm from "../components/ForgotPasswordForm";

const ForgotPassword = () => {
  const navigate = useNavigate();

  const setPage = (page: "login" | "signup" | "forgot" | "reset") => {
    if (page === "signup") {
      navigate("/signup");
      return;
    }

    if (page === "reset") {
      navigate("/reset-password");
      return;
    }

    if (page === "forgot") {
      navigate("/forgot-password");
      return;
    }

    navigate("/");
  };

  return (
    <AuthLayout>
      <ForgotPasswordForm setPage={setPage} />
    </AuthLayout>
  );
};

export default ForgotPassword;
