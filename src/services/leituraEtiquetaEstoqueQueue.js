var count = 0;
var etiquetaValida = 0;
var etiquetaInvalida = 0;
var readed = false;
var url;
var urlNode;

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

url = `${vars.urlApi}/rest/pprcSetEtiquetaConferenciaEstoque`;
urlNode = `${vars.urlNodeService}queue`;

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
    /*if (validLostInput != "" && validLostInput != null) {
        $("#button").click();
        $("#codbarra").focus();
    }*/

    $("#button").click();
    $("#codbarra").focus();
}
$(document).ready(function () {
    $("#codbarra").focus();

    $("#clearPage").click(function () {
        document.location.reload(true);
    });
    $(document).keypress(function (e) {
        if (e.which == 13) {
            $("#button").focus();
        }
    });

    $("button").click(function (e) {
        $("#responseDanger").hide();
        $("#responseSuccess").hide();
        var readBarcode = $("#codbarra").val();
        if (readBarcode != "") {
            let parm = new Object();
            let json = new Object();

            parm.UsuarioId = vars.user;
            parm.LocalEstoqueId = vars.local;
            parm.CodigoBarras = readBarcode.trim();
            parm.NroPalete = 0;
            parm.reqURL = url;

            json.json = parm;

            $.ajax({
                url: urlNode,
                method: "POST",
                dataType: "json",
                contentType: "application/json;charset=UTF-8",
                data: JSON.stringify(json),
                beforeSend: function () {
                    $("#alertText").text("Processando...");
                    $("#responseAlert").show();
                },
            })
                .done(function (msg) {
                    if (msg.MensagemErro == "") {
                        msg.Mensagem = `${readBarcode.trim()}-${
                            msg.ProdutoCodigo
                        } ${msg.ProdutoDescricao} ${msg.RevestimentoDescricao}`;
                        histLeitura.push(
                            `<li style="color:#041A56;">${msg.Mensagem}</li>`
                        );
                        etiquetaValida++;
                        $("#etiquetasValidas").text(etiquetaValida);
                    } else {
                        verifyReturn(msg.MensagemErro);
                        if (readBarcode != "")
                            histLeitura.push(
                                `<li style="color:red;">${readBarcode} - ${msg.MensagemErro}</li>`
                            );
                        etiquetaInvalida++;
                        $("#etiquetasInvalidas").text(etiquetaInvalida);
                    }
                    $("#codbarra").focus();
                    $("#historicoLeitura").html(histLeitura);
                })
                .fail(function (jqXHR, textStatus, msg) {
                    $("#dangerText").text(msg.MensagemErro);
                    $("#responseDanger").show();
                });
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
});
