import { useNavigate } from "react-router-dom";
import AuthLayout from "../../../layouts/AuthLayout";
import SignupForm from "../components/SignUpForm";

const Signup = () => {
  const navigate = useNavigate();

  const setPage = (page: "login" | "signup" | "forgot" | "reset") => {
    if (page === "login") {
      navigate("/");
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

    navigate("/signup");
  };

  return (
    <AuthLayout>
      <SignupForm setPage={setPage} />
    </AuthLayout>
  );
};

export default Signup;
