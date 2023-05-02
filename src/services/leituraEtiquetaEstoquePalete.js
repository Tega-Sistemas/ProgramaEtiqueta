var count = 0;
var etiquetaValida = 0;
var etiquetaInvalida = 0;
var readed = false;
var url;
var urlNode;
var NroPalete = 0;
var LoteProducao = 0;

$("#responseDanger").hide();
$("#responseSuccess").hide();
$("#responseAlert").hide();
var histLeitura = [];
var histEtiquetaSuccess;
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

url = `${vars.urlApi}/rest/pprcEtiquetaEntEstoqueLoteNewRest`;
urlNode = `${vars.urlNodeService}queue`;

NroPalete = parseInt(decodeURI(vars.NroPalete));
LoteProducao = parseInt(decodeURI(vars.LoteProducao));
$("#nroLote").text(LoteProducao);

$("#addPalete").text(NroPalete);

function verifyReturn(msg) {
  switch (msg) {
    case "Etiqueta Inválida":
      $("#responseDanger").show();
      $("#dangerText").text("Etiqueta inválida, favor verificar os dados");
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

$(document).ready(function () {
  $("#clearPage").click(function () {
    document.location.reload(true);
  });
  $(document).keypress(function (e) {
    if (e.which == 13) {
      $("#button").focus();
    }
  });

  $("#trocarPalete").click(function (e) {
    NroPalete++;
    $("#addPalete").text(NroPalete);
  });

  $("button").click(function (e) {
    $("#responseDanger").hide();
    $("#responseSuccess").hide();
    var readBarcode = $("#codbarra").val();

    if (
      readBarcode != "" &&
      LoteProducao === parseInt(readBarcode.slice(0, 6))
    ) {
      let parm = new Object();
      let json = new Object();
      parm.UsuarioId = vars.user;
      parm.LocalEstoqueId = vars.local;
      parm.CodigoBarras = readBarcode.trim();
      parm.NroPalete = NroPalete;
      parm.reqURL = url;
      json.json = parm;

      $.ajax({
        url: urlNode,
        method: "POST",
        dataType: "json",
        contentType: "application/json;charset=UTF-8",
        data: JSON.stringify(json),
        beforeSend: function () {
          // $("#alertText").text("Processando...");
          // $("#responseAlert").show();
        },
      })
        .done(function (msg) {
          $("#responseAlert").hide();
          tratarRetorno(msg, parm);
        })
        .fail(function (jqXHR, textStatus, msg) {
          $("#dangerText").text(msg.MensagemErro);
          $("#responseDanger").show();
        });
    } else {
      if (readBarcode != "") {
        if (LoteProducao !== parseInt(readBarcode.slice(0, 6))) {
          $("#alertText").text(
            "Etiqueta não é do lote de produção selecionado"
          );
        } else {
          $("#alertText").text("Favor, informar um código de etiqueta");
        }
        $("#responseAlert").show();
      }
    }
    $("#codbarra").val("");
    $("#codbarra").focus();
    $("#historicoLeitura").html(histLeitura);
    // if (count > histLeitura.length) {
    //   $("#responseAlert").hide();
    // } else {
    //   $("#alertText").text("Processando, favor não fechar a página");
    //   $("#responseAlert").show();
    // }
    if (readBarcode != null) {
      count++;
    }
  });
});

function tratarRetorno(msg, json) {
  if (msg.Msg1 == "") {
    let Mensagem = `${json["CodigoBarras"]}-${msg.ProdutoCodigo} ${msg.ProdutoDescricao} ${msg.RevestimentoDescricao}`;
    histLeitura.push(`<li style="color:#041A56;">${Mensagem}</li>`);
    etiquetaValida++;
    $("#etiquetasValidas").text(this.etiquetaValida);
  } else {
    verifyReturn(msg.Msg1);
    if (json["CodigoBarras"] != "")
      histLeitura.push(
        `<li style="color:red;">${json["CodigoBarras"]} - ${msg.Msg1}</li>`
      );
    this.etiquetaInvalida++;
    $("#etiquetasInvalidas").text(this.etiquetaInvalida);
  }
  $("#codbarra").focus();
  $("#historicoLeitura").html(this.histLeitura);
}

function getCookie(nomeDoCookie) {
  var name = nomeDoCookie + "=";
  var decodedCookie = decodeURIComponent(document.cookie);
  var ca = decodedCookie.split(";");
  for (var i = 0; i < ca.length; i++) {
    var c = ca[i];
    while (c.charAt(0) == " ") {
      c = c.substring(1);
    }
    if (c.indexOf(name) == 0) {
      return c.substring(name.length, c.length);
    }
  }
  return "";
}
