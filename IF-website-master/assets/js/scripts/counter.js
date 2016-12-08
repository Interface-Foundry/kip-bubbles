/* ================== */
/* ==== COUNT TO *==== */

jQuery(document).ready(function () {
    "use strict";
    $ = jQuery.noConflict();

    if (($().appear) && ($(".timerCounter").length > 0)) {
        $('.timerCounter').appear(function () {
            $('.timerVal').each(function () {
                $(this).countTo();
            })
        })
    }

});