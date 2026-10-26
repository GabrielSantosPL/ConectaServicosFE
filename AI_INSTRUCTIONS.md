# Diretrizes de Desenvolvimento e Restrições para IA

## 1. Regra de Componentização Estrita
- A IA **não deve** decidir de forma autônoma quando separar um código em um novo arquivo.
- Um componente só deve ser gerado em um arquivo separado se houver uma **ordem explícita** para isso na solicitação ou nas instruções do arquivo.

## 2. Protocolo de Comentários e Seções por Arquivo
Cada arquivo do projeto deve respeitar o formato de delimitadores baseados em linhas identificadoras:
`--- [Nome da seção] ---`

### A. Seção "Instruções IA"
- **Finalidade:** Servir como um campo de comando local onde o desenvolvedor escreve as alterações específicas desejadas para este arquivo.
- **Ação da IA:** A IA deve ler este campo, executar estritamente o que foi pedido no código do arquivo e, após concluir a tarefa, **limpar o conteúdo deste campo** (deixando-o vazio para a próxima alteração).

### B. Seção "Documentação IA" (Estilo Javadoc)
- **Finalidade:** Manter um sumário técnico atualizado do arquivo.
- **Ação da IA:** A IA deve atualizar esta seção sempre que modificar o arquivo, descrevendo de forma concisa a finalidade do componente, as variáveis presentes, as funções e seus respectivos parâmetros.

## 3. Restrições Críticas de Segurança
- A IA **está estritamente proibida** de criar, apagar ou alterar qualquer outra seção de comentários existente no código. 
- As únicas exceções permitidas são:
  1. Esvaziar o campo "Instruções IA" após executá-las.
  2. Escrever e atualizar o conteúdo do campo "Documentação IA".