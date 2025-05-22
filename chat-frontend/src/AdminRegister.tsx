import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function AdminRegister() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    setError(null);
    try {
      await axios.post("http://localhost:5000/api/admin/register", { email, password });
      setMsg("Uspešna registracija! Možete da se prijavite.");
      setTimeout(() => navigate("/login"), 1200);
    } catch (err: any) {
      setError(err.response?.data?.error || "Greška pri registraciji");
    }
  };

  return (
    <div className="card mx-auto" style={{ maxWidth: 400 }}>
      <div className="card-body">
        <h4 className="card-title mb-3">Admin Registracija</h4>
        <form onSubmit={handleRegister}>
          <div className="mb-3">
            <input className="form-control" type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div className="mb-3">
            <input className="form-control" type="password" placeholder="Lozinka" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          {msg && <div className="alert alert-success">{msg}</div>}
          {error && <div className="alert alert-danger">{error}</div>}
          <button className="btn btn-success w-100" type="submit">Registruj</button>
        </form>
      </div>
    </div>
  );
}