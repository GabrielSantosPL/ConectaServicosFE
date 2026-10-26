/*

--- [Instruções IA] ---



--- [Instruções IA] ---

--- [Documentação IA] ---

@fileoverview Página de Perfil de Cliente Comum do sistema Conecta Serviços.
@description Exibe os dados cadastrais do cliente comum, permitindo a edição de campos autorizados
             (Nome, Email, Senha, Telefone e Endereço) e bloqueando estritamente os campos imutáveis
             (CPF, Data de Nascimento, Data de Cadastro e Status da Conta).

@function PerfilCliente - Componente funcional React.
  @hook useState - Controla os dados do perfil, permissão de edição, mensagens de erro e feedback de sucesso.
  @hook useEffect - Garante o redirecionamento caso o usuário não esteja autenticado.

@function handleInputChange - Atualiza os campos de dados gerais permitidos para alteração.
  @param {React.ChangeEvent<HTMLInputElement>} e - Evento de alteração de campo.
@function handleEnderecoChange - Atualiza os campos da estrutura de endereço aninhada.
  @param {React.ChangeEvent<HTMLInputElement>} e - Evento de alteração de campo de endereço.
@function handleBuscarCep - Realiza a consulta ao ViaCEP para preencher automaticamente os dados de endereço na edição.
  @returns {Promise<void>}
@function handleSalvarPerfil - Envia as alterações permitidas para atualização através do serviço api.updatePerfilCliente.
  @param {React.FormEvent<HTMLFormElement>} e - Evento de submissão do formulário.
  @returns {Promise<void>}
@function handleTornarPrestador - Habilita e inicializa o perfil de prestador para a conta atual.
  @param {React.FormEvent<HTMLFormElement>} e - Evento de submissão do formulário de prestador.
  @returns {Promise<void>}

--- [Documentação IA] ---

*/

import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../services/api'

