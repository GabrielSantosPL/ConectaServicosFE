/*

--- [Instruções IA] ---



--- [Instruções IA] ---

--- [Documentação IA] ---

@fileoverview Página de Perfil do Prestador de Serviços do sistema Conecta Serviços.
@description Permite a visualização e edição de dados do prestador de serviços (respeitando
             as regras de imutabilidade de Nota e Status de Verificação), bem como a criação
             e edição completa de serviços oferecidos pelo prestador.

@function PerfilPrestador - Componente funcional React.
  @hook useState - Controla os dados cadastrais do prestador, lista de serviços próprios,
                    estados de edição/criação de serviço, mensagens e flags de carregamento.
  @hook useEffect - Inicializa a página com o usuário logado e carrega seus serviços cadastrados.
  @hook useNavigate - Redireciona o usuário caso não esteja autenticado.

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

--- [Documentação IA] ---

*/

import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../services/api'

export default function PerfilPrestador() {
  const navigate = useNavigate()
  const [usuario, setUsuario] = useState(() => api.getCurrentUser())
  const [servicosPrestador, setServicosPrestador] = useState([])
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

    async function carregarServicosPrestador() {
      if (user.perfilPrestador) {
        try {
          setCarregando(true)
          const servicos = await api.getServicosByPrestadorId(user.id)
          setServicosPrestador(servicos)
        } catch {
          setMensagemErro('Erro ao carregar serviços do prestador.')
        } finally {
          setCarregando(false)
        }
      } else {
        setCarregando(false)
      }
    }

    carregarServicosPrestador()
  }, [navigate])

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
