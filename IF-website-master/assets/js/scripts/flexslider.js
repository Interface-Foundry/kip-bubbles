
/* ==================== */
/* ==== FLEXSLIDER *==== */



jQuery(document).ready(function () {
    "use strict";
    $ = jQuery.noConflict();

    /* ========================== */
    /* ==== SCROLL TO ANCHOR ==== */

    $('a.local[href*=#]:not([href=#])').click(function () {
        if (location.pathname.replace(/^\//, '') == this.pathname.replace(/^\//, '') && location.hostname == this.hostname) {
            var target = $(this.hash);
            target = target.length ? target : $('[name=' + this.hash.slice(1) + ']');

            var menuOffset = 90;
            if ($(this).hasClass("menuOffset")) {
                if (!($.browser.mobile)) {
                    menuOffset = parseInt($('.navbar-default').height());
                } else {

                }
            }

            if (target.length) {
                $('html,body').animate({
                    scrollTop: target.offset().top - menuOffset
                }, 1000, 'swing');
                return false;
            }
        }
    });




    /* =========================== */
    /* === BIG ARROW ANIMATION *=== */

    function animateArrow() {

        setTimeout(function () {
            $(".bigArrow i").css('opacity', 1).stop(true, true).animate({opacity: 0, top: "15px"}, {
                queue: false, duration: 350, complete: function () {

                    $(".bigArrow i").css("top", "-15px").stop(true, true).delay(200).animate({opacity: 1, top: 0}, {
                        queue: false, duration: 450, complete: function () {
                            animateArrow();
                        }
                    })
                }
            })
        }, 1800);
    }

    animateArrow();

    $(window).load(function () {


        if (($().flexslider) && ($(".flexslider").length > 0)) {

            $('.flexslider.std-slider').each(function () {
                var $this = $(this);

                // initialize
                $this.find(".slides > li").each(function () {
                    var $slide_item = $(this);
                    var bg = validatedata($slide_item.attr('data-bg'), false);
                    if (bg) {
                        $slide_item.css('background-image', 'url("' + bg + '")');
                    }
                    $slide_item.css('min-height', $this.attr('data-height') + "px");

                    // hide slider content due to fade animation

                    /*
                     $slide_item.find(".inner").hide();

                     $slide_item.find(".inner [data-fx]").each(function () {
                     $(this).removeClass("animated");
                     })
                     */
                })

                var loop = validatedata(parseBoolean($this.attr("data-loop")), false);
                var smooth = validatedata(parseBoolean($this.attr("data-smooth")), false);
                var slideshow = validatedata(parseBoolean($this.attr("data-slideshow")), false);
                var speed = validatedata(parseInt($this.attr('data-speed')), 7000);
                var animspeed = validatedata(parseInt($this.attr("data-animspeed")), 600);
                var controls = validatedata(parseBoolean($this.attr('data-controls')), false);
                var dircontrols = validatedata(parseBoolean($this.attr('data-dircontrols')), false);

                $this.flexslider({
                    animation: "fade",              //String: Select your animation type, "fade" or "slide"
                    animationLoop: loop,             //Boolean: Should the animation loop? If false, directionNav will received "disable" classes at either end
                    smoothHeight: smooth,            //{NEW} Boolean: Allow height of the slider to animate smoothly in horizontal mode
                    slideshow: slideshow,                //Boolean: Animate slider automatically
                    slideshowSpeed: speed,           //Integer: Set the speed of the slideshow cycling, in milliseconds
                    animationSpeed: animspeed,            //Integer: Set the speed of animations, in milliseconds

                    // Primary Controls
                    controlNav: controls,               //Boolean: Create navigation for paging control of each clide? Note: Leave true for manualControls usage
                    directionNav: dircontrols,             //Boolean: Create navigation for previous/next navigation? (true/false)
                    touch: false,

                    pauseOnHover: true,            //Boolean: Pause the slideshow when hovering over slider, then resume when no longer hovering
                    prevText: " ",           //String: Set the text for the "previous" directionNav item
                    nextText: " ",
                    useCSS: false,

                    // Callback API
                    start: function () {
                        //$this.removeClass("loading-slider");

                        setTimeout(function () {
                            $this.find(".slides > li.flex-active-slide .inner [data-fx]").each(function () {
                                var $content = $(this);
                                $content.addClass($content.data('fx')).addClass("activate");
                            })
                        }, 650);

                    },
                    before: function () {

                        $this.find(".slides > li .inner [data-fx]").each(function () {
                            var $content = $(this);
                            $content.removeClass($content.data('fx')).removeClass("activate");
                        })
                    },           //Callback: function(slider) - Fires asynchronously with each slider animation
                    after: function () {
                        setTimeout(function () {
                            $this.find(".slides > li.flex-active-slide .inner [data-fx]").each(function () {
                                var $content = $(this);
                                $content.addClass($content.data('fx')).addClass("activate");
                            })
                        }, 150);
                    },            //Callback: function(slider) - Fires after each slider animation completes
                    end: function () {
                    },              //Callback: function(slider) - Fires when the slider reaches the last slide (asynchronous)
                    added: function () {
                    },            //{NEW} Callback: function(slider) - Fires after a slide is added
                    removed: function () {
                    }           //{NEW} Callback: function(slider) - Fires after a slide is removed
                });
            });

            $('.flexslider.carousel-slider').each(function () {
                var $this = $(this);

                var slideshow = validatedata(parseBoolean($this.attr("data-slideshow")), false);
                var speed = validatedata(parseInt($this.attr('data-speed')), 7000);
                var animspeed = validatedata(parseInt($this.attr("data-animspeed")), 600);
                var loop = validatedata(parseBoolean($this.attr("data-loop")), false);
                var min = validatedata(parseInt($this.attr('data-min')), 1);
                var max = validatedata(parseInt($this.attr("data-max")), 3);
                var move = validatedata(parseInt($this.attr("data-move")), 0);
                var controls = validatedata(parseBoolean($this.attr('data-controls')), false);
                var dircontrols = validatedata(parseBoolean($this.attr('data-dircontrols')), false);

                $this.flexslider({
                    animation: "slide",
                    slideshow: slideshow,
                    slideshowSpeed: speed,
                    animationSpeed: animspeed,
                    animationLoop: loop,
                    itemWidth: 370,
                    itemMargin: 18,
                    minItems: min,
                    maxItems: max,
                    move: move,
                    controlNav: controls,
                    directionNav: dircontrols
                });
            });
        }

    });


});
