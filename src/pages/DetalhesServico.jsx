/*

--- [Instruções IA] ---



--- [Instruções IA] ---

--- [Documentação IA] ---

@fileoverview Tela de Detalhes de um Serviço do sistema Conecta Serviços.
@description Exibe a ficha completa de um serviço selecionado, incluindo nome, preço,
             disponibilidade semanal, avaliações, dados do prestador e possibilita firmar
             um contrato formal de prestação de serviços atribuindo uma relação oficial
             entre o prestador e o cliente solicitante.

@function DetalhesServico - Componente funcional React.
  @hook useParams - Extrai o parâmetro dinâmico id da URL.
  @hook useNavigate - Permite redirecionamento programático caso seja necessário login.
  @hook useState - Controla os dados do serviço, formulário de contrato, estados de modal, carregamento e erros.
  @hook useEffect - Dispara a busca dos dados do serviço pelo ID através de api.getServicoById.

@function formatarPreco - Converte um número para formato monetário brasileiro (BRL).
  @param {number} valor - Valor numérico a formatar.
  @returns {string} String formatada em reais.
@function handleAbrirModalContrato - Inicializa os dados de agendamento/endereço e abre o formulário de contratação.
@function handleFecharModalContrato - Reseta os estados de erro/sucesso e fecha a janela modal de contratação.
@function handleEnderecoChange - Atualiza os campos de endereço onde o serviço será prestado.
  @param {React.ChangeEvent<HTMLInputElement>} e - Evento de alteração de campo de endereço.
@function handleConfirmarContrato - Registra formalmente a relação de serviço via api.createContrato vinculando cliente e prestador.
  @param {React.FormEvent<HTMLFormElement>} e - Evento de submissão do contrato.
  @returns {Promise<void>}

--- [Documentação IA] ---

*/

import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { api } from '../services/api'

