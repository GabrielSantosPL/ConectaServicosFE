/*

--- [Instruções IA] ---



--- [Instruções IA] ---

--- [Documentação IA] ---

@fileoverview Camada de serviços simulados (Mock API) para o frontend Conecta Serviços.
@description Simula a persistência e operações de backend utilizando o LocalStorage do navegador.
             Fornece métodos assíncronos baseados em Promises para gerenciar usuários, serviços,
             endereços via ViaCEP e o sistema de contratos que estabelece a relação de serviço
             entre clientes e prestadores.

@constant {string} STORAGE_USERS_KEY - Chave do LocalStorage para a lista de usuários.
@constant {string} STORAGE_SERVICES_KEY - Chave do LocalStorage para a lista de serviços.
@constant {string} STORAGE_SESSION_KEY - Chave do LocalStorage para a sessão do usuário logado.
@constant {string} STORAGE_CONTRACTS_KEY - Chave do LocalStorage para os contratos/relações de serviço.

@function initStorage - Inicializa os dados pré-cadastrados no LocalStorage caso ainda não existam.
@function login - Autentica um usuário por email e senha.
  @param {string} email - Email do usuário.
  @param {string} senha - Senha do usuário.
  @returns {Promise<Object>} Dados do usuário autenticado.
@function logout - Finaliza a sessão do usuário ativo.
  @returns {Promise<void>}
@function getCurrentUser - Recupera os dados do usuário atualmente logado.
  @returns {Object|null} Objeto do usuário ou null se não houver sessão ativa.
@function registerCliente - Cadastra um novo cliente comum no sistema.
  @param {Object} dadosCliente - Dados do cliente comum a serem registrados.
  @returns {Promise<Object>} Usuário recém-criado.
@function updatePerfilCliente - Atualiza as informações permitidas do cliente comum.
  @param {string|number} id - Identificador do usuário.
  @param {Object} dadosAtualizados - Novos dados permitidos para atualização.
  @returns {Promise<Object>} Usuário atualizado.
@function updatePerfilPrestador - Atualiza as informações permitidas do perfil de prestador.
  @param {string|number} id - Identificador do usuário prestador.
  @param {Object} dadosPrestador - Novos dados permitidos do prestador.
  @returns {Promise<Object>} Usuário prestador atualizado.
@function ativarPerfilPrestador - Promove/habilita o perfil de prestador para um cliente existente.
  @param {string|number} id - Identificador do usuário.
  @param {Object} dadosIniciaisPrestador - Dados iniciais do prestador (CNPJ, registro).
  @returns {Promise<Object>} Usuário com perfil de prestador ativo.
@function getServicos - Obtém a lista completa de serviços cadastrados.
  @returns {Promise<Array<Object>>} Lista de serviços.
@function getServicoById - Busca os detalhes de um serviço específico pelo ID.
  @param {string|number} id - Identificador do serviço.
  @returns {Promise<Object>} Serviço encontrado.
@function getServicosByPrestadorId - Busca os serviços pertencentes a um prestador específico.
  @param {string|number} prestadorId - Identificador do prestador.
  @returns {Promise<Array<Object>>} Lista de serviços do prestador.
@function createServico - Cria um novo serviço associado a um prestador.
  @param {Object} servicoData - Dados do novo serviço.
  @returns {Promise<Object>} Serviço criado.
@function updateServico - Atualiza as informações de um serviço existente.
  @param {string|number} id - Identificador do serviço.
  @param {Object} servicoData - Dados atualizados do serviço.
  @returns {Promise<Object>} Serviço atualizado.
@function consultarCep - Realiza busca de endereço utilizando a API pública ViaCEP.
  @param {string} cep - CEP numérico a ser consultado.
  @returns {Promise<Object>} Dados do endereço retornados pela API ViaCEP.
@function getContratos - Obtém a lista completa de contratos de serviço registrados.
  @returns {Promise<Array<Object>>} Lista de contratos.
@function getContratosByClienteId - Retorna todos os contratos vinculados a um cliente específico.
  @param {string|number} clienteId - Identificador do cliente.
  @returns {Promise<Array<Object>>} Lista de contratos do cliente.
@function getContratosByPrestadorId - Retorna todos os contratos recebidos por um prestador específico.
  @param {string|number} prestadorId - Identificador do prestador.
  @returns {Promise<Array<Object>>} Lista de contratos do prestador.
@function getContratoById - Busca os detalhes de um contrato específico pelo ID.
  @param {string|number} id - Identificador do contrato.
  @returns {Promise<Object>} Contrato encontrado.
@function createContrato - Registra uma nova relação contratual de serviço entre cliente e prestador.
  @param {Object} dadosContrato - Dados do contrato (serviço, datas, observações e envolvidos).
  @returns {Promise<Object>} Contrato criado com status 'Pendente'.
@function updateStatusContrato - Atualiza o status de um contrato ('Pendente', 'Em Andamento', 'Concluído', 'Cancelado').
  @param {string|number} id - Identificador do contrato.
  @param {string} novoStatus - Novo status atribuído ao contrato.
  @returns {Promise<Object>} Contrato atualizado.

--- [Documentação IA] ---

*/

