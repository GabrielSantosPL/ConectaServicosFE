/*

--- [Instruções IA] ---



--- [Instruções IA] ---

--- [Documentação IA] ---

@fileoverview Componente raiz de roteamento da aplicação Conecta Serviços.
@description Configura o cabeçalho global fixo comum a todas as páginas e define as rotas
             principais da aplicação (Home, Cadastro, Login, Perfil de Cliente, Perfil de Prestador
             e Detalhes do Serviço) utilizando a biblioteca React Router.

@function App - Componente principal da aplicação.
  @returns {JSX.Element} Estrutura com Header global e rotas da aplicação.

--- [Documentação IA] ---

*/

import { Routes, Route } from 'react-router-dom'
import Header from './components/Header'
import Home from './pages/Home'
import Cadastro from './pages/Cadastro'
import Login from './pages/Login'
import PerfilCliente from './pages/PerfilCliente'
import PerfilPrestador from './pages/PerfilPrestador'
import DetalhesServico from './pages/DetalhesServico'
import './App.css'

function App() {
  return (
    <div className="app-root">
      <Header />
      <main className="app-main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/cadastro" element={<Cadastro />} />
          <Route path="/login" element={<Login />} />
          <Route path="/perfil-cliente" element={<PerfilCliente />} />
          <Route path="/perfil-prestador" element={<PerfilPrestador />} />
          <Route path="/servico/:id" element={<DetalhesServico />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
