$("#codbarra").focus();
$("#mensagemErroG").hide();
$("#mensagemSuccessG").hide();
hideMsgs();

var readBarcode = "";
var etiquetaValida = 0;
var etiquetaInvalida = 0;
var etiquetaDuplicada = 0;
var qtdePalete = 0;
var etqConferidas = 0;
var histLeitura = [];
var etiquetasToConf = [];
var codCarga;
var etiquetaValida;
var totalEtiquetas;
var validaentestoque;
var tatalPedidos;
var qtdeTotalEtiquetas = 0;
var url;
var count = 0;
var requisicoes = [];
var promises = [];
var isProcessing = false;
var vars = [],
  hash;

var index = 0;

var hashes = window.location.href
  .slice(window.location.href.indexOf("?") + 1)
  .split("&");

for (var i = 0; i < hashes.length; i++) {
  hash = hashes[i].split("=");
  vars.push(hash[0]);
  vars[hash[0]] = hash[1];
}
vars;

codCarga = vars.carga;
etiquetaValida = vars.totconf;
totalEtiquetas = vars.totetiquetas;
qtdeTotalEtiquetas = vars.totetiquetas;
validaentestoque = vars.validarentrada;
tatalPedidos = vars.totaletqpedido;

$("#etiquetasToConf").text(qtdeTotalEtiquetas);
$("#etiquetasValidas").text(etiquetaValida);
$("#codCarga").text(`${codCarga} ${decodeURI(vars.desccarga)}`);
$("#nroPedido").text(vars.pedido);
$("#nomeImp").text(decodeURI(vars.nomeimp));
$("#descEtiqueta").text(decodeURI(vars.descetiq));

url = `${vars.urlApi}rest/pprcleretiquetacargacomimpressaorest`;
urlNode = `${vars.urlNodeService}queue`;
urlFinalizacao = `${vars.urlApi}rest/pprcFinalizaConferenciaRest`;

function hideMsgs() {
  $("#responseDanger").hide();
  $("#responseSuccess").hide();
  $("#responseAlert").hide();
}

function lostInputFocus() {
  var validLostInput = $("#codbarra").val();
  if (validLostInput != "" && validLostInput != null) {
    $("#button").click();
    $("#codbarra").focus();
  }
}

$("#estorna").click(() => {
  $("#codbarra").focus();
});

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

$("#finalizaConferencia").click(() => {
  finalizaConferencia();
});

$("button").click(async function (e) {
  hideMsgs();
  readBarcode = $("#codbarra").val().trim();
  let estorna = $("#estorna").is(":checked");
  let jaLida = false;

  if (!estorna) {
    etiquetasToConf.forEach((value) => {
      if (value == readBarcode) {
        jaLida = true;
        return;
      }
    });
  }

  if (readBarcode != "" && !jaLida) {
    if (!estorna) {
      etiquetasToConf.push(readBarcode);
    }

    var parm = new Object();
    parm.CodigoBarras = readBarcode.trim();
    parm.CargaId = vars.carga;
    parm.ModeloEtiquetaId = vars.etiqueta;
    parm.ImpressoraId = vars.imp;
    parm.PedidoId = vars.pedido;
    parm.Estornar = estorna ? 1 : 0;
    parm.isConfEstoque = validaentestoque == "true";
    parm.UsuarioId = vars.user;
    parm.UsuarioLogin = vars.username;
    parm.reqURL = url;

    let json = new Object();
    json.json = parm;

    requisicoes.push({
      url: urlNode,
      method: "POST",
      data: json,
    });

    console.log("Codigo Barras: " + readBarcode);
  } else {
    $("#alertText").text("Favor, informar um código de etiqueta");
    $("#responseAlert").show();
    if (jaLida) {
      etiquetaDuplicada++;
      $("#etiqeutasDuplicadas").text(etiquetaDuplicada);
      histLeitura.push(
        `<li style="color:red;">${readBarcode} - Leitura duplicada</li>`
      );
    }
  }

  $("#codbarra").val("");
  $("#codbarra").focus();
  $("#historicoLeitura").html(histLeitura);

  if (count >= histLeitura.length) {
    $("#responseAlert").hide();
  }

  if (readBarcode != null) {
    count++;
  }
});

