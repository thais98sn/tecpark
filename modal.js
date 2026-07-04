// modal.js - Utilitário global para modais customizados

let modalContainer = null;

function ensureContainer() {
    if (!modalContainer) {
        modalContainer = document.createElement('div');
        modalContainer.id = 'tecpark-modal-container';
        document.body.appendChild(modalContainer);
    }
}

export function showModal(title, message, isError = false) {
    return new Promise((resolve) => {
        ensureContainer();
        
        const icon = isError ? 'error' : 'info';
        const colorClass = isError ? 'text-error' : 'text-primary';
        const buttonClass = isError ? 'bg-error text-white hover:bg-red-700' : 'bg-primary text-on-primary hover:bg-primary-container';

        const modalHtml = `
            <div class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                <div class="bg-surface dark:bg-surface-container-high border border-outline-variant dark:border-outline p-6 rounded-lg shadow-2xl max-w-sm w-full animate-scale-up technical-shadow">
                    <div class="flex items-center gap-3 mb-4">
                        <span class="material-symbols-outlined text-3xl ${colorClass}">${icon}</span>
                        <h3 class="font-headline-sm text-headline-sm ${colorClass}">${title}</h3>
                    </div>
                    <p class="font-body-md text-body-md text-on-surface-variant dark:text-surface-variant mb-6 whitespace-pre-line">${message}</p>
                    <div class="flex justify-end">
                        <button id="modal-btn-ok" class="px-6 py-2 rounded font-label-mono text-label-mono uppercase transition-colors ${buttonClass}">OK</button>
                    </div>
                </div>
            </div>
        `;

        modalContainer.innerHTML = modalHtml;

        const btnOk = document.getElementById('modal-btn-ok');
        
        const closeModal = () => {
            modalContainer.innerHTML = '';
            resolve();
        };

        btnOk.addEventListener('click', closeModal);
    });
}

export function showCheckoutModal(plate, duration, totalValue, paymentMethods) {
    return new Promise((resolve, reject) => {
        ensureContainer();

        const methodsHtml = paymentMethods.map(m => `<option value="${m.nome}">${m.nome}</option>`).join('');

        const modalHtml = `
            <div class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                <div class="bg-surface border border-outline-variant p-6 rounded-lg shadow-2xl max-w-md w-full animate-scale-up technical-shadow">
                    <div class="flex items-center justify-between mb-6">
                        <h3 class="font-headline-sm text-headline-sm text-primary flex items-center gap-2">
                            <span class="material-symbols-outlined">payments</span>
                            Finalizar Ticket
                        </h3>
                        <button id="checkout-btn-close" class="text-on-surface-variant hover:text-error transition-colors">
                            <span class="material-symbols-outlined">close</span>
                        </button>
                    </div>
                    
                    <div class="bg-surface-container-lowest p-4 rounded border border-outline-variant mb-6 space-y-3">
                        <div class="flex justify-between items-center border-b border-outline-variant pb-2">
                            <span class="font-label-mono text-[11px] text-on-surface-variant uppercase">Placa</span>
                            <span class="license-plate-bg font-data-display px-2 py-1 border border-outline uppercase">${plate}</span>
                        </div>
                        <div class="flex justify-between items-center border-b border-outline-variant pb-2">
                            <span class="font-label-mono text-[11px] text-on-surface-variant uppercase">Permanência</span>
                            <span class="font-body-md font-bold">${duration}</span>
                        </div>
                        <div class="flex justify-between items-center pt-1">
                            <span class="font-label-mono text-sm text-on-surface-variant uppercase">Total a Pagar</span>
                            <span class="font-display-lg text-primary text-xl font-bold">R$ ${Number(totalValue).toFixed(2).replace('.', ',')}</span>
                        </div>
                    </div>

                    <div class="mb-6">
                        <label class="font-label-mono text-label-mono text-on-surface-variant uppercase mb-2 block">Forma de Pagamento</label>
                        <select id="checkout-payment-method" class="w-full bg-surface-container border-2 border-outline-variant rounded px-4 py-3 font-body-md focus:border-primary outline-none transition-colors">
                            <option value="">Selecione...</option>
                            ${methodsHtml}
                        </select>
                    </div>

                    <div class="flex justify-end gap-3">
                        <button id="checkout-btn-cancel" class="px-6 py-3 rounded font-label-mono text-label-mono text-on-surface-variant hover:bg-surface-container uppercase transition-colors">Cancelar</button>
                        <button id="checkout-btn-confirm" class="px-6 py-3 rounded font-label-mono text-label-mono bg-primary text-on-primary hover:bg-primary-container uppercase transition-colors flex items-center gap-2 disabled:opacity-50">
                            <span class="material-symbols-outlined text-sm">check_circle</span>
                            Confirmar Pagamento
                        </button>
                    </div>
                </div>
            </div>
        `;

        modalContainer.innerHTML = modalHtml;

        const btnClose = document.getElementById('checkout-btn-close');
        const btnCancel = document.getElementById('checkout-btn-cancel');
        const btnConfirm = document.getElementById('checkout-btn-confirm');
        const selectMethod = document.getElementById('checkout-payment-method');

        // Validação inicial
        btnConfirm.disabled = true;
        selectMethod.addEventListener('change', () => {
            btnConfirm.disabled = selectMethod.value === "";
        });

        const closeAll = () => {
            modalContainer.innerHTML = '';
            reject(new Error("Cancelado"));
        };

        btnClose.addEventListener('click', closeAll);
        btnCancel.addEventListener('click', closeAll);
        
        btnConfirm.addEventListener('click', () => {
            const method = selectMethod.value;
            if (method) {
                modalContainer.innerHTML = '';
                resolve(method);
            }
        });
    });
}

export function showEntrySuccessModal(plate) {
    return new Promise((resolve) => {
        ensureContainer();
        
        const modalHtml = `
            <div class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                <div class="bg-surface border border-outline-variant p-6 rounded-lg shadow-2xl max-w-sm w-full animate-scale-up technical-shadow">
                    <div class="flex items-center gap-3 mb-4">
                        <span class="material-symbols-outlined text-3xl text-primary">check_circle</span>
                        <h3 class="font-headline-sm text-headline-sm text-primary">Sucesso</h3>
                    </div>
                    <p class="font-body-md text-body-md text-on-surface-variant mb-6">
                        Entrada do veículo <span class="font-bold">${plate}</span> registrada com sucesso!
                    </p>
                    <div class="flex flex-col gap-3">
                        <button id="modal-btn-print" class="w-full px-6 py-3 rounded font-label-mono text-label-mono bg-surface-container-high hover:bg-surface-variant text-on-surface uppercase transition-colors flex items-center justify-center gap-2">
                            <span class="material-symbols-outlined text-sm">print</span>
                            Imprimir Ticket
                        </button>
                        <button id="modal-btn-ok" class="w-full px-6 py-3 rounded font-label-mono text-label-mono bg-primary text-on-primary hover:bg-primary-container uppercase transition-colors">
                            Concluir
                        </button>
                    </div>
                </div>
            </div>
        `;

        modalContainer.innerHTML = modalHtml;

        const btnOk = document.getElementById('modal-btn-ok');
        const btnPrint = document.getElementById('modal-btn-print');
        
        const closeAndResolve = (shouldPrint) => {
            modalContainer.innerHTML = '';
            resolve(shouldPrint);
        };

        btnOk.addEventListener('click', () => closeAndResolve(false));
        btnPrint.addEventListener('click', () => closeAndResolve(true));
    });
}
