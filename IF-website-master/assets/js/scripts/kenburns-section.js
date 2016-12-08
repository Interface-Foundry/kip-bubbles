jQuery(document).ready(function () {
    "use strict";
    $ = jQuery.noConflict();

    var $devicewidth = (window.innerWidth > 0) ? window.innerWidth : screen.width;
    var $deviceheight = (window.innerHeight > 0) ? window.innerHeight : screen.height;


    function makekenburns($element) {
        // we set the 'fx' class on the first image
        // when the page loads
        $element.find('img')[0].className = "fx";
        // the third variable is to keep track of
        // where we are in the loop
        // if it is set to *1* (instead of 0)
        // it is because the first image is styled
        // when the page loads
        var images = $element.find('img'), numberOfImages = images.length, i = 1;
        if (numberOfImages == 1) {
            images[0].className = "singlefx";
        }
        // this calls the kenBurns function every
        // 4 seconds. You can increase or decrease
        // this value to get different effects
        window.setInterval(kenBurns, 7000);

        function kenBurns() {
            if (numberOfImages != 1) {
                if (i == numberOfImages) {
                    i = 0;
                }
                images[i].className = "fx";
                // we can't remove the class from the previous
                // element or we'd get a bouncing effect so we
                // clean up the one before last
                // (there must be a smarter way to do this though)
                if (i === 0) {
                    images[numberOfImages - 2].className = "";
                }
                if (i === 1) {
                    images[numberOfImages - 1].className = "";
                }
                if (i > 1) {
                    images[i - 2].className = "";
                }
                i++;
            }
        }
    }


    /* =================== */
    /* ==== KEN BURNS ==== */

    $(".media-section[data-type='kenburns']").each(function () {
        var $this = $(this);
        var $height = $this.attr("data-height");

        if ($height.indexOf("%") > -1) {
            $this.css('min-height', $deviceheight);
            $this.css('height', $deviceheight);
        } else {
            $this.css('min-height', $height + "px");
            $this.css('height', $height + "px");
        }
        if ($("body").hasClass("withAnimation") && $devicewidth > 767) {
            makekenburns($this.find('.media-section-image-container'));
        } else {
            var images = $this.find('.media-section-image-container img');
            images.each(function () {
                var image = $(this)

                if (!image.is(":first-child")) {
                    image.remove();
                }
            })
        }
    });




});