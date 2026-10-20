# PRD — Caça-Palavras Escolar Interativo

**Documento de Requisitos de Produto (Product Requirements Document)**

| Campo | Valor |
| --- | --- |
| Produto | Caça-Palavras Escolar Interativo |
| Repositório | `Ca-a-Palavras` |
| Versão do documento | 1.0 |
| Status | **Entregue / em produção local** |
| Data | 20/10/2026 |
| Stack | React 18 + TypeScript + Vite (CSS puro) |
| Dependências de produção | `react`, `react-dom` (apenas) |
| Licença | Definida pelo responsável do projeto |

---

## 1. Resumo executivo

O **Caça-Palavras Escolar Interativo** é um jogo web de caça-palavras com vocabulário do ambiente
escolar, voltado a crianças do ensino fundamental, estudantes do ensino médio e professores que
querem uma atividade de sala de aula pronta e sem instalação.

A cada partida, o sistema **gera automaticamente** uma grade de letras com palavras escondidas nas
oito direções. O jogador encontra as palavras usando um **marca-texto virtual com sete cores**,
escolhendo a cor no momento em que encontra cada palavra. A aplicação é 100% responsiva, funciona
com mouse e com toque de tela (celular/tablet) e roda inteiramente no navegador, sem back-end,
sem cadastro e sem dependência de rede após o carregamento.

O diferencial do produto é a **liberdade cromática**: cada palavra encontrada permanece marcada
com a cor que estava selecionada no momento da descoberta, e a troca de cor durante a partida
nunca altera o que já foi encontrado.

---

## 2. Problema e oportunidade

### 2.1 Problema

Atividades de caça-palavras para o ambiente escolar costumam ter três limitações:

1. **Planilhas e listas de palavras prontas** têm começo e meio: a turma se diverte uma vez e o
   material se esgota. Gerar uma nova folha exige trabalho manual do professor.
2. **Marcadores de PDF ou impressos** não oferecem escolha de cor por palavra e exigem
   impressão, o que inviabiliza o uso em tablets e celulares na sala de aula.
3. **Aplicativos genéricos** não têm vocabulário escolar em português do Brasil, nem
   tratam palavras acentuadas (MATEMÁTICA, CIÊNCIAS, PORTUGUÊS) de forma consistente.

### 2.2 Oportunidade

Entregar um jogo **100% client-side** que gera partidas válidas sob demanda, funciona em
qualquer dispositivo moderno e permite ao professor escolher o repertório temático e o nível de
desafio da atividade. O custo marginal de infraestrutura é zero e o material é reutilizável em
todas as aulas.

### 2.3 Personas

| Persona | Perfil | Necessidade principal |
| --- | --- | --- |
| **Professora do 1º ao 5º ano** | 25–50 anos, usa projetor/tablet | Atividade rápida, visual e com vocabulário do aluno; não quer imprimir |
| **Estudante do ensino fundamental** | 8–12 anos, joga no celular | Diversão, cores, feedback imediato e interface intuitiva |
| **Estudante do ensino médio** | 14–17 anos, usa notebook | Desafio real, partidas diferentes a cada rodada |
| **Professor de língua/educação especial** | Usa teclado e projetor em sala | Reforço de vocabulário específico, com transparência total do processo |

### 2.4 Jobs to be done

- *"Quando preciso de uma atividade de vocabulário para hoje, quero gerar uma partida nova em
  segundos, sem preparar material."*
- *"Quando estou jogando no celular, quero que a seleção por toque funcione tão bem quanto o
  arrasto com o mouse."*
- *"Quando encontro uma palavra, quero marcá-la com a cor que eu escolhi, e que as cores das
  palavras anteriores continuem iguais."*
- *"Quando termino, quero ver quanto acertei e poder jogar de novo imediatamente."*

---

## 3. Objetivos e metas

| ID | Objetivo | Meta (SMART) | Como medir |
| --- | --- | --- | --- |
| OB-01 | Gerar partidas válidas | 100% das palavras da lista presentes na grade | `verifyRound()` + testes automatizados |
| OB-08 | Resposta imediata | Nova partida pronta em < 50 ms | Medido: 1,4–2,6 ms por rodada (RNF-01) |
| OB-02 | Jogabilidade com toque | Selecionar com toque e com mouse com o mesmo resultado | Testes E2E no Chrome com `hasTouch` |
| OB-03 | Persistência das cores | 100% das palavras mantêm a cor original após troca de cor | Teste E2E "mantém a cor original" |
| OB-04 | Resposta visual | Feedback de seleção em < 100 ms da soltura | Teste E2E (toast aparece após o arraste) |
| OB-05 | Responsividade | Sem rolagem horizontal em 360 px a 1920 px | Teste E2E de layout |
| OB-06 | Qualidade técnica | 0 erros de console durante a sessão completa | Teste E2E "nenhum erro de console" |
| OB-07 | Cobertura de testes | ≥ 60 casos automatizados cobrindo regras de negócio | 46 unitários + 17 E2E = 63 casos |

