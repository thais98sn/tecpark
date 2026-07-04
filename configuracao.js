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
    const inputTipo = document.getElementById('input-tipo');
    const inputMins = document.getElementById('input-mins');
    const inputUnidade = document.getElementById('input-unidade');
    const inputValor = document.getElementById('input-valor');
    const pricingList = document.getElementById('pricing-list');
    const btnSalvar = document.getElementById('btn-salvar');
    const inputVagas = document.getElementById('input-vagas');
    const btnSalvarVagas = document.getElementById('btn-salvar-vagas');

    const formParkingData = document.getElementById('parking-data-form');
    const inputNomeEstacionamento = document.getElementById('input-nome-estacionamento');
    const inputCnpj = document.getElementById('input-cnpj');
    const inputEndereco = document.getElementById('input-endereco');

    async function loadGerais() {
        const { data, error } = await supabase.from('configuracoes_gerais').select('*').eq('id', 1).single();
        if (data) {
            inputVagas.value = data.total_vagas || 100;
            if(inputNomeEstacionamento) inputNomeEstacionamento.value = data.nome_estacionamento || '';
            if(inputCnpj) inputCnpj.value = data.cnpj || '';
            if(inputEndereco) inputEndereco.value = data.endereco || '';
            
            // Atualizar cabeçalho se houver nome
            if (data.nome_estacionamento) {
                const headerTitle = document.querySelector('header h1');
                if (headerTitle) headerTitle.textContent = data.nome_estacionamento;
            }
        }
    }

    if (formParkingData) {
        formParkingData.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btnSalvarDados = document.getElementById('btn-salvar-dados');
            btnSalvarDados.disabled = true;
            
            const { error } = await supabase.from('configuracoes_gerais').update({ 
                nome_estacionamento: inputNomeEstacionamento.value,
                cnpj: inputCnpj.value,
                endereco: inputEndereco.value
            }).eq('id', 1);
            
            btnSalvarDados.disabled = false;
            
            if (error) {
                await showModal("Erro", "Erro ao salvar dados: " + error.message, true);
            } else {
                await showModal("Sucesso", "Dados do estacionamento atualizados com sucesso!");
                loadGerais(); // recarrega para atualizar o header
            }
        });
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

        pricingList.innerHTML = data.map(rule => {
            let labelTempo = `${rule.periodo_minutos} MIN`;
            if (rule.periodo_minutos >= 1440 && rule.periodo_minutos % 1440 === 0) {
                const dias = rule.periodo_minutos / 1440;
                labelTempo = `${dias} ${dias > 1 ? 'DIÁRIAS' : 'DIÁRIA'}`;
            } else if (rule.periodo_minutos >= 60 && rule.periodo_minutos % 60 === 0) {
                const horas = rule.periodo_minutos / 60;
                labelTempo = `${horas} ${horas > 1 ? 'HORAS' : 'HORA'}`;
            }

            return `
            <div class="flex items-center justify-between p-stack-sm bg-surface-container rounded border border-transparent hover:border-outline-variant transition-all">
                <div class="flex items-center gap-3">
                    <span class="bg-primary text-white text-[10px] font-bold px-2 py-1 rounded">${labelTempo}</span>
                    <div class="flex flex-col">
                        <span class="font-body-md text-body-md">${rule.descricao}</span>
                        <span class="text-xs text-on-surface-variant uppercase">${rule.tipo_regra === 'ADICIONAL' ? 'HORA EXTRA' : 'BASE'}</span>
                    </div>
                </div>
                <div class="flex items-center gap-4">
                    <span class="font-label-mono text-label-mono text-secondary">R$ ${Number(rule.valor).toFixed(2).replace('.', ',')}</span>
                    <button class="material-symbols-outlined text-primary text-sm hover:text-secondary btn-edit" data-id="${rule.id}" data-desc="${rule.descricao}" data-mins="${rule.periodo_minutos}" data-valor="${rule.valor}" data-tipo="${rule.tipo_regra}">edit</button>
                    <button class="material-symbols-outlined text-error text-sm hover:text-red-700 btn-delete" data-id="${rule.id}">delete</button>
                </div>
            </div>
            `;
        }).join('');

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

        // Add event listeners for edit buttons
        document.querySelectorAll('.btn-edit').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                inputDesc.value = btn.getAttribute('data-desc');
                
                let minsDB = parseInt(btn.getAttribute('data-mins'));
                let valorInput = minsDB;
                let unidade = 'minutos';
                
                if (minsDB >= 1440 && minsDB % 1440 === 0) {
                    valorInput = minsDB / 1440;
                    unidade = 'diarias';
                } else if (minsDB >= 60 && minsDB % 60 === 0) {
                    valorInput = minsDB / 60;
                    unidade = 'horas';
                }
                
                inputMins.value = valorInput;
                if(inputUnidade) inputUnidade.value = unidade;
                
                inputValor.value = btn.getAttribute('data-valor');
                inputTipo.value = btn.getAttribute('data-tipo');
                
                form.dataset.editId = id;
                btnSalvar.innerHTML = `<span class="material-symbols-outlined">update</span> ATUALIZAR REGRA`;
                
                if (!document.getElementById('btn-cancel-edit')) {
                    const cancelBtn = document.createElement('button');
                    cancelBtn.id = 'btn-cancel-edit';
                    cancelBtn.type = 'button';
                    cancelBtn.className = 'w-full bg-surface-variant text-on-surface-variant font-bold py-3 rounded transition-transform active:scale-95 hover:brightness-110 flex items-center justify-center gap-2 mb-stack-sm';
                    cancelBtn.innerHTML = `<span class="material-symbols-outlined">close</span> CANCELAR`;
                    cancelBtn.onclick = () => {
                        form.reset();
                        delete form.dataset.editId;
                        btnSalvar.innerHTML = `<span class="material-symbols-outlined">save</span> SALVAR REGRA`;
                        cancelBtn.remove();
                    };
                    btnSalvar.parentNode.insertBefore(cancelBtn, btnSalvar.nextSibling);
                }
                
                // Scroll up to form
                form.scrollIntoView({ behavior: 'smooth' });
            });
        });
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const desc = inputDesc.value;
        const tipo = inputTipo.value;
        const valorMin = parseInt(inputMins.value);
        const valor = parseFloat(inputValor.value);
        const unidade = inputUnidade ? inputUnidade.value : 'minutos';
        
        let mins = valorMin;
        if (unidade === 'horas') mins = valorMin * 60;
        else if (unidade === 'diarias') mins = valorMin * 1440;

        if (!desc || isNaN(mins) || isNaN(valor) || !tipo) {
            await showModal("Atenção", "Preencha os campos da regra corretamente.", true);
            return;
        }

        const editId = form.dataset.editId;

        btnSalvar.disabled = true;
        let requestError;
        
        if (editId) {
            const { error } = await supabase
                .from('configuracoes_preco')
                .update({ descricao: desc, periodo_minutos: mins, valor: valor, tipo_regra: tipo })
                .eq('id', editId);
            requestError = error;
        } else {
            const { error } = await supabase
                .from('configuracoes_preco')
                .insert([{ descricao: desc, periodo_minutos: mins, valor: valor, tipo_regra: tipo }]);
            requestError = error;
        }
        
        btnSalvar.disabled = false;

        if (requestError) {
            await showModal("Erro", "Erro ao salvar: " + requestError.message, true);
        } else {
            await showModal("Sucesso", editId ? "Regra de preço atualizada com sucesso!" : "Regra de preço salva com sucesso!");
            form.reset();
            delete form.dataset.editId;
            btnSalvar.innerHTML = `<span class="material-symbols-outlined">save</span> SALVAR REGRA`;
            const cancelBtn = document.getElementById('btn-cancel-edit');
            if (cancelBtn) cancelBtn.remove();
            
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
    loadGerais();
    loadPayments();
});
