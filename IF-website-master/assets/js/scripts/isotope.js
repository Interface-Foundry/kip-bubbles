/* ================== */
/* ==== ISOTOPE *==== */

jQuery(document).ready(function () {
    "use strict";
    $ = jQuery.noConflict();


    if (($.Isotope) && ($('#blog-list.withMasonry').length > 0)) {

        jQuery(window).load(function () {

            // blog masonry

            var $blogContainer = $('#blog-list.withMasonry'), // object that will keep track of options
                isotopeOptions = {}, // defaults, used if not explicitly set in hash
                defaultOptions = {
                    itemSelector: '.blog-item',
                    layoutMode: 'sloppyMasonry',
                    resizable: false, // disable normal resizing
                    // set columnWidth to a percentage of container width
                    masonry: {}
                };


            $(window).smartresize(function () {
                $blogContainer.isotope({
                    // update columnWidth to a percentage of container width
                    masonry: {}
                });
            });

            // set up Isotope
            $blogContainer.isotope(defaultOptions, function () {

                // fix for height dynamic content
                setTimeout(function () {
                    $blogContainer.isotope('reLayout');
                }, 1000);

            });
        });
    }


    if (($.Isotope) && ($('#galleryContainer').length > 0)) {
        // gallery isotope

        jQuery(window).load(function () {

            var $container = jQuery('#galleryContainer'), // object that will keep track of options
                isotopeOptions = {}, // defaults, used if not explicitly set in hash
                defaultOptions = {
                    filter: '*',
                    itemSelector: '.galleryItem',
                    sortBy: 'original-order',
                    layoutMode: 'sloppyMasonry',
                    sortAscending: true,
                    resizable: false, // disable normal resizing
                    // set columnWidth to a percentage of container width
                    masonry: {}
                };


            $(window).smartresize(function () {
                $container.isotope({
                    // update columnWidth to a percentage of container width
                    masonry: {}
                });
            });

            // set up Isotope
            $container.isotope(defaultOptions);

            var $optionSets = jQuery('#galleryFilters'), isOptionLinkClicked = false;

            // switches selected class on buttons
            function changeSelectedLink($elem) {
                // remove selected class on previous item
                $elem.parents('.option-set').find('.btn-primary').removeClass('btn-primary');
                // set selected class on new item
                $elem.addClass('btn-primary');
            }


            $optionSets.find('a').click(function () {
                var $this = jQuery(this);
                // don't proceed if already selected
                if ($this.hasClass('btn-primary')) {
                    return;
                }
                changeSelectedLink($this);
                // get href attr, remove leading #
                var href = $this.attr('href').replace(/^#/, ''), // convert href into object
                // i.e. 'filter=.inner-transition' -> { filter: '.inner-transition' }
                    option = jQuery.deparam(href, true);
                // apply new option to previous
                jQuery.extend(isotopeOptions, option);
                // set hash, triggers hashchange on window
                jQuery.bbq.pushState(isotopeOptions);
                isOptionLinkClicked = true;
                return false;
            });


            var hashChanged = false;

            jQuery(window).bind('hashchange', function (event) {
                // get options object from hash
                var hashOptions = window.location.hash ? jQuery.deparam.fragment(window.location.hash, true) : {}, // do not animate first call
                    aniEngine = hashChanged ? 'best-available' : 'none', // apply defaults where no option was specified
                    options = jQuery.extend({}, defaultOptions, hashOptions, {animationEngine: aniEngine});
                // apply options from hash
                $container.isotope(options);
                // save options
                isotopeOptions = hashOptions;

                // if option link was not clicked
                // then we'll need to update selected links
                if (!isOptionLinkClicked) {
                    // iterate over options
                    var hrefObj, hrefValue, $selectedLink;
                    for (var key in options) {
                        hrefObj = {};
                        hrefObj[key] = options[key];
                        // convert object into parameter string
                        // i.e. { filter: '.inner-transition' } -> 'filter=.inner-transition'
                        hrefValue = jQuery.param(hrefObj);
                        // get matching link
                        $selectedLink = $optionSets.find('a[href="#' + hrefValue + '"]');
                        changeSelectedLink($selectedLink);
                    }
                }

                isOptionLinkClicked = false;
                hashChanged = true;
            })// trigger hashchange to capture any hash data on init
                .trigger('hashchange');

        });
    }

});