### 3.1 Métricas de sucesso do produto (pós-lançamento)

| Métrica | Meta |
| --- | --- |
| Taxa de conclusão da partida (todas as palavras encontradas) | ≥ 45% das partidas iniciadas |
| Tempo médio de partida | ≤ 4 min (nível Fácil) / ≤ 9 min (nível Difícil) |
| Uso de "Dica" | ≤ 20% das partidas |
| Uso de "Mostrar solução" | ≤ 10% das partidas |
| Retorno (nova partida no mesmo dia) | ≥ 30% dos usuários |

> As métricas de uso acima dependem de um evento de analytics (`word_found`, `game_started`,
> `hint_used`, `solution_shown`, `game_completed`) ainda **não implementado** — ver item 17
> (Fora de escopo / próximos passos).

---

## 4. Escopo

### 4.1 Incluído (entregue)

- Geração automática de grade com palavras do ambiente escolar
- 8 direções de leitura (horizontal, vertical e diagonais, nos dois sentidos)
- Seleção por clique-e-arraste e por toque, com projeção em linha reta
- Modo "toque na primeira letra e depois na última"
- Marca-texto virtual com 7 cores, aplicável e persistente por palavra
- Lista de palavras sincronizada com a grade
- 6 categorias temáticas e 3 níveis de dificuldade
- Controles: novo jogo, reiniciar, dica, mostrar solução
- Confirmação antes de apagar progresso
- Contador de progresso, barra de progresso e tela de parabéns
- Layout responsivo (celular, tablet, desktop) e suporte a `prefers-reduced-motion`
- Persistência das preferências (cor, categoria, dificuldade) em `localStorage`

### 4.2 Fora do escopo (versão 1.0)

| Item | Justificativa |
| --- | --- |
| Conta de usuário / login | O jogo é anônimo e local; cadastro traria atrito sem valor |
| Backend / persistência de placares | Requer infraestrutura e não é necessário ao objetivo |
| Multiplayer / competição entre alunos | Escopo significativamente maior, com isolamento de dados de cada participante |
| Editor de palavras pelo professor | Pode ser adicionado como evolução (ver Roadmap) |
| Exportar/imprimir a folha | Não faz parte do conceito interativo |
| Áudio e efeitos sonoros | Requer assets e pode incomodar em sala de aula |
| Analytics / telemetria | Depende de decisão de privacidade do responsável |

---

## 5. Requisitos funcionais

Prioridade: **M** = Must (obrigatório) · **S** = Should (desejável) · **C** = Could (opcional)

### 5.1 Geração da partida

| ID | Requisito | Prioridade | Aceitação |
| --- | --- | --- | --- |
| RF-01 | O sistema gera automaticamente a grade de letras a cada nova partida | M | `newGame()` devolve grade nova com posições diferentes |
| RF-02 | As palavras são posicionadas nas 8 direções (→ ← ↑ ↓ ↗ ↖ ↘ ↙) | M | Teste cobre as 8 direções; em 40 partidas as 8 direções aparecem |
| RF-03 | Duas palavras podem compartilhar a mesma célula, desde que a letra seja igual (ignorando acentos) | M | Teste "gera palavras que compartilham letras" |
| RF-04 | Os espaços livres são preenchidos com letras aleatórias | M | Toda célula não ocupada recebe letra de A–Z |
| RF-05 | Toda palavra exibida na lista está realmente presente na grade | M | `verifyRound()` é executado antes de entregar a rodada |
| RF-06 | Não há palavras duplicadas na mesma rodada | M | Comparação por forma normalizada |
| RF-07 | Se uma palavra não couber, o motor tenta novas posições e, se necessário, descarta a palavra mais longa mantendo a lista coerente com a grade | M | `generateRound()` com 3 tentativas + laço de descarte |
| RF-08 | Palavras que surjam por acaso no preenchimento são removidas das células livres | S | ≤ 1 ocorrência acidental por partida (medição: 6 em 30 partidas) |
| RF-09 | A escolha da dificuldade altera tamanho da grade, quantidade e comprimento das palavras | M | Fácil 10×10/7 palavras/≤7 letras · Médio 12×12/10/≤9 · Difícil 14×14/14/≤12 |
| RF-10 | A escolha da categoria altera o repertório de palavras da rodada | M | 6 categorias, 80 palavras no total |
| RF-11 | A dificuldade "Fácil" prioriza palavras curtas; "Difícil" prioriza palavras longas | S | Teste "prioriza palavras curtas no nível fácil" |

