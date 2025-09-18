$("#codbarra").focus();
$("#mensagemErroG").hide();
hideMsgs();
var count = 0;
var etiquetaValida = 0;
var etiquetaInvalida = 0;
var etiquetaDuplicada = 0;
var qtdePalete = 0;
var url;
var histLeitura = [];
var etiquetasToConf = [];
var requisicoes = [];
var promises = [];
var vars = [],
    hash;
var hashes = window.location.href
    .slice(window.location.href.indexOf("?") + 1)
    .split("&");
for (var i = 0; i < hashes.length; i++) {
    hash = hashes[i].split("=");
    vars.push(hash[0]);
    vars[hash[0]] = hash[1];
}
vars;
var descCarga = vars.desccarga.replace(/%20/g, " ");
var totalEtiquetas = vars.totetiquetas;
var etiquetaValida = vars.totconf;
$("#etiquetasToConf").text(vars.totetiquetas);
$("#etiquetasValidas").text(etiquetaValida);
$("#codCarga").text(`${vars.carga} ${decodeURI(descCarga)}`);
$("#nroEntrega").text(vars.numentrega);
url = `${vars.urlApi}confcargaapi/preconferencia/conf`;

$("#estorna").click(() => {
    $("#codbarra").focus();
});

function hideMsgs() {
    $("#responseDanger").hide();
    $("#responseSuccess").hide();
    $("#responseAlert").hide();
}
function verifyReturn(msg) {
    switch (msg) {
        case "Etiqueta Inválida":
            $("#responseDanger").show();
            $("#dangerText").text(
                "Etiqueta inválida, favor verificar os dados"
            );
            break;
        case "Entrada Pela Etiqueta já Efetudada":
            $("#responseDanger").show();
            $("#dangerText").text(msg);
            break;
    }
}
function lostInputFocus() {
    var validLostInput = $("#codbarra").val();
    if (validLostInput != "" && validLostInput != null) {
        $("#button").click();
        $("#codbarra").focus();
    }
}

$("#clearPage").click(function () {
    document.location.reload(true);
});
$(document).keypress(function (e) {
    if (e.which == 13) {
        $("#button").focus();
    }
});
$("#btnZeraPalete").click(() => {
    qtdePalete = 0;
    $("#qtdePalete").text(qtdePalete);
});

$("button").click(function (e) {
    hideMsgs();

    let readBarcode = $("#codbarra").val();
    let estorna = $("#estorna").is(":checked");

    if (readBarcode != "") {
        let valReread = false;
        if (!estorna) {
            for (var i = 0; i < etiquetasToConf.length; i++) {
                if (etiquetasToConf[i] == readBarcode) {
                    valReread = true;
                }
            }
        }

        if (valReread) {
            etiquetaDuplicada++;
            $("#etiqeutasDuplicadas").text(etiquetaDuplicada);
            histLeitura.push(
                `<li style="color:red;">${readBarcode} - Leitura duplicada</li>`
            );
            valReread = false;
        } else {
            if (!estorna) etiquetasToConf.push(readBarcode);

            var parm = new Object();
            parm.CodigoBarras = readBarcode.trim();
            parm.EntregaNroEntrega = vars.numentrega;
            parm.CargaId = vars.carga || 0;
            parm.ClienteId = vars.clienteid || 0;
            parm.PedidoId = vars.pedidoid || 0;
            parm.Estorno = estorna ? 1 : 0;
            parm.UsuarioId = vars.usuarioid || 0;
            parm.UsuarioLogin = vars.usuariologin || "";

            requisicoes.push({
                url: url,
                method: "POST",
                data: parm,
                headers: {
                    'Token': getApiToken()
                }
            });
        }
    } else {
        $("#alertText").text("Favor, informar um código de etiqueta");
        $("#responseAlert").show();
    }
    $("#codbarra").val("");
    $("#codbarra").focus();
    $("#historicoLeitura").html(histLeitura);

    if (count >= histLeitura.length) {
        $("#responseAlert").hide();
    } else {
        $("#alertText").text("Processando, favor não fechar a página");
        $("#responseAlert").show();
    }

    if (readBarcode != null) {
        count++;
    }
});

$(document).ready(() => {
    $("#codbarra").focus();
});