const STORAGE_USERS_KEY = 'conecta_servicos_usuarios';
const STORAGE_SERVICES_KEY = 'conecta_servicos_itens';
const STORAGE_SESSION_KEY = 'conecta_servicos_sessao';
const STORAGE_CONTRACTS_KEY = 'conecta_servicos_contratos';

const SEED_USERS = [
  {
    id: 'user-1',
    nome: 'Maria da Silva',
    cpf: '111.222.333-44',
    email: 'cliente@teste.com',
    senha: '123456',
    telefone: '(11) 98765-4321',
    dataNascimento: '1995-05-15',
    dataCriacaoConta: '2026-01-10',
    statusConta: 'Ativa',
    endereco: {
      cep: '01001-000',
      estado: 'SP',
      cidade: 'São Paulo',
      bairro: 'Sé',
      rua: 'Praça da Sé',
      numero: '100'
    },
    perfilPrestador: null
  },
  {
    id: 'user-2',
    nome: 'Carlos Manutenção Elétrica',
    cpf: '555.666.777-88',
    email: 'prestador@teste.com',
    senha: '123456',
    telefone: '(11) 91234-5678',
    dataNascimento: '1988-10-20',
    dataCriacaoConta: '2025-11-01',
    statusConta: 'Ativa',
    endereco: {
      cep: '04571-010',
      estado: 'SP',
      cidade: 'São Paulo',
      bairro: 'Brooklin',
      rua: 'Avenida Engenheiro Luís Carlos Berrini',
      numero: '500'
    },
    perfilPrestador: {
      cnpj: '12.345.678/0001-99',
      notaAvaliacoes: 4.9,
      statusVerificacaoConta: 'Verificada',
      registroEspecificoProfissao: 'CREA-SP 9876543'
    }
  }
];

const SEED_SERVICES = [
  {
    id: 'serv-1',
    prestadorId: 'user-2',
    nome: 'Instalação e Manutenção de Redes Elétricas',
    preco: 180.0,
    disponibilidadeSemana: {
      dias: 'Segunda a Sexta',
      faixaHoraria: '08:00 às 18:00'
    },
    avaliacoes: [
      {
        id: 'rev-1',
        autor: 'Fernanda Lima',
        nota: 5,
        comentario: 'Serviço excelente e pontual, resolveu o curto-circuito com agilidade.',
        data: '2026-02-14'
      },
      {
        id: 'rev-2',
        autor: 'Rodrigo Santos',
        nota: 4.8,
        comentario: 'Profissional muito cuidadoso e transparente com o orçamento.',
        data: '2026-03-01'
      }
    ]
  },
  {
    id: 'serv-2',
    prestadorId: 'user-2',
    nome: 'Troca e Instalação de Padrão e Disjuntores',
    preco: 250.0,
    disponibilidadeSemana: {
      dias: 'Segunda a Sábado',
      faixaHoraria: '09:00 às 17:00'
    },
    avaliacoes: [
      {
        id: 'rev-3',
        autor: 'Ana Paula Costa',
        nota: 5,
        comentario: 'Instalação perfeita, altamente qualificado e dentro das normas.',
        data: '2026-03-10'
      }
    ]
  }
];

