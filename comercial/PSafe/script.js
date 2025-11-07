// --- 1. Definição da Estrutura do Funil ---
// Baseado na imagem: image_8f94e0.png
const funilConfig = [
    {
        title: "Jornada 1: Antivirus",
        events: [
            "event_17015",
            "event_17005",
            "event_17007",
            "event_17008",
            "event_17009",
            "event_17010"
        ]
    },
    {
        title: "Jornada 2: Phone Booster",
        events: [
            "event_10350",
            "event_10351",
            "event_10352",
            "event_10353",
            "event_10354"
        ]
    },
    {
        title: "Jornada 3: Limpeza Rápida",
        events: [
            "event_7000",
            "event_7001",
            "event_7002"
        ]
    },
    {
        title: "Jornada 4: Resfriador de CPU",
        events: [
            "event_6600",
            "event_6605"
        ]
    },
    {
        title: "Jornada 5: Economia de Bateria",
        events: [
            "event_6800",
            "event_6801"
        ]
    }
];

// --- 2. Carregamento Automático dos Dados ---

document.addEventListener('DOMContentLoaded', () => {
    loadData();
});

async function loadData() {
    const messageArea = document.getElementById('message-area');
    
    try {
        const response = await fetch('historico_analytics.csv');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const csvContent = await response.text();
        processCSV(csvContent);

    } catch (error) {
        console.error('Erro ao carregar o CSV:', error);
        messageArea.innerHTML = `
            <p style="color: #f87171;"><b>Erro ao carregar <code>historico_analytics.csv</code>.</b></p>
            <p>Por favor, verifique se:</p>
            <ul style="text-align: left; display: inline-block; margin-top: 10px;">
                <li>O arquivo <code>historico_analytics.csv</code> está na mesma pasta.</li>
                <li>Você está rodando um servidor local (ex: "Live Server" no VS Code).</li>
            </ul>`;
    }
}


// --- 3. Processamento do CSV ---

function processCSV(csvContent) {
    // Remove linhas em branco
    const lines = csvContent.split('\n').filter(line => line.trim() !== '');
    
    if (lines.length < 1) {
        alert("Erro: Arquivo CSV vazio.");
        return;
    }

    const headerLine = lines[0].trim();
    const header = headerLine.split(',');
    
    // Encontra os índices das colunas que nos interessam
    const nameIndex = header.indexOf('NomeDoEvento');
    const countIndex = header.indexOf('ContagemDeEventos');

    if (nameIndex === -1 || countIndex === -1) {
        alert("Erro: O CSV não contém as colunas 'NomeDoEvento' ou 'ContagemDeEventos'. Verifique o cabeçalho.");
        return;
    }

    // Agrega os dados: { "event_17015": 12000, "event_10350": 8000, ... }
    const eventTotals = {};

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        const columns = line.split(',');

        // Garante que a linha tem colunas suficientes
        if (columns.length > Math.max(nameIndex, countIndex)) {
            const eventName = columns[nameIndex].trim();
            const eventCountStr = columns[countIndex].trim();
            const eventCount = parseInt(eventCountStr, 10);

            if (eventName && !isNaN(eventCount)) {
                if (!eventTotals[eventName]) {
                    eventTotals[eventName] = 0;
                }
                eventTotals[eventName] += eventCount;
            } else {
                 console.warn(`Linha pulada (dados inválidos): ${line}`);
            }
        }
    }

    // Após processar, renderiza os gráficos
    renderFunnelCharts(eventTotals);
}

// --- 4. Renderização dos Gráficos ---

function renderFunnelCharts(eventTotals) {
    const chartsContainer = document.getElementById('charts-container');
    const messageArea = document.getElementById('message-area');
    
    // Limpa o container
    chartsContainer.innerHTML = '';
    
    let chartsRendered = false;

    // Para cada configuração de funil...
    funilConfig.forEach(jornada => {
        
        // 1. Prepara os dados do funil
        const funnelData = [];
        jornada.events.forEach(eventName => {
            const count = eventTotals[eventName] || 0; // Pega o total ou 0 se não existir
            funnelData.push({
                name: eventName,
                value: count
            });
        });

        // 2. Filtra eventos com 0 (como pedido)
        const filteredFunnelData = funnelData.filter(step => step.value > 0);
        
        // 3. Se não sobrou nenhum evento, não renderiza o card
        if (filteredFunnelData.length === 0) {
            console.warn(`Jornada "${jornada.title}" pulada, nenhum evento encontrado.`);
            return;
        }

        chartsRendered = true;
        const baseValue = filteredFunnelData[0].value; // O primeiro evento é 100%

        // 4. Cria o HTML do card do funil
        const card = document.createElement('div');
        card.className = 'funnel-card';

        let cardHTML = `<h2>${jornada.title}</h2><ul class="funnel-container">`;

        filteredFunnelData.forEach((step, index) => {
            const percentageOfBase = ((step.value / baseValue) * 100);
            
            let percentageOfPreviousText = '';
            if (index > 0) {
                // Evita divisão por zero se o passo anterior for 0 (embora já filtrado)
                const previousValue = filteredFunnelData[index-1].value;
                if (previousValue > 0) {
                    const percentageOfPrevious = (step.value / previousValue * 100).toFixed(1);
                    percentageOfPreviousText = `(${percentageOfPrevious}% do anterior)`;
                }
            } else {
                percentageOfPreviousText = '(100%)';
            }
            
            cardHTML += `
                <li class="funnel-step">
                    <!-- A barra de progresso usa a % em relação ao primeiro passo -->
                    <div class="funnel-bar" style="width: ${percentageOfBase.toFixed(1)}%;"></div>
                    <div class="step-content">
                        <span class="step-label">${step.name}</span>
                        <div class="step-metrics">
                            <span class="step-value">${step.value.toLocaleString('pt-BR')}</span>
                            <span class="step-percentage">${percentageOfPreviousText}</span>
                        </div>
                    </div>
                </li>
            `;
        });

        cardHTML += `</ul>`;
        card.innerHTML = cardHTML;
        chartsContainer.appendChild(card);
    });
    
    // Adiciona a classe ao body para esconder a mensagem de "carregue o arquivo"
    if (chartsRendered) {
        document.body.classList.add('charts-visible');
    } else {
        messageArea.innerHTML = "<p>Arquivo carregado, mas nenhum evento correspondente às jornadas foi encontrado no CSV.</p>";
        document.body.classList.remove('charts-visible');
    }
}

