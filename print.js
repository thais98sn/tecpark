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
        
        // Remover o iframe após a impressão (com um pequeno delay)
        setTimeout(() => {
            document.body.removeChild(printFrame);
        }, 1000);
    };
}
