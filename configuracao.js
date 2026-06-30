import { supabase } from './supabaseClient.js'
import { showModal } from './modal.js'

document.addEventListener('DOMContentLoaded', async () => {
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

    const form = document.getElementById('price-form');
    const inputDesc = document.getElementById('input-desc');
    const inputMins = document.getElementById('input-mins');
    const inputValor = document.getElementById('input-valor');
    const pricingList = document.getElementById('pricing-list');
    const btnSalvar = document.getElementById('btn-salvar');
    const inputVagas = document.getElementById('input-vagas');
    const btnSalvarVagas = document.getElementById('btn-salvar-vagas');

    async function loadVagas() {
        const { data, error } = await supabase.from('configuracoes_gerais').select('*').eq('id', 1).single();
        if (data) {
            inputVagas.value = data.total_vagas;
        }
    }

    btnSalvarVagas.addEventListener('click', async () => {
        const vagas = parseInt(inputVagas.value);
        if(isNaN(vagas) || vagas <= 0) {
            await showModal("Erro", "Quantidade de vagas inválida.", true);
            return;
        }
        
        btnSalvarVagas.disabled = true;
        const { error } = await supabase.from('configuracoes_gerais').upsert({ id: 1, total_vagas: vagas });
        btnSalvarVagas.disabled = false;
        
        if (error) {
            await showModal("Erro", "Erro ao salvar: " + error.message, true);
        } else {
            await showModal("Sucesso", "Capacidade atualizada com sucesso!");
        }
    });

    async function loadConfig() {
        const { data, error } = await supabase
            .from('configuracoes_preco')
            .select('*')
            .order('periodo_minutos', { ascending: true });

        if (error) {
            console.error("Erro ao carregar configurações", error);
            return;
        }

        if (data.length === 0) {
            pricingList.innerHTML = `<p class="font-body-md text-on-surface-variant p-4 text-center">Nenhuma regra cadastrada.</p>`;
            return;
        }

        pricingList.innerHTML = data.map(rule => `
            <div class="flex items-center justify-between p-stack-sm bg-surface-container rounded border border-transparent hover:border-outline-variant transition-all">
                <div class="flex items-center gap-3">
                    <span class="bg-primary text-white text-[10px] font-bold px-2 py-1 rounded">${rule.periodo_minutos} MIN</span>
                    <span class="font-body-md text-body-md">${rule.descricao}</span>
                </div>
                <div class="flex items-center gap-4">
                    <span class="font-label-mono text-label-mono text-secondary">R$ ${Number(rule.valor).toFixed(2).replace('.', ',')}</span>
                    <button class="material-symbols-outlined text-error text-sm hover:text-red-700 btn-delete" data-id="${rule.id}">delete</button>
                </div>
            </div>
        `).join('');

        // Add event listeners for delete buttons
        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = e.target.getAttribute('data-id');
                if (confirm('Tem certeza que deseja remover esta regra?')) {
                    const { error } = await supabase.from('configuracoes_preco').delete().eq('id', id);
                    if (error) {
                        await showModal("Erro", "Erro ao excluir: " + error.message, true);
                    } else {
                        loadConfig();
                    }
                }
            });
        });
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const desc = inputDesc.value;
        const mins = parseInt(inputMins.value);
        const valor = parseFloat(inputValor.value);

        if (!desc || isNaN(mins) || isNaN(valor)) {
            await showModal("Atenção", "Preencha os campos da regra corretamente.", true);
            return;
        }

        btnSalvar.disabled = true;
        const { error } = await supabase
            .from('configuracoes_preco')
            .insert([{ descricao: desc, periodo_minutos: mins, valor: valor }]);
        
        btnSalvar.disabled = false;

        if (error) {
            await showModal("Erro", "Erro ao salvar: " + error.message, true);
        } else {
            await showModal("Sucesso", "Regra de preço salva com sucesso!");
            form.reset();
            loadConfig();
        }
    });

    // --- CRUD Formas de Pagamento ---
    const paymentForm = document.getElementById('payment-form');
    const inputPaymentName = document.getElementById('input-payment-name');
    const paymentList = document.getElementById('payment-list');
    const btnAddPayment = document.getElementById('btn-add-payment');

    async function loadPayments() {
        const { data, error } = await supabase.from('formas_pagamento').select('*').order('nome', { ascending: true });
        
        if (error) {
            console.error("Erro pagamentos:", error);
            return;
        }

        if (data.length === 0) {
            paymentList.innerHTML = `<p class="font-body-md text-on-surface-variant p-2 text-center">Nenhuma forma cadastrada.</p>`;
            return;
        }

        paymentList.innerHTML = data.map(pay => `
            <div class="flex items-center justify-between p-2 bg-surface rounded border border-transparent hover:border-outline-variant transition-all">
                <span class="font-body-md text-body-md">${pay.nome}</span>
                <button class="material-symbols-outlined text-error text-sm hover:text-red-700 btn-delete-payment" data-id="${pay.id}">delete</button>
            </div>
        `).join('');

        document.querySelectorAll('.btn-delete-payment').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = e.target.getAttribute('data-id');
                if (confirm('Remover esta forma de pagamento?')) {
                    const { error } = await supabase.from('formas_pagamento').delete().eq('id', id);
                    if (error) await showModal("Erro", "Erro ao excluir: " + error.message, true);
                    else loadPayments();
                }
            });
        });
    }

    if (paymentForm) {
        paymentForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const nome = inputPaymentName.value.trim();
            if (!nome) return;

            btnAddPayment.disabled = true;
            const { error } = await supabase.from('formas_pagamento').insert([{ nome: nome }]);
            btnAddPayment.disabled = false;

            if (error) {
                await showModal("Erro", "Erro ao salvar pagamento: " + error.message, true);
            } else {
                paymentForm.reset();
                loadPayments();
            }
        });
    }

    loadConfig();
    loadVagas();
    loadPayments();
});
