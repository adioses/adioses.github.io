var lim_data = {
    'DEP' :{
      //url : 'http://localhost:8080/geoserver/Limites/wms', 
      url : 'http://spm.senamhi.gob.pe:8080/geoserver/Limites/wms', 
      name : 'Departamentos',
      color : 'FFFFFF',
      style : 'Label',
      label: true,
      idx : 310,
      al : 3,
      tl : 20,
    },
    'PRO' :{
        //url : 'http://localhost:8080/geoserver/Limites/wms', 
        url : 'http://spm.senamhi.gob.pe:8080/geoserver/Limites/wms', 
        name : 'Provincias',
        color : 'FCE94F',
        style : 'No_Label_SLD',
        label: true,
        idx : 309,
        al : 2,
        tl : 15,
      },
    'DST' :{
        //url : 'http://localhost:8080/geoserver/Limites/wms', 
        url : 'http://spm.senamhi.gob.pe:8080/geoserver/Limites/wms', 
        name : 'Distritos',
        color : 'AD7FA8',
        style : 'No_Label_SLD',
        label: true,
        idx : 308,
        al : 1,
        tl : 10,
      },
}

var limites = new Array();
var limopts = new Array();

function env(cc,wd,tl){
    st = 'color:' + cc + ';width:' + wd + ';fsize:' + tl + ';'
    return st
}

function opts_lims(data) {
    return {
        layers : data.name,
        styles: data.style,
        env : env(data.color,data.al, data.tl),
        format:'image/png',
        transparent: true,
        zIndex: data.idx,
    }
}

lys = Object.keys(lim_data)
for (var i = 0; i < lys.length; i++) {
    id = lys[i]
    data = lim_data[id]
    limopts[id] = opts_lims(data)
    limites[id] = L.nonTiledLayer.wms(data.url, limopts[id])
}

function activate_label(id) {
    var checkBox = document.getElementById(id+'_l');
    if (checkBox.checked == true){
        limopts[id]['styles']='Label'
        limites[id].setParams(limopts[id])
    } else {
        limopts[id]['styles']='No_Label_SLD'
        limites[id].setParams(limopts[id])
    }
}

function change_width(id) {
    data =  lim_data[id]
    cc = document.getElementById(id+'_wd').value;
    str = env(data.color,cc, data.tl)
    limopts[id]['env'] = str,
    limites[id].setParams(limopts[id])
    lim_data[id]['al'] = cc
}

function change_fsize(id) {
    data =  lim_data[id]
    cc = document.getElementById(id+'_fs').value;
    str = env(data.color, data.al, cc)
    limopts[id]['env'] = str,
    limites[id].setParams(limopts[id])
    lim_data[id]['tl'] = cc
}

function change_color(id) {
    data =  lim_data[id]
    cc = document.getElementById(id+'_cc').value;
    str = env(cc.substring(1), data.al, data.tl)
    limopts[id]['env'] = str,
    limites[id].setParams(limopts[id])
    lim_data[id]['color'] = cc.substring(1)
}

function activate_lims(id) {
    var checkBox = document.getElementById(id);
    if (checkBox.checked == true){
        limites[id].addTo(map)
    } else {
      map.removeLayer(limites[id])
    }
}



