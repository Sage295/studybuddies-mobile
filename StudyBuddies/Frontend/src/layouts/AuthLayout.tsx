import React from "react";
import bgImage from "../assets/511517ad616f16850994c6968769fd96.jpg";
import logo from "../assets/logo.png";

type Props = {
  children: React.ReactNode;
};

const AuthLayout: React.FC<Props> = ({ children }) => {
  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        width: "100%",
        position: "relative", 
      }}
    >
      {/* LEFT SIDE */}
      <div
        style={{
          flex: 1,
          position: "relative",
          backgroundImage: `url(${bgImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
       
      </div>

      
      <div
        style={{
          flex: 1,
          background: "#050214",
          color: "white",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        {children}
      </div>

     
      <img
        src={logo}
        alt="logo"
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%) rotate(13deg)",
          width: "300px",
          zIndex: 10,
          pointerEvents: "none",
        }}
      />
    </div>
  );
};

export default AuthLayout;
