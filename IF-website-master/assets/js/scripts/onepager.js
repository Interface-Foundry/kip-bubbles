
/* =================== */
/* ==== ONE PAGER *==== */


jQuery(document).ready(function () {
    "use strict";
    $ = jQuery.noConflict();

    if(device.mobile()){
        $('.navbar-fixed-top').removeClass('navbar-fixed-top');
        $('.navbar-transparent').removeClass('navbar-transparent');
    }

    var $logoimage = $(".navbar-brand img");
    var oldsrc = '';

    function swapMenu(mode) {

        var animDuration = 50;
        if (isiPad) {
            animDuration = 0;
        }

        if (mode == "init") {
            $logoimage = $(".navbar-brand img");
            oldsrc = $logoimage.attr('src');
        }

        if ((mode == "standardMenu") && (!($.browser.mobile))) {
            $(".navbar-transparent").removeClass("navbar-transparent");
            if (!($logoimage.hasClass("swaped"))) {

                $logoimage.fadeOut(animDuration, function () {
                    $logoimage.attr('src', $logoimage.parent().attr("data-logo"));
                    $logoimage.fadeIn(animDuration).addClass("swaped");
                });
            }
        }
        if ((mode == "fixedMenu") && (!($.browser.mobile))) {
            $onepagerNav.addClass("navbar-transparent");
            $logoimage.attr('src', oldsrc);
            $logoimage.removeClass("swaped");
        }
    }


    var onepagerNavClass = "navbar-onepager";
    var $onepagerNav = $("." + onepagerNavClass);

    if (($onepagerNav.length > 0)) {

        var scrollOffset = 0;
        var navHeightSpecial = 0;
        navHeightSpecial = parseInt($('.navbar-default').height());

        if (!($.browser.mobile)) {

            // ipad landscape
            if ($(window).width() < 800) {
                navHeightSpecial = parseInt($('.navbar-default').height());
            }

        } else {
            $(".navbar-fixed-top").removeClass(onepagerNavClass).removeClass("navbar-transparent").addClass("navbar-static-top");
            $logoimage.fadeOut(50, function () {
                $logoimage.attr('src', $logoimage.parent().attr("data-logo"));
                $logoimage.fadeIn(50).addClass("swaped");
            });


            scrollOffset = parseInt($('.navbar-default').height());
        }

        $('.nav.navbar-nav li a').click(function () {
            // if mobile and menu open - hide it after click
            var $togglebtn = $(".navbar-toggle");

            if (!($togglebtn.hasClass("collapsed")) && ($togglebtn.is(":visible"))) {
                $(".navbar-toggle").trigger("click");
            }

            var $this = $(this);

            var content = $this.attr('href');

            var myUrl = content.match(/^#([^\/]+)$/i);

            if ($(content).length > 0) {
                if (myUrl) {
                    if ($.browser.mobile) {
                        navHeightSpecial = parseInt($('.navbar-default').height());
                    }

                    var goPosition = $(content).offset().top + scrollOffset - navHeightSpecial;

                    $('html,body').stop().animate({scrollTop: goPosition}, 1000, 'easeInOutExpo', function () {
                        $this.closest("li.onepager").addClass("active");
                    });


                } else {
                    window.location = content;
                }

                return false;
            }
        });


        $(window).on('scroll', function () {

            var menuEl, mainMenu = $onepagerNav, mainMenuHeight = mainMenu.outerHeight() + 5;
            var menuElements = mainMenu.find('a');

            var scrollElements = menuElements.map(function () {

                var content = $(this).attr("href");
                var myUrl = content.match(/^#([^\/]+)$/i);

                if (myUrl) {

                    var item = $($(this).attr("href"));
                    if (item.length) {
                        return item;
                    }

                }
            });

            var fromTop = $(window).scrollTop() + mainMenuHeight;

            var currentEl = scrollElements.map(function () {
                if ($(this).offset().top < fromTop) {
                    return this;
                }
            });

            currentEl = currentEl[currentEl.length - 1];
            var id = currentEl && currentEl.length ? currentEl[0].id : "";
            if (menuEl !== id) {
                menuElements.parent().removeClass("active").end().filter("[href=#" + id + "]").parent().addClass("active");
            }

            var scroll = $(window).scrollTop();
            if (scroll > 0) {
                swapMenu("standardMenu");
            } else {
                swapMenu("fixedMenu");
            }

        });


        swapMenu("init");
        var scroll = $(window).scrollTop();
        if ((scroll > 0) && (!isiPad)) {
            swapMenu("standardMenu");
        }

        // ipad hack to swap menus
        document.addEventListener("touchmove", ScrollStart, false);

    } else{
        $(window).on('scroll', ScrollStart)

    }
    function ScrollStart() {
        swapMenu("standardMenu");
    }


});