export default function DetalhesServico() {
  const { id } = useParams()
  const navigate = useNavigate()
  const currentUser = api.getCurrentUser()

  const [servico, setServico] = useState(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  // Estados do sistema de contratos
  const [mostrarModalContrato, setMostrarModalContrato] = useState(false)
  const [salvandoContrato, setSalvandoContrato] = useState(false)
  const [erroContrato, setErroContrato] = useState('')
  const [contratoCriado, setContratoCriado] = useState(null)

  const [dataHoje] = useState(() => new Date().toISOString().split('T')[0])
  const [dataAgendamento, setDataAgendamento] = useState(() => new Date().toISOString().split('T')[0])
  const [observacoes, setObservacoes] = useState('')
  const [enderecoAtendimento, setEnderecoAtendimento] = useState({
    rua: '',
    numero: '',
    bairro: '',
    cidade: '',
    estado: '',
    cep: ''
  })

  useEffect(() => {
    async function carregarServico(servicoId) {
      try {
        setCarregando(true)
        const dados = await api.getServicoById(servicoId)
        setServico(dados)
      } catch (err) {
        setErro(err.message || 'Erro ao carregar detalhes do serviço.')
      } finally {
        setCarregando(false)
      }
    }

    if (id) {
      carregarServico(id)
    }
  }, [id])

  const formatarPreco = (valor) => {
    return Number(valor || 0).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    })
  }

  const handleAbrirModalContrato = () => {
    if (!currentUser) {
      navigate('/login')
      return
    }

    setEnderecoAtendimento({
      rua: currentUser.endereco?.rua || '',
      numero: currentUser.endereco?.numero || '',
      bairro: currentUser.endereco?.bairro || '',
      cidade: currentUser.endereco?.cidade || '',
      estado: currentUser.endereco?.estado || '',
      cep: currentUser.endereco?.cep || ''
    })
    setDataAgendamento(dataHoje)
    setObservacoes('')
    setErroContrato('')
    setContratoCriado(null)
    setMostrarModalContrato(true)
  }

  const handleFecharModalContrato = () => {
    setMostrarModalContrato(false)
    setContratoCriado(null)
    setErroContrato('')
  }

  const handleEnderecoChange = (e) => {
    const { name, value } = e.target
    setEnderecoAtendimento(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleConfirmarContrato = async (e) => {
    e.preventDefault()
    setErroContrato('')

    if (!currentUser) {
      navigate('/login')
      return
    }

    if (!servico || !servico.prestador) {
      setErroContrato('Dados do prestador ou serviço não encontrados.')
      return
    }

    try {
      setSalvandoContrato(true)
      const novoContrato = await api.createContrato({
        servicoId: servico.id,
        servicoNome: servico.nome,
        clienteId: currentUser.id,
        clienteNome: currentUser.nome,
        clienteTelefone: currentUser.telefone,
        clienteEmail: currentUser.email,
        clienteEndereco: enderecoAtendimento,
        prestadorId: servico.prestador.id,
        prestadorNome: servico.prestador.nome,
        prestadorTelefone: servico.prestador.telefone,
        prestadorEmail: servico.prestador.email,
        preco: servico.preco,
        dataAgendamento: dataAgendamento,
        observacoes: observacoes
      })
      setContratoCriado(novoContrato)
    } catch (err) {
      setErroContrato(err.message || 'Erro ao registrar o contrato de serviço.')
    } finally {
      setSalvandoContrato(false)
    }
  }

  if (carregando) {
    return (
      <div className="page-container">
        <p className="loading-message">Carregando detalhes do serviço...</p>
      </div>
    )
  }

  if (erro || !servico) {
    return (
      <div className="page-container">
        <div className="card empty-state-card">
          <h2>Serviço Não Encontrado</h2>
          <p>{erro || 'O serviço solicitado não existe ou foi removido.'}</p>
          <Link to="/" className="btn-primary">Voltar para a Página Inicial</Link>
        </div>
      </div>
    )
  }

  const prestador = servico.prestador
  const mediaAvaliacoes = servico.avaliacoes && servico.avaliacoes.length > 0
    ? (servico.avaliacoes.reduce((acc, curr) => acc + Number(curr.nota), 0) / servico.avaliacoes.length).toFixed(1)
    : null

  return (
    <div className="page-container">
      <div className="navigation-back-bar">
        <Link to="/" className="btn-back">← Voltar para todos os serviços</Link>
      </div>

      <div className="details-layout">
        {/* Bloco Principal do Serviço */}
        <section className="service-main-details card">
          <div className="service-details-header">
            <span className="service-category-tag">Serviço Cadastrado</span>
            <h1 className="service-main-title">{servico.nome}</h1>
            <div className="service-highlight-price">
              <span className="price-title">Preço Estimado</span>
              <span className="price-big">{formatarPreco(servico.preco)}</span>
            </div>
          </div>

          <div className="service-info-block">
            <h3>Disponibilidade na Semana</h3>
            <div className="availability-card">
              <div className="availability-row">
                <strong>📅 Dias de Atendimento:</strong>
                <span>{servico.disponibilidadeSemana?.dias || 'A combinar'}</span>
              </div>
              <div className="availability-row">
                <strong>⏰ Faixa Horária:</strong>
                <span>{servico.disponibilidadeSemana?.faixaHoraria || 'Horário flexível'}</span>
              </div>
            </div>
          </div>

          {/* Avaliações do Serviço */}
          <div className="service-reviews-block">
            <div className="reviews-header">
              <h3>Avaliações do Serviço</h3>
              <span className="reviews-summary-badge">
                {mediaAvaliacoes ? `★ ${mediaAvaliacoes} de 5.0 (${servico.avaliacoes.length} avaliações)` : 'Ainda sem avaliações'}
              </span>
            </div>

            {servico.avaliacoes && servico.avaliacoes.length > 0 ? (
              <div className="reviews-list">
                {servico.avaliacoes.map((item) => (
                  <div key={item.id} className="review-item">
                    <div className="review-item-header">
                      <strong>{item.autor}</strong>
                      <span className="review-score">★ {item.nota}</span>
                      {item.data && <span className="review-date">{item.data}</span>}
                    </div>
                    <p className="review-comment">{item.comentario}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="no-reviews-text">
                Este serviço ainda não recebeu avaliações de clientes.
              </p>
            )}
          </div>
        </section>

        {/* Informações do Prestador */}
        <aside className="provider-sidebar card">
          <h3>Sobre o Prestador</h3>

          {prestador ? (
            <div className="provider-sidebar-content">
              <div className="provider-avatar-box">
                <span className="provider-avatar-letter">
                  {prestador.nome ? prestador.nome.charAt(0).toUpperCase() : 'P'}
                </span>
                <div className="provider-names">
                  <h4>{prestador.nome}</h4>
                  <span className="provider-status-tag">
                    ✓ {prestador.statusVerificacaoConta}
                  </span>
                </div>
              </div>

              <div className="provider-meta-list">
                <div className="provider-meta-item">
                  <span className="meta-label">Nota do Prestador:</span>
                  <span className="meta-value">★ {prestador.notaAvaliacoes || '5.0'}</span>
                </div>

                <div className="provider-meta-item">
                  <span className="meta-label">CNPJ:</span>
                  <span className="meta-value">{prestador.cnpj || 'Não informado'}</span>
                </div>

                <div className="provider-meta-item">
                  <span className="meta-label">Registro Profissional:</span>
                  <span className="meta-value">
                    {prestador.registroEspecificoProfissao || 'Não aplicável ou não informado'}
                  </span>
                </div>

                <div className="provider-meta-item">
                  <span className="meta-label">Localização:</span>
                  <span className="meta-value">
                    {prestador.cidade && prestador.estado
                      ? `${prestador.cidade} - ${prestador.estado}`
                      : 'Não especificada'}
                  </span>
                </div>

                <div className="provider-meta-item">
                  <span className="meta-label">Telefone / Contato:</span>
                  <span className="meta-value highlight-contact">{prestador.telefone}</span>
                </div>

                <div className="provider-meta-item">
                  <span className="meta-label">E-mail:</span>
                  <span className="meta-value">{prestador.email}</span>
                </div>
              </div>

              <div className="provider-action-box">
                {currentUser && currentUser.id === prestador.id ? (
                  <div className="contract-box-owned">
                    <span className="contract-box-tag">Seu Serviço</span>
                    <p className="contract-box-desc">
                      Você é o prestador deste serviço. Para visualizar e responder aos contratos recebidos, acesse seu painel.
                    </p>
                    <Link to="/perfil-prestador" className="btn-secondary btn-full">
                      Ir para Meu Painel
                    </Link>
                  </div>
                ) : (
                  <div className="contract-action-container">
                    <button
                      type="button"
                      onClick={handleAbrirModalContrato}
                      className="btn-contract-main"
                    >
                      🤝 Contratar Serviço
                    </button>
                    <p className="contract-subhint">
                      Atribui uma relação formal de prestação de serviços com o profissional.
                    </p>

                    <div className="contact-divider">
                      <span>ou tire dúvidas rápidas</span>
                    </div>

                    <a
                      href={`https://api.whatsapp.com/send?phone=${prestador.telefone.replace(/\D/g, '')}&text=Olá,%20vi%20seu%20serviço%20"${encodeURIComponent(servico.nome)}"%20no%20Conecta%20Serviços!`}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-whatsapp-outline"
                    >
                      💬 Falar via WhatsApp
                    </a>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <p className="no-provider-text">Informações do prestador não disponíveis.</p>
          )}
        </aside>
      </div>

      {/* Modal de Estabelecimento de Contrato */}
      {mostrarModalContrato && (
        <div className="modal-backdrop">
          <div className="modal-content contract-modal">
            <div className="modal-header">
              <h3>Contrato de Prestação de Serviço</h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={handleFecharModalContrato}
              >
                ✕
              </button>
            </div>

            {contratoCriado ? (
              <div className="contract-success-box">
                <div className="contract-success-icon">✓</div>
                <h4>Contrato Estabelecido com Sucesso!</h4>
                <p>
                  A relação de serviço foi atribuída entre você e o prestador <strong>{contratoCriado.prestadorNome}</strong>.
                </p>

                <div className="contract-summary-card">
                  <div className="summary-row">
                    <span>Protocolo do Contrato:</span>
                    <strong>{contratoCriado.id}</strong>
                  </div>
                  <div className="summary-row">
                    <span>Serviço:</span>
                    <strong>{contratoCriado.servicoNome}</strong>
                  </div>
                  <div className="summary-row">
                    <span>Valor Acordado:</span>
                    <strong>{formatarPreco(contratoCriado.preco)}</strong>
                  </div>
                  <div className="summary-row">
                    <span>Status Inicial:</span>
                    <span className="badge-contract-status status-pendente">
                      {contratoCriado.status}
                    </span>
                  </div>
                  <div className="summary-row">
                    <span>Data de Solicitação:</span>
                    <span>{contratoCriado.dataContratacao}</span>
                  </div>
                </div>

                <p className="contract-next-steps">
                  O prestador recebeu a notificação em seu painel profissional e entrará em contato para alinhar a execução.
                </p>

                <div className="modal-footer-actions">
                  <Link to="/perfil-cliente" className="btn-primary">
                    Visualizar Meus Contratos no Perfil
                  </Link>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={handleFecharModalContrato}
                  >
                    Fechar
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleConfirmarContrato} className="contract-form">
                <p className="modal-description">
                  Ao confirmar a solicitação, será estabelecido o vínculo formal de serviço entre as partes.
                </p>

                {erroContrato && <div className="alert alert-error">{erroContrato}</div>}

                <div className="contract-parties-card">
                  <div className="party-item">
                    <span className="party-role">Prestador de Serviço</span>
                    <strong>{prestador?.nome}</strong>
                    <span>{prestador?.telefone}</span>
                  </div>
                  <div className="party-divider">➔</div>
                  <div className="party-item">
                    <span className="party-role">Cliente Contratante</span>
                    <strong>{currentUser?.nome}</strong>
                    <span>{currentUser?.telefone}</span>
                  </div>
                </div>

                <div className="contract-value-card">
                  <span>Valor do Serviço Contratado:</span>
                  <span className="contract-price-value">{formatarPreco(servico.preco)}</span>
                </div>

                <div className="form-group">
                  <label htmlFor="dataAgendamento">Data Preferencial para o Atendimento *</label>
                  <input
                    id="dataAgendamento"
                    type="date"
                    min={dataHoje}
                    value={dataAgendamento}
                    onChange={(e) => setDataAgendamento(e.target.value)}
                    required
                  />
                </div>

                <fieldset className="form-fieldset-compact">
                  <legend>Endereço de Realização do Atendimento</legend>
                  <div className="form-row">
                    <div className="form-group flex-3">
                      <label htmlFor="endRua">Rua / Logradouro *</label>
                      <input
                        id="endRua"
                        type="text"
                        name="rua"
                        value={enderecoAtendimento.rua}
                        onChange={handleEnderecoChange}
                        placeholder="Ex: Rua das Flores"
                        required
                      />
                    </div>
                    <div className="form-group flex-1">
                      <label htmlFor="endNumero">Número *</label>
                      <input
                        id="endNumero"
                        type="text"
                        name="numero"
                        value={enderecoAtendimento.numero}
                        onChange={handleEnderecoChange}
                        placeholder="123"
                        required
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group flex-2">
                      <label htmlFor="endBairro">Bairro *</label>
                      <input
                        id="endBairro"
                        type="text"
                        name="bairro"
                        value={enderecoAtendimento.bairro}
                        onChange={handleEnderecoChange}
                        placeholder="Bairro"
                        required
                      />
                    </div>
                    <div className="form-group flex-2">
                      <label htmlFor="endCidade">Cidade *</label>
                      <input
                        id="endCidade"
                        type="text"
                        name="cidade"
                        value={enderecoAtendimento.cidade}
                        onChange={handleEnderecoChange}
                        placeholder="Cidade"
                        required
                      />
                    </div>
                    <div className="form-group flex-1">
                      <label htmlFor="endEstado">UF *</label>
                      <input
                        id="endEstado"
                        type="text"
                        name="estado"
                        value={enderecoAtendimento.estado}
                        onChange={handleEnderecoChange}
                        placeholder="UF"
                        maxLength={2}
                        required
                      />
                    </div>
                  </div>
                </fieldset>

                <div className="form-group">
                  <label htmlFor="observacoesContrato">
                    Observações e Detalhes do Serviço Solicitado
                  </label>
                  <textarea
                    id="observacoesContrato"
                    rows={3}
                    value={observacoes}
                    onChange={(e) => setObservacoes(e.target.value)}
                    placeholder="Descreva detalhes específicos da sua solicitação, necessidades especiais ou pontos de atenção para o prestador..."
                  />
                </div>

                <div className="modal-footer-actions">
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={salvandoContrato}
                  >
                    {salvandoContrato ? 'Registrando Contrato...' : 'Confirmar e Firmar Contrato'}
                  </button>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={handleFecharModalContrato}
                    disabled={salvandoContrato}
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
