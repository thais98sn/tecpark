export function printTicket({ nome_estacionamento, endereco, placa, hora_entrada, cnpj }) {
    const dataHoraImpressao = new Date().toLocaleString('pt-BR');
    
    // Fallbacks para campos vazios
    const nome = nome_estacionamento || 'TECPARK';
    const end = endereco || 'Endereço não cadastrado';
    const doc = cnpj || 'CNPJ não cadastrado';

    // Montando o conteúdo do ticket
    const ticketHtml = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Ticket de Entrada</title>
            <style>
                @page { 
                    size: 58mm auto; 
                    margin: 0; 
                }
                body {
                    font-family: 'Courier New', Courier, monospace;
                    font-size: 12px;
                    width: 58mm;
                    margin: 0;
                    padding: 5px;
                    box-sizing: border-box;
                    color: #000;
                    background: #fff;
                    line-height: 1.2;
                }
                .center {
                    text-align: center;
                }
                .bold {
                    font-weight: bold;
                }
                .divider {
                    border-top: 1px dashed #000;
                    margin: 8px 0;
                }
                .info-row {
                    display: flex;
                    flex-direction: column;
                    margin-bottom: 5px;
                }
                .info-label {
                    font-size: 10px;
                }
                .info-value {
                    font-size: 14px;
                    font-weight: bold;
                }
                .footer {
                    font-size: 10px;
                    text-align: center;
                    margin-top: 10px;
                }
            </style>
        </head>
        <body>
            <div class="center bold" style="font-size: 16px; margin-bottom: 5px;">
                ${nome}
            </div>
            <div class="center" style="font-size: 10px; margin-bottom: 10px;">
                ${end}
            </div>
            
            <div class="divider"></div>
            
            <div class="center bold" style="font-size: 14px; margin: 10px 0;">
                TICKET DE ENTRADA
            </div>
            
            <div class="info-row center">
                <div class="info-label">PLACA DO VEÍCULO</div>
                <div class="info-value" style="font-size: 20px; border: 1px solid #000; display: inline-block; padding: 2px 8px; margin-top: 2px;">
                    ${placa}
                </div>
            </div>
            
            <div class="info-row center" style="margin-top: 10px;">
                <div class="info-label">ENTRADA</div>
                <div class="info-value">${hora_entrada}</div>
            </div>
            
            <div class="divider"></div>
            
            <div class="center" style="font-size: 10px;">
                CNPJ: ${doc}
            </div>
            
            <div class="center" style="font-size: 10px; margin-top: 5px;">
                Impresso em: ${dataHoraImpressao}
            </div>
            
            <div class="footer">
                Agradecemos a preferência!
                <br>Guarde este ticket.
            </div>
        </body>
        </html>
    `;

    // Criação de um iframe oculto para impressão
    const printFrame = document.createElement('iframe');
    printFrame.style.position = 'fixed';
    printFrame.style.right = '0';
    printFrame.style.bottom = '0';
    printFrame.style.width = '0';
    printFrame.style.height = '0';
    printFrame.style.border = '0';
    
    document.body.appendChild(printFrame);
    
    const docFrame = printFrame.contentWindow || printFrame.contentDocument.document || printFrame.contentDocument;
    
    docFrame.document.open();
    docFrame.document.write(ticketHtml);
    docFrame.document.close();
    
    // Aguarda carregar e imprime
    printFrame.onload = function() {
        printFrame.contentWindow.focus();
        printFrame.contentWindow.print();
        
        setTimeout(() => {
            document.body.removeChild(printFrame);
        }, 1000);
    };
}

export function printReport({ nome_estacionamento, cnpj, dateStr, reportTitle, totalRevenue, totalVehicles, records }) {
    const dataHoraImpressao = new Date().toLocaleString('pt-BR');
    const nome = nome_estacionamento || 'TECPARK';
    const doc = cnpj || 'CNPJ não cadastrado';
    const title = reportTitle || 'Relatório de Operação';

    // Formatar linhas da tabela
    const rowsHtml = records.map(r => {
        const dataEntrada = new Date(r.data_entrada);
        const entradaStr = dataEntrada.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        let saidaStr = '---';
        let valorStr = 'R$ 0,00';
        let status = 'Pendente';
        let pagamento = r.forma_pagamento || '---';

        if (r.status === 'FINALIZADO') {
            const dataSaida = new Date(r.data_saida);
            saidaStr = dataSaida.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
            valorStr = `R$ ${Number(r.valor_pago).toFixed(2).replace('.', ',')}`;
            status = 'Pago';
        }

        return `
            <tr>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;">${r.placa}</td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;">${entradaStr}</td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;">${saidaStr}</td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;">${status}</td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;">${pagamento}</td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">${valorStr}</td>
            </tr>
        `;
    }).join('');

    const reportHtml = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>${title}</title>
            <style>
                @page { size: A4 portrait; margin: 20mm; }
                body {
                    font-family: Arial, sans-serif;
                    font-size: 12px;
                    color: #333;
                    line-height: 1.5;
                }
                .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 10px; }
                .title { font-size: 24px; font-weight: bold; margin-bottom: 5px; }
                .subtitle { font-size: 14px; color: #666; }
                .summary { display: flex; justify-content: space-between; margin-bottom: 30px; background: #f9f9f9; padding: 15px; border: 1px solid #ddd; }
                .summary-item { text-align: center; }
                .summary-label { font-size: 10px; text-transform: uppercase; color: #666; }
                .summary-value { font-size: 18px; font-weight: bold; color: #000; }
                table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
                th { background-color: #f2f2f2; padding: 10px 8px; text-align: left; border-bottom: 2px solid #ddd; font-size: 11px; text-transform: uppercase; }
                .footer { text-align: center; font-size: 10px; color: #999; margin-top: 50px; border-top: 1px solid #ddd; padding-top: 10px; }
            </style>
        </head>
        <body>
            <div class="header">
                <div class="title">${nome}</div>
                <div class="subtitle">${title}</div>
                <div style="font-size: 10px; margin-top: 5px;">CNPJ: ${doc} | Período: ${dateStr}</div>
            </div>

            <div class="summary">
                <div class="summary-item">
                    <div class="summary-label">Faturamento Total</div>
                    <div class="summary-value">R$ ${totalRevenue.toFixed(2).replace('.', ',')}</div>
                </div>
                <div class="summary-item">
                    <div class="summary-label">Veículos Atendidos</div>
                    <div class="summary-value">${totalVehicles}</div>
                </div>
                <div class="summary-item">
                    <div class="summary-label">Emissão</div>
                    <div class="summary-value" style="font-size: 12px; margin-top: 4px;">${dataHoraImpressao}</div>
                </div>
            </div>

            <h3 style="margin-bottom: 10px; font-size: 14px;">Detalhamento de Transações</h3>
            <table>
                <thead>
                    <tr>
                        <th>Placa</th>
                        <th>Entrada</th>
                        <th>Saída</th>
                        <th>Status</th>
                        <th>Pagamento</th>
                        <th>Valor</th>
                    </tr>
                </thead>
                <tbody>
                    ${rowsHtml.length > 0 ? rowsHtml : '<tr><td colspan="6" style="text-align: center; padding: 20px;">Nenhuma transação registrada neste período.</td></tr>'}
                </tbody>
            </table>

            <div class="footer">
                Documento gerado automaticamente pelo sistema TECPARK.
            </div>
        </body>
        </html>
    `;

    const printFrame = document.createElement('iframe');
    printFrame.style.position = 'fixed';
    printFrame.style.right = '0';
    printFrame.style.bottom = '0';
    printFrame.style.width = '0';
    printFrame.style.height = '0';
    printFrame.style.border = '0';
    
    document.body.appendChild(printFrame);
    
    const docFrame = printFrame.contentWindow || printFrame.contentDocument.document || printFrame.contentDocument;
    
    docFrame.document.open();
    docFrame.document.write(reportHtml);
    docFrame.document.close();
    
    printFrame.onload = function() {
        printFrame.contentWindow.focus();
        printFrame.contentWindow.print();
        
        setTimeout(() => {
            document.body.removeChild(printFrame);
        }, 1000);
    };
}