### 5.2 Grade e interação

| ID | Requisito | Prioridade | Aceitação |
| --- | --- | --- | --- |
| RF-12 | A grade é composta por células de letra organizadas em linhas e colunas | M | DOM com `role="grid"` e células indexadas por linha/coluna |
| RF-13 | O jogador seleciona letras com mouse (arrastar) | M | Teste E2E com `page.mouse` |
| RF-14 | O jogador seleciona letras com toque em telas sensíveis | M | Teste E2E com `page.touchscreen` (iPhone 13) |
| RF-15 | A seleção segue uma reta válida entre as 8 direções; arrastar fora da linha "puxa" a seleção para a direção mais próxima | M | `projectSelection()` + teste unitário das projeções |
| RF-16 | Ao soltar, o sistema valida a sequência contra a lista da rodada | M | `submitSelection()` compara a forma normalizada |
| RF-17 | Se a palavra for correta, as células são marcadas com a cor escolhida e a palavra é registrada como encontrada | M | Teste E2E "encontra uma palavra arrastando com o mouse" |
| RF-18 | Se a seleção não formar palavra válida, a seleção temporária é desfeita e a grade é avisada | M | Toast de erro + animação de tremor da grade |
| RF-19 | Letras aleatórias nunca são marcadas como palavra encontrada | M | Teste E2E "não marca letras aleatórias" |
| RF-20 | O modo "toque na primeira letra e depois na última" completa a seleção | S | Teste E2E correspondente |
| RF-21 | Passar o mouse sobre uma palavra da lista destaca suas células na grade | C | `cell--highlight` (destaque sutil, sem revelar a solução) |

### 5.3 Marca-texto e cores

