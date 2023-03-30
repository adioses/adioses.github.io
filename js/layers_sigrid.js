function sigrid_layer(id, data) {
    return `
    <div class="grid-layout">
        <div class="caja head">
            ${data.label}
        </div>
        <div class="caja check">
            <div class="form-check form-switch">
                <input class="form-check-input" type="checkbox" id="${id}" ${data.st} onclick=activate_sigrid("${id}")>
            </div>
        </div>
        <div class="caja slide">
            <input type="range" class="form-range" min="0" max="1" step="0.1" value="${data.op}" onchange=opacity_s("${id}",this.value)>
        </div>
    </div>
    `;
}

function opacity_s(id, op) {
    layers_sigrid[id].setOpacity(op)
}

function opts_sigrid(data) {
    return {
        url : data.url,
        layers: [data.layer],
        format:'png32',
        f: 'image',
        pane: 'SIGRID',
        transparent: true,
        useCors : false,
        opacity: data.op,
        zIndex: data.z,
        maxZoom: 19,
    }
}

function sigrid_add(id, data) {
    sigrid_opt[id] = opts_sigrid(data) // generando opciones
    layers_sigrid[id] = L.esri.dynamicMapLayer(sigrid_opt[id])
    if (data.st == 'checked') {
        layers_sigrid[id].addTo(map)
    }
    $("#SigridLayers").append(sigrid_layer(id, data));
}

function activate_sigrid(id) {
    var checkBox = document.getElementById(id);
    if (checkBox.checked == true){
        layers_sigrid[id].addTo(map)
    } else {
      map.removeLayer(layers_sigrid[id])
    }
}

/* *************************************************************************************************************************** */
/* *************************************************************************************************************************** */
var cs = 3
$(document).ready(function() {
    $(".add_nsigrid").click(function(){
      id = 'SSG'+('00' + cs).slice(-2);
      layers_sigrid[id] = {
        url : 'http://sigrid.cenepred.gob.pe/arcgis/rest/services/' + document.getElementById('f_grupo').value+ '/MapServer/',
        layer : document.getElementById('f_cod').value,
        label : document.getElementById('f_name').value,
        st : '',
        op : 0.5,
        z : 300 + cs,
      }
      cs += 1
      sigrid_add(id, layers_sigrid[id])
    })
})

$(document).ready(function() {
    $(".tst_nsigrid").click(function(){
        group = document.getElementById('f_grupo').value
        cod = document.getElementById('f_cod').value
        url = 'http://sigrid.cenepred.gob.pe/arcgis/rest/services/'
        lnk = url + group + '/Mapserver/' + cod
        window.open(lnk, '_blank')
        console.log(lnk)
    })
})

$("#SigridLayers").append("<hr style='height: 0; border-top: 1px solid #ddd; margin: 5px -10px 5px -6px;'/>");
/* *************************************************************************************************************************** */
/* *************************************************************************************************************************** */

$('#SigridLayers').append("<strong class='title'> Listado de Capas </strong></br>")

var layers_sigrid = new Array();
var sigrid_opt = new Array();

map.createPane('SIGRID');


var data_sigrid = {
    'SSG01' : {
        url : 'http://sigrid.cenepred.gob.pe/arcgis/rest/services/Cartografia_Peligros/MapServer/',
        layer : 5010502,
        label :'Sucepeptibilidad a Inundaciones',
        st : '',
        op : 0.5,
        z : 120,
    },
    'SSG02' : {
        url : 'http://sigrid.cenepred.gob.pe/arcgis/rest/services/Cartografia_Peligros/MapServer/',
        layer : 5020303,
        label :'Suceptibilidad a Movimientos en Masa',
        st : '',
        op : 0.5,
        z : 121,
    }
}

lys = Object.keys(data_sigrid)
for (var i = 0; i < lys.length; i++) {
    id = lys[i]
    data = data_sigrid[id]
    sigrid_add(id, data)
} 
map.getPane('SIGRID').style.zIndex = 300; 

/* *************************************************************************************************************************** */

$('#SigridLayers').append("<hr style='height: 0; border-top: 1px solid #ddd; margin: 5px -10px 5px -6px;'/>");