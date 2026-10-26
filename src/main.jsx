/*

--- [Instruções IA] ---



--- [Instruções IA] ---

--- [Documentação IA] ---

@fileoverview Ponto de entrada principal da aplicação React.
@description Inicializa a raiz React no elemento DOM #root, encapsulando o componente
             principal App com o roteador BrowserRouter do React Router.

--- [Documentação IA] ---

*/

import { BrowserRouter } from 'react-router-dom'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>,
)
