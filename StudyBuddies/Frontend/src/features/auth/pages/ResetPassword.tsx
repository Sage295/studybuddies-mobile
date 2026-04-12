import { useNavigate } from "react-router-dom";
import AuthLayout from "../../../layouts/AuthLayout";
import ResetPasswordForm from "../components/ResetPasswordForm";

const ResetPassword = () => {
  const navigate = useNavigate();

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
      <ResetPasswordForm setPage={setPage} />
    </AuthLayout>
  );
};

export default ResetPassword;
