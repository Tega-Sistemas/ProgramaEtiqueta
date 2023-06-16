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
var etiquetaValida;
var totalEtiquetas;
var validaentestoque;
var tatalPedidos;
var qtdeTotalEtiquetas = 0;
var url;
var count = 0;
var requisicoes = [];
var promises = [];
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

etiquetaValida = vars.totconferido;
totalEtiquetas = vars.totconferir;
qtdeTotalEtiquetas = vars.totconferir;
validaentestoque = vars.validarentrada;

$("#etiquetasToConf").text(qtdeTotalEtiquetas);
$("#etiquetasValidas").text(etiquetaValida);
$("#codCarga").text(`${vars.romaneionro} ${decodeURI(vars.romaneiodesc)}`);

url = `${vars.url}rest/setConferenciaEtiquetaRomaneio`;

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

    console.log("Codigo Barras: " + readBarcode);

    var parm = new Object();
    parm.UsuarioId = vars.user;
    parm.RomaneioId = vars.romaneioid;
    parm.CodigoBarras = readBarcode.trim();
    parm.LicencaId = vars.licenca;
    parm.Estorno = estorna ? 1 : 0;

    requisicoes.push({
      url: url,
      method: "POST",
      data: parm,
    });
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

function enviarRequisicoesEmOrdem() {
  return new Promise((resolve, reject) => {
    function processarProximaPromessa(promessaAtual) {
      if (promessaAtual >= promises.length) {
        // todas as promessas foram processadas
        resolve();
        return;
      }

      const promessa = promises[promessaAtual];
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
        promises.push(() => axios(request));
      }
    });

    enviarRequisicoesEmOrdem();

    requisicoes = [];
  }

  triggerArray.tamanhoAnterior = tamanhoAtual;
}

setInterval(triggerArray, 1500);
