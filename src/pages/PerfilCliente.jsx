/*

--- [Instruções IA] ---



--- [Instruções IA] ---

--- [Documentação IA] ---

@fileoverview Página de Perfil de Cliente Comum do sistema Conecta Serviços.
@description Exibe os dados cadastrais do cliente comum com atualização dinâmica de endereço
             via CEP sem necessidade de botão, gerencia campos editáveis e imutáveis, e exibe
             a relação completa de contratos e serviços contratados junto a prestadores.

@function PerfilCliente - Componente funcional React.
  @hook useState - Controla os dados do perfil, lista de contratos, mensagens de erro e feedback de sucesso.
  @hook useEffect - Garante o redirecionamento caso não autenticado e sincroniza contratos do cliente.
  @hook useNavigate - Fornece navegação programática no React Router.

@function formatarPreco - Converte um número para formato monetário em reais (BRL).
  @param {number} valor - Valor numérico a ser formatado.
  @returns {string} String formatada em reais.
@function handleInputChange - Atualiza os campos de dados gerais permitidos para alteração.
  @param {React.ChangeEvent<HTMLInputElement>} e - Evento de alteração de campo.
@function handleEnderecoChange - Atualiza os campos de endereço e dispara dinamicamente a busca no ViaCEP ao atingir 8 dígitos.
  @param {React.ChangeEvent<HTMLInputElement>} e - Evento de alteração de campo de endereço.
@function handleBuscarCep - Realiza a consulta ao ViaCEP para preencher automaticamente os dados de endereço.
  @param {string} [cepInformado] - CEP numérico a consultar.
  @returns {Promise<void>}
@function handleSalvarPerfil - Envia as alterações permitidas para atualização através do serviço api.updatePerfilCliente.
  @param {React.FormEvent<HTMLFormElement>} e - Evento de submissão do formulário.
  @returns {Promise<void>}
@function handleTornarPrestador - Habilita e inicializa o perfil de prestador para a conta atual.
  @param {React.FormEvent<HTMLFormElement>} e - Evento de submissão do formulário de prestador.
  @returns {Promise<void>}
@function handleAlterarStatusContrato - Permite ao cliente cancelar ou concluir uma relação contratual.
  @param {string} contratoId - ID do contrato a ser alterado.
  @param {string} novoStatus - Novo status desejado.
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

  // Estados do sistema de contratos
  const [contratosCliente, setContratosCliente] = useState([])
  const [carregandoContratos, setCarregandoContratos] = useState(true)
  const [atualizandoContratoId, setAtualizandoContratoId] = useState(null)

  const [mensagemSucesso, setMensagemSucesso] = useState('')
  const [mensagemErro, setMensagemErro] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [buscandoCep, setBuscandoCep] = useState(false)

  useEffect(() => {
    const user = api.getCurrentUser()
    if (!user) {
      navigate('/login')
      return
    }

    async function carregarContratos() {
      try {
        setCarregandoContratos(true)
        const lista = await api.getContratosByClienteId(user.id)
        setContratosCliente(lista)
      } catch {
        // Ignora ou mantém lista vazia
      } finally {
        setCarregandoContratos(false)
      }
    }

    carregarContratos()

    const aoMudarContratos = () => {
      carregarContratos()
    }

    window.addEventListener('contracts-change', aoMudarContratos)
    return () => {
      window.removeEventListener('contracts-change', aoMudarContratos)
    }
  }, [navigate])

  const formatarPreco = (valor) => {
    return Number(valor || 0).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    })
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleEnderecoChange = (e) => {
    const { name, value } = e.target

    if (name === 'cep') {
      const digitos = value.replace(/\D/g, '').slice(0, 8)
      const formatado = digitos.length > 5 ? `${digitos.slice(0, 5)}-${digitos.slice(5)}` : digitos

      setFormData(prev => ({
        ...prev,
        endereco: {
          ...prev.endereco,
          cep: formatado
        }
      }))

      if (digitos.length === 8) {
        handleBuscarCep(digitos)
      } else {
        setMensagemErro('')
      }
      return
    }

    setFormData(prev => ({
      ...prev,
      endereco: {
        ...prev.endereco,
        [name]: value
      }
    }))
  }

  const handleBuscarCep = async (cepInformado) => {
    const limpo = String(cepInformado || formData.endereco.cep).replace(/\D/g, '')
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
          estado: dados.estado || '',
          cidade: dados.cidade || '',
          bairro: dados.bairro || '',
          rua: dados.rua || ''
        }
      }))
    } catch (err) {
      setMensagemErro(err.message || 'Erro ao consultar o CEP no ViaCEP.')
    } finally {
      setBuscandoCep(false)
    }
  }

  const handleAlterarStatusContrato = async (contratoId, novoStatus) => {
    try {
      setAtualizandoContratoId(contratoId)
      setMensagemErro('')
      setMensagemSucesso('')
      await api.updateStatusContrato(contratoId, novoStatus)
      if (usuario) {
        const lista = await api.getContratosByClienteId(usuario.id)
        setContratosCliente(lista)
      }
      setMensagemSucesso(`Status do contrato atualizado com sucesso para "${novoStatus}".`)
    } catch (err) {
      setMensagemErro(err.message || 'Erro ao atualizar o contrato.')
    } finally {
      setAtualizandoContratoId(null)
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
              <div className="form-group flex-2">
                <label htmlFor="editCep">
                  CEP {buscandoCep && <span className="cep-inline-loading">(Buscando endereço...)</span>}
                </label>
                <input
                  id="editCep"
                  type="text"
                  name="cep"
                  value={formData.endereco.cep}
                  onChange={handleEnderecoChange}
                  maxLength={9}
                  required
                />
              </div>

              <div className="form-group flex-1">
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

        {/* Seção de Contratos e Relações de Serviço do Cliente */}
        <section className="contracts-section">
          <div className="section-header-contracts">
            <div>
              <h3>Meus Contratos de Serviços</h3>
              <p className="contracts-subtitle">
                Acompanhe o andamento das relações de serviços contratadas com os prestadores.
              </p>
            </div>
            <span className="badge-counter">{contratosCliente.length} contrato(s)</span>
          </div>

          {carregandoContratos ? (
            <p className="loading-message">Carregando seus contratos...</p>
          ) : contratosCliente.length === 0 ? (
            <div className="empty-contracts-card">
              <p>Você ainda não formalizou nenhum contrato de serviço.</p>
              <Link to="/" className="btn-secondary">Explorar Catálogo de Serviços</Link>
            </div>
          ) : (
            <div className="contracts-list">
              {contratosCliente.map((contrato) => (
                <div key={contrato.id} className="contract-card">
                  <div className="contract-card-header">
                    <div>
                      <span className="contract-code">Protocolo: {contrato.id}</span>
                      <h4 className="contract-title">{contrato.servicoNome}</h4>
                    </div>
                    <span className={`badge-contract-status status-${contrato.status.toLowerCase().replace(/\s+/g, '-')}`}>
                      {contrato.status}
                    </span>
                  </div>

                  <div className="contract-card-grid">
                    <div className="contract-info-item">
                      <span className="info-label">Prestador:</span>
                      <strong className="info-value">{contrato.prestadorNome}</strong>
                    </div>

                    <div className="contract-info-item">
                      <span className="info-label">Contato do Prestador:</span>
                      <span className="info-value">{contrato.prestadorTelefone}</span>
                    </div>

                    <div className="contract-info-item">
                      <span className="info-label">Valor Acordado:</span>
                      <strong className="info-value price-text">{formatarPreco(contrato.preco)}</strong>
                    </div>

                    <div className="contract-info-item">
                      <span className="info-label">Data Agendada:</span>
                      <span className="info-value">{contrato.dataAgendamento || contrato.dataContratacao}</span>
                    </div>

                    <div className="contract-info-item full-width">
                      <span className="info-label">Endereço do Atendimento:</span>
                      <span className="info-value">
                        {contrato.clienteEndereco?.rua ? (
                          `${contrato.clienteEndereco.rua}, ${contrato.clienteEndereco.numero || 'S/N'} - ${contrato.clienteEndereco.bairro}, ${contrato.clienteEndereco.cidade}/${contrato.clienteEndereco.estado}`
                        ) : 'Endereço residencial cadastrado'}
                      </span>
                    </div>

                    {contrato.observacoes && (
                      <div className="contract-info-item full-width">
                        <span className="info-label">Observações da Solicitação:</span>
                        <p className="contract-notes">{contrato.observacoes}</p>
                      </div>
                    )}
                  </div>

                  <div className="contract-card-actions">
                    <a
                      href={`https://api.whatsapp.com/send?phone=${String(contrato.prestadorTelefone || '').replace(/\D/g, '')}&text=Olá%20${encodeURIComponent(contrato.prestadorNome)},%20estou%20entrando%20em%20contato%20sobre%20o%20contrato%20${contrato.id}%20do%20serviço%20${encodeURIComponent(contrato.servicoNome)}.`}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-whatsapp-sm"
                    >
                      💬 Falar no WhatsApp
                    </a>

                    {contrato.status === 'Em Andamento' && (
                      <button
                        type="button"
                        onClick={() => handleAlterarStatusContrato(contrato.id, 'Concluído')}
                        disabled={atualizandoContratoId === contrato.id}
                        className="btn-success-sm"
                      >
                        ✓ Confirmar Conclusão
                      </button>
                    )}

                    {(contrato.status === 'Pendente' || contrato.status === 'Em Andamento') && (
                      <button
                        type="button"
                        onClick={() => handleAlterarStatusContrato(contrato.id, 'Cancelado')}
                        disabled={atualizandoContratoId === contrato.id}
                        className="btn-danger-sm"
                      >
                        ✕ Cancelar Contrato
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

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
