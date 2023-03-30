/* global L */
/* *************************************************************************************************************************** */
/* ************************************************** Definiendo Basemaps  *************************************************** */
var basemaps = {
    "OpenStreetMaps":L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    {
      minZoom: 2,
      maxZoom: 19,
      id: "osm.streets"
    }
    ),
    "Google-Map": L.tileLayer("https://mt1.google.com/vt/lyrs=r&x={x}&y={y}&z={z}",
    {
      minZoom: 2,
      maxZoom: 19,
      id: "google.street"
    }
    ),
    "Google-Satellite": L.tileLayer("https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}",
    {
      minZoom: 2,
      maxZoom: 19,
      id: "google.satellite"
    }
    ),
    "Google-Hybrid": L.tileLayer("https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}",
    {
      minZoom: 2,
      maxZoom: 19,
      id: "google.hybrid"
    }
    )
};
/* *************************************************************************************************************************** */
/* ************************************************** Iniciando Mapa   ******************************************************* */
// Definiendo contol
  var overlays = {};
  var mapOptions = {
    fullscreenControl:true,
    fullscreenControlOptions: {position: 'topright'},
    attributionControl: false,
    center: [-5.2, -80.5],
    zoom: 10,
    layers: [basemaps['Google-Satellite']],
    maxZoom : 19,
  };
  var map = L.map("map", mapOptions);
  
/* *************************************************************************************************************************** */
/* *************************************** Agregando Sidebar con Control Layer  ********************************************** */  
  var sidebar = L.control.sidebar({
    autopan: false,
    container: "sidebar",
    position: "left"
  }).addTo(map)
  .open('home');
  
  //Render Layer Control & Move to Sidebar
  var layerControl = L.control.layers(basemaps,overlays,
    {
      position: "topleft",
      collapsed: false
    }).addTo(map);
  
  var oldLayerControl = layerControl.getContainer();
  var newLayerControl = $("#layercontrol");
  newLayerControl.append(oldLayerControl);
  
  $(".leaflet-control-layers-list").prepend("<strong class='title'>Mapas Base</strong><br>");
  $(".leaflet-control-layers-list").after("<hr style='height: 0; border-top: 2px solid #ddd; margin: 15px -10px 0px -6px;'/>");
/* *************************************************************************************************************************** */
/* *************************************************************************************************************************** */

// Funcion para crear la tabla popup del componente 02
var cc;
function gen_table (d) {
  var tab = '<table class="table table-bordered border-dark">'
  for (var i = 0; i < cc.length; i++) {
    id = cc[i]
    if (d[id]) {
      data = d[id]
      // cambios a montos en texto
      if ( id == 'Costo_Equipos' || id == 'Costo_de_Liberación' ) {
        data = d[id].toLocaleString('en-US', { style: 'currency', currency: 'PEN' })
      } else if ( id == 'Costo' ) {
        tmp = parseFloat(d[id])
        data = tmp.toLocaleString('en-US', { style: 'currency', currency: 'PEN' })
      }
      if (typeof data == "string") {
        sp = data.replaceAll('\n','</br>')
      } else {
        sp = data
      }
      tab += '<tr><td><b>' + id.replaceAll('_',' ') + '</b></td><td style="text-align: justify">'+ sp + '</td></tr>';
    }
  }
  tab += '</table>';
  return tab
}

// Función para los iconos del C02
function Icons (f, latlng) {
  if (f.properties.Mantiene != 3) {
    st = f.properties.Nombre_del_Sensor
    let myIcon = L.icon({
      iconUrl: './img/'+st.replaceAll('/', '-')+'.svg',
      iconSize:     [20, 20],
      iconAnchor:   [10, 10],
    })
    return L.marker(latlng, { icon: myIcon }).bindPopup(gen_table(f['properties']), {maxWidth:850})
  }
}

// funcion para activar y desactivar
function activate_pts(id) {
  var checkBox = document.getElementById(id);
  if (checkBox.checked == true){
    add_pts(id, pts_data[id])
    if (pts_data[id]['st_t'] == 1){
      activate_Telemetria(id)
    }
    if (pts_data[id]['st_c']){
      add_cobertura(id)
    }
   } else {
    map.removeLayer(pts_layer[id])
    map.removeLayer(ptslb_layer[id])
    if (pts_data[id]['st_t'] == 1){
      id_c = 'T'+id.slice(-2)
      check_tl = document.getElementById(id_c);
      check_tl.checked = false
      pts_data[id]['st_t'] = 0
      map.removeLayer(TL_layers[id])
    }
    if (pts_data[id]['st_c']){
      id_c = id + '_c'
      check_tl = document.getElementById(id_c);
      check_tl.checked = false
      pts_data[id]['st_c'] = false
      map.removeLayer(cob_layers[id])
    }
    if (lg == 0){
      map.removeControl(C02_l);
      lg = 1
    } 
  }
}

