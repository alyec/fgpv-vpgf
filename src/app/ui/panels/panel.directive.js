(() => {

    /**
     * @ngdoc directive
     * @module rvFiltersPanel
     * @memberof app.ui
     * @description
     *
     * The `rvPanel` directive is reused by all the core panels of the viewer; main, side and filters.
     *
     * HTML example:
     * <rv-panel type="main" close-button="false"></rv-panel>
     */
    angular
        .module('app.ui.panels')
        .directive('rvPanel', rvPanel);

    /**
     * `rvPanel` directive body.
     *
     * @function rvPanel
     * @return {object} directive body
     */
    function rvPanel() {
        const directive = {
            restrict: 'E',
            templateUrl: function (element, attr) {
                return 'app/ui/panels/' + attr.type + '-panel.html';
            },
            scope: {
                closeButton: '@closeButton'
            },
            controller: Controller,
            controllerAs: 'self',
            bindToController: true
        };

        return directive;
    }

    /**
     * Skeleton controller function.
     * @function Controller
     */
    function Controller($attrs, stateManager) {
        'ngInject';
        const self = this;

        self.closePanel = self.closeButton !== 'false' ? closePanel : undefined;

        /**
         * Temporary function to close the panel.
         * @function closePanel
         * FIXME: this should be handled in the shatehelper
         */
        function closePanel() {
            stateManager.setActive($attrs.type);
        }
    }
})();
