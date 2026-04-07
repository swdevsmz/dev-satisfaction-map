import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// React アプリのエントリーポイント。
// 開発中に副作用の問題を検出しやすくするため StrictMode で描画する。
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
