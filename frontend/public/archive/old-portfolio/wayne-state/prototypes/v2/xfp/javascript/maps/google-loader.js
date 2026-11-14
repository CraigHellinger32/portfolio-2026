function GoogleMap(mapDiv) {
    this.mapDiv = mapDiv;
    this.map = null;
    this.marker = null;

    this.init = function(osm, centerLat, centerLng, zoom) {
    	var that = this;

        if (osm == false) {
            this.map = new google.maps.Map(this.mapDiv, {
                center: {lat: centerLat, lng: centerLng},
                zoom: zoom
            });
        }
        else {
            this.map = new google.maps.Map(this.mapDiv, {
                center: {lat: centerLat, lng: centerLng},
                zoom: zoom,
                mapTypeId: "OSM",
                mapTypeControl: false,
                streetViewControl: false
            });

            this.map.mapTypes.set("OSM", new google.maps.ImageMapType({
                getTileUrl: function(coord, zoom) {
                    // "Wrap" x (logitude) at 180th meridian properly
                    // NB: Don't touch coord.x because coord param is by reference, and changing its x property breakes something in Google's lib
                    var tilesPerGlobe = 1 << zoom;
                    var x = coord.x % tilesPerGlobe;
                    if (x < 0) {
                        x = tilesPerGlobe+x;
                    }
                    // Wrap y (latitude) in a like manner if you want to enable vertical infinite scroll

                    return "https://tile.openstreetmap.org/" + zoom + "/" + x + "/" + coord.y + ".png";
                },
                tileSize: new google.maps.Size(256, 256),
                name: "OpenStreetMap",
                maxZoom: 18
            }));
        }

        var hiddenInput = this.mapDiv.nextSibling;
        if (hiddenInput.nodeType == 3) {
            hiddenInput = hiddenInput.nextSibling;
        }

        if (hiddenInput.value != '') {
            var point = JSON.parse(hiddenInput.value);
            this.updateMap(point.x, point.y);
        }

        this.mapDiv.parentNode.querySelector('.current-location').onclick = function(e) {
            e.preventDefault();

            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(function (position) {
                    that.updateMap(position.coords.latitude, position.coords.longitude);
                });
            }
            else {
                alert("Geolocation is not supported by this browser.");
            }
        }

        this.mapDiv.parentNode.querySelector('.postcode-lookup-btn').onclick = function() {
            var input = that.mapDiv.parentNode.querySelector('.postcode-lookup-btn').previousSibling,
                locale = document.querySelector('.form-locale').value,
                countryCode = locale.slice(-2).toUpperCase();

            if (input.nodeType == 3) {
                input = input.previousSibling;
            }

            that.lookupPostcode(input.value, countryCode);
        }

        this.mapDiv.parentNode.querySelector('.add-pin-btn').onclick = function() {
            var center = that.map.getCenter();
            that.addMarker(center.lat(), center.lng());
        }

        this.mapDiv.parentNode.querySelector('.remove-pin-btn').onclick = function() {
            var hiddenInput = that.mapDiv.nextSibling.nextSibling;

            hiddenInput.value = '';
            if (that.marker) {
                that.marker.setMap(null);
            }
        }
    }

    this.updateMap = function(lat, lon) {
        this.moveMapToPoint(lat, lon);
        this.addMarker(lat, lon);
    }

    this.moveMapToPoint = function(lat, lon) {
        this.map.setCenter({ lat: lat, lng: lon });
        this.map.setZoom(18);
    }

    this.addMarker = function(lat, lon) {
        if (this.marker == null) {
            this.marker = new google.maps.Marker({
                draggable: true,
                title: 'My location'
            });

            var that = this;
            this.marker.addListener('dragend',function(event) {
                that.updateHiddenInput(event.latLng.lat(), event.latLng.lng());
            });
        }

        this.marker.setPosition({ lat: lat, lng: lon });
        this.marker.setMap(this.map);
        this.updateHiddenInput(lat, lon);
    }

    this.lookupPostcode = function(postcode, countryCode) {
        var url = '/jadu/xforms2/includes/postcode_lookup_ajax.php?postcode=' + postcode,
            pchttp = new XMLHttpRequest(),
            that = this;

        this.mapDiv.parentNode.querySelector('.postcode-error').style.display = 'none';

        pchttp.onreadystatechange = function() {
            if (pchttp.readyState == 4 && pchttp.status == 200) {
                var response = pchttp.responseText;
                if (response && response == true) {
                    var geocoder = new google.maps.Geocoder();
                    geocoder.geocode({'componentRestrictions': {'country': countryCode, 'postalCode': postcode}}, function(results, status)
                    {
                        // callback with a status and result
                        if (status == google.maps.GeocoderStatus.OK)
                        {
                            var lat = results[0].geometry.location.lat(),
                                lon = results[0].geometry.location.lng()

                            that.updateMap(lat, lon);
                        }
                        else {
                            that.mapDiv.parentNode.querySelector('.postcode-error').style.display = 'block';
                        }
                    });
                }
                else {
                   that.mapDiv.parentNode.querySelector('.postcode-error').style.display = 'block';
                }
            }
        };
        pchttp.open("GET", url, true);
        pchttp.send();
    }

    this.updateHiddenInput = function(lat, lon) {
        var hiddenInput = this.mapDiv.nextSibling;
        if (hiddenInput.nodeType == 3) {
            hiddenInput = hiddenInput.nextSibling;
        }

        var data = {
                    x: lat,
                    y: lon
                };

        hiddenInput.value = JSON.stringify(data);
    }
}
