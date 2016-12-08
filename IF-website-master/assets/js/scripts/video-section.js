
jQuery(document).ready(function () {
    "use strict";
    $ = jQuery.noConflict();


    var $devicewidth = (window.innerWidth > 0) ? window.innerWidth : screen.width;
    var $deviceheight = (window.innerHeight > 0) ? window.innerHeight : screen.height;



    /* ======================= */
    /* ==== VIDEO SECTION ==== */

    $(".media-section[data-type='video']").each(function () {
        var $this = $(this);
        var $height = $this.attr("data-height");
        var $time = 1;

        if ($height.indexOf("%") > -1) {
            $this.css('min-height', $deviceheight);
            $this.find('> .display-table').css('height', $deviceheight);
        } else {
            $this.css('min-height', $height + "px");
            $this.find('> .display-table').css('height', $height + "px");
        }

        if (!$this.hasClass("html5")) {
            var $videoframe = $this.find('iframe')
            if ($videoframe.attr('data-startat')) {
                $time = $videoframe.attr('data-startat');
            }
            if (!($devicewidth < 992) && !device.mobile()) {
                if (typeof $f != 'undefined') {
                    var $video = '#' + $videoframe.attr('id');
                    var iframe = $($video)[0], player = $f(iframe), status = $('.status');


                    player.addEvent('ready', function () {
                        player.api('setVolume', 0);
                        player.api('seekTo', $time);
                    })
                }
            }
        } else {
            //THIS IS WHERE YOU CALL THE VIDEO ID AND AUTO PLAY IT. CHROME HAS SOME KIND OF ISSUE AUTOPLAYING HTML5 VIDEOS, SO THIS IS NEEDED
            document.getElementById('video1').play();
        }
        if (($devicewidth < 992) || device.mobile()) {
            $this.find(".video").css('display', 'none');
            if ($this.attr("data-fallback-image") !== undefined) {
                $this.css('background-image', 'url("' + $this.attr("data-fallback-image") + '")');
            }
        }
    });

});