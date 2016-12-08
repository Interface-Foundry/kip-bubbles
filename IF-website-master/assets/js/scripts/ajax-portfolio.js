/* ================================ */
/* === AJAX PORTFOLIO ONE PAGER *=== */


jQuery(document).ready(function () {
    "use strict";
    $ = jQuery.noConflict();


    $("body").on("click", ".getAjaxItem", function () {
        var $this = $(this);
        var $galDetails = $("#galleryAjaxDetails");

        if ($galDetails.length <= 0) {
            return true;
        }

        var url = $this.attr("href") + " #ajaxContent";

        var $navbar = $('.navbar-fixed-top');
        var navHeight = 0;
        if ($navbar.length > 0) {
            navHeight = parseInt($navbar.height());
        }

        if (($galDetails).is(":visible")) {
            $galDetails.animate({opacity: 0}, 400, function () {
                $galDetails.load(url, function () {

                    $galDetails.delay(300).animate({opacity: 1}, 400, function () {
                        $('html,body').animate({
                            scrollTop: $galDetails.offset().top - navHeight
                        }, 600, 'swing');
                    });
                });
            });
        } else {
            $galDetails.slideUp(300, function () {
                $galDetails.load(url, function () {
                    $galDetails.delay(300).slideDown(700, function () {
                        $('html,body').animate({
                            scrollTop: $galDetails.offset().top - navHeight
                        }, 600, 'swing');
                    });
                });
            });
        }

        return false;
    })

    $("body").on("click", ".closeAjaxPortfolio", function () {
        var $galDetails = $("#galleryAjaxDetails");

        var $navbar = $('.navbar-fixed-top');
        var navHeight = 0;
        if ($navbar.length > 0) {
            navHeight = parseInt($navbar.height());
        }

        $galDetails.slideUp(300, function () {
            $('html,body').animate({
                scrollTop: $("#portfolio").offset().top - navHeight
            }, 600, 'swing');
        });
        return false;
    });


    $(document).ajaxStart(function () {
        $("#ct_preloader").addClass("ajax-inprogress").show();

    });

    $(document).ajaxStop(function () {
        setTimeout(function () {
            $("#ct_preloader").removeClass("ajax-inprogress").hide();
        }, 300);

        // init js after ajax stop
        $("#galleryAjaxDetails .content-area").each(function () {
            var $this = $(this);
            var bottomSpace = $this.attr("data-btmspace");
            var topSpace = $this.attr("data-topspace");

            if (validatedata(bottomSpace, false)) {
                $this.css("padding-bottom", bottomSpace + "px");
            }
            if (validatedata(topSpace, false)) {
                $this.css("padding-top", topSpace + "px");
            }
        })
        $("[data-toggle='tooltip']").tooltip();

    });


    /* ================================================ */
    /* =========== GROUP BUTTON PORTFOLIO  =========== */


    $(".btn-group #galleryFilters > li > a").on("click", function (e) {
        $(".btn-group .uppercase span").text($(this).data("text"));
        $(".btn-group").removeClass("open");
        return false;
    });

});