function enviarRequisicoesEmOrdem() {
    let CodigoBarras;
    this.isProcessing = true;
    return new Promise((resolve, reject) => {
        function processarProximaPromessa(promessaAtual) {
            if (promises.length === 0) {
                this.isProcessing = false;
            }

            if (promises[promessaAtual] != null) {
                CodigoBarras = promises[promessaAtual].data.CodigoBarras;

                if (CodigoBarras != processarProximaPromessa.lastCodBarras) {
                    processarProximaPromessa.lastCodBarras = CodigoBarras;
                    console.log(promises[promessaAtual]);
                    const promessa = () => axios(promises[promessaAtual]);
                    promessa()
                        .then(function (result) {
                            if (result.data.MensagemErro == "") {
                                let message = `${CodigoBarras} - ${result.data.ProdutoDescricao} ${result.data.RevestimentoDescricao}`;
                                $("#mensagemErroG").hide();
                                histLeitura.push(
                                    `<li style="color:#041A56;">${message} </li>`
                                );
                                this.etiquetaValida++;
                                this.qtdePalete++;
                                /* * Diminui a quantidade total de etiquetas conforme a carga é lida */
                                $("#qtdePalete").text(this.qtdePalete);
                                this.totalEtiquetas--;
                                $("#etiquetasToConf").text(this.totalEtiquetas);
                                $("#etiquetasValidas").text(
                                    this.etiquetaValida
                                );
                            } else {
                                verifyReturn(result.data.Mensagem);
                                if (CodigoBarras != "")
                                    histLeitura.push(
                                        `<li style="color:red;">${CodigoBarras} - ${result.data.MensagemErro}</li>`
                                    );
                                this.mensagemErroG = `${CodigoBarras} - ${result.data.MensagemErro}`;
                                this.etiquetaInvalida++;
                                $("#etiquetasInvalidas").text(
                                    this.etiquetaInvalida
                                );
                                $("#mensagemErroG").text(this.mensagemErroG);
                                $("#mensagemErroG").show();
                            }
                        })
                        .catch(function (error) {
                            let errorMessage = "";
                            let displayMessage = "";
                            
                            // Verifica se é um erro de resposta HTTP (400, 500, etc.)
                            if (error.response) {
                                // A requisição foi feita e o servidor respondeu com código de erro
                                if (error.response.data) {
                                    // Tenta extrair a mensagem de erro do JSON retornado pela API
                                    if (error.response.data.MensagemErro) {
                                        errorMessage = error.response.data.MensagemErro;
                                    } else if (error.response.data.Mensagem) {
                                        errorMessage = error.response.data.Mensagem;
                                    } else if (error.response.data.message) {
                                        errorMessage = error.response.data.message;
                                    } else if (typeof error.response.data === 'string') {
                                        errorMessage = error.response.data;
                                    } else {
                                        errorMessage = `Erro HTTP ${error.response.status}: ${error.response.statusText}`;
                                    }
                                } else {
                                    errorMessage = `Erro HTTP ${error.response.status}: ${error.response.statusText}`;
                                }
                                
                                // Processa a mensagem de erro similar ao sucesso
                                verifyReturn(errorMessage);
                                displayMessage = `${CodigoBarras} - ${errorMessage}`;
                                this.mensagemErroG = displayMessage;
                                this.etiquetaInvalida++;
                                $("#etiquetasInvalidas").text(this.etiquetaInvalida);
                                $("#mensagemErroG").text(this.mensagemErroG);
                                $("#mensagemErroG").show();
                                
                            } else if (error.request) {
                                // A requisição foi feita mas não houve resposta
                                errorMessage = "Erro de rede: Não foi possível conectar com o servidor";
                                displayMessage = `${CodigoBarras} - ${errorMessage}`;
                            } else {
                                // Algo aconteceu na configuração da requisição
                                errorMessage = error.message || "Erro desconhecido";
                                displayMessage = `${CodigoBarras} - ${errorMessage}`;
                            }
                            
                            histLeitura.push(
                                `<li style="color:red;">${displayMessage}</li>`
                            );
                        })
                        .finally(function () {
                            // remove a promessa da array após a execução
                            promises.splice(promessaAtual, 1);
                            // chama a próxima promessa
                            processarProximaPromessa(promessaAtual);
                            $("#historicoLeitura").html(histLeitura);
                        });
                } else {
                    promises.splice(promessaAtual, 1);
                    processarProximaPromessa(promessaAtual);
                }
            }
        }

        // inicia o processamento da primeira promessa
        processarProximaPromessa(0);
    });
}

function triggerArray() {
    let tamanhoAtual = this.requisicoes.length;

    if (
        (tamanhoAtual === triggerArray.tamanhoAnterior && tamanhoAtual > 0) ||
        tamanhoAtual >= 20
    ) {
        requisicoes.forEach(function (request) {
            if (request.data.CodigoBarras != "") {
                promises.push(request);
            }
        });

        if (!this.isProcessing) {
            enviarRequisicoesEmOrdem();
        }

        requisicoes = [];
    }

    triggerArray.tamanhoAnterior = tamanhoAtual;
}

setInterval(triggerArray, 500);
