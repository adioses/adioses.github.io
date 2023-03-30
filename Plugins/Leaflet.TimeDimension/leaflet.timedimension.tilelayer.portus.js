/*
 * L.TimeDimension.Layer.TileLayer.Portus: TimeDimension TileLayer for Portus.
 */

L.TimeDimension.Layer.TileLayer = L.TimeDimension.Layer.extend({});

L.timeDimension.layer.tileLayer = function(layer, options) {
    return new L.TimeDimension.Layer.TileLayer(layer, options);
};

L.TimeDimension.Layer.TileLayer.Portus = L.TimeDimension.Layer.TileLayer.extend({

    initialize: function(layer, options) {
        L.TimeDimension.Layer.TileLayer.prototype.initialize.call(this, layer, options);
        this._layers = {};
        this._defaultTime = 0;
        this._availableTimes = [];
        this._timeCacheBackward = this.options.cacheBackward || this.options.cache || 0;
        this._timeCacheForward = this.options.cacheForward || this.options.cache || 0;

        this._baseLayer.on('load', (function() {
            this._baseLayer.setLoaded(true);
            this.fire('timeload', {
                time: this._defaultTime
            });
        }).bind(this));
    },

    eachLayer: function(method, context) {
        for (var prop in this._layers) {
            if (this._layers.hasOwnProperty(prop)) {
                method.call(context, this._layers[prop]);
            }
        }
        return L.TimeDimension.Layer.TileLayer.prototype.eachLayer.call(this, method, context);
    },

    _onNewTimeLoading: function(ev) {
        var layer = this._getLayerForTime(ev.time);
        if (!this._map.hasLayer(layer)) {
            this._map.addLayer(layer);
        }
    },

    isReady: function(time) {
        var layer = this._getLayerForTime(time);
        var currentZoom = this._map.getZoom();
        if (layer.options.minZoom && currentZoom < layer.options.minZoom){
            return true;
        }
        if (layer.options.maxZoom && currentZoom > layer.options.maxZoom){
            return true;
        }
        return layer.isLoaded();
    },

    _update: function() {
        if (!this._map)
            return;
        var time = this._timeDimension.getCurrentTime();
        // It will get the layer for this time (create or get)
        // Then, the layer will be loaded if necessary, adding it to the map (and show it after loading).
        // If it already on the map (but probably hidden), it will be shown
        var layer = this._getLayerForTime(time);
        if (this._currentLayer == null) {
            this._currentLayer = layer;
        }
        if (!this._map.hasLayer(layer)) {
            this._map.addLayer(layer);
        } else {
            this._showLayer(layer, time);
        }
    },

    setOpacity: function(opacity) {
        L.TimeDimension.Layer.TileLayer.prototype.setOpacity.apply(this, arguments);
        // apply to all preloaded caches
        for (var prop in this._layers) {
            if (this._layers.hasOwnProperty(prop) && this._layers[prop].setOpacity) {
                this._layers[prop].setOpacity(opacity);
            }
        }
    },
    
    setZIndex: function(zIndex){
        L.TimeDimension.Layer.TileLayer.prototype.setZIndex.apply(this, arguments);
        // apply to all preloaded caches
        for (var prop in this._layers) {
            if (this._layers.hasOwnProperty(prop) && this._layers[prop].setZIndex) {
                this._layers[prop].setZIndex(zIndex);
            }
        }
    },
    /*  Funcion Para  obtener color del pixel */
    getColor: function(latlng) {
        if (this._baseLayer.options.hasOwnProperty('maxNativeZoom')) {
            zf = this._baseLayer.options.maxNativeZoom;
        } else {
            zf = 18;
        }
        var size = this._currentLayer.getTileSize();
        if (this._currentLayer._tileZoom <= zf) {
            var point = this._map.project(latlng, this._currentLayer._tileZoom).floor();
            var coords = point.unscaleBy(size).floor();
            var offset = point.subtract(coords.scaleBy(size));
            coords.z = this._currentLayer._tileZoom;
        } else {
            var point = this._map.project(latlng, zf).floor();
            var coords = point.unscaleBy(size).floor();
            var offset = point.subtract(coords.scaleBy(size));
            coords.z = 7;
        }
        var tile = this._currentLayer._tiles[this._currentLayer._tileCoordsToKey(coords)];
        if (!tile || !tile.loaded) return null;
        try {
          var canvas = document.createElement("canvas");
          canvas.width = 1;
          canvas.height = 1;
          var context = canvas.getContext('2d');
          context.drawImage(tile.el, -offset.x, -offset.y, size.x, size.y);
          return context.getImageData(0, 0, 1, 1).data;
        } catch (e) {
          return null;
        }
    },
    /*  Fin de la modificacion */
    _unvalidateCache: function() {
        var time = this._timeDimension.getCurrentTime();
        for (var prop in this._layers) {
            if (time != prop && this._layers.hasOwnProperty(prop)) {
                this._layers[prop].setLoaded(false); // mark it as unloaded
                this._layers[prop].redraw();
            }
        }
    },

    _evictCachedTimes: function(keepforward, keepbackward) {
        // Cache management
        var times = this._getLoadedTimes();
        var strTime = String(this._currentTime);
        var index = times.indexOf(strTime);
        var remove = [];
        // remove times before current time
        if (keepbackward > -1) {
            var objectsToRemove = index - keepbackward;
            if (objectsToRemove > 0) {
                remove = times.splice(0, objectsToRemove);
                this._removeLayers(remove);
            }
        }
        if (keepforward > -1) {
            index = times.indexOf(strTime);
            var objectsToRemove = times.length - index - keepforward - 1;
            if (objectsToRemove > 0) {
                remove = times.splice(index + keepforward + 1, objectsToRemove);
                this._removeLayers(remove);
            }
        }
    },

    _showLayer: function(layer, time) {
        if (this._currentLayer && this._currentLayer !== layer) {
            this._currentLayer.hide();
        }
        layer.show();
        if (this._currentLayer && this._currentLayer === layer) {
            return;
        }
        this._currentLayer = layer;
        this._currentTime = time;
        //console.log('Show layer with time: ' + new Date(time).toISOString());

        this._evictCachedTimes(this._timeCacheForward, this._timeCacheBackward);
    },

    _getLayerForTime: function(time) {
        if (time == 0 || time == this._defaultTime || time == null) {
            return this._baseLayer;
        }
        if (this._layers.hasOwnProperty(time)) {
            return this._layers[time];
        }
        var nearestTime = this._getNearestTime(time);
        if (this._layers.hasOwnProperty(nearestTime)) {
            return this._layers[nearestTime];
        }

        var newLayer = this._createLayerForTime(nearestTime);
       
        this._layers[time] = newLayer;

        newLayer.on('load', (function(layer, time) {
            layer.setLoaded(true);
            // this time entry should exists inside _layers
            // but it might be deleted by cache management
            if (!this._layers[time]) {
                this._layers[time] = layer;
            }
            if (this._timeDimension && time == this._timeDimension.getCurrentTime() && !this._timeDimension.isLoading()) {
                this._showLayer(layer, time);
            }
            // console.log('Loaded layer ' + layer.wmsParams.layers + ' with time: ' + new Date(time).toISOString());
            this.fire('timeload', {
                time: time
            });
        }).bind(this, newLayer, time));

        // Hack to hide the layer when added to the map.
        // It will be shown when timeload event is fired from the map (after all layers are loaded)
        newLayer.onAdd = (function(map) {
            Object.getPrototypeOf(this).onAdd.call(this, map);
            this.hide();
        }).bind(newLayer);
        return newLayer;
    },
    
    _createLayerForTime:function(time){
        var options = this._baseLayer.options;
        var url = this._baseLayer.getURL();

        var startDate = new Date(time);
        startDate.setUTCHours(0, 0, 0, 0);
        var startDateFormatted = startDate.toISOString().substring(0,10)//.replace(/-/g, '');
        url = url.replace('{d}', startDateFormatted);
        //url = url.replace('{d}', startDateFormatted+'T');
        //console.log(startDateFormatted)

        var hours = new Date(time).getUTCHours();
        hours = "00" + hours;
        hours = hours.substring(hours.length - 2, hours.length);
        url = url.replace('{h}', hours);
        //url = url.replace('{h}', hours+':');

        var min = new Date(time).getUTCMinutes();
        min = "00" + min;
        min = min.substring(min.length - 2, min.length);
        url = url.replace('{m}', min);
        //url = url.replace('{m}', min+':00Z');

        return new this._baseLayer.constructor(url, this._baseLayer.options);
    },

    _getLoadedTimes: function() {
        var result = [];
        for (var prop in this._layers) {
            if (this._layers.hasOwnProperty(prop)) {
                result.push(prop);
            }
        }
        return result.sort(function(a, b) {
            return a - b;
        });
    },

    _removeLayers: function(times) {
        for (var i = 0, l = times.length; i < l; i++) {
            if (this._map)
                this._map.removeLayer(this._layers[times[i]]);
            delete this._layers[times[i]];
        }
    },

    setMinimumForwardCache: function(value) {
        if (value > this._timeCacheForward) {
            this._timeCacheForward = value;
        }
    },

    _getNearestTime: function(time) {
        if (this._layers.hasOwnProperty(time)) {
            return time;
        }
        if (this._availableTimes.length == 0) {
            return time;
        }
        var index = 0;
        var len = this._availableTimes.length;
        for (; index < len; index++) {
            if (time < this._availableTimes[index]) {
                break;
            }
        }
        // We've found the first index greater than the time. Get the previous
        if (index > 0) {
            index--;
        }
        if (time != this._availableTimes[index]) {
            console.log('Search layer time: ' + new Date(time).toISOString());
            console.log('Return layer time: ' + new Date(this._availableTimes[index]).toISOString());
        }
        return this._availableTimes[index];
    },

});

L.timeDimension.layer.tileLayer.portus = function(layer, options) {
    return new L.TimeDimension.Layer.TileLayer.Portus(layer, options);
};