// funcion para añadir C02
function add_pts(id, layer) {
  wfs_p = {
    service: 'WFS',
    version: '1.0.0',
    request: 'GetFeature',
    typeName: 'ARCC:'+layer.name,
    CQL_FILTER: layer.cql,
    outputFormat: 'application/json'
  }
  params = L.Util.extend(wfs_p);
  lk = layer.ows + L.Util.getParamString(params);
  cc = layer.cc;
  $.ajax({
    url: lk,
    success: function (data) {
      pts_layer[id] = L.geoJson(data, {pointToLayer: Icons}).addTo(map)
    }
  })
  if (layer.lb) {
    ptslb_layer[id] = L.nonTiledLayer.wms(layer.url, {
      layers : layer.name,
      cql : layer.cql,
      format:'image/png',
      transparent: true,
      zIndex: layer.idx
    }).addTo(map);
  }
}

var pts_layer = new Array();
var ptslb_layer = new Array();
var TL_layers = new Array();
var cob_layers = new Array();

cob_layers['RAD'] = L.nonTiledLayer.wms('http://spm.senamhi.gob.pe:8080/geoserver/ARCC/wms', {
  layers : 'MGF_CAP_PER_EWS_CoberturaRadar_Ply',
  cql : 'Codigo=888888',
  format:'image/png',
  transparent: true,
  opacity:0.4,
  zIndex: 102,
}
)

cob_layers['C03'] = L.nonTiledLayer.wms('http://spm.senamhi.gob.pe:8080/geoserver/ARCC/wms', {
  layers : 'ENV_CAP_PER_EWS_CoberturaSirenas_Ply',
  cql : '1=1',
  format:'image/png',
  transparent: true,
  opacity:1,
  zIndex: 102,
}
)

var pts_data = {
  'C02' :{
    //ows : 'http://localhost:8080/geoserver/ows',
    //url : 'http://localhost:8080/geoserver/ARCC/wms', 
    ows : 'http://spm.senamhi.gob.pe:8080/geoserver/ows',
    url : 'http://spm.senamhi.gob.pe:8080/geoserver/wms', 
    name : 'MGF_CAP_PER_EWS_Instrumental_Pt',
    opts : ['EHA','EMA','PLU','HUM','QUE','REP','REC'],
    cc : ['Codigo', 'Cuenca', 'Nombre_Corto', 'Latitud', 'Longitud','Referencia', 'Poseedor', 'Propietario', 'Costo_de_Liberación',
          'Costo_Equipos', 'Model_Site', 'Telemetria_Ficha', 'Transmite_A:', 'Linderos','Sustento'],
    cql : '1=1',
    lb : true,
    idx : 308,
    // info de telemetria
    st_t : 0,
    ids : ['N1', 'N2', 'N3', 'SAT'],
    ct :  ['black', 'blue', 'orange', '#2142e8', 'white'],
    ly : 1 
  },
  'C03' : {
    //ows : 'http://localhost:8080/geoserver/ows',
    //url : 'http://localhost:8080/geoserver/ARCC/wms', 
    ows : 'http://spm.senamhi.gob.pe:8080/geoserver/ows',
    url : 'http://spm.senamhi.gob.pe:8080/geoserver/wms', 
    name : 'MGF_CAP_PER_EWS_Sirenas_Pt',
    opts : ['SIR','UCC'],
    cc : ['Codigo', 'Cuenca', 'Nombre_del_Sensor', 'Nombre_Corto', 'Longitud','Latitud','Nombre_de_la_Institución', 'Transmisión', 'Transmite_A:', 'Canal_primario',
          'Canal_Secundario', 'Intensidad_Señal', 'Azimut', 'Costo'],
    cql : '1=1',
    lb : true,
    idx : 307,
    // info telemetria
    st_t : 0, 
    ids : ['N1', 'N2', 'SAT'],
    ct :  ['black', 'blue', 'orange', '#2142e8', 'white'] ,
  },

  'RAD' : {
    //ows : 'http://localhost:8080/geoserver/ows',
    //url : 'http://localhost:8080/geoserver/ARCC/wms', 
    ows : 'http://spm.senamhi.gob.pe:8080/geoserver/ows',
    url : 'http://spm.senamhi.gob.pe:8080/geoserver/wms', 
    name : 'MGF_CAP_PER_EWS_Radares_Pt',
    opts : ['RAD'],
    cc : ['Codigo', 'Cuenca', 'Componente', 'Nombre_del_Sensor', 'Nombre_Corto',
    'Longitud', 'Latitud', 'Ubicación', 'Proyectos', 'Altura_Torre', 'Costo_de_liberación'],
    cql : '1=1',
    lb : true,
    idx : 309,
    // info cobertura
    st_c : false,
  }
}

