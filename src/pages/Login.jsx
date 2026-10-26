/*

--- [Instruções IA] ---



--- [Instruções IA] ---

--- [Documentação IA] ---

@fileoverview Página de Login do sistema Conecta Serviços.
@description Permite que clientes e prestadores de serviço acessem suas respectivas contas
             por meio da validação de credenciais de e-mail e senha.

@function Login - Componente funcional React.
  @hook useState - Controla os valores de e-mail, senha, mensagens de erro e estado de submissão.
  @hook useNavigate - Redireciona o usuário para o perfil após a autenticação bem-sucedida.

@function handleLogin - Submete as credenciais para o método api.login e gerencia o fluxo de sucesso ou erro.
  @param {React.FormEvent<HTMLFormElement>} e - Evento de envio do formulário.
  @returns {Promise<void>}
@function preencherDemo - Facilita testes acadêmicos preenchendo as credenciais de contas de demonstração.
  @param {string} emailDemo - E-mail da conta de teste.
  @param {string} senhaDemo - Senha da conta de teste.

--- [Documentação IA] ---

*/

import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../services/api'

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    setErro('')

    if (!email.trim() || !senha.trim()) {
      setErro('Preencha os campos de e-mail e senha.')
      return
    }

    try {
      setCarregando(true)
      const user = await api.login(email, senha)
      if (user.perfilPrestador) {
        navigate('/perfil-prestador')
      } else {
        navigate('/perfil-cliente')
      }
    } catch (err) {
      setErro(err.message || 'Erro ao realizar login.')
    } finally {
      setCarregando(false)
    }
  }

  const preencherDemo = (emailDemo, senhaDemo) => {
    setEmail(emailDemo)
    setSenha(senhaDemo)
    setErro('')
  }

  return (
    <div className="page-container form-page-container">
      <div className="card form-card login-card">
        <div className="form-header">
          <h2>Acessar Conta</h2>
          <p>Informe suas credenciais para gerenciar seus serviços ou perfil.</p>
        </div>

        {erro && <div className="alert alert-error">{erro}</div>}

        <form onSubmit={handleLogin} className="standard-form">
          <div className="form-group">
            <label htmlFor="loginEmail">E-mail</label>
            <input
              id="loginEmail"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seuemail@exemplo.com"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="loginSenha">Senha</label>
            <input
              id="loginSenha"
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="Digite sua senha"
              required
            />
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-primary" disabled={carregando}>
              {carregando ? 'Entrando...' : 'Entrar'}
            </button>
          </div>

          <div className="demo-accounts-box">
            <p className="demo-title">Contas de teste para avaliação rápida:</p>
            <div className="demo-buttons">
              <button
                type="button"
                className="btn-demo"
                onClick={() => preencherDemo('cliente@teste.com', '123456')}
              >
                👤 Entrar como Cliente (Maria)
              </button>
              <button
                type="button"
                className="btn-demo"
                onClick={() => preencherDemo('prestador@teste.com', '123456')}
              >
                🛠️ Entrar como Prestador (Carlos)
              </button>
            </div>
          </div>

          <div className="form-footer-link">
            <span>Ainda não possui conta? </span>
            <Link to="/cadastro">Cadastre-se aqui</Link>
          </div>
        </form>
      </div>
    </div>
  )
}
