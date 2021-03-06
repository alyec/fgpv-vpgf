(() => {
    'use strict';
    /**
     * @module $mdDialog
     * @memberof material.components.dialog
     * @requires $delegate, $q
     * @description
     *
     * The `mdDialog` decorator modifies the angular material $mdDialog service
     */

    angular
        .module('material.components.dialog')
        .decorator('$mdDialog', mdDialog);

    function mdDialog($delegate, $q) {
        'ngInject';

        const origShow = $delegate.show;

        $delegate.show = show;
        return $delegate;

        /**
         * Modifies existing dialog show function such that focus is always correctly applied by
         * the focus manager to the opened dialog by default, unless the 'focusOnOpen' option is explicitly false.
         *
         * @private
         * @function show
         * @param      {Object}     opts angular material optionsOrPreset object https://material.angularjs.org/latest/api/service/$mdDialog
         * @return     {Promise}    resolves to undefined when the opening dialog animation is complete
         */
        function show(opts) {
            return $q(resolve => {
                opts.focusOnOpen = opts.focusOnOpen === false ? false : true;
                opts.onComplete = (_, element) => {
                    // newly created focus trap tabindex must be -1 as required by focus manager for all focusable elements
                    element
                        .find('.md-dialog-focus-trap')
                        .attr('tabindex', -1);

                    element
                        .find('md-dialog')
                        .attr('rv-trap-focus', '')
                        .focus(opts.focusOnOpen);
                    resolve();
                };
                origShow(opts);
            });
        }
    }
})();