/* *************************************************************************************************************************** */
/* *************************************************************************************************************************** */
// Cobertura

function add_cobertura(id) {
  id_c = id + '_c'
  checkBox = document.getElementById(id_c);
  if (checkBox.checked == true) {
    pts_data[id]['st_c'] = true
    check_t = document.getElementById(id)
    if (check_t.checked == true) {
      cob_layers[id].addTo(map)
    }
  } else {
    pts_data[id]['st_c'] = false
    map.removeLayer(cob_layers[id])
  }
}

 // Telemetria
 function popup_telemetria(st, dst) {
  return `<b>${st['Nombre_Corto']} - ${st['Transmite_A:']}:</b><br> La distancia entre puntos es: ${dst} Km`;
}

function activate_Telemetria(id) {
  data = pts_data[id]
  id_c = 'T'+id.slice(-2)
  var checkBox = document.getElementById(id_c);
  if (checkBox.checked == true){
    pts_data[id]['st_t'] = 1
    check_t = document.getElementById(id)
    if (check_t.checked == true) {
      add_Telemetria(id, data)
    }
   } else {
    pts_data[id]['st_t'] = 0
    map.removeLayer(TL_layers[id])
  }
}

function add_Telemetria(id, data) {
  wfs_p = {
    service: 'WFS',
    version: '1.0.0',
    request: 'GetFeature',
    typeName: 'ARCC:' + data.name ,
    CQL_FILTER: data.cql,
    outputFormat: 'application/json'
  }
  params = L.Util.extend(wfs_p);
  lk = data.ows + L.Util.getParamString(params);
  ct = data.ct
  TL_layers[id] = L.layerGroup();

  $.ajax({
    url: lk,
    success: function (data) {
      for (var i = 0; i < data.features.length; i++){
        nm = data.features[i].properties['Transmite_A:']
        mt = data.features[i].properties['Mantiene']
        if (nm != 'Receptora' && mt < 3) {
          xy = data.features[i].geometry.coordinates
          x2 = data.features[i].properties.Lon_R
          y2 = data.features[i].properties.Lat_R
          pt1 = new L.LatLng(xy[1],xy[0])
          pt2 = new L.LatLng(y2, x2)
          cls = data.features[i].properties.RL
          if (cls < 4) {
            dst = (map.distance(pt1,pt2)/1000).toFixed(2).toString()
            var line = new L.Polyline([pt1, pt2], {
              color: ct[cls -1],
              weight: 3,
              opacity: 1,
              smoothFactor:1
            }).bindPopup(popup_telemetria(data.features[i].properties, dst))
            TL_layers[id].addLayer(line)
          } else {
            var marker_s = new L.circleMarker(pt1,{
              fillColor: ct[cls - 1],
              color: ct[cls - 1],
              weight: 1,
              fillOpacity: 0.9,
              radius: 15,
            })
            TL_layers[id].addLayer(marker_s)
          }
          TL_layers[id].addTo(map);
        }
      }
    }
  })
} 

/* *************************************************************************************************************************** */
/* *************************************************************************************************************************** */
let C02_sns = `
<center style="font-size:14px;font-weight:bold;color:black">Componente 2 Instrumental </center>
<ul class="nobull">
  <li> <img src="./img/EHA.svg" height="15"> &nbsp; (EHA) Estación hidrológica automática </li>
  <li> <img src="./img/EMA.svg" height="15"> &nbsp; (EMA) Estación meteorológica automática </li>
  <li> <img src="./img/HUM.svg" height="15"> &nbsp; (HUM) Sensor humedad de suelo </li>
  <li> <img src="./img/PLU.svg" height="15"> &nbsp; (PLU) Estación pluviométrica automática </li>
  <li> <img src="./img/QUE.svg" height="15"> &nbsp; (QUE) Acelerómetro </li>
  <li> <img src="./img/REP.svg" height="18"> &nbsp; (REC|REP) Repetidor/Receptor </li>
  <li> <img src="./img/RAD.svg" height="18"> &nbsp; (RAD) Radar meteorológico </li>
</ul>
`

