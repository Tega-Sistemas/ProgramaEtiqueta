$("#mensagemErroG").hide();
hideMsgs();

//Variáveis para processamento em fila
var requisicoes = [];
var promises = [];
var isProcessing = false;
//------------------------------------

var count = 0;
var etiquetaValida = 0;
var etiquetaInvalida = 0;
var etiquetaDuplicada = 0;
var url;
var histLeitura = [];
var etiquetasToConf = [];
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

var descCarga = vars.descricao;
var totalEtiquetas = vars.totaletiqueta - vars.etiquetaconferida;
$("#etiquetasValidas").text(etiquetaValida);
$("#SetorDescricao").text(` ${decodeURI(vars.setordescricao)}`);

url = `${vars.urlapi}rest/pprcConferenciaEtiquetaFaseProd`;
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

function lostInputFocusEquipamento() {
    var validLostInput = $("#codequipamento").val();
    let readBarcode = $("#codbarra").val();
    if (
        validLostInput.trim() != "" &&
        validLostInput != null &&
        validLostInput != 0
    ) {
        $("#codbarra").focus();
        $("#mensagemErroG").hide();
    } else {
        $("#codequipamento").focus();
        if (readBarcode != null && readBarcode != "") {
            $("#mensagemErroG").text(
                "Informe um código válido de equipamento!"
            );
            $("#mensagemErroG").show();
        }
    }
}

$(document).ready(function () {
    $("#codequipamento").focus();

    $("#clearPage").click(function () {
        document.location.reload(true);
    });

    $(document).keypress(function (e) {
        if (e.which == 13) {
            $("#button").focus();
        }
    });

    $("button").click(function (e) {
        hideMsgs();
        var readBarcode = $("#codbarra").val();
        if (readBarcode != "") {
            var parm = new Object();
            parm.SetorId = vars.setorid;
            parm.LicencaId = vars.licencaid;
            parm.EquipamentoId = $("#codequipamento").val();
            parm.UsuarioLogin = vars.usuariologin;
            parm.CodigoBarras = readBarcode.trim();

            requisicoes.push({
                url: url,
                method: "POST",
                data: parm,
            });

            etiquetasToConf.push(readBarcode);
            
        } else {
            $("#alertText").text("Favor, informar um código de etiqueta");
            $("#responseAlert").show();
        }
        $("#codbarra").val("");
        $("#codequipamento").val("");
        $("#codequipamento").focus();
        $("#historicoLeitura").html(histLeitura);
        if (count >= histLeitura.length) {
            $("#responseAlert").hide();
        } else {
            $("#alertText").text("Processando, favor não fechar a página");
            $("#responseAlert").show();
        }
        if (readBarcode != null) {
            count++;
            ("");
        }
    });
});

function triggerArray() {

    let tamanhoAtual = this.requisicoes.length;

    if (
        (tamanhoAtual === triggerArray.tamanhoAnterior && tamanhoAtual > 0) ||
        tamanhoAtual >= 20
    ) {
        requisicoes.forEach(function (request) {
            request
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
                    const promessa = () => axios(promises[promessaAtual]);
                    promessa()
                        .then(function (result) {
                            if (result.data.MensagemErro == "") {
                                $("#mensagemErroG").hide();
                                histLeitura.push(
                                    `<li style="color:#041A56;">${result.data.Mensagem} </li>`
                                );
                                etiquetaValida++;

                                /* * Diminui a quantidade total de etiquetas conforme a carga é lida */
                                totalEtiquetas--;
                                $("#etiquetasToConf").text(totalEtiquetas);
                                $("#etiquetasValidas").text(etiquetaValida);
                            } else {
                                verifyReturn(result.data.Mensagem);
                                if (CodigoBarras != "")
                                    histLeitura.push(
                                        `<li style="color:red;">${CodigoBarras} - ${result.data.MensagemErro}</li>`
                                    );
                                mensagemErroG = `${CodigoBarras} - ${result.data.MensagemErro}`;
                                etiquetaInvalida++;
                                $("#etiquetasInvalidas").text(etiquetaInvalida);
                                $("#mensagemErroG").text(mensagemErroG);
                                $("#mensagemErroG").show();
                            }
                        })
                        .catch(function (error) {
                            histLeitura.push(
                                `<li style="color:red;"> Ocorreu um erro inesperado. ${JSON.stringify(
                                    error
                                )}</li>`
                            );

                            reject(error);
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

setInterval(triggerArray, 1500);