const SEED_CONTRACTS = [
  {
    id: 'cont-1',
    servicoId: 'serv-1',
    servicoNome: 'Instalação e Manutenção de Redes Elétricas',
    clienteId: 'user-1',
    clienteNome: 'Maria da Silva',
    clienteTelefone: '(11) 98765-4321',
    clienteEmail: 'cliente@teste.com',
    clienteEndereco: {
      rua: 'Praça da Sé',
      numero: '100',
      bairro: 'Sé',
      cidade: 'São Paulo',
      estado: 'SP',
      cep: '01001-000'
    },
    prestadorId: 'user-2',
    prestadorNome: 'Carlos Manutenção Elétrica',
    prestadorTelefone: '(11) 91234-5678',
    prestadorEmail: 'prestador@teste.com',
    preco: 180.0,
    dataContratacao: '2026-03-12',
    dataAgendamento: '2026-03-20',
    status: 'Em Andamento',
    observacoes: 'Revisão geral do quadro de disjuntores da residência.'
  }
];

function initStorage() {
  if (!localStorage.getItem(STORAGE_USERS_KEY)) {
    localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(SEED_USERS));
  }
  if (!localStorage.getItem(STORAGE_SERVICES_KEY)) {
    localStorage.setItem(STORAGE_SERVICES_KEY, JSON.stringify(SEED_SERVICES));
  }
  if (!localStorage.getItem(STORAGE_CONTRACTS_KEY)) {
    localStorage.setItem(STORAGE_CONTRACTS_KEY, JSON.stringify(SEED_CONTRACTS));
  }
}

initStorage();

function getUsersFromStorage() {
  initStorage();
  const raw = localStorage.getItem(STORAGE_USERS_KEY);
  return raw ? JSON.parse(raw) : [];
}

function saveUsersToStorage(users) {
  localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(users));
}

function getServicesFromStorage() {
  initStorage();
  const raw = localStorage.getItem(STORAGE_SERVICES_KEY);
  return raw ? JSON.parse(raw) : [];
}

function saveServicesToStorage(services) {
  localStorage.setItem(STORAGE_SERVICES_KEY, JSON.stringify(services));
}

function getContractsFromStorage() {
  initStorage();
  const raw = localStorage.getItem(STORAGE_CONTRACTS_KEY);
  return raw ? JSON.parse(raw) : [];
}

function saveContractsToStorage(contracts) {
  localStorage.setItem(STORAGE_CONTRACTS_KEY, JSON.stringify(contracts));
}

