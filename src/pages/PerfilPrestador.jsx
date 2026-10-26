/*

--- [Instruções IA] ---



--- [Instruções IA] ---

--- [Documentação IA] ---

@fileoverview Página de Perfil do Prestador de Serviços do sistema Conecta Serviços.
@description Permite a visualização e edição de dados do prestador de serviços (respeitando
             as regras de imutabilidade de Nota e Status de Verificação), o gerenciamento
             de contratos/ordens de serviço solicitadas por clientes e a criação e edição
             de serviços oferecidos no catálogo do marketplace.

@function PerfilPrestador - Componente funcional React.
  @hook useState - Controla os dados cadastrais do prestador, lista de serviços próprios,
                    lista de contratos recebidos, filtros, mensagens e flags de carregamento.
  @hook useEffect - Inicializa a página com o usuário logado, carrega serviços e contratos recebidos.
  @hook useNavigate - Redireciona o usuário caso não esteja autenticado.

@function formatarPreco - Converte um número para formato monetário em reais (BRL).
  @param {number} valor - Valor numérico a ser formatado.
  @returns {string} String formatada em reais.
@function handlePrestadorChange - Atualiza os campos de texto do perfil profissional.
  @param {React.ChangeEvent<HTMLInputElement>} e - Evento de alteração de campo.
@function handlePrestadorSubmit - Atualiza os dados permitidos do perfil de prestador via api.updatePerfilPrestador.
  @param {React.FormEvent<HTMLFormElement>} e - Evento de submissão do perfil.
  @returns {Promise<void>}
@function handleIniciarCriacaoServico - Limpa o formulário de serviço e ativa o modo de cadastro de novo serviço.
@function handleIniciarEdicaoServico - Carrega os dados de um serviço existente para edição.
  @param {Object} servico - Objeto do serviço a ser editado.
@function handleCancelarFormServico - Reseta e oculta o formulário de serviço.
@function handleSalvarServico - Processa a criação ou alteração de um serviço via api.createServico ou api.updateServico.
  @param {React.FormEvent<HTMLFormElement>} e - Evento de submissão do formulário de serviço.
  @returns {Promise<void>}
@function handleAlterarStatusContrato - Atualiza o status de um contrato recebido ('Em Andamento', 'Concluído', 'Cancelado').
  @param {string} contratoId - Identificador do contrato.
  @param {string} novoStatus - Novo status atribuído.
  @returns {Promise<void>}

--- [Documentação IA] ---

*/

import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../services/api'

