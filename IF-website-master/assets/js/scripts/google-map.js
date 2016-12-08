
/* ============================================= */
/* ==== GOOGLE MAP - Asynchronous Loading  *==== */



function initmap() {
    "use strict";
    jQuery(".googleMap").each(function () {
        var atcenter = "";
        var $this = jQuery(this);
        var location = $this.data("location");

        var offset = -30;

        if (validatedata($this.data("offset"))) {
            offset = $this.data("offset");
        }

        if (validatedata(location)) {

            var draggable = true;
            if (($.browser.mobile)||(isiPad)) {
                draggable = false;
            }

            $this.gmap3({
                marker: {
                    //latLng: [40.616439, -74.035540],
                    address: location,
                    options: {
                        visible: false
                    },
                    callback: function (marker) {
                        atcenter = marker.getPosition();
                    }
                },
                map: {
                    options: {
                        //maxZoom:11,
                        zoom: 18,
                        mapTypeId: google.maps.MapTypeId.ROADMAP,
                        // ('ROADMAP', 'SATELLITE', 'HYBRID','TERRAIN');
                        scrollwheel: false,
                        draggable: draggable,
                        disableDoubleClickZoom: false,
                        //disableDefaultUI: true,
                        mapTypeControlOptions: {
                            //mapTypeIds: [google.maps.MapTypeId.ROADMAP, google.maps.MapTypeId.HYBRID],
                            //style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
                            //position: google.maps.ControlPosition.RIGHT_CENTER
                            mapTypeIds: []
                        }
                    },
                    events: {
                        idle: function () {
                            if (!$this.data('idle')) {
                                $this.gmap3('get').panBy(0, offset);
                                $this.data('idle', true);
                            }
                        }
                    }
                },
                overlay: {
                    //latLng: [40.616439, -74.035540],
                    address: location,
                    options: {
                        content: '<div class="customMarker"><span class="fa fa-map-marker"></span><i></i></div>',
                        offset: {
                            y: -70,
                            x: -25
                        }
                    }
                }
                //},"autofit"
            });

            // center on resize
            google.maps.event.addDomListener(window, "resize", function () {
                //var userLocation = new google.maps.LatLng(53.8018,-1.553);
                setTimeout(function () {
                    $this.gmap3('get').setCenter(atcenter);
                    $this.gmap3('get').panBy(0, offset);
                }, 400);

            });

            // set height
            $this.css("min-height", $this.data("height") + "px");
        }

    })
}

function loadScript() {
    "use strict";
    var script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = 'https://maps.googleapis.com/maps/api/js?v=3.exp&sensor=false&' + 'callback=initmap';
    document.body.appendChild(script);
}


if ($(".googleMap").length > 0) {
    window.onload = loadScript;
}
/**
 * Created by User on 2014-09-05.
 */
