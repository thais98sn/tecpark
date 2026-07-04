import { supabase } from './supabaseClient.js'
import { showModal, showCheckoutModal, showEntrySuccessModal, showExitSuccessModal } from './modal.js'
import { printTicket, printReceipt } from './print.js'

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

    const btnEntrada = document.getElementById('btn-entrada');
    const btnSaida = document.getElementById('btn-saida');
    const plateInput = document.getElementById('plate-input');
    const activeVehiclesList = document.getElementById('active-vehicles-list');
    const activeCountBadge = document.getElementById('active-count-badge');

    async function loadActiveVehicles() {
        const { data: records, error } = await supabase
            .from('registros_estacionamento')
            .select('*')
            .eq('status', 'ESTACIONADO')
            .order('data_entrada', { ascending: false });

        if (error) {
            console.error("Erro ao carregar veículos:", error);
            return;
        }

        const { data: config } = await supabase.from('configuracoes_gerais').select('*').eq('id', 1).single();
        if (config && config.nome_estacionamento) {
            const headerTitle = document.querySelector('header h1');
            if (headerTitle) headerTitle.textContent = config.nome_estacionamento;
        }
        
        const totalVagas = config ? config.total_vagas : 100;
        const capacityPercentage = document.getElementById('capacity-percentage');
        if(capacityPercentage) {
            const pct = Math.min(100, Math.round((records.length / totalVagas) * 100));
            capacityPercentage.textContent = `${pct}%`;
        }

        activeCountBadge.textContent = `${records.length} VAGA${records.length !== 1 ? 'S' : ''} OCUPADA${records.length !== 1 ? 'S' : ''}`;
        
        if (records.length === 0) {
            activeVehiclesList.innerHTML = `
            <div class="border-2 border-dashed border-outline-variant rounded p-stack-sm flex items-center justify-center min-h-[120px] bg-surface-container-low opacity-60 col-span-full">
                <span class="font-label-mono text-label-mono text-on-surface-variant">NENHUM VEÍCULO ESTACIONADO</span>
            </div>`;
            return;
        }

        activeVehiclesList.innerHTML = records.map(record => {
            const dataEntrada = new Date(record.data_entrada);
            const agora = new Date();
            const horasFormatado = dataEntrada.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
            const diffMs = agora - dataEntrada;
            const diffMins = Math.floor(diffMs / 60000);
            const hours = Math.floor(diffMins / 60);
            const mins = diffMins % 60;
            const timeStr = `${hours.toString().padStart(2, '0')}h ${mins.toString().padStart(2, '0')}m`;

            return `
            <div class="bg-white border border-outline-variant rounded p-stack-sm flex flex-col gap-stack-sm technical-shadow hover:border-primary transition-colors cursor-pointer" onclick="document.getElementById('plate-input').value = '${record.placa}'">
                <div class="flex justify-between items-start">
                    <span class="font-data-display text-data-display bg-[#F1F5F9] px-2 py-0.5 rounded border border-outline">${record.placa}</span>
                </div>
                <div class="flex flex-col">
                    <span class="font-label-mono text-label-mono text-on-surface-variant text-[11px] uppercase">Entrada</span>
                    <span class="font-body-md text-body-md text-primary">Hoje, ${horasFormatado}</span>
                </div>
                <div class="flex justify-between items-center pt-2 border-t border-outline-variant mt-1">
                    <span class="font-label-mono text-label-mono text-secondary font-bold">${timeStr}</span>
                </div>
            </div>`;
        }).join('');
    }

    // Carregar na inicialização
    loadActiveVehicles();

    btnEntrada.addEventListener('click', async () => {
        const plate = plateInput.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
        if (plate.length < 7) {
            await showModal("Ops!", "Placa inválida. Preencha corretamente.", true);
            return;
        }
        
        btnEntrada.disabled = true;

        // Verificar se o veículo já está estacionado
        const { data: existingRecords, error: checkError } = await supabase
            .from('registros_estacionamento')
            .select('id')
            .ilike('placa', plate)
            .eq('status', 'ESTACIONADO')
            .limit(1);

        if (checkError) {
            await showModal("Erro", "Falha ao verificar veículo: " + checkError.message, true);
            btnEntrada.disabled = false;
            return;
        }

        if (existingRecords && existingRecords.length > 0) {
            await showModal("Atenção", "Este veículo já consta como ESTACIONADO no pátio. Registre a saída dele antes de tentar uma nova entrada.", true);
            btnEntrada.disabled = false;
            return;
        }

        const { error } = await supabase
            .from('registros_estacionamento')
            .insert([{ placa: plate, status: 'ESTACIONADO' }]);
            
        btnEntrada.disabled = false;

        if (error) {
            await showModal("Erro", "Erro ao registrar entrada: " + error.message, true);
        } else {
            const shouldPrint = await showEntrySuccessModal(plate);
            
            if (shouldPrint) {
                const { data: config } = await supabase.from('configuracoes_gerais').select('*').eq('id', 1).single();
                const now = new Date();
                const hora_entrada = now.toLocaleDateString('pt-BR') + ' ' + now.toLocaleTimeString('pt-BR');
                
                printTicket({
                    nome_estacionamento: config?.nome_estacionamento,
                    endereco: config?.endereco,
                    cnpj: config?.cnpj,
                    placa: plate,
                    hora_entrada: hora_entrada
                });
            }
            
            plateInput.value = '';
            loadActiveVehicles();
        }
    });

    btnSaida.addEventListener('click', async () => {
        const plate = plateInput.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
        if (plate.length < 7) {
            await showModal("Ops!", "Placa inválida. Preencha corretamente.", true);
            return;
        }
        
        btnSaida.disabled = true;

        // Buscar veículo estacionado
        const { data: records, error } = await supabase
            .from('registros_estacionamento')
            .select('*')
            .ilike('placa', plate)
            .eq('status', 'ESTACIONADO')
            .order('data_entrada', { ascending: false })
            .limit(1);
            
        const record = records && records.length > 0 ? records[0] : null;
        if (error || !record) {
            await showModal("Não encontrado", "Veículo não encontrado ou não está estacionado.", true);
            btnSaida.disabled = false;
            return;
        }

        const entrada = new Date(record.data_entrada);
        const saida = new Date();
        const diffMs = saida - entrada;
        const diffMins = Math.ceil(diffMs / 60000);
        const hours = Math.floor(diffMins / 60);
        const mins = diffMins % 60;
        const timeStr = `${hours.toString().padStart(2, '0')}h ${mins.toString().padStart(2, '0')}m`;

        // Calcular valor
        const { data: configs, error: cfgError } = await supabase
            .from('configuracoes_preco')
            .select('*')
            .order('periodo_minutos', { ascending: true });
            
        let valorPagar = 0;
        if (configs && configs.length > 0) {
            const baseConfigs = configs.filter(c => c.tipo_regra !== 'ADICIONAL');
            const additionalConfigs = configs.filter(c => c.tipo_regra === 'ADICIONAL');
            
            let appliedBaseMins = 0;
            // 1. Achar a maior regra base aplicável
            if (baseConfigs.length > 0) {
                const applicableBase = baseConfigs.filter(c => diffMins >= c.periodo_minutos);
                if(applicableBase.length > 0) {
                    const bestBase = applicableBase[applicableBase.length - 1];
                    valorPagar = bestBase.valor;
                    appliedBaseMins = bestBase.periodo_minutos;
                } else {
                    // Se não bateu nem o mínimo, cobra a menor base
                    valorPagar = baseConfigs[0].valor;
                    appliedBaseMins = baseConfigs[0].periodo_minutos;
                }
            }

            // 2. Calcular extra se houver
            if (diffMins > appliedBaseMins && additionalConfigs.length > 0) {
                const extraMins = diffMins - appliedBaseMins;
                const extraRule = additionalConfigs[0]; // Pega a primeira regra extra
                const blocks = Math.ceil(extraMins / extraRule.periodo_minutos);
                valorPagar += blocks * extraRule.valor;
            }
        }

        // Buscar Formas de Pagamento
        const { data: paymentMethods, error: payError } = await supabase
            .from('formas_pagamento')
            .select('*');

        if (payError || !paymentMethods || paymentMethods.length === 0) {
            await showModal("Erro de Configuração", "Nenhuma forma de pagamento cadastrada. Configure no painel.", true);
            btnSaida.disabled = false;
            return;
        }

        let selectedMethod = null;
        try {
            selectedMethod = await showCheckoutModal(plate, timeStr, valorPagar, paymentMethods);
        } catch (err) {
            // Cancelado
            btnSaida.disabled = false;
            return;
        }

        // Atualizar registro no banco
        const { error: updError } = await supabase
            .from('registros_estacionamento')
            .update({ 
                data_saida: saida.toISOString(), 
                valor_pago: valorPagar, 
                forma_pagamento: selectedMethod,
                status: 'FINALIZADO' 
            })
            .eq('id', record.id);
            
        btnSaida.disabled = false;

        if (updError) {
            await showModal("Erro", "Erro ao registrar saída: " + updError.message, true);
        } else {
            const shouldPrint = await showExitSuccessModal(plate, valorPagar, selectedMethod);
            
            if (shouldPrint) {
                const { data: config } = await supabase.from('configuracoes_gerais').select('*').eq('id', 1).single();
                
                printReceipt({
                    nome_estacionamento: config?.nome_estacionamento,
                    endereco: config?.endereco,
                    cnpj: config?.cnpj,
                    placa: plate,
                    hora_entrada: entrada.toLocaleString('pt-BR'),
                    hora_saida: saida.toLocaleString('pt-BR'),
                    tempo_permanencia: timeStr,
                    valor_pago: valorPagar,
                    forma_pagamento: selectedMethod
                });
            }
            
            plateInput.value = '';
            loadActiveVehicles();
        }
    });
});