export default function PerfilPrestador() {
  const navigate = useNavigate()
  const [usuario, setUsuario] = useState(() => api.getCurrentUser())
  const [servicosPrestador, setServicosPrestador] = useState([])
  const [contratosPrestador, setContratosPrestador] = useState([])
  const [filtroStatusContrato, setFiltroStatusContrato] = useState('Todos')
  const [atualizandoContratoId, setAtualizandoContratoId] = useState(null)
  const [carregando, setCarregando] = useState(true)

  // Formulário de perfil do prestador
  const [formPerfil, setFormPerfil] = useState(() => {
    const user = api.getCurrentUser()
    return {
      nome: user?.nome || '',
      email: user?.email || '',
      senha: user?.senha || '',
      telefone: user?.telefone || '',
      cnpj: user?.perfilPrestador?.cnpj || '',
      registroEspecificoProfissao: user?.perfilPrestador?.registroEspecificoProfissao || '',
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

  // Formulário de serviço (criação e edição)
  const [modoServico, setModoServico] = useState(null) // 'novo' | 'editando' | null
  const [servicoEmEdicaoId, setServicoEmEdicaoId] = useState(null)
  const [formServico, setFormServico] = useState({
    nome: '',
    preco: '',
    disponibilidadeDias: '',
    disponibilidadeHorario: ''
  })

  const [mensagemSucesso, setMensagemSucesso] = useState('')
  const [mensagemErro, setMensagemErro] = useState('')
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    const user = api.getCurrentUser()
    if (!user) {
      navigate('/login')
      return
    }

    async function carregarDadosPrestador() {
      if (user.perfilPrestador) {
        try {
          setCarregando(true)
          const [servicos, contratos] = await Promise.all([
            api.getServicosByPrestadorId(user.id),
            api.getContratosByPrestadorId(user.id)
          ])
          setServicosPrestador(servicos)
          setContratosPrestador(contratos)
        } catch {
          setMensagemErro('Erro ao carregar dados do prestador.')
        } finally {
          setCarregando(false)
        }
      } else {
        setCarregando(false)
      }
    }

    carregarDadosPrestador()

    const aoMudarContratos = async () => {
      if (user.perfilPrestador) {
        const contratos = await api.getContratosByPrestadorId(user.id)
        setContratosPrestador(contratos)
      }
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

  const handleAlterarStatusContrato = async (contratoId, novoStatus) => {
    try {
      setAtualizandoContratoId(contratoId)
      setMensagemErro('')
      setMensagemSucesso('')
      await api.updateStatusContrato(contratoId, novoStatus)
      if (usuario) {
        const contratos = await api.getContratosByPrestadorId(usuario.id)
        setContratosPrestador(contratos)
      }
      setMensagemSucesso(`Status do contrato atualizado com sucesso para "${novoStatus}".`)
    } catch (err) {
      setMensagemErro(err.message || 'Erro ao atualizar status do contrato.')
    } finally {
      setAtualizandoContratoId(null)
    }
  }

  const handlePrestadorChange = (e) => {
    const { name, value } = e.target
    setFormPerfil(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handlePrestadorSubmit = async (e) => {
    e.preventDefault()
    setMensagemSucesso('')
    setMensagemErro('')

    try {
      setSalvando(true)
      const userAtualizado = await api.updatePerfilPrestador(usuario.id, {
        nome: formPerfil.nome,
        email: formPerfil.email,
        senha: formPerfil.senha,
        telefone: formPerfil.telefone,
        cnpj: formPerfil.cnpj,
        registroEspecificoProfissao: formPerfil.registroEspecificoProfissao.trim() ? formPerfil.registroEspecificoProfissao : null,
        endereco: formPerfil.endereco
      })
      setUsuario(userAtualizado)
      setMensagemSucesso('Dados do perfil de prestador atualizados com sucesso!')
    } catch (err) {
      setMensagemErro(err.message || 'Erro ao atualizar dados do prestador.')
    } finally {
      setSalvando(false)
    }
  }

  const handleIniciarCriacaoServico = () => {
    setModoServico('novo')
    setServicoEmEdicaoId(null)
    setFormServico({
      nome: '',
      preco: '',
      disponibilidadeDias: 'Segunda a Sexta',
      disponibilidadeHorario: '08:00 às 18:00'
    })
    setMensagemSucesso('')
    setMensagemErro('')
  }

  const handleIniciarEdicaoServico = (servico) => {
    setModoServico('editando')
    setServicoEmEdicaoId(servico.id)
    setFormServico({
      nome: servico.nome,
      preco: servico.preco,
      disponibilidadeDias: servico.disponibilidadeSemana?.dias || '',
      disponibilidadeHorario: servico.disponibilidadeSemana?.faixaHoraria || ''
    })
    setMensagemSucesso('')
    setMensagemErro('')
  }

  const handleCancelarFormServico = () => {
    setModoServico(null)
    setServicoEmEdicaoId(null)
    setFormServico({
      nome: '',
      preco: '',
      disponibilidadeDias: '',
      disponibilidadeHorario: ''
    })
  }

  const handleSalvarServico = async (e) => {
    e.preventDefault()
    setMensagemSucesso('')
    setMensagemErro('')

    if (!formServico.nome.trim()) {
      setMensagemErro('O nome do serviço é obrigatório.')
      return
    }
    if (!formServico.preco || Number(formServico.preco) <= 0) {
      setMensagemErro('Informe um preço válido para o serviço.')
      return
    }

    try {
      setSalvando(true)
      const dadosServico = {
        prestadorId: usuario.id,
        nome: formServico.nome,
        preco: parseFloat(formServico.preco),
        disponibilidadeSemana: {
          dias: formServico.disponibilidadeDias,
          faixaHoraria: formServico.disponibilidadeHorario
        }
      }

      if (modoServico === 'novo') {
        await api.createServico(dadosServico)
        setMensagemSucesso('Novo serviço cadastrado com sucesso!')
      } else if (modoServico === 'editando') {
        await api.updateServico(servicoEmEdicaoId, dadosServico)
        setMensagemSucesso('Serviço atualizado com sucesso!')
      }

      handleCancelarFormServico()
      const servicosAtualizados = await api.getServicosByPrestadorId(usuario.id)
      setServicosPrestador(servicosAtualizados)
    } catch (err) {
      setMensagemErro(err.message || 'Erro ao salvar serviço.')
    } finally {
      setSalvando(false)
    }
  }

  if (carregando) {
    return (
      <div className="page-container">
        <p className="loading-message">Carregando painel do prestador...</p>
      </div>
    )
  }

  if (!usuario) {
    return null
  }

  // Caso o usuário ainda não possua o perfil de prestador habilitado
  if (!usuario.perfilPrestador) {
    return (
      <div className="page-container">
        <div className="card empty-state-card">
          <h2>Perfil de Prestador Não Habilitado</h2>
          <p>
            Você está cadastrado como cliente comum. Para oferecer e gerenciar serviços no marketplace,
            você precisa ativar seu perfil de prestador.
          </p>
          <Link to="/perfil-cliente" className="btn-primary">
            Ir para Meu Perfil e Ativar Modo Prestador
          </Link>
        </div>
      </div>
    )
  }

  const contratosFiltrados = contratosPrestador.filter(contrato => {
    if (filtroStatusContrato === 'Todos') return true
    return contrato.status === filtroStatusContrato
  })

  return (
    <div className="page-container">
      <div className="card profile-card">
        <div className="profile-header">
          <div>
            <h2>Painel do Prestador de Serviços</h2>
            <p>Gerencie seus dados profissionais e anuncie seus serviços no catálogo.</p>
          </div>
          <div className="provider-metrics">
            <span className="metric-badge">
              Nota Média: <strong>★ {usuario.perfilPrestador.notaAvaliacoes || '5.0'}</strong>
            </span>
            <span className="metric-badge">
              Status da Conta: <strong>{usuario.perfilPrestador.statusVerificacaoConta}</strong>
            </span>
          </div>
        </div>

        {mensagemSucesso && <div className="alert alert-success">{mensagemSucesso}</div>}
        {mensagemErro && <div className="alert alert-error">{mensagemErro}</div>}

        {/* Informações Cadastrais do Prestador */}
        <form onSubmit={handlePrestadorSubmit} className="standard-form">
          <fieldset className="form-section disabled-section">
            <legend>Informações Imutáveis do Prestador</legend>
            <p className="field-hint">
              As notas de avaliações e o status de verificação são regulados pela plataforma e não podem ser alterados pelo prestador.
            </p>

            <div className="form-row">
              <div className="form-group">
                <label>Nota de Avaliações (Imutável)</label>
                <input
                  type="text"
                  value={`★ ${usuario.perfilPrestador.notaAvaliacoes || '5.0'}`}
                  disabled
                  readOnly
                  className="input-readonly"
                />
              </div>

              <div className="form-group">
                <label>Status de Verificação da Conta (Imutável)</label>
                <input
                  type="text"
                  value={usuario.perfilPrestador.statusVerificacaoConta || 'Em Análise'}
                  disabled
                  readOnly
                  className="input-readonly"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>CPF (Imutável)</label>
                <input type="text" value={usuario.cpf} disabled readOnly className="input-readonly" />
              </div>

              <div className="form-group">
                <label>Data de Criação (Imutável)</label>
                <input type="text" value={usuario.dataCriacaoConta} disabled readOnly className="input-readonly" />
              </div>
            </div>
          </fieldset>

          <fieldset className="form-section">
            <legend>Informações Profissionais (Editáveis)</legend>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="prestadorCnpjInput">CNPJ</label>
                <input
                  id="prestadorCnpjInput"
                  type="text"
                  name="cnpj"
                  value={formPerfil.cnpj}
                  onChange={handlePrestadorChange}
                  placeholder="00.000.000/0000-00"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="prestadorRegistroInput">Registro Específico da Profissão</label>
                <input
                  id="prestadorRegistroInput"
                  type="text"
                  name="registroEspecificoProfissao"
                  value={formPerfil.registroEspecificoProfissao}
                  onChange={handlePrestadorChange}
                  placeholder="Ex: CRM, CREA, OAB ou MEI (pode ser nulo caso não haja)"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="prestadorNomeInput">Nome Comercial / Profissional</label>
                <input
                  id="prestadorNomeInput"
                  type="text"
                  name="nome"
                  value={formPerfil.nome}
                  onChange={handlePrestadorChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="prestadorTelefoneInput">Telefone de Contato</label>
                <input
                  id="prestadorTelefoneInput"
                  type="text"
                  name="telefone"
                  value={formPerfil.telefone}
                  onChange={handlePrestadorChange}
                  required
                />
              </div>
            </div>
          </fieldset>

          <div className="form-actions">
            <button type="submit" className="btn-primary" disabled={salvando}>
              {salvando ? 'Salvando...' : 'Atualizar Dados do Prestador'}
            </button>
          </div>
        </form>

        <hr className="divider" />

        {/* Gestão de Contratos e Ordens de Serviço Recebidas */}
        <section className="contracts-management-section">
          <div className="management-header">
            <div>
              <h3>Contratos e Ordens de Serviço Recebidas</h3>
              <p>Gerencie as solicitações e contratos de serviço firmados diretamente com seus clientes.</p>
            </div>
            <div className="contracts-stats-badges">
              <span className="badge-stat-item">
                Pendentes: <strong>{contratosPrestador.filter(c => c.status === 'Pendente').length}</strong>
              </span>
              <span className="badge-stat-item">
                Em Andamento: <strong>{contratosPrestador.filter(c => c.status === 'Em Andamento').length}</strong>
              </span>
              <span className="badge-stat-item">
                Concluídos: <strong>{contratosPrestador.filter(c => c.status === 'Concluído').length}</strong>
              </span>
            </div>
          </div>

          {/* Filtros de Status */}
          <div className="contract-filter-tabs">
            {['Todos', 'Pendente', 'Em Andamento', 'Concluído', 'Cancelado'].map(statusTab => (
              <button
                key={statusTab}
                type="button"
                className={`tab-filter-btn ${filtroStatusContrato === statusTab ? 'active' : ''}`}
                onClick={() => setFiltroStatusContrato(statusTab)}
              >
                {statusTab}
              </button>
            ))}
          </div>

          {contratosFiltrados.length === 0 ? (
            <div className="empty-contracts-card">
              <p>
                {filtroStatusContrato === 'Todos'
                  ? 'Nenhum contrato de serviço recebido até o momento.'
                  : `Nenhum contrato com status "${filtroStatusContrato}".`}
              </p>
            </div>
          ) : (
            <div className="contracts-list">
              {contratosFiltrados.map((contrato) => (
                <div key={contrato.id} className="contract-card provider-contract-card">
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
                      <span className="info-label">Cliente Solicitante:</span>
                      <strong className="info-value">{contrato.clienteNome}</strong>
                    </div>

                    <div className="contract-info-item">
                      <span className="info-label">Telefone / WhatsApp:</span>
                      <span className="info-value">{contrato.clienteTelefone}</span>
                    </div>

                    <div className="contract-info-item">
                      <span className="info-label">E-mail:</span>
                      <span className="info-value">{contrato.clienteEmail || 'Não informado'}</span>
                    </div>

                    <div className="contract-info-item">
                      <span className="info-label">Valor do Contrato:</span>
                      <strong className="info-value price-text">{formatarPreco(contrato.preco)}</strong>
                    </div>

                    <div className="contract-info-item">
                      <span className="info-label">Data de Solicitação:</span>
                      <span className="info-value">{contrato.dataContratacao}</span>
                    </div>

                    <div className="contract-info-item">
                      <span className="info-label">Data Preferencial de Atendimento:</span>
                      <strong className="info-value text-highlight">
                        {contrato.dataAgendamento || contrato.dataContratacao}
                      </strong>
                    </div>

                    <div className="contract-info-item full-width">
                      <span className="info-label">Endereço de Realização do Serviço:</span>
                      <span className="info-value">
                        {contrato.clienteEndereco?.rua ? (
                          `${contrato.clienteEndereco.rua}, ${contrato.clienteEndereco.numero || 'S/N'} - ${contrato.clienteEndereco.bairro}, ${contrato.clienteEndereco.cidade}/${contrato.clienteEndereco.estado} (CEP: ${contrato.clienteEndereco.cep || 'N/A'})`
                        ) : 'Endereço a combinar com o cliente'}
                      </span>
                    </div>

                    {contrato.observacoes && (
                      <div className="contract-info-item full-width">
                        <span className="info-label">Descrição e Observações do Cliente:</span>
                        <p className="contract-notes">{contrato.observacoes}</p>
                      </div>
                    )}
                  </div>

                  <div className="contract-card-actions">
                    <a
                      href={`https://api.whatsapp.com/send?phone=${String(contrato.clienteTelefone || '').replace(/\D/g, '')}&text=Olá%20${encodeURIComponent(contrato.clienteNome)},%20sou%20${encodeURIComponent(usuario.nome)}%20referente%20ao%20contrato%20${contrato.id}%20do%20serviço%20${encodeURIComponent(contrato.servicoNome)}.`}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-whatsapp-sm"
                    >
                      💬 Falar com Cliente no WhatsApp
                    </a>

                    {contrato.status === 'Pendente' && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleAlterarStatusContrato(contrato.id, 'Em Andamento')}
                          disabled={atualizandoContratoId === contrato.id}
                          className="btn-success-sm"
                        >
                          ✓ Aceitar e Iniciar Serviço
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAlterarStatusContrato(contrato.id, 'Cancelado')}
                          disabled={atualizandoContratoId === contrato.id}
                          className="btn-danger-sm"
                        >
                          ✕ Recusar
                        </button>
                      </>
                    )}

                    {contrato.status === 'Em Andamento' && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleAlterarStatusContrato(contrato.id, 'Concluído')}
                          disabled={atualizandoContratoId === contrato.id}
                          className="btn-success-sm"
                        >
                          ✓ Finalizar Atendimento
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAlterarStatusContrato(contrato.id, 'Cancelado')}
                          disabled={atualizandoContratoId === contrato.id}
                          className="btn-danger-sm"
                        >
                          ✕ Cancelar Atendimento
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <hr className="divider" />

        {/* Gerenciamento de Serviços */}
        <section className="services-management-section">
          <div className="management-header">
            <div>
              <h3>Meus Serviços Cadastrados</h3>
              <p>Crie e edite os serviços que os clientes visualizam na página inicial.</p>
            </div>
            {!modoServico && (
              <button
                type="button"
                className="btn-accent"
                onClick={handleIniciarCriacaoServico}
              >
                + Cadastrar Novo Serviço
              </button>
            )}
          </div>

          {/* Formulário de Criação / Edição de Serviço */}
          {modoServico && (
            <div className="service-form-wrapper">
              <h4>{modoServico === 'novo' ? 'Cadastrar Novo Serviço' : 'Editar Serviço'}</h4>
              <form onSubmit={handleSalvarServico} className="standard-form">
                <div className="form-group">
                  <label htmlFor="servicoNome">Nome do Serviço *</label>
                  <input
                    id="servicoNome"
                    type="text"
                    value={formServico.nome}
                    onChange={(e) => setFormServico(prev => ({ ...prev, nome: e.target.value }))}
                    placeholder="Ex: Reparo Hidráulico Residencial"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="servicoPreco">Preço Base (R$) *</label>
                  <input
                    id="servicoPreco"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formServico.preco}
                    onChange={(e) => setFormServico(prev => ({ ...prev, preco: e.target.value }))}
                    placeholder="Ex: 150.00"
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="servicoDias">Disponibilidade - Dias da Semana *</label>
                    <input
                      id="servicoDias"
                      type="text"
                      value={formServico.disponibilidadeDias}
                      onChange={(e) => setFormServico(prev => ({ ...prev, disponibilidadeDias: e.target.value }))}
                      placeholder="Ex: Segunda a Sexta, ou Segunda a Sábado"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="servicoHorario">Disponibilidade - Faixa Horária *</label>
                    <input
                      id="servicoHorario"
                      type="text"
                      value={formServico.disponibilidadeHorario}
                      onChange={(e) => setFormServico(prev => ({ ...prev, disponibilidadeHorario: e.target.value }))}
                      placeholder="Ex: 08:00 às 18:00"
                      required
                    />
                  </div>
                </div>

                <div className="form-actions-inline">
                  <button type="submit" className="btn-primary" disabled={salvando}>
                    {salvando ? 'Salvando...' : modoServico === 'novo' ? 'Cadastrar Serviço' : 'Salvar Alterações'}
                  </button>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={handleCancelarFormServico}
                    disabled={salvando}
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Tabela / Lista de Serviços Cadastrados */}
          {servicosPrestador.length === 0 ? (
            <div className="empty-state">
              <p>Você ainda não possui serviços cadastrados. Clique no botão acima para criar o seu primeiro serviço.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Nome do Serviço</th>
                    <th>Preço</th>
                    <th>Disponibilidade Semanal</th>
                    <th>Avaliações</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {servicosPrestador.map((serv) => (
                    <tr key={serv.id}>
                      <td>
                        <strong>{serv.nome}</strong>
                      </td>
                      <td>
                        {Number(serv.preco).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </td>
                      <td>
                        {serv.disponibilidadeSemana?.dias} ({serv.disponibilidadeSemana?.faixaHoraria})
                      </td>
                      <td>
                        {serv.avaliacoes?.length > 0
                          ? `★ ${(serv.avaliacoes.reduce((a, b) => a + Number(b.nota), 0) / serv.avaliacoes.length).toFixed(1)} (${serv.avaliacoes.length})`
                          : 'Nenhuma avaliação'}
                      </td>
                      <td>
                        <div className="table-actions">
                          <button
                            type="button"
                            className="btn-table-edit"
                            onClick={() => handleIniciarEdicaoServico(serv)}
                          >
                            Editar
                          </button>
                          <Link to={`/servico/${serv.id}`} className="btn-table-view">
                            Ver Detalhes
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
