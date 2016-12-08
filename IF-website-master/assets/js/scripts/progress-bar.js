
/* ====================== */
/* ==== PROGRESS BAR *==== */

jQuery(document).ready(function () {
    "use strict";
    $ = jQuery.noConflict();


    $(window).load(function () {


        if (($().appear) && ($("body").hasClass("withAnimation"))) {
            $('.progress').appear(function () {
                var $this = $(this);
                $this.each(function () {
                    var $innerbar = $this.find(".progress-bar");
                    var percentage = $innerbar.attr("data-percentage");
                    var barcolor = '#' + $innerbar.attr("data-barcolor");
                    $innerbar.css("background-color", barcolor);
                    $innerbar.addClass("animating").css("width", percentage + "%");

                    $innerbar.on('transitionend webkitTransitionEnd oTransitionEnd otransitionend MSTransitionEnd', function () {
                        $innerbar.find(".pull-right").fadeIn(900);
                    });

                });
            }, {accY: -100});
        } else {
            $('.progress').each(function () {
                var $this = $(this);
                var $innerbar = $this.find(".progress-bar");
                var percentage = $innerbar.attr("data-percentage");
                $innerbar.addClass("animating").css("width", percentage + "%");

                $innerbar.on('transitionend webkitTransitionEnd oTransitionEnd otransitionend MSTransitionEnd', function () {
                    $innerbar.find(".pull-right").fadeIn(900);
                });

            });
        }

        $('.progress-icons').each(function () {
            var $this = $(this);
            var $total = $this.attr("data-total");
            var $icon = $this.attr("data-icon");
            var htmldata = "";

            $this.css("font-size", ($this.attr("data-font-size") + "px"));

            var i;
            for (i = 0; i < $total; i++) {
                htmldata += '<i class="fa ' + $icon + '"></i> ';
            }

            $this.html(htmldata);

            if (($().appear) && ($("body").hasClass("withAnimation"))) {
                $('.progress-icons').appear(function () {
                    var $this = $(this);
                    var $active = $this.attr("data-active");
                    var $icons = $this.find('i:lt(' + $active + ')');
                    var $delay = parseInt(validatedata($this.attr("data-delay"), 20))

                    var delay = $delay;
                    for (i = 0; i < $icons.length; i++) {
                        setTimeout((function (i) {
                            return function () {
                                i.style.color = $this.attr("data-icon-color");
                            }
                        })($icons[i]), delay);
                        delay += $delay;
                    }
                }, {accY: -100});
            } else {
                $this.each(function () {
                    var $active = $this.attr("data-active");
                    var $icons = $this.find('i:lt(' + $active + ')');
                    $icons.css('color', $this.attr("data-icon-color"))
                });
            }
        })

        if (($().appear) && ($("body").hasClass("withAnimation"))) {
            $('.progress').appear(function () {
            }, {accY: -100});
        } else {
            $('.progress').each(function () {
            });
        }


        /* ==================== */
        /* === PROGRESS BAR *=== */

        if (($().appear) && ($(".progress").length > 0)) {
            jQuery('.progress').appear(function () {
                var $this = jQuery(this);
                $this.each(function () {
                    var $innerbar = $this.find(".progress-bar");
                    var percentage = $innerbar.attr("data-percentage");

                    $innerbar.addClass("animating").css("width", percentage + "%");

                    $innerbar.on('transitionend webkitTransitionEnd oTransitionEnd otransitionend MSTransitionEnd', function () {
                        $this.find(".pro-level").fadeIn(600);
                    });

                });
            }, {accY: -100});
        }


    });

});