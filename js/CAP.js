function ops_cap(data) {
    if (data.en_t == true) {
        str = data.env + 'opacity:'+data.op;
    } else {
        str = 'opacity:'+data.op;
    }
    return {
        layers: data.layer,
        format:'image/png',
        transparent: true,
        CQL_FILTER: data.cql,
        env: str,
        zIndex: data.z,
        maxZoom: 19,
    }
}

function opacity_c(id, op) {
    op = document.getElementById(id+'_o').value;
    cap_opts[id]['env']='opacity:'+op.toString()+';'
    cap_layers[id].setParams(cap_opts[id])
}

function opacity_cap(id, op) {
    data = cap_data[id]
    op = document.getElementById(id+'_o').value;
    cap_opts[id]['env'] = data.env + 'opacity:' + op.toString()+';'
    cap_layers[id].setParams(cap_opts[id])
}


function activate_sub(id) {
    data = cap_data[id]
    ck = document.getElementById(id+'_s');
    if (ck.checked){
        cap_data[id]['sub'] = true
        subcuenca = L.nonTiledLayer.wms(data.url, {
            layers : 'AMZ_CAP_PER_EWS_SubCuencas_Ply',
            cql : data.cql,
            format:'image/png',
            transparent: true,
            zIndex: 154
        }).addTo(map)        
    } else {
        map.removeLayer(subcuenca)
        cap_data[id]['sub'] = false
    }
}

function activate_cap(id) {
    checkBox = document.getElementById(id);
    if (checkBox.checked == true){
        cap_layers[id].addTo(map)
    } else {
      map.removeLayer(cap_layers[id])
      if (cap_data[id]['sub']){
        map.removeLayer(subcuenca)
        cap_data[id]['sub'] = false
        ck = document.getElementById(id+'_s');
        ck.checked = false
      }
    }
}



var cap_data = {
    'CUE' :{
        url : 'http://spm.senamhi.gob.pe:8080/geoserver/ARCC/wms',
        layer : 'AMZ_CAP_PER_EWS_LimiteCuencas_Ply',
        cql : '1=1',
        st : '',
        op : 0.5,
        z : 153,
        sub : false,
    },
    'PDB' :{
        url : 'http://spm.senamhi.gob.pe:8080/geoserver/ARCC/wms',
        layer : 'AMZ_CAP_PER_EWS_AreaPobDirecAfectada_Ply',
        cql : '1=1',
        st : '',
        op : 0.5,
        z : 156,
        en_t: true,
        env: 'color:FF0000;fill:FF0000;',
    },
    'ASD' :{
        url : 'http://spm.senamhi.gob.pe:8080/geoserver/ARCC/wms',
        layer : 'AMZ_CAP_PER_EWS_AreaInfluenciaDirecSocial_Ply',
        cql : '1=1',
        st : '',
        op : 0.5,
        z : 155,
        en_t: true,
        env: 'color:AAAAAA;fill:AAAAAA;',
    },
   
}

var cap_layers = new Array();
var cap_opts = new Array();

lys = Object.keys(cap_data)
for (var i = 0; i < lys.length; i++) {
    id = lys[i]
    data = cap_data[id]
    cap_opts[id] = ops_cap(data)
    cap_layers[id] = L.nonTiledLayer.wms(data.url, cap_opts[id])
}

