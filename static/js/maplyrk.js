'use strict';
let map, saved_lat, saved_lon, saved_zoom, bbox;
let condom_icon, strip_icon, shop_icon, brothel_icon, love_hotel_icon , register_icon, massage_icon;
const poi_markers = [];
const api_key = 'APIkey'

function jumpTo(lat, lon) {
	$("#autocomplete").hide();
	$("#searchfield").val('');
	map.panTo([lat, lon]);
}

function geocode() {
	const query = $("#searchfield").val();

	if(query.length > 3) {
		$.getJSON("https://api.maptiler.com/geocoding/"+ query+".json?key="+ api_key, {
			"proximity": Array(saved_lon,saved_lat),
			"limit": 5,
			"language": navigator.language
		}, function(data) {
			let autocomplete_content = "<li>";
			$.each(data.features, function(number, feature) {
				const latlng = [feature.geometry.coordinates[1], feature.geometry.coordinates[0]];
				autocomplete_content += "<ul onclick='jumpTo(" + latlng[0] + ", " + latlng[1] + ")'>" + feature.place_name + "</ul>";
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

	if(tags['addr:housenumber'] !== undefined) {
		popup_content += '<br>' + tags['addr:housenumber']
	}
	if(tags['addr:street'] !== undefined) {
		if(tags['addr:housenumber'] === undefined) {
			popup_content += '<br>'
		}
		popup_content += ' ' + tags['addr:street']
	}
	if(tags['addr:city'] !== undefined) {
		popup_content += '<br>' + tags['addr:city']
	}
	if(tags.opening_hours !== undefined) {
		popup_content += '<br>Open: ' + tags.opening_hours
	}
	popup_content += "<table class='smalltext' id=\""+osmid+"\">"
	popup_content += '<tr><th>Key</th><th>Value</th></tr>'
	for (const [key, raw_value] of Object.entries(tags)) {
		let value = raw_value
		if(key==='email') {
			value = '<a href="mailto:' + raw_value + '">' + raw_value + '</a>'
		} else if (key==='website' || key==='facebook' || key==='instagram') {
			value = '<a href="' + raw_value + '" target="_blank" >' + raw_value + '</a>'
		} else if (key==='phone') {
			value = '<a href="tel:' + raw_value + '" target="_blank" >' + raw_value + '</a>'
		}
		popup_content += '<tr><td>' +key +'</td><td>'+value+'</td></tr>'
	}
	popup_content += "</table>"
	popup_content += "<div class='more_on_osm'><a href='javascript:void(0)' class='toggle_tags' data-target='"+osmid+"'> Show all tags</a></div>";
	popup_content += "<div class='more_on_osm'><a href='"+osmlink+"' target='_blank'>Show on OpenStreetMap.org</a></div>";

	mrk.bindPopup(popup_content).on("popupopen", () => {
		let trigger = $(".toggle_tags")
		let tag_table = $('#'+ trigger.attr("data-target"))
		tag_table.hide();
		trigger.on("click", function(e) {
            e.preventDefault();
			tag_table.show( 400);
			trigger.hide();
		});
	});
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
			if(el.tags.vending === "condoms") {
				setPoiMarker("Condom vending machine", condom_icon, el.lat, el.lon, el.tags, el.id, el.type);
			} else if(el.tags.amenity === "stripclub") {
				setPoiMarker("Strip Club", strip_icon, el.lat, el.lon, el.tags, el.id, el.type);
			} else if(el.tags.shop === "erotic" || el.tags.shop === "adult" || el.tags.shop === "sex") {
				setPoiMarker("Sex shop", shop_icon, el.lat, el.lon, el.tags, el.id, el.type);
			} else if(el.tags.amenity === "brothel") {
				setPoiMarker("Brothel", brothel_icon, el.lat, el.lon, el.tags, el.id, el.type);
			} else if(el.tags.amenity === "love_hotel") {
				setPoiMarker("Love Hotel", love_hotel_icon, el.lat, el.lon, el.tags, el.id, el.type);
			} else if(el.tags.amenity === "swingerclub") {
				setPoiMarker("Swinger Club", brothel_icon, el.lat, el.lon, el.tags, el.id, el.type);
			} else if(el.tags.amenity === "register_office" || el.tags.office === "register") {
				setPoiMarker("Register Office", register_icon, el.lat, el.lon, el.tags, el.id, el.type);
			} else if(el.tags.massage === "sexual" || el.tags.massage === "erotic") {
				setPoiMarker("Erotic Massage", massage_icon, el.lat, el.lon, el.tags, el.id, el.type);
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
	localStorage.setItem("zoom", map.getZoom())

	$.ajax({
		url: "https://overpass-api.de/api/interpreter",
		data: {
			"data": '[bbox:'+bbox+'][out:json][timeout:25];(nwr[vending=condoms];nwr[amenity~"^(brothel|love_hotel|swingerclub|stripclub|register_office)$"];nwr[shop~"^(erotic|adult|sex)$"];nwr[massage~"^(sexual|erotic)$"];nwr[office=register];);out body center;'
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

	love_hotel_icon = L.icon({
		iconUrl: '/static/img/love_hotel.png',
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

	massage_icon = L.icon({
		iconUrl: '/static/img/massage.png',
		iconSize: [30, 30],
		iconAnchor: [15, 15],
		popupAnchor: [0, -15]
	});

	// init map
	map = L.map('bigmap')
	
	saved_lat = localStorage.getItem("pos_lat")
	saved_lon = localStorage.getItem("pos_lon")
	saved_zoom = localStorage.getItem("zoom")

	if(saved_lat !== null && saved_lon !== null && saved_zoom != null) {
		map.setView([saved_lat, saved_lon],saved_zoom)
		if (saved_zoom >= 12) {
			$("#zoomnotice").hide();
		}
	} else {
		map.setView([48.638, 7.690], 5);
	}

	retina = L.Browser.retina ? "@2x" : null;

	L.tileLayer('https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}'+retina+'.png?key='+ api_key, {
		attribution: 'Powered by <a href="https://maptiler.com/">maptiler.com</a> and <a href="https://www.openstreetmap.org/copyright">&copy;OpenStreetMap contributors</a>',
		maxZoom: 18
	}).addTo(map);

	// init search
	$("#searchfield").keyup(function() {
		geocode();
	});

	// Display notice to zoom in.
	map.on('zoomend', function() {
		if (map.getZoom() >= 12){
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