export function printReceipt({ nome_estacionamento, endereco, cnpj, placa, hora_entrada, hora_saida, tempo_permanencia, valor_pago, forma_pagamento }) {
    const dataHoraImpressao = new Date().toLocaleString('pt-BR');
    
    const nome = nome_estacionamento || 'TECPARK';
    const end = endereco || 'Endereço não cadastrado';
    const doc = cnpj || 'CNPJ não cadastrado';

    const ticketHtml = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Comprovante de Pagamento</title>
            <style>
                @page { size: 58mm auto; margin: 0; }
                body {
                    font-family: 'Courier New', Courier, monospace;
                    font-size: 12px;
                    width: 58mm;
                    margin: 0;
                    padding: 5px;
                    box-sizing: border-box;
                    color: #000;
                    background: #fff;
                    line-height: 1.2;
                }
                .center { text-align: center; }
                .bold { font-weight: bold; }
                .divider { border-top: 1px dashed #000; margin: 8px 0; }
                .info-row { display: flex; flex-direction: column; margin-bottom: 5px; }
                .info-row-inline { display: flex; justify-content: space-between; margin-bottom: 3px; }
                .info-label { font-size: 10px; }
                .info-value { font-size: 14px; font-weight: bold; }
                .footer { font-size: 10px; text-align: center; margin-top: 10px; }
            </style>
        </head>
        <body>
            <div class="center bold" style="font-size: 16px; margin-bottom: 5px;">
                ${nome}
            </div>
            <div class="center" style="font-size: 10px; margin-bottom: 10px;">
                ${end}
            </div>
            
            <div class="divider"></div>
            
            <div class="center bold" style="font-size: 14px; margin: 10px 0;">
                COMPROVANTE DE PAGAMENTO
            </div>
            
            <div class="info-row center">
                <div class="info-label">PLACA DO VEÍCULO</div>
                <div class="info-value" style="font-size: 20px; border: 1px solid #000; display: inline-block; padding: 2px 8px; margin-top: 2px;">
                    ${placa}
                </div>
            </div>
            
            <div class="info-row-inline" style="margin-top: 10px;">
                <span class="info-label">ENTRADA:</span>
                <span class="info-value" style="font-size: 12px;">${hora_entrada}</span>
            </div>
            <div class="info-row-inline">
                <span class="info-label">SAÍDA:</span>
                <span class="info-value" style="font-size: 12px;">${hora_saida}</span>
            </div>
            <div class="info-row-inline">
                <span class="info-label">PERMANÊNCIA:</span>
                <span class="info-value" style="font-size: 12px;">${tempo_permanencia}</span>
            </div>
            
            <div class="divider"></div>
            
            <div class="info-row-inline">
                <span class="info-label">FORMA PAGAMENTO:</span>
                <span class="info-value" style="font-size: 12px;">${forma_pagamento}</span>
            </div>
            <div class="info-row-inline">
                <span class="info-label">TOTAL PAGO:</span>
                <span class="info-value" style="font-size: 14px;">R$ ${Number(valor_pago).toFixed(2).replace('.', ',')}</span>
            </div>
            
            <div class="divider"></div>
            
            <div class="center" style="font-size: 10px;">
                CNPJ: ${doc}
            </div>
            
            <div class="center" style="font-size: 10px; margin-top: 5px;">
                Impresso em: ${dataHoraImpressao}
            </div>
            
            <div class="footer">
                Obrigado pela preferência!
                <br>Volte sempre.
            </div>
        </body>
        </html>
    `;

    const printFrame = document.createElement('iframe');
    printFrame.style.position = 'fixed';
    printFrame.style.right = '0';
    printFrame.style.bottom = '0';
    printFrame.style.width = '0';
    printFrame.style.height = '0';
    printFrame.style.border = '0';
    
    document.body.appendChild(printFrame);
    
    const docFrame = printFrame.contentWindow || printFrame.contentDocument.document || printFrame.contentDocument;
    
    docFrame.document.open();
    docFrame.document.write(ticketHtml);
    docFrame.document.close();
    
    printFrame.onload = function() {
        printFrame.contentWindow.focus();
        printFrame.contentWindow.print();
        
        setTimeout(() => {
            document.body.removeChild(printFrame);
        }, 1000);
    };
}
