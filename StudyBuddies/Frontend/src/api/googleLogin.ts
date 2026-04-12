import { supabase } from "../supabase";
import { appUrl } from "./config";

export const googleLogin = async () => {
  await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: appUrl || window.location.origin
    }
  });
};
