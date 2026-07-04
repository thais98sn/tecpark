import { supabase } from './supabaseClient.js'
import { printReport } from './print.js'

document.addEventListener('DOMContentLoaded', async () => {
    // Verificar sessão
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
        window.location.href = '/index.html';
        return;
    }

    // Header User Menu Logic
    document.querySelectorAll('.user-email-display').forEach(el => {
        el.textContent = session.user.email.split('@')[0];
    });

    document.querySelectorAll('.btn-logout').forEach(btn => {
        btn.addEventListener('click', async () => {
            await supabase.auth.signOut();
            window.location.href = '/index.html';
        });
    });

    const totalRevenueEl = document.getElementById('total-revenue');
    const totalVehiclesEl = document.getElementById('total-vehicles');
    const currentOccupancyEl = document.getElementById('current-occupancy');
    const occupancyBar = document.getElementById('occupancy-bar');
    const totalVagasLabel = document.getElementById('total-vagas-label');
    const tbody = document.getElementById('transactions-tbody');
    const currentDateEl = document.getElementById('current-date');
    const chartContainer = document.getElementById('chart-container');

    // Atualizar data na tela
    if (currentDateEl) {
        const dateOptions = { day: '2-digit', month: 'short', year: 'numeric' };
        currentDateEl.textContent = new Date().toLocaleDateString('pt-BR', dateOptions).replace('. de', '').toUpperCase();
    }

    // Paginação e Busca
    let allRecords = [];
    let currentPage = 1;
    const itemsPerPage = 5;

    const searchInput = document.getElementById('search-plate');
    const btnPrev = document.getElementById('btn-prev-page');
    const btnNext = document.getElementById('btn-next-page');
    const pageInfo = document.getElementById('pagination-info');

    if (searchInput) {
        searchInput.addEventListener('input', () => {
            currentPage = 1; // Reseta para p1 ao buscar
            renderTable();
        });
    }

    if (btnPrev) {
        btnPrev.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                renderTable();
            }
        });
    }

    if (btnNext) {
        btnNext.addEventListener('click', () => {
            currentPage++;
            renderTable();
        });
    }

    function renderTable() {
        const term = searchInput ? searchInput.value.trim().toUpperCase() : '';
        let filtered = allRecords;
        if (term) {
            filtered = allRecords.filter(r => r.placa.includes(term));
        }

        const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
        if (currentPage > totalPages) currentPage = totalPages;

        const startIdx = (currentPage - 1) * itemsPerPage;
        const endIdx = startIdx + itemsPerPage;
        const paged = filtered.slice(startIdx, endIdx);

        if (paged.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" class="p-4 text-center">Nenhuma transação encontrada.</td></tr>`;
            if (pageInfo) pageInfo.textContent = `Mostrando 0 de 0`;
            if (btnPrev) btnPrev.disabled = true;
            if (btnNext) btnNext.disabled = true;
            return;
        }

        tbody.innerHTML = paged.map(record => {
            const dataEntrada = new Date(record.data_entrada);
            const entradaStr = dataEntrada.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            
            let permanencia = '---';
            let valorStr = 'R$ 0,00';
            let statusBadge = '';
            let pagamentoStr = record.forma_pagamento || '---';

            if (record.status === 'FINALIZADO') {
                const dataSaida = new Date(record.data_saida);
                const diffMins = Math.floor((dataSaida - dataEntrada) / 60000);
                const h = Math.floor(diffMins / 60);
                const m = diffMins % 60;
                permanencia = `${h.toString().padStart(2, '0')}h ${m.toString().padStart(2, '0')}m`;
                
                valorStr = `R$ ${Number(record.valor_pago).toFixed(2).replace('.', ',')}`;
                statusBadge = `<span class="bg-green-100 text-green-800 px-2 py-1 text-[10px] font-bold uppercase rounded">Pago</span>`;
            } else {
                const diffMins = Math.floor((new Date() - dataEntrada) / 60000);
                const h = Math.floor(diffMins / 60);
                const m = diffMins % 60;
                permanencia = `${h.toString().padStart(2, '0')}h ${m.toString().padStart(2, '0')}m`;
                pagamentoStr = 'Pendente';
                statusBadge = `<span class="bg-surface-container text-on-surface-variant px-2 py-1 text-[10px] font-bold uppercase rounded">Pendente</span>`;
            }

            return `
            <tr class="border-b border-outline-variant hover:bg-surface-container transition-colors">
                <td class="p-4">
                    <span class="license-plate-bg font-data-display text-data-display px-2 py-1 border border-outline uppercase">${record.placa}</span>
                </td>
                <td class="p-4 font-label-mono text-label-mono">${entradaStr}</td>
                <td class="p-4">${permanencia}</td>
                <td class="p-4 font-bold">${valorStr}</td>
                <td class="p-4 text-on-surface-variant font-label-mono text-[12px] uppercase">${pagamentoStr}</td>
                <td class="p-4">${statusBadge}</td>
            </tr>`;
        }).join('');

        if (pageInfo) {
            const showingStart = startIdx + 1;
            const showingEnd = Math.min(startIdx + itemsPerPage, filtered.length);
            pageInfo.textContent = `Mostrando ${showingStart}-${showingEnd} de ${filtered.length}`;
        }

        if (btnPrev) btnPrev.disabled = currentPage === 1;
        if (btnNext) btnNext.disabled = currentPage === totalPages;
    }

    async function loadReports() {
        // Obter capacidade
        const { data: config } = await supabase.from('configuracoes_gerais').select('*').eq('id', 1).single();
        if (config && config.nome_estacionamento) {
            const headerTitle = document.querySelector('header h1');
            if (headerTitle) headerTitle.textContent = config.nome_estacionamento;
        }
        const totalVagas = config ? config.total_vagas : 100;

        const { data: records, error } = await supabase
            .from('registros_estacionamento')
            .select('*')
            .order('data_entrada', { ascending: false });

        if (error) {
            console.error("Erro ao carregar relatórios", error);
            return;
        }

        allRecords = records;

        let totalRevenue = 0;
        let activeVehicles = 0;
        
        allRecords.forEach(r => {
            if (r.status === 'FINALIZADO') {
                totalRevenue += Number(r.valor_pago || 0);
            } else if (r.status === 'ESTACIONADO') {
                activeVehicles++;
            }
        });

        // Atualizar Dashboard
        totalRevenueEl.textContent = `R$ ${totalRevenue.toFixed(2).replace('.', ',')}`;
        totalVehiclesEl.textContent = allRecords.length;
        
        const occupancyPct = Math.min(100, Math.round((activeVehicles / totalVagas) * 100));
        currentOccupancyEl.textContent = `${occupancyPct}%`;
        occupancyBar.style.width = `${occupancyPct}%`;
        if (totalVagasLabel) totalVagasLabel.textContent = `/ ${totalVagas} Vagas`;

        // Gráfico Dinâmico
        if (chartContainer) {
            const bins = {};
            for (let i = 0; i < 24; i++) {
                bins[i.toString().padStart(2, '0')] = 0;
            }
            let maxCount = 0;

            allRecords.forEach(r => {
                if (!r.data_entrada) return;
                
                // Tratar fuso horário corretamente garantindo que é interpretado como UTC se vier sem Z
                let d = r.data_entrada.includes('Z') || r.data_entrada.includes('+') 
                    ? new Date(r.data_entrada) 
                    : new Date(r.data_entrada + 'Z');

                // Para evitar que diferenças de fuso escondam os dados recém-inseridos do usuário
                // Vamos mostrar registros que ocorreram nas últimas 24h ou no dia atual
                const now = new Date();
                const diffHours = (now - d) / (1000 * 60 * 60);
                
                if (diffHours >= -24 && diffHours <= 24) {
                    const h = d.getHours().toString().padStart(2, '0');
                    if (bins[h] !== undefined) {
                        bins[h]++;
                    }
                }
            });

            for (let k in bins) {
                if (bins[k] > maxCount) maxCount = bins[k];
            }

            let html = '';
            for (let i = 0; i < 24; i++) {
                const k = i.toString().padStart(2, '0');
                const count = bins[k];
                const heightPct = maxCount === 0 ? 0 : Math.round((count / maxCount) * 100);
                const finalHeight = count > 0 ? Math.max(5, heightPct) : 0;
                const colorClass = finalHeight > 80 ? 'bg-secondary' : 'bg-secondary-container';
                
                // Mostrar todas as labels em telas grandes, esconder as ímpares em telas muito pequenas
                const labelVisibility = i % 2 === 0 ? 'block' : 'hidden sm:block';

                html += `
                <div class="flex flex-col items-center justify-end flex-1 group h-full" title="${count} veículo(s)">
                    <div class="${colorClass} w-full chart-bar group-hover:bg-secondary transition-all rounded-t-[2px]" style="height: ${finalHeight}%"></div>
                    <span class="font-label-mono text-[9px] mt-2 text-on-surface-variant ${labelVisibility}">${k}h</span>
                </div>`;
            }
            chartContainer.innerHTML = html;
        }

        // Configurar botão de Exportar PDF
        const btnExportPdf = document.getElementById('btn-export-pdf');
        if (btnExportPdf) {
            // Remove antigos listeners caso a função seja chamada novamente
            const newBtn = btnExportPdf.cloneNode(true);
            btnExportPdf.parentNode.replaceChild(newBtn, btnExportPdf);
            
            newBtn.addEventListener('click', () => {
                const startDateInput = document.getElementById('export-start-date').value;
                const endDateInput = document.getElementById('export-end-date').value;
                
                let reportRecords = allRecords;
                let dateStr = 'Todo o período';
                let reportTitle = 'Relatório Geral';

                if (startDateInput || endDateInput) {
                    const start = startDateInput ? new Date(startDateInput + 'T00:00:00') : new Date('1970-01-01');
                    const end = endDateInput ? new Date(endDateInput + 'T23:59:59') : new Date('2099-12-31');
                    
                    reportRecords = allRecords.filter(r => {
                        const rDate = new Date(r.data_entrada);
                        return rDate >= start && rDate <= end;
                    });
                    
                    if (startDateInput && endDateInput) {
                        dateStr = `${start.toLocaleDateString('pt-BR')} a ${end.toLocaleDateString('pt-BR')}`;
                        reportTitle = 'Relatório de Período';
                    } else if (startDateInput) {
                        dateStr = `A partir de ${start.toLocaleDateString('pt-BR')}`;
                        reportTitle = 'Relatório de Período';
                    } else {
                        dateStr = `Até ${end.toLocaleDateString('pt-BR')}`;
                        reportTitle = 'Relatório de Período';
                    }
                } else {
                    // Default to today if no dates selected to keep original behavior or just export all
                    // The user wants to choose. If they don't choose, we export everything or ask them to choose.
                    // Let's export all if they leave it blank.
                    dateStr = 'Todo o histórico';
                }

                let periodRevenue = 0;
                reportRecords.forEach(r => {
                    if (r.status === 'FINALIZADO') {
                        periodRevenue += Number(r.valor_pago || 0);
                    }
                });

                printReport({
                    nome_estacionamento: config?.nome_estacionamento,
                    cnpj: config?.cnpj,
                    dateStr: dateStr,
                    reportTitle: reportTitle,
                    totalRevenue: periodRevenue,
                    totalVehicles: reportRecords.length,
                    records: reportRecords
                });
            });
        }

        // Renderizar Tabela Inicial
        renderTable();
    }

    loadReports();
});