let C02_r = `
<center style="font-size:14px;font-weight:bold;color:black"> Cobertura de Radar </center>
<ul class="nobull">
  <li> <i class="fa fa-square fa-2x" style="color:#00aa00;"></i>  Objetos visibles a 500m del suelo </li>
  <li> <i class="fa fa-square fa-2x" style="color:#ffff00;"></i>  Objetos visibles a 1000m del suelo </li>
  <li> <i class="fa fa-square fa-2x" style="color:#ff8000;"></i>  Objetos visibles a 2000m del suelo </li>
  <li> <i class="fa fa-square fa-2x" style="color:#ff0000;"></i>  Objetos visibles a 3000m del suelo </li>
</ul>
`

let C02_t = `
<center style="font-size:14px;font-weight:bold;color:black"> Telemetria VHF </center>
<ul class="nobull">
  <li> <i class="fa fa-minus fa-2x" style="color:black;"></i> &nbsp; Estación ----> REC|REP </li>
  <li> <i class="fa fa-minus fa-2x" style="color:orange;"></i> &nbsp; Repetidor ----> Repetidor </li>
  <li> <i class="fa fa-minus fa-2x" style="color:blue;"></i> &nbsp; Repetidor ----> Receptor </li>
</u>
<center style="font-size:14px;font-weight:bold;color:black"> Telemetria Satelital </center>
<ul class="nobull">
  <li> <i class="fa fa-circle fa-lg" style="color:#2142e8;"></i>  &nbsp; INMARSAT </li>
  <li> <i class="fa-regular fa-circle fa-lg" style="color:black;"></i> &nbsp; GOES </li>
</ul>
`


var C03_html = `
<center style="font-size:14px;font-weight:bold;color:black">Componente 3 Instrumental </center>
<ul class="nobull">
  <li> <img src="./img/SIR.svg" height="15"> &nbsp; (SIR) Sirena </li>
  <li> <img src="./img/UCC.svg" height="15"> &nbsp; (UCC) Unidad de centro de control </li>
</ul>
`

let C03_t = `
<center style="font-size:14px;font-weight:bold;color:black"> Telemetria HF </center>
<ul class="nobull">
  <li> <i class="fa fa-minus fa-2x" style="color:black;"></i> &nbsp; Sirena ----> UCC </li>
  <li> <i class="fa fa-minus fa-2x" style="color:blue;"></i> &nbsp; Sirena ----> Sirena </li>
</u>
<center style="font-size:14px;font-weight:bold;color:black"> Telemetria Satelital </center>
<ul class="nobull">
  <li> <i class="fa fa-circle fa-lg" style="color:#2142e8;"></i>  &nbsp; GSM </li>
</ul>
`


var C02_l = L.control({position: 'bottomright'});
C02_l.onAdd = function() {
  div = L.DomUtil.create('div', 'info legend')
  html = C02_sns
  // añadiendo radar
  ck = document.getElementById('T02');
  if (ck.checked){
    html += C02_t
  }
  div.innerHTML = html
  return div
}

var lg = 1
$(document).ready(function() {
    $(".add_legend").click(function(){
      if (lg == 1) {
        C02_l.addTo(map)
        lg = 0
      } else {
        map.removeControl(C02_l);
        lg = 1
      }

    })
})

var RAD_l = L.control({position: 'bottomright'});
RAD_l.onAdd = function() {
  div = L.DomUtil.create('div', 'info legend')
  div.innerHTML = C02_r
  return div
}

var lg_r = 1
$(document).ready(function() {
    $(".add_radar").click(function(){
      if (lg_r == 1) {
        RAD_l.addTo(map)
        lg_r = 0
      } else {
        map.removeControl(RAD_l);
        lg_r = 1
      }

    })
})

var C03_l = L.control({position: 'bottomright'});
C03_l.onAdd = function() {
  div = L.DomUtil.create('div', 'info legend')
  html = C03_html
  // añadiendo radar
  ck = document.getElementById('T03');
  if (ck.checked){
    html += C03_t
  }
  div.innerHTML = html
  return div
}

var lg_s = 1
$(document).ready(function() {
    $(".add_sir").click(function(){
      if (lg_s == 1) {
        C03_l.addTo(map)
        lg_s = 0
      } else {
        map.removeControl(C03_l);
        lg_s = 1
      }

    })
})