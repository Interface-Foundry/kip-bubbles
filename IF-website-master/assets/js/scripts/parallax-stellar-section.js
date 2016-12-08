
jQuery(document).ready(function () {
    "use strict";
    $ = jQuery.noConflict();


    var $devicewidth = (window.innerWidth > 0) ? window.innerWidth : screen.width;
    var $deviceheight = (window.innerHeight > 0) ? window.innerHeight : screen.height;


    /* ================== */
    /* ==== PARALLAX ==== */


    $(".stellar-object").each(function () {
        var $this = $(this);
        var $bg = $this.attr("data-image");
        var $height = $this.attr("data-height") + 'px';
        var $width = $this.attr("data-width") + 'px';
        var $top = $this.attr("data-top");
        var $left = $this.attr("data-left");

        $this.css('background-image', 'url("' + $bg + '")');
        $this.css('width', $width);
        $this.css('height', $height);
        $this.css('top', $top);
        $this.css('left', $left);
    })

    if (!device.mobile() && !device.tablet()) {
        $(".media-section[data-type='parallax']").each(function () {
            var $this = $(this);
            var $bg = $this.attr("data-image");
            var $height = $this.attr("data-height");

            $this.css('background-image', 'url("' + $bg + '")');
            if ($height.indexOf("%") > -1) {
                $this.css('min-height', $deviceheight);
                $this.css('height', $deviceheight);
            } else {
                $this.css('min-height', $height + "px");
                $this.css('height', $height + "px");
            }
        })
    } else {
        $(".media-section[data-type='parallax']").each(function () {
            var $this = $(this);
            var $bg = $this.attr("data-image-mobile");
            var $height = $this.attr("data-height");

            if ($height.indexOf("%") > -1) {
                $this.css('min-height', $deviceheight);
                $this.css('height', $deviceheight);
            } else {
                $this.css('min-height', $height + "px");
                $this.css('height', $height + "px");
            }
            $this.css('background-image', 'url("' + $bg + '")');
        })
    }

// add background position for parallax. fix for ipad and iphone
    if (!device.mobile() && !device.tablet()) {
        $(".media-section[data-type='parallax']").css('background-attachment', 'fixed');
    } else {
        $(".media-section[data-type='parallax']").css('background-attachment', 'scroll');
    }

});





$(window).load(function () {

    if ($().stellar) {
        if (!device.mobile() && !device.tablet()) {
            //initialise Stellar.js
            $(window).stellar({

                horizontalScrolling: false, responsive: true, positionProperty: 'transform'
            });
        }
    }

});