export const api = {
  login: async (email, senha) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const users = getUsersFromStorage();
        const user = users.find(u => u.email.toLowerCase() === email.trim().toLowerCase() && u.senha === senha);
        if (user) {
          localStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(user));
          window.dispatchEvent(new Event('auth-change'));
          resolve(user);
        } else {
          reject(new Error('Credenciais inválidas. Verifique seu e-mail e senha.'));
        }
      }, 200);
    });
  },

  logout: async () => {
    return new Promise((resolve) => {
      localStorage.removeItem(STORAGE_SESSION_KEY);
      window.dispatchEvent(new Event('auth-change'));
      resolve();
    });
  },

  getCurrentUser: () => {
    const raw = localStorage.getItem(STORAGE_SESSION_KEY);
    if (!raw) return null;
    const sessionUser = JSON.parse(raw);
    const users = getUsersFromStorage();
    const freshUser = users.find(u => u.id === sessionUser.id);
    return freshUser || sessionUser;
  },

  registerCliente: async (dadosCliente) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const users = getUsersFromStorage();
        const emailExists = users.some(u => u.email.toLowerCase() === dadosCliente.email.trim().toLowerCase());
        if (emailExists) {
          return reject(new Error('Já existe uma conta cadastrada com este e-mail.'));
        }
        const cpfExists = users.some(u => u.cpf.replace(/\D/g, '') === dadosCliente.cpf.replace(/\D/g, ''));
        if (cpfExists) {
          return reject(new Error('Já existe uma conta cadastrada com este CPF.'));
        }

        const hoje = new Date().toISOString().split('T')[0];

        const novoUsuario = {
          id: 'user-' + Date.now(),
          nome: dadosCliente.nome || 'Cliente',
          cpf: dadosCliente.cpf,
          email: dadosCliente.email,
          senha: dadosCliente.senha,
          telefone: dadosCliente.telefone,
          dataNascimento: dadosCliente.dataNascimento,
          dataCriacaoConta: hoje,
          statusConta: 'Ativa',
          endereco: {
            cep: dadosCliente.endereco?.cep || '',
            estado: dadosCliente.endereco?.estado || '',
            cidade: dadosCliente.endereco?.cidade || '',
            bairro: dadosCliente.endereco?.bairro || '',
            rua: dadosCliente.endereco?.rua || '',
            numero: dadosCliente.endereco?.numero || ''
          },
          perfilPrestador: null
        };

        users.push(novoUsuario);
        saveUsersToStorage(users);
        resolve(novoUsuario);
      }, 200);
    });
  },

  updatePerfilCliente: async (id, dadosAtualizados) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const users = getUsersFromStorage();
        const index = users.findIndex(u => u.id === id);
        if (index === -1) {
          return reject(new Error('Usuário não encontrado.'));
        }

        const usuarioExistente = users[index];

        const usuarioAtualizado = {
          ...usuarioExistente,
          nome: dadosAtualizados.nome !== undefined ? dadosAtualizados.nome : usuarioExistente.nome,
          email: dadosAtualizados.email !== undefined ? dadosAtualizados.email : usuarioExistente.email,
          senha: dadosAtualizados.senha !== undefined ? dadosAtualizados.senha : usuarioExistente.senha,
          telefone: dadosAtualizados.telefone !== undefined ? dadosAtualizados.telefone : usuarioExistente.telefone,
          endereco: {
            ...usuarioExistente.endereco,
            ...(dadosAtualizados.endereco || {})
          },
          cpf: usuarioExistente.cpf,
          dataNascimento: usuarioExistente.dataNascimento,
          dataCriacaoConta: usuarioExistente.dataCriacaoConta,
          statusConta: usuarioExistente.statusConta
        };

        users[index] = usuarioAtualizado;
        saveUsersToStorage(users);

        const currentSession = localStorage.getItem(STORAGE_SESSION_KEY);
        if (currentSession && JSON.parse(currentSession).id === id) {
          localStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(usuarioAtualizado));
          window.dispatchEvent(new Event('auth-change'));
        }

        resolve(usuarioAtualizado);
      }, 200);
    });
  },

  ativarPerfilPrestador: async (id, dadosIniciaisPrestador) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const users = getUsersFromStorage();
        const index = users.findIndex(u => u.id === id);
        if (index === -1) {
          return reject(new Error('Usuário não encontrado.'));
        }

        const usuario = users[index];
        usuario.perfilPrestador = {
          cnpj: dadosIniciaisPrestador.cnpj || '',
          notaAvaliacoes: 5.0,
          statusVerificacaoConta: 'Em Análise',
          registroEspecificoProfissao: dadosIniciaisPrestador.registroEspecificoProfissao || null
        };

        users[index] = usuario;
        saveUsersToStorage(users);

        const currentSession = localStorage.getItem(STORAGE_SESSION_KEY);
        if (currentSession && JSON.parse(currentSession).id === id) {
          localStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(usuario));
          window.dispatchEvent(new Event('auth-change'));
        }

        resolve(usuario);
      }, 200);
    });
  },

  updatePerfilPrestador: async (id, dadosPrestador) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const users = getUsersFromStorage();
        const index = users.findIndex(u => u.id === id);
        if (index === -1) {
          return reject(new Error('Usuário não encontrado.'));
        }

        const usuario = users[index];
        if (!usuario.perfilPrestador) {
          return reject(new Error('Perfil de prestador não está habilitado para este usuário.'));
        }

        usuario.perfilPrestador = {
          ...usuario.perfilPrestador,
          cnpj: dadosPrestador.cnpj !== undefined ? dadosPrestador.cnpj : usuario.perfilPrestador.cnpj,
          registroEspecificoProfissao: dadosPrestador.registroEspecificoProfissao !== undefined
            ? dadosPrestador.registroEspecificoProfissao
            : usuario.perfilPrestador.registroEspecificoProfissao,
          notaAvaliacoes: usuario.perfilPrestador.notaAvaliacoes,
          statusVerificacaoConta: usuario.perfilPrestador.statusVerificacaoConta
        };

        if (dadosPrestador.nome !== undefined) usuario.nome = dadosPrestador.nome;
        if (dadosPrestador.email !== undefined) usuario.email = dadosPrestador.email;
        if (dadosPrestador.senha !== undefined) usuario.senha = dadosPrestador.senha;
        if (dadosPrestador.telefone !== undefined) usuario.telefone = dadosPrestador.telefone;
        if (dadosPrestador.endereco !== undefined) {
          usuario.endereco = { ...usuario.endereco, ...dadosPrestador.endereco };
        }

        users[index] = usuario;
        saveUsersToStorage(users);

        const currentSession = localStorage.getItem(STORAGE_SESSION_KEY);
        if (currentSession && JSON.parse(currentSession).id === id) {
          localStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(usuario));
          window.dispatchEvent(new Event('auth-change'));
        }

        resolve(usuario);
      }, 200);
    });
  },

  getServicos: async () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const services = getServicesFromStorage();
        const users = getUsersFromStorage();

        const servicosCompletos = services.map(serv => {
          const prestador = users.find(u => u.id === serv.prestadorId);
          return {
            ...serv,
            prestador: prestador
              ? {
                  id: prestador.id,
                  nome: prestador.nome,
                  email: prestador.email,
                  telefone: prestador.telefone,
                  cidade: prestador.endereco?.cidade || '',
                  estado: prestador.endereco?.estado || '',
                  cnpj: prestador.perfilPrestador?.cnpj || '',
                  notaAvaliacoes: prestador.perfilPrestador?.notaAvaliacoes || 0,
                  statusVerificacaoConta: prestador.perfilPrestador?.statusVerificacaoConta || 'Não verificado',
                  registroEspecificoProfissao: prestador.perfilPrestador?.registroEspecificoProfissao || null
                }
              : null
          };
        });

        resolve(servicosCompletos);
      }, 200);
    });
  },

  getServicoById: async (id) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const services = getServicesFromStorage();
        const serv = services.find(s => String(s.id) === String(id));
        if (!serv) {
          return reject(new Error('Serviço não encontrado.'));
        }

        const users = getUsersFromStorage();
        const prestador = users.find(u => u.id === serv.prestadorId);

        resolve({
          ...serv,
          prestador: prestador
            ? {
                id: prestador.id,
                nome: prestador.nome,
                email: prestador.email,
                telefone: prestador.telefone,
                cidade: prestador.endereco?.cidade || '',
                estado: prestador.endereco?.estado || '',
                cnpj: prestador.perfilPrestador?.cnpj || '',
                notaAvaliacoes: prestador.perfilPrestador?.notaAvaliacoes || 0,
                statusVerificacaoConta: prestador.perfilPrestador?.statusVerificacaoConta || 'Não verificado',
                registroEspecificoProfissao: prestador.perfilPrestador?.registroEspecificoProfissao || null
              }
            : null
        });
      }, 200);
    });
  },

  getServicosByPrestadorId: async (prestadorId) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const services = getServicesFromStorage();
        const servicosDoPrestador = services.filter(s => String(s.prestadorId) === String(prestadorId));
        resolve(servicosDoPrestador);
      }, 200);
    });
  },

  createServico: async (servicoData) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (!servicoData.prestadorId) {
          return reject(new Error('Prestador não informado para o serviço.'));
        }

        const services = getServicesFromStorage();
        const novoServico = {
          id: 'serv-' + Date.now(),
          prestadorId: servicoData.prestadorId,
          nome: servicoData.nome,
          preco: parseFloat(servicoData.preco) || 0,
          disponibilidadeSemana: {
            dias: servicoData.disponibilidadeSemana?.dias || '',
            faixaHoraria: servicoData.disponibilidadeSemana?.faixaHoraria || ''
          },
          avaliacoes: []
        };

        services.push(novoServico);
        saveServicesToStorage(services);
        resolve(novoServico);
      }, 200);
    });
  },

  updateServico: async (id, servicoData) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const services = getServicesFromStorage();
        const index = services.findIndex(s => String(s.id) === String(id));
        if (index === -1) {
          return reject(new Error('Serviço não encontrado para atualização.'));
        }

        const servicoExistente = services[index];
        const servicoAtualizado = {
          ...servicoExistente,
          nome: servicoData.nome !== undefined ? servicoData.nome : servicoExistente.nome,
          preco: servicoData.preco !== undefined ? parseFloat(servicoData.preco) : servicoExistente.preco,
          disponibilidadeSemana: {
            dias: servicoData.disponibilidadeSemana?.dias !== undefined
              ? servicoData.disponibilidadeSemana.dias
              : servicoExistente.disponibilidadeSemana.dias,
            faixaHoraria: servicoData.disponibilidadeSemana?.faixaHoraria !== undefined
              ? servicoData.disponibilidadeSemana.faixaHoraria
              : servicoExistente.disponibilidadeSemana.faixaHoraria
          }
        };

        services[index] = servicoAtualizado;
        saveServicesToStorage(services);
        resolve(servicoAtualizado);
      }, 200);
    });
  },

  consultarCep: async (cep) => {
    const cepLimpo = String(cep).replace(/\D/g, '');
    if (cepLimpo.length !== 8) {
      throw new Error('CEP deve conter 8 dígitos.');
    }

    const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
    if (!response.ok) {
      throw new Error('Erro ao consultar a API ViaCEP.');
    }

    const data = await response.json();
    if (data.erro) {
      throw new Error('CEP não encontrado na base do ViaCEP.');
    }

    return {
      cep: data.cep,
      estado: data.uf,
      cidade: data.localidade,
      bairro: data.bairro,
      rua: data.logradouro
    };
  },

  getContratos: async () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const contracts = getContractsFromStorage();
        resolve(contracts);
      }, 150);
    });
  },

  getContratosByClienteId: async (clienteId) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const contracts = getContractsFromStorage();
        const doCliente = contracts.filter(c => String(c.clienteId) === String(clienteId));
        resolve(doCliente);
      }, 150);
    });
  },

  getContratosByPrestadorId: async (prestadorId) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const contracts = getContractsFromStorage();
        const doPrestador = contracts.filter(c => String(c.prestadorId) === String(prestadorId));
        resolve(doPrestador);
      }, 150);
    });
  },

  getContratoById: async (id) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const contracts = getContractsFromStorage();
        const contrato = contracts.find(c => String(c.id) === String(id));
        if (!contrato) {
          return reject(new Error('Contrato não encontrado.'));
        }
        resolve(contrato);
      }, 150);
    });
  },

  createContrato: async (dadosContrato) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (!dadosContrato.servicoId || !dadosContrato.clienteId || !dadosContrato.prestadorId) {
          return reject(new Error('Dados incompletos para estabelecer o contrato de serviço.'));
        }

        const contracts = getContractsFromStorage();
        const hoje = new Date().toISOString().split('T')[0];

        const novoContrato = {
          id: 'cont-' + Date.now(),
          servicoId: String(dadosContrato.servicoId),
          servicoNome: dadosContrato.servicoNome || 'Serviço Profissional',
          clienteId: String(dadosContrato.clienteId),
          clienteNome: dadosContrato.clienteNome || 'Cliente',
          clienteTelefone: dadosContrato.clienteTelefone || '',
          clienteEmail: dadosContrato.clienteEmail || '',
          clienteEndereco: dadosContrato.clienteEndereco || {},
          prestadorId: String(dadosContrato.prestadorId),
          prestadorNome: dadosContrato.prestadorNome || 'Prestador',
          prestadorTelefone: dadosContrato.prestadorTelefone || '',
          prestadorEmail: dadosContrato.prestadorEmail || '',
          preco: parseFloat(dadosContrato.preco) || 0,
          dataContratacao: hoje,
          dataAgendamento: dadosContrato.dataAgendamento || hoje,
          status: 'Pendente',
          observacoes: dadosContrato.observacoes ? dadosContrato.observacoes.trim() : ''
        };

        contracts.unshift(novoContrato);
        saveContractsToStorage(contracts);
        window.dispatchEvent(new Event('contracts-change'));
        resolve(novoContrato);
      }, 200);
    });
  },

  updateStatusContrato: async (id, novoStatus) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const statusValidos = ['Pendente', 'Em Andamento', 'Concluído', 'Cancelado'];
        if (!statusValidos.includes(novoStatus)) {
          return reject(new Error('Status de contrato inválido.'));
        }

        const contracts = getContractsFromStorage();
        const index = contracts.findIndex(c => String(c.id) === String(id));
        if (index === -1) {
          return reject(new Error('Contrato não encontrado para atualização.'));
        }

        contracts[index] = {
          ...contracts[index],
          status: novoStatus,
          dataAtualizacaoStatus: new Date().toISOString()
        };

        saveContractsToStorage(contracts);
        window.dispatchEvent(new Event('contracts-change'));
        resolve(contracts[index]);
      }, 200);
    });
  }
};
