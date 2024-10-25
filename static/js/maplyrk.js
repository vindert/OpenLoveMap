'use strict';
let map, saved_lat, saved_lon, bbox;
let condom_icon, strip_icon, shop_icon, brothel_icon, register_icon;
const poi_markers = [];

function jumpTo(lat, lon) {
	$("#autocomplete").hide();
	map.panTo([lat, lon]);
}

function geocode() {
	const searchword = $("#searchfield").val();

	if(searchword.length > 3) {
		https://api.maptiler.com/geocoding/{query}.json
		$.getJSON("https://photon.komoot.de/api/", {
			"q": searchword,
			"lat": saved_lat,
			"lon": saved_lon,
			"limit": 5,
			"lang": navigator.language
		}, function(data) {
			let autocomplete_content = "<li>";

			$.each(data.features, function(number, feature) {
				const latlng = [feature.geometry.coordinates[1], feature.geometry.coordinates[0]];

				autocomplete_content += "<ul onclick='jumpTo(" + latlng[0] + ", " + latlng[1] + ")'>" + feature.properties.name + ", " + feature.properties.country + "</ul>";
			});
			let autocomplete = $("#autocomplete")
			autocomplete.html(autocomplete_content+"</li>");
			autocomplete.show();
		});
	}
}

function setPoiMarker(poi_type, icon, lat, lon, tags, osmid, osmtype) {
	const mrk = L.marker([lat, lon], {icon: icon});
	const osmlink = "https://www.openstreetmap.org/" + osmtype + "/" + osmid;
	let popup_content;
	if(tags.name === undefined) {
		popup_content = "<strong>" + poi_type + "</strong>";
	} else {
		popup_content = "<strong>" + tags.name + " ("+ poi_type +")</strong>";
	}

	popup_content += "<div class='more_on_osm'><a href='"+osmlink+"'>more on OpenStreetMap.org</a></div>";

	mrk.bindPopup(popup_content);
	poi_markers.push(mrk);
	mrk.addTo(map);
}

function elementToMap(data) {
	$.each(poi_markers, function(_, mrk) {
		map.removeLayer(mrk);
	});

	$.each(data.elements, function(_, el) {
		if(el.lat === undefined) {
			el.lat = el.center.lat;
			el.lon = el.center.lon;
		}

		if(el.tags !== undefined && el.tags.entrance !== "yes") {
			let mrk;

			if(el.tags.vending !== undefined) {
				mrk = L.marker([el.lat, el.lon], {icon: condom_icon});
				mrk.bindPopup("Condom vending machine");
			} else if(el.tags.amenity === "stripclub") {
				setPoiMarker("Strip Club", strip_icon, el.lat, el.lon, el.tags, el.id, el.type);
			} else if(el.tags.shop === "erotic" || el.tags.shop === "adult" || el.tags.shop === "sex") {
				setPoiMarker("Sex shop", shop_icon, el.lat, el.lon, el.tags, el.id, el.type);
			} else if(el.tags.amenity === "brothel") {
				setPoiMarker("Brothel", brothel_icon, el.lat, el.lon, el.tags, el.id, el.type);
			} else if(el.tags.amenity === "love_hotel") {
				setPoiMarker("Love Hotel", brothel_icon, el.lat, el.lon, el.tags, el.id, el.type);
			} else if(el.tags.amenity === "swingerclub") {
				setPoiMarker("Swinger Club", brothel_icon, el.lat, el.lon, el.tags, el.id, el.type);
			} else if(el.tags.amenity === "register_office" || el.tags.office === "register") {
				setPoiMarker("Register Office", register_icon, el.lat, el.lon, el.tags, el.id, el.type);
			}
		}
	});
}

function getOpElements() {
	if(map.getZoom() < 12) {
		return null;
	}

	bbox = map.getBounds().getSouth() + "," + map.getBounds().getWest() + "," + map.getBounds().getNorth() +  "," + map.getBounds().getEast();

	localStorage.setItem("pos_lat", map.getCenter().lat)
	localStorage.setItem("pos_lon", map.getCenter().lng)

	$.ajax({
		url: "https://overpass-api.de/api/interpreter",
		data: {
			"data": '[bbox:'+bbox+'][out:json][timeout:25];(nwr[vending=condoms];nwr[amenity~"^(brothel|love_hotel|swingerclub|stripclub|register_office)$"];nwr[shop~"^(erotic|adult|sex)$"];nwr[office=register];);out body center;'
		},
		success: elementToMap
	});
}


function goToCurrentPos() {
	navigator.geolocation.getCurrentPosition(function(pos) {
		map.setView([pos.coords.latitude, pos.coords.longitude]);
	});
}


$(function() {
	let retina;
	condom_icon = L.icon({
		iconUrl: '/static/img/condom.png',
		iconSize: [30, 30],
		iconAnchor: [15, 15],
		popupAnchor: [0, -15]
	});

	strip_icon = L.icon({
		iconUrl: '/static/img/stripclub.png',
		iconSize: [30, 30],
		iconAnchor: [15, 15],
		popupAnchor: [0, -15]
	});

	shop_icon = L.icon({
		iconUrl: '/static/img/shop.png',
		iconSize: [30, 30],
		iconAnchor: [15, 15],
		popupAnchor: [0, -15]
	});

	brothel_icon = L.icon({
		iconUrl: '/static/img/brothel.png',
		iconSize: [30, 30],
		iconAnchor: [15, 15],
		popupAnchor: [0, -15]
	});

	register_icon = L.icon({
		iconUrl: '/static/img/register.png',
		iconSize: [30, 30],
		iconAnchor: [15, 15],
		popupAnchor: [0, -15]
	});

	// init map
	map = L.map('bigmap')
	
	saved_lat = localStorage.getItem("pos_lat")
	saved_lon = localStorage.getItem("pos_lon")

	if(saved_lat !== undefined) {
		map.setView([saved_lat, saved_lon], 9)
	} else {
		map.setView([48.638, 7.690], 5);
	}

	retina = L.Browser.retina ? "@2x" : null;

	L.tileLayer('https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}'+retina+'.png?key=9SA3hAd2J4saslOINKuo', {
		attribution: 'Powered by <a href="https://maptiler.com/">maptiler.com</a> and <a href="https://www.openstreetmap.org/copyright">&copy;OpenStreetMap contributors</a>',
		maxZoom: 18
	}).addTo(map);

	// init search
	$("#searchfield").keyup(function() {
		geocode();
	});

	// Display notice to zoom in.
	map.on('zoomend', function() {
		if (map.getZoom() >=12){
			$("#zoomnotice").fadeOut();
		}
		else {
			$("#zoomnotice").fadeIn();
		}
	});


	// poi reload on map move
	map.on('moveend', getOpElements);

	// initial poi load
	getOpElements();
});
