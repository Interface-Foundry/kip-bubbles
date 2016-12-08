/* ========================== */
/* ==== HELPER FUNCTIONS ==== */





isIE = false;

var isiPad = (navigator.userAgent.match(/iPad/i) != null);


$.fn.isAfter = function (sel) {
	return this.prevAll(sel).length !== 0;
}
$.fn.isBefore = function (sel) {
	return this.nextAll(sel).length !== 0;
}




function validatedata($attr, $defaultValue) {
	if ($attr !== undefined) {
		return $attr
	}
	return $defaultValue;
}

function parseBoolean(str, $defaultValue) {
	if (str == 'true') {
		return true;
	}
	return $defaultValue;
	//return /true/i.test(str);
}





jQuery(document).ready(function () {
	"use strict";
	$ = jQuery.noConflict();

    var $devicewidth = (window.innerWidth > 0) ? window.innerWidth : screen.width;
    var $deviceheight = (window.innerHeight > 0) ? window.innerHeight : screen.height;




	/* ============================= */
	/* ==== SET ELEMENTS HEIGHT ==== */
	// flexslider
	$('.flexslider.std-slider').each(function () {
		var $this = $(this);
		$this.css('min-height', $this.attr('data-height') + "px");
	});

	// spacer element
	$('.spacer').each(function () {
		var $this = $(this);
		$this.css('height', $this.attr('data-height') + "px");
	});




	/* ================================== */
	/* ==== SET PADDING FOR SECTIONS ==== */

    $(".content-area, .parallaxSection").each(function () {
        var $this = $(this);
        var bottomSpace = $this.attr("data-btmspace");
        var topSpace = $this.attr("data-topspace");
        var bg = $this.attr("data-bg");

        if (validatedata(bottomSpace, false)) {
            $this.css("padding-bottom", bottomSpace + "px");
        }
        if (validatedata(topSpace, false)) {
            $this.css("padding-top", topSpace + "px");
        }
        if (validatedata(bg, false)) {
            $this.css('background-image', 'url("' + bg + '")');
        }
    })


    if ($(".parallaxSection.height100").length > 0) {

        $(".parallaxSection.height100").each(function () {

            var $this = $(this);
            $("#boxedWrapper, body").css("height", "100%");

            var menuHeight = 0;
            if ($this.isAfter(".navbar-default")) {
                menuHeight = $(".navbar-default").outerHeight();
            }
            if ($(".navbar-default").hasClass("navbar-fixed-top")) {
                menuHeight = 0;
            }


            var sliderHeight = $this.outerHeight() - menuHeight;
            var $slider = $this.find(".flexslider");

            $($this, $slider).css("height", sliderHeight);

        })
    }





	/* ========================= */
	/* ==== CLICKABLE TABLE ==== */

	$('.table-responsive tr').click(function () {
		var $this = $(this);
		if ($this.attr('data-link') !== undefined) {
			window.location = $this.attr('data-link');
		}
	});



	/* =============================== */
	/* ==== PLACEHOLDERS FALLBACK ==== */

	if ($().placeholder) {
		$("input[placeholder],textarea[placeholder]").placeholder();
	}

	/* ======================================= */
	/* === CLICKABLE MAIN PARENT ITEM MENU === */

	if(isiPad) {

	} else {
		jQuery(".navbar-default li.dropdown > .dropdown-toggle").removeAttr("data-toggle data-target");
	}

	$("body").on("click", ".navbar-default .dropdown", function () {
		var $this = $(this);

		if($this.hasClass("open")) {
			$this.find("> .dropdown-toggle").removeAttr("data-toggle data-target");
		}
	});


	/* ======================== */
	/* ==== ANIMATION INIT ==== */

	if ($().appear) {

		if (($.browser.mobile)||(isiPad)) {
			// disable animation on mobile
			$("body").removeClass("withAnimation");
		} else {

			$('.withAnimation .animated').appear(function () {
				var $this = $(this);
				$this.each(function () {
					$this.addClass('activate');
					$this.addClass($this.data('fx'));
				});
			}, {accX: 50, accY: -150});

		}
	}



    /* ================================= */
    /* ==== FIT VIDEOS TO CONTAINER ==== */

    if ($().fitVids) {
        $(".video").fitVids();
    }


    /* ==================================== */
    /* ==== FITVIDS - responsive video ==== */

    if (($().fitVids) && ($(".responsiveVideo").length > 0)) {
        $(".responsiveVideo").fitVids();
    }



	/* ======================= */
	/* ==== TOOLTIPS INIT ==== */

    $("[data-toggle='tooltip']").tooltip();


	/* ======================= */
	/* ==== TO TOP BUTTON ==== */


	$('#toTop').click(function () {
		$("body,html").animate({scrollTop: 0}, 600);
		return false;
	});

	$(window).scroll(function () {
		if ($(this).scrollTop() != 0) {
			$("#toTop").fadeIn(300);
		} else {
			$("#toTop").fadeOut(250);
		}
	});





    /* ================================================ */
    /* ============== ADD SNAP MENUS ================== */



    if ($devicewidth < 768) {

        var snapper = new Snap({
            element: document.getElementById('boxedWrapper')
        });

        snapper.settings({
            disable: "left",
            addBodyClasses: true
        });

        $('.navbar-toggle').click(function(){
            snapper.open('right');
        })
        $('.snap-drawers-button .navbar-toggle').click(function(){
            snapper.close();
        })
    }



    /* ============================ */
    /* ==== SECTION BACKGROUND ==== */

    $(".section").each(function () {
        var $this = $(this);
        $this.css('background-color', $this.attr("data-bg-color"));
    })
    $(".section-top").each(function () {
        var $this = $(this);
        $this.css('background-color', $this.attr("data-bg-color"));
    })
    $(".section-bottom").each(function () {
        var $this = $(this);
        $this.css('background-color', $this.attr("data-bg-color"));
    })

    $(".media-section[data-type='background']").each(function () {
        var $this = $(this);
        $this.css('background-image', 'url("' + $this.attr("data-image") + '")');
    })

    /* ============================ */
    /* ==== MAGNIFIC POPUP ==== */


    if ($().magnificPopup) {
        $('.magnificpopup').each(function () {
            var $this = $(this);
            var $type = $this.attr('data-type');
            $this.magnificPopup({
                type: $type, closeOnContentClick: true, closeBtnInside: true, fixedContentPos: true, mainClass: 'mfp-no-margins mfp-with-zoom', // class to remove default margin from left and right side
                image: {
                    verticalFit: true
                }
            });
        })
    }



});


/* / document ready */







