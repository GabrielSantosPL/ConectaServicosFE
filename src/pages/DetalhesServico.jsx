/*

--- [Instruções IA] ---



--- [Instruções IA] ---

--- [Documentação IA] ---

@fileoverview Tela de Detalhes de um Serviço do sistema Conecta Serviços.
@description Exibe a ficha completa de um serviço selecionado, incluindo nome, preço,
             disponibilidade semanal (dias e faixa horária), avaliações detalhadas do serviço
             e os dados completos do prestador ao qual o serviço pertence (CNPJ, registro, nota, etc.).

@function DetalhesServico - Componente funcional React.
  @hook useParams - Extrai o parâmetro dinâmico id da URL.
  @hook useState - Controla o estado dos dados do serviço carregado, carregamento e erros.
  @hook useEffect - Dispara a busca dos dados do serviço pelo ID através de api.getServicoById.

@function formatarPreco - Converte um número para formato monetário brasileiro (BRL).
  @param {number} valor - Valor numérico a formatar.
  @returns {string} String formatada em reais.

--- [Documentação IA] ---

*/

import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api } from '../services/api'

export default function DetalhesServico() {
  const { id } = useParams()
  const [servico, setServico] = useState(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

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
                <a
                  href={`https://api.whatsapp.com/send?phone=${prestador.telefone.replace(/\D/g, '')}&text=Olá,%20vi%20seu%20serviço%20"${encodeURIComponent(servico.nome)}"%20no%20Conecta%20Serviços!`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-contact-provider"
                >
                  Entrar em Contato com o Prestador
                </a>
              </div>
            </div>
          ) : (
            <p className="no-provider-text">Informações do prestador não disponíveis.</p>
          )}
        </aside>
      </div>
    </div>
  )
}