export default function PerfilCliente() {
  const navigate = useNavigate()
  const [usuario, setUsuario] = useState(() => api.getCurrentUser())
  const [formData, setFormData] = useState(() => {
    const user = api.getCurrentUser()
    return {
      nome: user?.nome || '',
      email: user?.email || '',
      senha: user?.senha || '',
      telefone: user?.telefone || '',
      endereco: {
        cep: user?.endereco?.cep || '',
        estado: user?.endereco?.estado || '',
        cidade: user?.endereco?.cidade || '',
        bairro: user?.endereco?.bairro || '',
        rua: user?.endereco?.rua || '',
        numero: user?.endereco?.numero || ''
      }
    }
  })

  const [mostrarModalPrestador, setMostrarModalPrestador] = useState(false)
  const [dadosPrestadorForm, setDadosPrestadorForm] = useState({
    cnpj: '',
    registroEspecificoProfissao: ''
  })

  const [mensagemSucesso, setMensagemSucesso] = useState('')
  const [mensagemErro, setMensagemErro] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [buscandoCep, setBuscandoCep] = useState(false)

  useEffect(() => {
    if (!api.getCurrentUser()) {
      navigate('/login')
    }
  }, [navigate])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleEnderecoChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      endereco: {
        ...prev.endereco,
        [name]: value
      }
    }))
  }

  const handleBuscarCep = async () => {
    const limpo = formData.endereco.cep.replace(/\D/g, '')
    if (limpo.length !== 8) {
      setMensagemErro('Informe um CEP válido com 8 dígitos.')
      return
    }

    try {
      setBuscandoCep(true)
      setMensagemErro('')
      const dados = await api.consultarCep(limpo)
      setFormData(prev => ({
        ...prev,
        endereco: {
          ...prev.endereco,
          cep: dados.cep || limpo,
          estado: dados.estado,
          cidade: dados.cidade,
          bairro: dados.bairro,
          rua: dados.rua
        }
      }))
    } catch (err) {
      setMensagemErro(err.message || 'Erro ao consultar o CEP no ViaCEP.')
    } finally {
      setBuscandoCep(false)
    }
  }

  const handleSalvarPerfil = async (e) => {
    e.preventDefault()
    setMensagemSucesso('')
    setMensagemErro('')

    try {
      setSalvando(true)
      const userAtualizado = await api.updatePerfilCliente(usuario.id, formData)
      setUsuario(userAtualizado)
      setMensagemSucesso('Perfil atualizado com sucesso!')
    } catch (err) {
      setMensagemErro(err.message || 'Erro ao salvar alterações no perfil.')
    } finally {
      setSalvando(false)
    }
  }

  const handleTornarPrestador = async (e) => {
    e.preventDefault()
    if (!dadosPrestadorForm.cnpj.trim()) {
      setMensagemErro('Por favor, informe seu CNPJ para ativar o perfil de prestador.')
      return
    }

    try {
      setSalvando(true)
      const userAtualizado = await api.ativarPerfilPrestador(usuario.id, dadosPrestadorForm)
      setUsuario(userAtualizado)
      setMostrarModalPrestador(false)
      setMensagemSucesso('Perfil de prestador habilitado com sucesso!')
      setTimeout(() => {
        navigate('/perfil-prestador')
      }, 1000)
    } catch (err) {
      setMensagemErro(err.message || 'Erro ao habilitar o perfil de prestador.')
    } finally {
      setSalvando(false)
    }
  }

  if (!usuario) {
    return (
      <div className="page-container">
        <p className="loading-message">Carregando dados do usuário...</p>
      </div>
    )
  }

  return (
    <div className="page-container">
      <div className="card profile-card">
        <div className="profile-header">
          <div>
            <h2>Meu Perfil de Cliente</h2>
            <p>Gerencie seus dados pessoais e informações de contato.</p>
          </div>
          <div className="profile-badges">
            <span className="badge-status">Status da Conta: <strong>{usuario.statusConta}</strong></span>
            {usuario.perfilPrestador && (
              <span className="badge-prestador">Perfil Prestador Ativo</span>
            )}
          </div>
        </div>

        {mensagemSucesso && <div className="alert alert-success">{mensagemSucesso}</div>}
        {mensagemErro && <div className="alert alert-error">{mensagemErro}</div>}

        <form onSubmit={handleSalvarPerfil} className="standard-form">
          {/* Seção de Informações Imutáveis */}
          <fieldset className="form-section disabled-section">
            <legend>Informações do Sistema (Não alteráveis)</legend>
            <p className="field-hint">
              Por regras de conformidade e segurança, os seguintes dados não podem ser modificados:
            </p>

            <div className="form-row">
              <div className="form-group">
                <label>CPF (Imutável)</label>
                <input type="text" value={usuario.cpf} disabled readOnly className="input-readonly" />
              </div>

              <div className="form-group">
                <label>Data de Nascimento (Imutável)</label>
                <input type="text" value={usuario.dataNascimento} disabled readOnly className="input-readonly" />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Data de Criação da Conta (Imutável)</label>
                <input type="text" value={usuario.dataCriacaoConta} disabled readOnly className="input-readonly" />
              </div>

              <div className="form-group">
                <label>Status da Conta (Imutável)</label>
                <input type="text" value={usuario.statusConta} disabled readOnly className="input-readonly" />
              </div>
            </div>
          </fieldset>

          {/* Seção de Informações Editáveis */}
          <fieldset className="form-section">
            <legend>Informações de Contato e Acesso (Editáveis)</legend>

            <div className="form-group">
              <label htmlFor="editNome">Nome Completo</label>
              <input
                id="editNome"
                type="text"
                name="nome"
                value={formData.nome}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="editEmail">E-mail</label>
                <input
                  id="editEmail"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="editSenha">Senha de Acesso</label>
                <input
                  id="editSenha"
                  type="text"
                  name="senha"
                  value={formData.senha}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="editTelefone">Telefone / WhatsApp</label>
              <input
                id="editTelefone"
                type="tel"
                name="telefone"
                value={formData.telefone}
                onChange={handleInputChange}
                required
              />
            </div>
          </fieldset>

          {/* Seção de Endereço (Editável) */}
          <fieldset className="form-section">
            <legend>Endereço Residencial (Editável)</legend>

            <div className="form-row cep-lookup-row">
              <div className="form-group">
                <label htmlFor="editCep">CEP</label>
                <div className="input-with-button">
                  <input
                    id="editCep"
                    type="text"
                    name="cep"
                    value={formData.endereco.cep}
                    onChange={handleEnderecoChange}
                    maxLength={9}
                    required
                  />
                  <button
                    type="button"
                    onClick={handleBuscarCep}
                    className="btn-secondary"
                    disabled={buscandoCep}
                  >
                    {buscandoCep ? 'Buscando...' : 'ViaCEP'}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="editEstado">Estado (UF)</label>
                <input
                  id="editEstado"
                  type="text"
                  name="estado"
                  value={formData.endereco.estado}
                  onChange={handleEnderecoChange}
                  maxLength={2}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group flex-2">
                <label htmlFor="editCidade">Cidade</label>
                <input
                  id="editCidade"
                  type="text"
                  name="cidade"
                  value={formData.endereco.cidade}
                  onChange={handleEnderecoChange}
                  required
                />
              </div>

              <div className="form-group flex-2">
                <label htmlFor="editBairro">Bairro</label>
                <input
                  id="editBairro"
                  type="text"
                  name="bairro"
                  value={formData.endereco.bairro}
                  onChange={handleEnderecoChange}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group flex-3">
                <label htmlFor="editRua">Rua / Logradouro</label>
                <input
                  id="editRua"
                  type="text"
                  name="rua"
                  value={formData.endereco.rua}
                  onChange={handleEnderecoChange}
                  required
                />
              </div>

              <div className="form-group flex-1">
                <label htmlFor="editNumero">Número</label>
                <input
                  id="editNumero"
                  type="text"
                  name="numero"
                  value={formData.endereco.numero}
                  onChange={handleEnderecoChange}
                  required
                />
              </div>
            </div>
          </fieldset>

          <div className="form-actions">
            <button type="submit" className="btn-primary" disabled={salvando}>
              {salvando ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </form>

        {/* Seção sobre Perfil de Prestador */}
        <div className="provider-status-section">
          <h3>Perfil de Prestador de Serviços</h3>
          {usuario.perfilPrestador ? (
            <div className="provider-active-box">
              <p>Você já possui um perfil de prestador ativo!</p>
              <Link to="/perfil-prestador" className="btn-primary">
                Acessar Painel do Prestador e Gerenciar Serviços
              </Link>
            </div>
          ) : (
            <div className="provider-inactive-box">
              <p>
                Deseja oferecer seus serviços profissionais em nossa plataforma?
                Habilite seu perfil de prestador para começar a divulgar seus trabalhos.
              </p>
              {!mostrarModalPrestador ? (
                <button
                  type="button"
                  className="btn-accent"
                  onClick={() => setMostrarModalPrestador(true)}
                >
                  Quero me tornar Prestador de Serviços
                </button>
              ) : (
                <form onSubmit={handleTornarPrestador} className="standard-form sub-form">
                  <div className="form-group">
                    <label htmlFor="prestadorCnpj">CNPJ *</label>
                    <input
                      id="prestadorCnpj"
                      type="text"
                      placeholder="00.000.000/0000-00"
                      value={dadosPrestadorForm.cnpj}
                      onChange={(e) => setDadosPrestadorForm(prev => ({ ...prev, cnpj: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="prestadorRegistro">Registro Específico da Profissão (Opcional)</label>
                    <input
                      id="prestadorRegistro"
                      type="text"
                      placeholder="Ex: CREA, CRM, OAB ou MEI (pode ser nulo caso não haja)"
                      value={dadosPrestadorForm.registroEspecificoProfissao}
                      onChange={(e) => setDadosPrestadorForm(prev => ({ ...prev, registroEspecificoProfissao: e.target.value }))}
                    />
                  </div>

                  <div className="form-actions-inline">
                    <button type="submit" className="btn-primary" disabled={salvando}>
                      {salvando ? 'Ativando...' : 'Confirmar e Ativar Perfil Prestador'}
                    </button>
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => setMostrarModalPrestador(false)}
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
