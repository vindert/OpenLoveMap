!function (a) {
    let b = function () {
        let b = a.documentMode;
        return "onhashchange" in a && (void 0 === b || b > 7)
    }();
    L.Hash = function (a) {
        this.onHashChange = L.Util.bind(this.onHashChange, this), a && this.init(a)
    }, L.Hash.parseHash = function (a) {
        0 === a.indexOf("#") && (a = a.substr(1));
        let b = a.split("/");
        if (3 === b.length) {
            let c = parseInt(b[0], 10), d = parseFloat(b[1]), e = parseFloat(b[2]);
            return isNaN(c) || isNaN(d) || isNaN(e) ? !1 : {center: new L.LatLng(d, e), zoom: c}
        }
        return !1
    }, L.Hash.formatHash = function (a) {
        let b = a.getCenter(), c = a.getZoom(), d = Math.max(0, Math.ceil(Math.log(c) / Math.LN2));
        return "#" + [c, b.lat.toFixed(d), b.lng.toFixed(d)].join("/")
    }, L.Hash.prototype = {
        map: null, lastHash: null, parseHash: L.Hash.parseHash, formatHash: L.Hash.formatHash, init: function (a) {
            this.map = a, this.lastHash = null, this.onHashChange(), this.isListening || this.startListening()
        }, removeFrom: function () {
            this.changeTimeout && clearTimeout(this.changeTimeout), this.isListening && this.stopListening(), this.map = null
        }, onMapMove: function () {
            if (this.movingMap || !this.map._loaded) return !1;
            let a = this.formatHash(this.map);
            this.lastHash !== a && (location.replace(a), this.lastHash = a)
        }, movingMap: !1, update: function () {
            let a = location.hash;
            if (a !== this.lastHash) {
                let b = this.parseHash(a);
                b ? (this.movingMap = !0, this.map.setView(b.center, b.zoom), this.movingMap = !1) : this.onMapMove(this.map)
            }
        }, changeDefer: 100, changeTimeout: null, onHashChange: function () {
            if (!this.changeTimeout) {
                let a = this;
                this.changeTimeout = setTimeout(function () {
                    a.update(), a.changeTimeout = null
                }, this.changeDefer)
            }
        }, isListening: !1, hashChangeInterval: null, startListening: function () {
            this.map.on("moveend", this.onMapMove, this), b ? L.DomEvent.addListener(a, "hashchange", this.onHashChange) : (clearInterval(this.hashChangeInterval), this.hashChangeInterval = setInterval(this.onHashChange, 50)), this.isListening = !0
        }, stopListening: function () {
            this.map.off("moveend", this.onMapMove, this), b ? L.DomEvent.removeListener(a, "hashchange", this.onHashChange) : clearInterval(this.hashChangeInterval), this.isListening = !1
        }
    }, L.hash = function (a) {
        return new L.Hash(a)
    }, L.Map.prototype.addHash = function () {
        this._hash = L.hash(this)
    }, L.Map.prototype.removeHash = function () {
        this._hash.removeFrom()
    }
}(window);