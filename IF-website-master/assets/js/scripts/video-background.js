/* ======================== */
/* === VIDEO BACKGROUND *=== */

jQuery(document).ready(function () {
    "use strict";
    $ = jQuery.noConflict();


    $.fn.isOnScreen = function () {
        var win = $(window);
        var viewport = {
            top: win.scrollTop(),
            left: win.scrollLeft()
        };
        viewport.right = viewport.left + win.width();
        viewport.bottom = viewport.top + win.height();
        var bounds = this.offset();
        bounds.right = bounds.left + this.outerWidth();
        bounds.bottom = bounds.top + this.outerHeight();
        return (!(viewport.right < bounds.left || viewport.left > bounds.right || viewport.bottom < bounds.top || viewport.top > bounds.bottom));
    };

    if (($().mb_YTPlayer) && ($(".videoSection").length > 0)) {
        if ((isiPad) || (($.browser.mobile))) {
            $("#ct_preloader").fadeOut(600);
            $(".fallbackVideo").fitVids().show();

        } else {

            $(".videoSection").mb_YTPlayer();
            $('.videoSection').on("YTPStart", function () {
                setTimeout(function () {
                    $("#ct_preloader").fadeOut(300);
                    $(".videoSection").find(".flexslider").fadeIn(1000);
                }, 1050);
            })
            // if wait long - hide preloader
            setTimeout(function () {
                $("#ct_preloader").fadeOut(300);
            }, 9000);

            // chrome parallax section fix
            if ($('.videoSection.parallaxEffect').isOnScreen()) {
                $('.videoSection.parallaxEffect .innerVideo').css("position", "fixed");
            } else {
                $('.videoSection.parallaxEffect .innerVideo').css("position", "absolute");
            }
            $(window).on('scroll', function () {
                if ($('.videoSection.parallaxEffect').isOnScreen()) {
                    $('.videoSection.parallaxEffect .innerVideo').css("position", "fixed");
                } else {
                    $('.videoSection.parallaxEffect .innerVideo').css("position", "absolute");
                }
            });

            $('.videoSection.parallaxEffect').each(function () {
                var $this = $(this);
                $this.siblings(":not([data-bg], .navbar-default)").css({
                    "position": "relative",
                    "z-index": "1"
                })

            })
        }
    }

});