| ID | Requisito | Prioridade | Aceitação |
| --- | --- | --- | --- |
| RF-22 | Há uma paleta com 7 cores: amarelo, verde, azul, rosa, laranja, roxo, vermelho | M | `MARKER_COLORS` com 7 entradas |
| RF-23 | Cada cor é representada por um botão visual | M | `color-swatch` com amostra circular colorida |
| RF-24 | A cor selecionada fica claramente destacada (anel + nome + ✓) | M | Classe `color-swatch--selected` + rótulo visível |
| RF-25 | O jogador pode trocar a cor a qualquer momento, inclusive durante a partida | M | `setColor()` disponível sempre |
| RF-26 | Cada palavra encontrada permanece marcada com a cor vigente no momento da descoberta | M | Cor gravada em `FoundWord.color` no momento do achado |
| RF-27 | Trocar de cor **não** altera as palavras já encontradas | M | Teste E2E "mantém a cor original das palavras já encontradas" |
| RF-28 | As letras permanecem legíveis sobre a marcação | M | Fundo translúcido + texto escuro (#1E293B) |
| RF-29 | Existe indicação visual da cor de marca-texto atualmente selecionada | M | Swatch selecionado + nome exibido |

### 5.4 Lista de palavras

| ID | Requisito | Prioridade | Aceitação |
| --- | --- | --- | --- |
| RF-30 | A lista exibe todas as palavras a encontrar | M | `word-list__items` |
| RF-31 | Palavras não encontradas aparecem com destaque normal | M | Estilo padrão |
| RF-32 | Palavras encontradas são marcadas como concluídas e riscadas | M | `word-list__item--found` + `text-decoration: line-through` |
| RF-33 | Cada item encontrado exibe um marcador na cor utilizada | S | `word-list__dot` com a cor da palavra |
| RF-34 | A lista exibe o progresso (encontradas/total) | M | `word-list__counter` |
| RF-35 | A lista permanece sincronizada com a grade | M | Mesmo estado (`state.found`) alimenta lista e grade |
| RF-36 | A lista é responsiva: coluna lateral no desktop, grade de cartões no mobile | M | Media queries 1000 px e 640 px |

### 5.5 Controles

| ID | Requisito | Prioridade | Aceitação |
| --- | --- | --- | --- |
| RF-37 | "Novo jogo" gera outra grade e outra lista | M | Teste E2E correspondente |
| RF-38 | "Reiniciar" limpa as marcações e mantém a mesma grade | M | Teste E2E correspondente |
| RF-39 | "Dica" destaca temporariamente **uma única letra** de uma palavra não encontrada (2,8 s), sem revelar a palavra | M | Teste E2E: exatamente 1 célula com `cell--hint` |
| RF-40 | "Mostrar solução" revela todas as palavras restantes com marcação visual distinta (cinza tracejada) | M | Classe `cell--revealed` |
| RF-41 | "Escolher categoria" permite trocar o tema das palavras | M | Select com 6 opções |
| RF-42 | "Escolher dificuldade" permite trocar o nível | M | Controle segmentado com 3 opções |
| RF-43 | Ações que apagam o progresso exigem confirmação quando há palavras encontradas | M | `ConfirmDialog` + testes E2E de aceitar/cancelar |

### 5.6 Progresso, vitória e preferências

| ID | Requisito | Prioridade | Aceitação |
| --- | --- | --- | --- |
| RF-44 | Exibir a quantidade de palavras encontradas e o total (ex.: "8 de 15") | M | `progress-count` |
| RF-45 | Barra de progresso atualizada automaticamente | M | `progress__fill` com transição |
| RF-46 | Ao completar a partida, exibir mensagem de parabéns | M | `WinOverlay` com título "Parabéns! Você conseguiu!" |
| RF-47 | Animação leve de conclusão | S | Confete CSS animado (26 partículas) |
| RF-48 | Mostrar o total de palavras encontradas e o tempo de partida | S | Texto "Você encontrou X de Y palavras em mm:ss" |
| RF-49 | Oferecer botão "Jogar novamente" | M | `data-testid="play-again"` |
| RF-50 | Lembrar cor, categoria e dificuldade entre sessões | S | `localStorage` (`caca-palavras-escolar:prefs`) |

---

## 6. Regras de negócio

| ID | Regra |
| --- | --- |
| RN-01 | A comparação de palavras é feita sobre a forma **normalizada** (sem acentos, maiúscula, sem espaços/pontuação). Assim, MATEMÁTICA = MATEMATICA e a grade funciona com ou sem acento. |
| RN-02 | Uma palavra só é considerada encontrada se o texto da seleção, normalizado, for **igual** ao de uma palavra da lista da rodada. |
| RN-03 | Se a seleção corresponder a uma palavra do banco que **não está na lista**, o jogo informa que ela não faz parte da partida (nada é marcado). |
| RN-04 | Ao encontrar uma palavra, a cor vigente é gravada **no momento do achado** e não muda depois. |
| RN-05 | A mesma palavra não pode ser pontuada duas vezes; ao selecioná-la de novo, o jogo avisa "já foi encontrada". |
| RN-06 | Palavras que compartilham célula podem ser encontradas de forma independente; a cor da primeira marcação prevalece na célula compartilhada. |
| RN-07 | Só células livres (fora das palavras posicionadas) podem ser reescritas na limpeza de palavras acidentais — as palavras da lista nunca são alteradas. |
| RN-08 | Trocar de categoria ou dificuldade **sempre** gera uma nova partida; reiniciar mantém a mesma. |
| RN-09 | Reiniciar, novo jogo, troca de categoria/dificuldade e "mostrar solução" pedem confirmação se `palavras encontradas > 0`. |
| RN-10 | "Mostrar solução" revela as palavras restantes e encerra a rodada, indicando na tela de vitória que a solução foi utilizada. |
| RN-11 | A partida é considerada concluída quando o número de palavras encontradas (incluindo reveladas) iguala o total da lista. |
| RN-12 | A dica nunca revela a palavra inteira: apenas uma célula é pulsada por 2,8 s. |
| RN-13 | O tempo exibido na vitória conta desde a geração da grade até a última palavra encontrada. |
| RN-14 | As preferências (cor, categoria, dificuldade) são persistidas localmente, com fallback seguro quando o `localStorage` está indisponível (modo privativo). |

---

## 7. Requisitos não funcionais

| ID | Categoria | Requisito | Verificação |
| --- | --- | --- | --- |
| RNF-01 | Performance | Geração de partida em < 50 ms | Medido: **1,4 ms** (Médio), **2,6 ms** (Fácil), **1,6 ms** (Difícil) por rodada |
| RNF-02 | Performance | Resposta visual da seleção < 100 ms após a soltura | E2E |
| RNF-03 | Performance | Renderização da grade (196 células) sem travamento | E2E |
| RNF-04 | Usabilidade | Funciona com mouse, toque e teclado (navegação por Tab nos controles) | E2E (mouse e toque) + foco visível em todos os botões |
| RNF-05 | Usabilidade | Sem rolagem horizontal de 360 px a 1920 px | E2E de layout |
| RNF-06 | Acessibilidade | Contraste adequado entre letra, fundo e marcação | Texto #1E293B sobre manchas translúcidas (≥ 4.5:1) |
| RNF-07 | Acessibilidade | `prefers-reduced-motion` desliga animações | Media query no CSS |
| RNF-08 | Acessibilidade | Botões com `aria-pressed`, `aria-label` e foco visível | Auditoria de código |
| RNF-09 | Acessibilidade | Mensagens em região `role="status" aria-live="polite"` | Componente `Toast` |
| RNF-10 | Compatibilidade | Chrome/Edge/Firefox/Safari atuais (desktop e mobile) | Uso apenas de Pointer Events, CSS Grid e `aspect-ratio` |
| RNF-11 | Manutenibilidade | Lógica de jogo separada da interface | `src/lib/*` (puro) vs `src/components/*` (UI) |
| RNF-12 | Manutenibilidade | Tipagem estrita sem `any` implícito | `strict: true` + `npm run typecheck` |
| RNF-13 | Manutenibilidade | Zero dependências além de React | `package.json` |
| RNF-14 | Qualidade | 0 erros de console e de página | E2E ao final da sessão |
| RNF-15 | Qualidade | Suíte automatizada de 63 casos verde | `npm test` + `npm run test:e2e` |
| RNF-16 | Offline | After o carregamento inicial, o jogo funciona sem rede | Aplicação 100% client-side, sem fontes externas obrigatórias |
| RNF-17 | Segurança/Privacidade | Nenhum dado pessoal coletado ou enviado | Sem chamadas de rede além do carregamento dos assets |
| RNF-18 | Portabilidade | Funciona em disco local, servidor estático e hospedagem (Vercel/Netlify) | Build de produção com `vite build` |

---

## 8. Fluxos de usuário

### 8.1 Fluxo principal — jogar uma partida

```
Entrada → [Carrega grade + lista] → Escolhe cor → Arrasta/toque nas letras
   → Valida seleção
        ├─ correta → marca células na cor + risca na lista → atualiza progresso
        │      └─ última palavra? → Tela de parabéns → "Jogar novamente" → nova partida
        └─ incorreta → aviso de erro + grade treme → seleciona de novo
```

### 8.2 Fluxo — novo jogo com progresso existente

```
"Novo jogo" → Há palavras encontradas?
      ├─ Não → gera nova partida imediatamente
      └─ Sim → diálogo de confirmação
                ├─ "Sim, novo jogo" → nova partida, progresso zerado
                └─ "Cancelar" → mantém a partida atual intacta
```

### 8.3 Fluxo — mobile

```
Abre no celular → grade visível logo abaixo do marca-texto
   → toca na primeira letra → arrasta o dedo até a última (a seleção "puxa" para a linha reta)
   → solta → validação
   (alternativa: toca na primeira, depois na última)
```

### 8.4 Máquina de estados da partida

```
          ┌──────────┐  novo jogo / reiniciar / troca de config
          │ playing  │◄──────────────────────────────┐
          └────┬─────┘                               │
     todas as │ palavras                            │
     encontradas                                   │
          ┌────▼─────┐   "mostrar solução"           │
          │   won    │──────────────────────────────►│
          └──────────┘                               │
                                                    │
          (reiniciar / novo jogo) ───────────────────┘
```

---

## 9. Modelo de dados (entidades)

```ts
Round {
  id: number;               // identificador da rodada (incrementa a cada novo jogo)
  size: number;             // lado da grade (10, 12 ou 14)
  grid: string[][];         // letras da grade (pode conter acentos nas células de palavras)
  words: PlacedWord[];      // palavras posicionadas (todas presentes na grade)
  category: CategoryId;
  difficulty: Difficulty;
}

PlacedWord {
  id: string;               // ex.: "w0"
  text: string;             // texto exibido, com acentos (ex.: "MATEMÁTICA")
  cells: Cell[];            // células ocupadas, na ordem da leitura
  direction: Direction;     // direção da leitura
  category: CategoryId;
}

FoundWord {                 // só existe para palavras já encontradas
  wordId: string;           // referência a PlacedWord.id
  cells: Cell[];            // células efetivamente marcadas pelo jogador
  color: ColorId;           // cor do marca-texto no momento do achado
  revealed: boolean;        // true quando revelada por "Mostrar solução"
}
```

Derivados em tempo de execução: `cellMarks` (célula → cor/palavra), `foundCount`, `totalWords`,
`progress` (0–1).

---

## 10. Arquitetura de software

```
┌──────────────────────────────────────────────────────────────┐
│  src/components/            camada de apresentação (React)   │
│  WordSearchGrid · WordList · ColorPicker · ControlBar ·      │
│  CategorySelect · DifficultySelect · ProgressBar · Toast ·   │
│  WinOverlay · ConfirmDialog                                  │
├──────────────────────────────────────────────────────────────┤
│  src/hooks/useGame.ts       estado da partida, validação,     │
│                             dica, solução, preferências       │
├──────────────────────────────────────────────────────────────┤
│  src/lib/                   domínio puro (sem React)         │
│  wordSearch (geração) · selection (seleção) ·                │
│  normalize (acentos) · colors (paleta) · wordBank (dados)    │
└──────────────────────────────────────────────────────────────┘
```

**Decisões de projeto**

| Decisão | Motivo |
| --- | --- |
| Pointer Events (um só código para mouse e toque) | Unifica as duas interação, testável em navegador real |
| Projeção da seleção na reta mais próxima | O dedo não precisa percorrer a palavra com precisão |
| `touch-action: none` apenas na grade | Evita conflito entre arrasto e rolagem da página |
| Comparação por forma normalizada | Trata acentos de forma consistente (RF/RN-01) |
| Cor gravada por palavra no achado | Garante a persistência cromática (RF-27) |
| Sem back-end | Zero infraestrutura, zero coleta de dados, funciona offline |
| CSS puro com variáveis | Sem dependências de UI; tema consistente e leve |
| PRNG com semente opcional | Partidas reproduzíveis nos testes |

---

## 11. Design system (resumo)

| Elemento | Especificação |
| --- | --- |
| Paleta de fundo | Gradientes suaves: `#EEF4FF` → `#FDF3FF` → `#FFF9EC` com brilhos radiais |
| Cor primária | `#6366F1` (indigo) com hover `#4F46E5` |
| Texto | `#1E293B` (principal) / `#475569` (secundário) / `#7C8AA3` (terciário) |
| Superfícies | Branco `#FFFFFF`, cantos de 10–24 px, sombras suaves |
| Tipografia | Nunito/Quicksand (fallback: system-ui) — arredondada e amigável |
| Grade | CSS Grid com `aspect-ratio: 1`, fonte responsiva por número de colunas |
| Marcação | Mancha translúcida + borda sólida na cor; letra permanece escura e legível |
| Revelação (solução) | Cinza `#94A3B8` com borda tracejada — visualmente distinto das 7 cores |
| Seleção em andamento | Anel indigo `#6366F1` + leve aumento de escala |
| Erro | Tremor horizontal da grade (400 ms) + toast vermelho |
| Dica | Pulso âmbar `#FCD34D` na célula sorteada |
| Movimento | Animações de 120–450 ms; desligadas com `prefers-reduced-motion` |

---

## 12. Acessibilidade

- Todos os controles são `<button>` reais, com foco visível (`focus-visible`) e `aria-pressed`
  nos controles de estado.
- Paleta com 7 cores **nunca é a única pista**: a cor aparece junto do nome e do ✓; o texto
  riscado na lista confirma o estado.
- Mensagens em `role="status" aria-live="polite"` (não interceptam a leitura de tela).
- Contraste do texto da grade preservado sob a marcação (fundo claro + texto escuro).
- Nenhuma informação dependente apenas de cor ou apenas de posição.

---

## 13. Estratégia de testes e QA

### 13.1 Suíte automatizada (63 casos)

| Suíte | Ferramenta | Casos | Escopo |
| --- | --- | --- | --- |
| Unitária | Vitest | 46 | `normalize`, `selection`, `wordSearch` |
| End-to-end | Puppeteer + Chrome | 17 | Interação real, layout, botões, victory |

**Cobertura unitária (46 casos)**

- Normalização: acentos, maiúsculas, espaços, `sameLetters`
- Busca nas 8 direções (uma por direção), com acentos e sem acentos
- Palavras com letra compartilhada; `findAllOccurrences`
- Geração válida em **todas as 6 categorias × 3 dificuldades** (6 rodadas cada)
- Ausência de duplicatas; presença de todas as palavras na grade
- Distribuição das 8 direções ao longo de 40 partidas
- Limites de comprimento por dificuldade; prioridade de palavras curtas no Fácil
- Ausência de palavras acidentais (≤ 1 por partida) e existência de palavras compartilhadas
- Projeções de seleção: diagonal, horizontal, vertical, limites da grade, caminho exato

**Cobertura end-to-end (17 casos)**

1. Carrega sem erros de console (100 células no nível Fácil)
2. Arraste com mouse encontra a palavra e aplica a cor escolhida
3. Trocar de cor **não** altera as palavras já encontradas
4. Seleção inválida não marca nada e mostra aviso
5. Dica pisca exatamente 1 letra
6. Reiniciar limpa marcações e mantém a grade
7. Novo jogo gera outra grade após confirmação
8. Cancelar a confirmação preserva grade e progresso
9. Dificuldade Difícil gera grade 14×14
10. Trocar categoria troca o repertório de palavras
11. Mostrar solução revela tudo e exibe a tela de parabéns
12. "Jogar novamente" fecha a tela e zera o progresso
13. Seleção por toque (emulação iPhone 13, `hasTouch`)
14. Modo "toque na primeira e depois na última"
15. Layout sem rolagem horizontal em 360 px
16. Layout em tela grande (1920 px) com grade visível
17. Nenhum erro de console ao final de toda a sessão

### 13.2 Testes manuais complementares

| Cenário | Resultado esperado |
| --- | --- |
| Arrastar para fora da grade | Seleção para na última célula válida, sem erro |
| Selecionar a mesma palavra duas vezes | Aviso "já foi encontrada", sem alterar a marcação |
| Fechar e reabrir o navegador | Cor, categoria e dificuldade preservadas |
| Impressão da página | Grade e lista legíveis (bonus) |
| Redimensionar a janela durante a partida | Grade se adapta sem perder marcações |

### 13.3 Bugs reais encontrados e corrigidos durante a QA

| # | Bug | Impacto | Correção |
| --- | --- | --- | --- |
| 1 | Palavras posicionadas com direção negativa saíam dos limites da grade | Partidas com células `undefined` | Cálculo da faixa válida de início por eixo e por sentido |
| 2 | Projeção diagonal usava vetor não normalizado | Seleções ~2× maiores, nenhuma palavra reconhecida | Normalização do vetor (`dot / ‖d‖²`) |
| 3 | Toast flutuante cobria e bloqueava o botão "Mostrar solução" | Ação impossível de acionar | Aviso passou para o fluxo do layout (espaço reservado, `pointer-events: none`) |
| 4 | No celular a grade ficava abaixo da dobra | Jogador não via/interagia na grade | Reordenação mobile (grade logo abaixo do marca-texto) |
| 5 | Diálogo de confirmação bloqueava a grade em mobile | Interação travada | Diálogo sobreposto com botão "Ver a grade" e cancelamento explícito |

---

## 14. Riscos e mitigações

| Risco | Probabilidade | Impacto | Mitigação |
| --- | --- | --- | --- |
| Acusar falso positivo (palavra acidental na grade) | Média | Baixo | Limpeza automática de acidentais + aviso explícito quando a palavra não está na lista (RN-03) |
| Arraste impreciso em telas pequenas | Alta | Médio | Projeção na linha reta + modo "toque duas vezes" |
| Contraste ruim sob marcação | Baixa | Alto | Cores translúcidas com texto escuro validado visualmente |
| Palavras não couberem na grade | Baixa | Médio | Redimensionamento automático + 3 novas tentativas + descarte da palavra mais longa (RF-07) |
| Regressão de lógica | Média | Alto | 63 casos automatizados cobrindo as regras de negócio |
| Dependência de Chrome para o E2E | Média | Baixo | `CHROME_PATH` configurável; suíte unitária independente de navegador |

---

## 15. Roadmap

| Versão | Entregas | Status |
| --- | --- | --- |
| **1.0 (entregue)** | Geração automática, seleção mouse/toque, 7 cores, 6 categorias, 3 níveis, dica, solução, progresso, vitória, responsividade, 63 testes | ✅ Concluído |
| 1.1 | Editor de palavras pelo professor (criar-sets) + exportar/imprimir folha | Planejado |
| 1.2 | Modo multiplayer em sala (mesma tela, turnos) | Em avaliação |
| 1.3 | Áudio opcional, temas de marca-texto e placar local por aluno | Backlog |
| 2.0 | Conta do professor, Turmas, painel de progresso e conteúdo curricular (BNCC) | Visão |

---

## 16. Critérios de aceite da versão 1.0

- [x] A grade é gerada automaticamente e **todas** as palavras da lista estão presentes nela
- [x] As 8 direções funcionam no mouse e no toque
- [x] Palavras com letras compartilhadas são encontradas corretamente
- [x] Trocar de cor durante a partida mantém as cores anteriores
- [x] "Novo jogo", "Reiniciar", "Dica" e "Mostrar solução" funcionam
- [x] Trocar de categoria/dificuldade gera nova partida
- [x] Confirmação é pedida antes de apagar progresso
- [x] Contador e barra de progresso refletem o estado em tempo real
- [x] Tela de parabéns com contagem, tempo e "Jogar novamente"
- [x] Acentos tratados de forma consistente
- [x] Layout sem rolagem horizontal de 360 px a 1920 px
- [x] Nenhum erro de console
- [x] 63 casos automatizados verdes

---

## 17. Rastreabilidade — requisito → implementação → teste

| Requisito | Implementação | Teste automatizado |
| --- | --- | --- |
| RF-01, RF-07 | `src/lib/wordSearch.ts` → `generateRound()` | `wordSearch.test.ts` › "gera uma partida válida" |
| RF-02 | `DIRECTIONS`, `tryPlace()` | `wordSearch.test.ts` › "encontra a palavra em cada uma das oito direções" |
| RF-03, RN-06 | `tryPlace()` (célula reaproveitada) | `wordSearch.test.ts` › "gera palavras que compartilham letras" |
| RF-05 | `verifyRound()` | `wordSearch.test.ts` › "gera uma partida válida" (todas as categorias × dificuldades) |
| RF-06 | `pickWords()` (dedup por forma normalizada) | `wordSearch.test.ts` › "gera uma partida válida" |
| RF-08 | `removeAccidentalWords()` | `wordSearch.test.ts` › "evita que letras aleatórias formem palavras do banco fora da lista" |
| RF-09 | `DIFFICULTIES` em `wordBank.ts` | `wordSearch.test.ts` › "respeita o limite de comprimento" + E2E "mudar a dificuldade" |
| RF-10 | `CATEGORIES` em `wordBank.ts` | E2E "mudar a categoria troca o conjunto de palavras" |
| RF-13, RF-14 | `WordSearchGrid.tsx` (Pointer Events) | E2E "encontra uma palavra arrastando com o mouse" / "seleciona palavras por toque" |
| RF-15 | `selection.ts` → `projectSelection()` | `selection.test.ts` › "projectSelection" |
| RF-16, RN-02 | `useGame.ts` → `submitSelection()` | E2E "encontra uma palavra…" |
| RF-18, RF-19 | `submitSelection()` + `reportInvalid()` | E2E "não marca letras aleatórias e desfaz a seleção inválida" |
| RF-20 | `straightPath()` + modo âncora | E2E "funciona no modo toque na primeira e depois na última" |
| RF-22 a RF-29 | `colors.ts` + `ColorPicker.tsx` + `FoundWord.color` | E2E "mantém a cor original das palavras já encontradas" |
| RF-30 a RF-36 | `WordList.tsx` | E2E (contagem, riscado, cor do marcador) |
| RF-37 a RF-43 | `ControlBar.tsx`, `ConfirmDialog.tsx`, `useGame.ts` | E2E dos 4 botões + confirmações |
| RF-44, RF-45 | `ProgressBar.tsx` | E2E (contador e barra) |
| RF-46 a RF-49 | `WinOverlay.tsx` | E2E "mostrar a solução…" e "permite jogar novamente depois da vitória" |
| RF-50 | `useGame.ts` → `readPreferences/writePreferences` | Verificado manualmente (persistência entre recargas) |
| RN-01 | `normalize.ts` | `normalize.test.ts` + `wordSearch.test.ts` (com/sem acento) |
| RNF-05 | `global.css` (media queries) | E2E "a interface se adapta a telas pequenas/grandes" |
| RNF-07 | `global.css` (`prefers-reduced-motion`) | Auditoria de código |
| RNF-14, RNF-15 | suíte | E2E "nenhum erro de console durante toda a sessão" |

---

## 18. Glossário

| Termo | Significado |
| --- | --- |
| **Grade** | Matriz de letras onde as palavras ficam escondidas |
| **Rodada / Partida** | Uma grade + lista de palavras + marcações |
| **Marca-texto** | Ferramenta de destaque de cor aplicada às letras encontradas |
| **Palavra acidental** | Palavra do banco que surge por acaso no preenchimento aleatório |
| **Forma normalizada** | Texto sem acentos, em maiúsculas, sem espaços — base de toda comparação |
| **Âncora** | Primeira célula selecionada, que define a direção da linha |
| **Revelação** | Marcação cinza tracejada aplicada por "Mostrar solução" |

---

## 19. Registro de revisões

| Versão | Data | Autor | Alterações |
| --- | --- | --- | --- |
| 1.0 | 20/10/2026 | Equipe de desenvolvimento | Documento inicial, alinhado à implementação entregue (v1.0 do jogo) |

---

*Documento vivo: deve ser atualizado a cada entrega que altere regras de negócio, requisitos ou a
matriz de testes.*
