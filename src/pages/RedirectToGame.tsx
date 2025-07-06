// src/pages/RedirectToGame.tsx
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function RedirectToGame() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate('/game');
  }, [navigate]);

  return null;
}
