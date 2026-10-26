/*

--- [Instruções IA] ---



--- [Instruções IA] ---

--- [Documentação IA] ---

@fileoverview Página de Cadastro de Cliente Comum do sistema Conecta Serviços.
@description Permite o cadastro exclusivo de novos clientes comuns com validação e
             auto-preenchimento dinâmico e automático de endereço via consulta à API pública ViaCEP
             ao digitar o 8º dígito do CEP, sem a necessidade de pressionar botões adicionais.

@function Cadastro - Componente funcional React.
  @hook useState - Gerencia os dados do formulário (cliente e endereço), estados de carregamento, sucesso e erros.
  @hook useNavigate - Permite redirecionar o usuário após a conclusão do cadastro.

@function handleInputChange - Atualiza os campos de texto gerais do formulário no estado local.
  @param {React.ChangeEvent<HTMLInputElement>} e - Evento de alteração de campo.
@function handleEnderecoChange - Atualiza os campos de endereço e aciona dinamicamente a busca no ViaCEP assim que o CEP atinge 8 dígitos.
  @param {React.ChangeEvent<HTMLInputElement>} e - Evento de alteração de campo de endereço.
@function handleBuscarCep - Dispara a busca automática no ViaCEP e preenche dinamicamente os campos de logradouro, bairro, cidade e estado.
  @param {string} cepInformado - CEP numérico a ser consultado.
  @returns {Promise<void>}
@function handleCepBlur - Valida se o CEP informado está incompleto ao sair do campo.
@function handleSubmit - Valida os dados informados e cadastra o novo cliente na base simulada.
  @param {React.FormEvent<HTMLFormElement>} e - Evento de submissão do formulário.
  @returns {Promise<void>}

--- [Documentação IA] ---

*/

import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../services/api'

