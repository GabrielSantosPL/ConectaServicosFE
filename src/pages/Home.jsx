/*

--- [Instruções IA] ---



--- [Instruções IA] ---

--- [Documentação IA] ---

@fileoverview Página Inicial (Home) do sistema Conecta Serviços.
@description Exibe o catálogo completo de todos os serviços cadastrados no sistema,
             apresentando nome, preço, disponibilidade semanal, avaliações e dados do prestador,
             com link para a página de detalhes de cada serviço.

@function Home - Componente funcional React.
  @hook useState - Controla a lista de serviços carregados, estado de carregamento e eventuais mensagens de erro.
  @hook useEffect - Dispara o carregamento inicial dos serviços a partir da API simulada.

@function formatarPreco - Converte um valor numérico para o formato de moeda Real (BRL).
  @param {number} valor - Valor numérico a ser formatado.
  @returns {string} String formatada em reais (R$ ...).
@function calcularMediaAvaliacoes - Calcula a média aritmética das notas das avaliações de um serviço.
  @param {Array<Object>} avaliacoes - Lista de objetos de avaliação.
  @returns {string} Média formatada com uma casa decimal ou mensagem indicando ausência de avaliações.

--- [Documentação IA] ---

*/

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../services/api'

export default function Home() {
  const [servicos, setServicos] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  useEffect(() => {
    async function carregarServicos() {
      try {
        setCarregando(true)
        const lista = await api.getServicos()
        setServicos(lista)
      } catch {
        setErro('Não foi possível carregar a lista de serviços.')
      } finally {
        setCarregando(false)
      }
    }

    carregarServicos()
  }, [])

  const formatarPreco = (valor) => {
    return Number(valor || 0).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    })
  }

  const calcularMediaAvaliacoes = (avaliacoes) => {
    if (!avaliacoes || avaliacoes.length === 0) {
      return 'Sem avaliações ainda'
    }
    const soma = avaliacoes.reduce((acc, curr) => acc + (Number(curr.nota) || 0), 0)
    const media = (soma / avaliacoes.length).toFixed(1)
    return `★ ${media} (${avaliacoes.length} ${avaliacoes.length === 1 ? 'avaliação' : 'avaliações'})`
  }

  return (
    <div className="page-container">
      <section className="hero-banner">
        <h2>Encontre os Melhores Prestadores de Serviços</h2>
        <p>Conectamos você a profissionais qualificados de diversas áreas de forma rápida e segura.</p>
      </section>

      <section className="services-section">
        <div className="section-header">
          <h3>Serviços Disponíveis</h3>
          <span className="services-count">Total: {servicos.length} serviço(s)</span>
        </div>

        {carregando && <p className="loading-message">Carregando serviços disponíveis...</p>}
        {erro && <p className="error-message">{erro}</p>}

        {!carregando && servicos.length === 0 && (
          <div className="empty-state">
            <p>Nenhum serviço cadastrado no momento.</p>
          </div>
        )}

        <div className="services-grid">
          {servicos.map((servico) => (
            <article key={servico.id} className="service-card">
              <div className="service-card-body">
                <span className="service-badge-category">Serviço Profissional</span>
                <h4 className="service-title">{servico.nome}</h4>

                <div className="service-price-tag">
                  <span className="price-label">A partir de</span>
                  <span className="price-value">{formatarPreco(servico.preco)}</span>
                </div>

                <div className="service-detail-item">
                  <strong>Disponibilidade:</strong>
                  <span>
                    {servico.disponibilidadeSemana?.dias || 'A combinar'} - {servico.disponibilidadeSemana?.faixaHoraria || 'Horário flexível'}
                  </span>
                </div>

                <div className="service-detail-item">
                  <strong>Avaliações do serviço:</strong>
                  <span className="rating-badge">{calcularMediaAvaliacoes(servico.avaliacoes)}</span>
                </div>

                <div className="service-provider-info">
                  <strong>Prestador:</strong>
                  <span>{servico.prestador?.nome || 'Profissional parceiro'}</span>
                  {servico.prestador?.cidade && (
                    <span className="provider-location">
                      📍 {servico.prestador.cidade}/{servico.prestador.estado}
                    </span>
                  )}
                  {servico.prestador?.statusVerificacaoConta && (
                    <span className="provider-verification">
                      ✓ Conta {servico.prestador.statusVerificacaoConta}
                    </span>
                  )}
                </div>
              </div>

              <div className="service-card-footer">
                <Link to={`/servico/${servico.id}`} className="btn-view-details">
                  Ver Detalhes do Serviço
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}
