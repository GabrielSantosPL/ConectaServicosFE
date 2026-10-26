/*

--- [Instruções IA] ---



--- [Instruções IA] ---

--- [Documentação IA] ---

@fileoverview Componente de cabeçalho global (Header) do sistema Conecta Serviços.
@description Renderiza a barra de navegação superior comum a todas as páginas da aplicação,
             exibindo links de navegação, status de autenticação do usuário e ações de login/logout.

@function Header - Componente funcional React.
  @hook useState - Controla o estado local do usuário atualmente autenticado.
  @hook useEffect - Escuta eventos customizados de alteração de autenticação ('auth-change') e atualizações de armazenamento.
  @hook useNavigate - Fornece mecanismo programático de navegação entre rotas do React Router.

@function handleLogout - Encerra a sessão atual chamando o serviço de autenticação e redireciona o usuário para a página inicial.
  @returns {Promise<void>}

--- [Documentação IA] ---

*/

import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../services/api'

export default function Header() {
  const [usuario, setUsuario] = useState(api.getCurrentUser())
  const navigate = useNavigate()

  useEffect(() => {
    const sincronizarSessao = () => {
      setUsuario(api.getCurrentUser())
    }

    window.addEventListener('auth-change', sincronizarSessao)
    window.addEventListener('storage', sincronizarSessao)

    return () => {
      window.removeEventListener('auth-change', sincronizarSessao)
      window.removeEventListener('storage', sincronizarSessao)
    }
  }, [])

  const handleLogout = async () => {
    await api.logout()
    setUsuario(null)
    navigate('/')
  }

  const isPrestador = Boolean(usuario && usuario.perfilPrestador)

  return (
    <header className="header-container">
      <div className="header-content">
        <div className="header-brand">
          <Link to="/" className="brand-logo">
            <span className="brand-primary">Conecta</span>
            <span className="brand-secondary">Serviços</span>
          </Link>
          <span className="brand-tagline">Marketplace de Serviços</span>
        </div>

        <nav className="header-nav">
          <Link to="/" className="nav-link">Página Inicial</Link>

          {!usuario ? (
            <>
              <Link to="/login" className="nav-link">Entrar</Link>
              <Link to="/cadastro" className="btn-primary-nav">Cadastre-se</Link>
            </>
          ) : (
            <div className="user-nav-group">
              <span className="user-greeting">
                Olá, <strong>{usuario.nome}</strong>
                {isPrestador && <span className="badge-prestador">Prestador</span>}
              </span>

              <Link to="/perfil-cliente" className="nav-link">Meu Perfil</Link>

              {isPrestador ? (
                <Link to="/perfil-prestador" className="nav-link nav-link-highlight">
                  Painel Prestador
                </Link>
              ) : (
                <Link to="/perfil-prestador" className="nav-link">
                  Quero ser Prestador
                </Link>
              )}

              <button type="button" onClick={handleLogout} className="btn-logout">
                Sair
              </button>
            </div>
          )}
        </nav>
      </div>
    </header>
  )
}