export default function Cadastro() {
  const navigate = useNavigate()

  const [formData, setFormData] = useState({
    nome: '',
    cpf: '',
    email: '',
    senha: '',
    telefone: '',
    dataNascimento: '',
    endereco: {
      cep: '',
      estado: '',
      cidade: '',
      bairro: '',
      rua: '',
      numero: ''
    }
  })

  const [buscandoCep, setBuscandoCep] = useState(false)
  const [erroCep, setErroCep] = useState('')
  const [erroForm, setErroForm] = useState('')
  const [sucesso, setSucesso] = useState(false)
  const [salvando, setSalvando] = useState(false)

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
        setErroCep('')
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
      setErroCep('O CEP deve conter 8 números.')
      return
    }

    try {
      setBuscandoCep(true)
      setErroCep('')
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
      setErroCep(err.message || 'Erro ao consultar o CEP no ViaCEP.')
    } finally {
      setBuscandoCep(false)
    }
  }

  const handleCepBlur = () => {
    const limpo = formData.endereco.cep.replace(/\D/g, '')
    if (limpo.length > 0 && limpo.length < 8) {
      setErroCep('O CEP deve conter 8 números.')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErroForm('')

    if (!formData.nome.trim()) {
      setErroForm('Por favor, informe seu nome completo.')
      return
    }
    if (!formData.cpf.trim()) {
      setErroForm('Por favor, informe seu CPF.')
      return
    }
    if (!formData.email.trim()) {
      setErroForm('Por favor, informe seu e-mail.')
      return
    }
    if (!formData.senha || formData.senha.length < 6) {
      setErroForm('A senha deve conter no mínimo 6 caracteres.')
      return
    }
    if (!formData.telefone.trim()) {
      setErroForm('Por favor, informe seu telefone.')
      return
    }
    if (!formData.dataNascimento) {
      setErroForm('Por favor, informe sua data de nascimento.')
      return
    }
    if (!formData.endereco.cep) {
      setErroForm('Por favor, informe o CEP do seu endereço.')
      return
    }
    if (!formData.endereco.numero) {
      setErroForm('Por favor, informe o número da sua residência.')
      return
    }

    try {
      setSalvando(true)
      await api.registerCliente(formData)
      setSucesso(true)
      setTimeout(() => {
        navigate('/login')
      }, 1500)
    } catch (err) {
      setErroForm(err.message || 'Erro ao realizar o cadastro.')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="page-container form-page-container">
      <div className="card form-card">
        <div className="form-header">
          <h2>Cadastro de Cliente</h2>
          <p>Crie sua conta como cliente comum para solicitar e contratar serviços.</p>
        </div>

        {erroForm && <div className="alert alert-error">{erroForm}</div>}
        {sucesso && (
          <div className="alert alert-success">
            Cadastro realizado com sucesso! Redirecionando para o login...
          </div>
        )}

        <form onSubmit={handleSubmit} className="standard-form">
          <fieldset className="form-section">
            <legend>Dados Pessoais</legend>

            <div className="form-group">
              <label htmlFor="nome">Nome Completo *</label>
              <input
                id="nome"
                type="text"
                name="nome"
                value={formData.nome}
                onChange={handleInputChange}
                placeholder="Ex: João da Silva"
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="cpf">CPF *</label>
                <input
                  id="cpf"
                  type="text"
                  name="cpf"
                  value={formData.cpf}
                  onChange={handleInputChange}
                  placeholder="000.000.000-00"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="dataNascimento">Data de Nascimento *</label>
                <input
                  id="dataNascimento"
                  type="date"
                  name="dataNascimento"
                  value={formData.dataNascimento}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="email">E-mail *</label>
                <input
                  id="email"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="seuemail@exemplo.com"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="senha">Senha de Acesso *</label>
                <input
                  id="senha"
                  type="password"
                  name="senha"
                  value={formData.senha}
                  onChange={handleInputChange}
                  placeholder="Mínimo 6 caracteres"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="telefone">Telefone / WhatsApp *</label>
              <input
                id="telefone"
                type="tel"
                name="telefone"
                value={formData.telefone}
                onChange={handleInputChange}
                placeholder="(00) 00000-0000"
                required
              />
            </div>
          </fieldset>

          <fieldset className="form-section">
            <legend>Endereço Residencial</legend>
            <p className="field-hint">
              Digite o CEP para preenchimento dinâmico e automático das informações de endereço via ViaCEP.
            </p>

            <div className="form-row cep-lookup-row">
              <div className="form-group flex-2">
                <label htmlFor="cep">
                  CEP * {buscandoCep && <span className="cep-inline-loading">(Buscando endereço...)</span>}
                </label>
                <input
                  id="cep"
                  type="text"
                  name="cep"
                  value={formData.endereco.cep}
                  onChange={handleEnderecoChange}
                  onBlur={handleCepBlur}
                  placeholder="00000-000"
                  maxLength={9}
                  required
                />
                {erroCep && <span className="field-error-text">{erroCep}</span>}
              </div>

              <div className="form-group flex-1">
                <label htmlFor="estado">Estado (UF) *</label>
                <input
                  id="estado"
                  type="text"
                  name="estado"
                  value={formData.endereco.estado}
                  onChange={handleEnderecoChange}
                  placeholder="Ex: SP"
                  maxLength={2}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group flex-2">
                <label htmlFor="cidade">Cidade *</label>
                <input
                  id="cidade"
                  type="text"
                  name="cidade"
                  value={formData.endereco.cidade}
                  onChange={handleEnderecoChange}
                  placeholder="Ex: São Paulo"
                  required
                />
              </div>

              <div className="form-group flex-2">
                <label htmlFor="bairro">Bairro *</label>
                <input
                  id="bairro"
                  type="text"
                  name="bairro"
                  value={formData.endereco.bairro}
                  onChange={handleEnderecoChange}
                  placeholder="Ex: Centro"
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group flex-3">
                <label htmlFor="rua">Rua / Logradouro *</label>
                <input
                  id="rua"
                  type="text"
                  name="rua"
                  value={formData.endereco.rua}
                  onChange={handleEnderecoChange}
                  placeholder="Ex: Rua das Flores"
                  required
                />
              </div>

              <div className="form-group flex-1">
                <label htmlFor="numero">Número *</label>
                <input
                  id="numero"
                  type="text"
                  name="numero"
                  value={formData.endereco.numero}
                  onChange={handleEnderecoChange}
                  placeholder="123"
                  required
                />
              </div>
            </div>
          </fieldset>

          <div className="form-actions">
            <button type="submit" className="btn-primary" disabled={salvando}>
              {salvando ? 'Cadastrando...' : 'Finalizar Cadastro'}
            </button>
          </div>

          <div className="form-footer-link">
            <span>Já tem uma conta? </span>
            <Link to="/login">Clique aqui para entrar</Link>
          </div>
        </form>
      </div>
    </div>
  )
}
