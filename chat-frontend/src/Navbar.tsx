import React from "react";
import { Link, useNavigate } from "react-router-dom";

interface Props {
  isLoggedIn: boolean;
  onLogout: () => void;
}

export default function Navbar({ isLoggedIn, onLogout }: Props) {
  const navigate = useNavigate();

  return (
    <nav className="navbar navbar-expand navbar-dark bg-primary">
      <div className="container">
        <Link className="navbar-brand" to="/">Chat Admin</Link>
        <div className="navbar-nav ms-auto">
          {!isLoggedIn ? (
            <>
              <button className="btn btn-outline-light me-2" onClick={() => navigate("/register")}>
                Register
              </button>
              <button className="btn btn-light" onClick={() => navigate("/login")}>
                Login
              </button>
            </>
          ) : (
            <button className="btn btn-warning" onClick={onLogout}>
              Logout
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}