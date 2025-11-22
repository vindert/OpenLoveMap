'use strict';
let map, saved_lat, saved_lon, saved_zoom, bbox;
let condom_icon, strip_icon, shop_icon, shop_lgbtq_icon, brothel_icon, love_hotel_icon , register_icon, massage_icon, swinger_icon;
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
	let popup_content,popup_icons = '',oh

	// Create opening_hours object.
	if(tags.opening_hours !== undefined) {
		oh = new opening_hours(tags.opening_hours, null, {'locale': navigator.language});
	}

	if(tags.name === undefined) {
		popup_content = "<strong>" + poi_type + "</strong>";
	} else {
		popup_content = "<strong>" + tags.name + " ("+ poi_type +")</strong>";
	}
	if(tags.opening_hours !== undefined) {
		if (oh.getState()) {
			popup_icons += '<img src="/static/img/open.png" alt="Open" title="Now open" class="popup_icon">'
		} else {
			popup_icons += '<img src="/static/img/closed.png" alt="closed" title="Currently closed" class="popup_icon">'
		}
	}
	if(tags.website !== undefined || tags['contact:website'] !== undefined) {
		let website_url
		if(tags.website !== undefined) {
			website_url = tags.website
		}
		else {
			website_url =tags['contact:website']
		}
		popup_icons += '<a href="'+ website_url +'" target="_blank"><img src="/static/img/link.png" alt="Website link" title="Website link" class="popup_icon"></a> '
	}
	if(tags.email !== undefined || tags['contact:email'] !== undefined) {
        let email_url
        if(tags.email !== undefined) {
            email_url = tags.email
        }
        else {
            email_url =tags['contact:email']
        }
		popup_icons += '<a href="mailto:'+ email_url +'"><img src="/static/img/mail.png" alt="Contact by email" title="Contact by email" class="popup_icon"></a> '
	}
	if(tags.phone !== undefined || tags['contact:phone'] !== undefined) {
		let phone_number
		if(tags.phone !== undefined) {
			phone_number = tags.phone
		}
		else {
			phone_number =tags['contact:phone']
		}
		popup_icons += '<a href="tel:'+ phone_number +'"><img src="/static/img/phone.png" alt="Contact by phone" title="Contact by phone" class="popup_icon"></a> '
	}
	if(popup_icons) {
		popup_content += '<br>' + popup_icons
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
		popup_content += '<br>Opening hours:<br><span class="popup_opening_hours">' + oh.prettifyValue(
		{conf: {
			locale: 'en',
			rule_sep_string: '<br>',
			print_semicolon: false
		}}) + '</span>'
	}
	popup_content += "<table class='smalltext' id=\""+osmid+"\">"
	popup_content += '<tr><th>Key</th><th>Value</th></tr>'
	for (const [key, raw_value] of Object.entries(tags)) {
		let value = raw_value
		if(key==='email' || key==='contact:email') {
			value = '<a href="mailto:' + raw_value + '">' + raw_value + '</a>'
		} else if (key==='website' || key==='contact:website' || key==='facebook' || key==='contact:facebook' || key==='instagram' || key==='contact:instagram') {
			value = '<a href="' + raw_value + '" target="_blank" >' + raw_value + '</a>'
		} else if (key==='phone' || key==='contact:phone') {
			value = '<a href="tel:' + raw_value + '" target="_blank" >' + raw_value + '</a>'
		} else if (key==='opening_hours') {
			value = oh.prettifyValue(
				{conf: {
						locale: 'en',
						rule_sep_string: '<br>'
					}})
		}
		popup_content += '<tr><td style="vertical-align:top">' +key +'</td><td>'+value+'</td></tr>'
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
			} else if(el.tags.shop === "erotic" || el.tags.shop === "adult") {
				console.log(el.tags)
				if (el.tags.lgbtq === 'primary') {
					setPoiMarker("LGBTQ Sex shop", shop_lgbtq_icon, el.lat, el.lon, el.tags, el.id, el.type);
				} else {
					setPoiMarker("Sex shop", shop_icon, el.lat, el.lon, el.tags, el.id, el.type);
				}
			} else if(el.tags.amenity === "brothel") {
				setPoiMarker("Brothel", brothel_icon, el.lat, el.lon, el.tags, el.id, el.type);
			} else if(el.tags.amenity === "love_hotel") {
				setPoiMarker("Love Hotel", love_hotel_icon, el.lat, el.lon, el.tags, el.id, el.type);
			} else if(el.tags.amenity === "swingerclub") {
				setPoiMarker("Swinger Club", swinger_icon, el.lat, el.lon, el.tags, el.id, el.type);
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
			"data": '[bbox:'+bbox+'][out:json][timeout:25];(nwr[vending=condoms];nwr[amenity~"^(brothel|love_hotel|swingerclub|stripclub|register_office)$"];nwr[shop~"^(erotic|adult)$"];nwr[massage~"^(sexual|erotic)$"];nwr[office=register];);out body center;'
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
		iconSize: [30, 45],
		iconAnchor: [15, 45],
		popupAnchor: [0, -45]
	});

	strip_icon = L.icon({
		iconUrl: '/static/img/stripclub.png',
		iconSize: [30, 45],
		iconAnchor: [15, 45],
		popupAnchor: [0, -45]
	});

	shop_icon = L.icon({
		iconUrl: '/static/img/shop.png',
		iconSize: [30, 45],
		iconAnchor: [15, 45],
		popupAnchor: [0, -45]
	});

	shop_lgbtq_icon = L.icon({
		iconUrl: '/static/img/shop_lgbtq.png',
		iconSize: [30, 45],
		iconAnchor: [15, 45],
		popupAnchor: [0, -45]
	});

	brothel_icon = L.icon({
		iconUrl: '/static/img/brothel.png',
		iconSize: [30, 45],
		iconAnchor: [15, 45],
		popupAnchor: [0, -45]
	});

	love_hotel_icon = L.icon({
		iconUrl: '/static/img/love_hotel.png',
		iconSize: [30, 45],
		iconAnchor: [15, 45],
		popupAnchor: [0, -45]
	});

	register_icon = L.icon({
		iconUrl: '/static/img/register.png',
		iconSize: [30, 45],
		iconAnchor: [15, 45],
		popupAnchor: [0, -45]
	});

	massage_icon = L.icon({
		iconUrl: '/static/img/massage.png',
		iconSize: [30, 45],
		iconAnchor: [15, 45],
		popupAnchor: [0, -45]
	});

	swinger_icon = L.icon({
		iconUrl: '/static/img/swinger.png',
		iconSize: [30, 45],
		iconAnchor: [15, 45],
		popupAnchor: [0, -45]
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

	// Needed for URL parameters.
	let hash = new L.Hash(map);

	retina = L.Browser.retina ? "@2x" : '';

	L.tileLayer('https://api.maptiler.com/maps/openstreetmap/{z}/{x}/{y}'+retina+'.jpg?key='+ api_key, {
		attribution: '<a href="https://maptiler.com/">maptiler.com</a> and <a href="https://www.openstreetmap.org/copyright">&copy;OpenStreetMap contributors</a>',
		tileSize: 512,
		zoomOffset: -1,
		maxZoom: 19
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