function finalizaConferencia() {
  $.LoadingOverlay("show", {
    fontawesome: "fas fa-box-check",
    fontawesomeColor: "#273A6E",
  });

  $("#loadingindicator").LoadingOverlay("show");

  var parmFinalizacao = new Object();
  var jsonFinalizacao = new Object();
  parmFinalizacao.CargaId = this.vars.carga;
  parmFinalizacao.NomeConferente = this.vars.username;
  parmFinalizacao.reqURL = this.urlFinalizacao;
  jsonFinalizacao.json = parmFinalizacao;

  $.ajax({
    url: urlNode,
    method: "POST",
    dataType: "json",
    contentType: "application/json;charset=UTF-8",
    data: JSON.stringify(jsonFinalizacao),
    beforeSend: function () {},
  })
    .done(function (msg) {
      if (msg.isError) {
        $("#mensagemErroG").text(`Erro: ${msg.message}`);
        $("#mensagemErroG").show();
      } else {
        $("#mensagemSuccessG").text(`Conferência finalizada com sucesso!`);
        $("#mensagemSuccessG").show();
      }
    })
    .fail(function (jqXHR, textStatus, msg) {
      $("#mensagemErroG").text(
        `Ocorreu um erro ao finalizar a conferência (${msg})`
      );
      $("#mensagemErroG").show();
    });

  $.LoadingOverlay("hide");
  $("#loadingindicator").LoadingOverlay("hide");
}

function enviarRequisicoesEmOrdem() {
  let CodigoBarras;
  this.isProcessing = true;
  return new Promise((resolve, reject) => {
    function processarProximaPromessa(promessaAtual) {
      if (promises.length === 0) {
        console.log("zerou");
        this.isProcessing = false;
      }

      if (promises[promessaAtual] != null) {
        CodigoBarras = promises[promessaAtual].data.json.CodigoBarras;

        if (CodigoBarras != processarProximaPromessa.lastCodBarras) {
          processarProximaPromessa.lastCodBarras = CodigoBarras;
          const promessa = () => axios(promises[promessaAtual]);
          promessa()
            .then(function (result) {
              if (result.data.MensagemErro == "") {
                this.etiquetaValida++;
                this.etqConferidas++;
                this.qtdePalete++;
                this.totalEtiquetas = this.totalEtiquetas - 1;
                $("#etiquetasToConf").text(this.totalEtiquetas);
                $("#mensagemErroG").hide();
                $("#mensagemSuccessG").hide();
                $("#qtdePalete").text(this.qtdePalete);
                $("#etiquetasValidas").text(this.etiquetaValida);
                this.histLeitura.push(
                  `<li style="color:#041A56;">${result.data.Mensagem}</li>`
                );
                if (totalEtiquetas == 0) {
                  finalizaConferencia();
                }
              } else {
                this.histLeitura.push(
                  `<li style="color:red;">${result.data.MensagemErro}</li>`
                );
                this.etiquetaInvalida++;
                $("#etiquetasInvalidas").text(this.etiquetaInvalida);
                $("#mensagemErroG").text(`${result.data.MensagemErro}`);
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
          console.log("---------------Entrou no else");
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
      if (request.data.json.CodigoBarras != "") {
        promises.push(request);
      }
    });

    if (!this.isProcessing) {
      console.log("Chamando processamento");
      enviarRequisicoesEmOrdem();
    } else {
      console.log("já processando!");
    }

    requisicoes = [];
  }

  triggerArray.tamanhoAnterior = tamanhoAtual;
}

setInterval(triggerArray, 1500);
