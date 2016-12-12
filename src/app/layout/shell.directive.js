(() => {
    'use strict';

    /**
     * @module rvShell
     * @memberof app.layout
     * @restrict E
     * @description
     *
     * // TODO: update comments since it's a directive now and much had changed.
     * The `ShellController` controller handles the shell which is the visible part of the layout.
     * `self.isLoading` is initially `true` and causes the loading overlay to be displayed; when `configService` resolves, it's set to `false` and the loading overly is removed.
     */
    angular
        .module('app.layout')
        .directive('rvShell', rvShell);

    function rvShell($rootElement, $rootScope, events, storageService, stateManager, configService, layoutService) {
        const directive = {
            restrict: 'E',
            templateUrl: 'app/layout/shell.html',
            scope: {},
            link: link,
            controller: Controller,
            controllerAs: 'self',
            bindToController: true
        };

        return directive;

        function link(scope, el) {
            const self = scope.self;

            // open legend panel if option is set in config for current viewport
            configService.getCurrent().then(config => {
                if (config.legendIsOpen && config.legendIsOpen[layoutService.currentLayout()]) {
                    stateManager.setActive({ side: false }, 'mainToc');
                }
            });

            storageService.panels.shell = el;

            // boolean used by touch mode toggle, true if touch mode is active
            self.isTouch = $rootElement.hasClass('rv-touch');
            self.toggleTouch = () => {
                if (self.isTouch) {
                    $rootElement.removeClass('rv-touch');
                } else {
                    $rootElement.addClass('rv-touch');
                }
                self.isTouch = !self.isTouch;
            };

            // fix for IE 11 where focus can move to esri generated svg elements
            $rootScope.$on(events.rvApiReady, () => {
                $rootElement.find('.rv-esri-map svg').attr('focusable', false);
            });

            $rootElement.on('keydown', event => {
                // detect if any side panels are open, if so ignore escape key (side panel has own listener and will continue to close)
                const mdSidePanelOpen = $('md-sidenav').toArray().find(el => !$(el).hasClass('md-closed'));
                if (event.which === 27 && !mdSidePanelOpen) {
                    scope.$apply(() => {
                        stateManager.closePanelFromHistory();
                    });
                } else if ([9, 13, 37, 38, 39, 40, 187, 189].find(x => x === event.which)) {
                    $rootElement.addClass('rv-keyboard');
                    $rootElement.on('mousemove', () => {
                        $rootElement.removeClass('rv-keyboard');
                        $rootElement.off('mousemove');
                    });
                }
            });
        }
    }

    // ignore jshint maxparams options
    // FIXME: refactoring out shell directive into more manageable piece
    function Controller($mdDialog, $translate, version, sideNavigationService, geoService, // jshint ignore:line
        fullScreenService, helpService, basemapService, configService, storageService, exportService,
        $rootScope, events, stateManager, $rootElement) {
        'ngInject';
        const self = this;

        self.geoService = geoService;
        self.version = version;
        self.minimize = sideNavigationService.close;
        self.translate = tag => $translate.instant('focus.dialog.' + tag);

        // set side nav menu items
        setDefaultItems();
        setCustomItems();

        // if language change, reset menu item
        $rootScope.$on(events.rvLangSwitch, () => {
            setDefaultItems();
            setCustomItems();
        });
        /**
         * Set default menu items
         *
         * @function setDefaultItems
         */
        function setDefaultItems() {
            self.menu = [{
                name: 'Options',
                type: 'heading',
                children: [{
                    name: $translate.instant('sidenav.label.fullscreen'),
                    type: 'link',
                    action: () => {
                        sideNavigationService.close();
                        fullScreenService.toggle();
                    },
                    icon: 'navigation:check',
                    class: 'rv-has-icon',
                    showIcon: fullScreenService.isExpanded,
                    show: () => !$rootElement.attr('rv-fullpage-app')
                },
                {
                    name: $translate.instant('appbar.tooltip.layers'),
                    type: 'link',
                    action: () => {
                        sideNavigationService.close();
                        stateManager.setActive('mainToc');
                    },
                    icon: 'navigation:check',
                    class: 'rv-has-icon',
                    showIcon: () => stateManager.state.mainToc.active
                },
                {
                    name: $translate.instant('nav.label.basemap'),
                    type: 'link',
                    action: basemapService.open
                }]
            },
            {
                name: $translate.instant('sidenav.label.help'),
                type: 'link',
                action: helpService.open
            }];
        }

        /**
         * Set custom menu items
         *
         * @function setCustomItems
         */
        function setCustomItems() {
            configService.getCurrent().then(data => {
                self.markerImageSrc = data.logoUrl;

                if (data.services.exportMapUrl) {
                    self.menu[0].children.push({
                        name: $translate.instant('sidenav.label.export'),
                        type: 'link',
                        action: () => {
                            sideNavigationService.close();
                            exportService.open();
                        }
                    });
                }

                if (data.shareable) {
                    self.menu[0].children.push({
                        name: $translate.instant('sidenav.label.share'),
                        type: 'link',
                        action: event => {
                            sideNavigationService.close();

                            $mdDialog.show({
                                controller: sideNavigationService.ShareController,
                                controllerAs: 'self',
                                templateUrl: 'app/ui/sidenav/share-dialog.html',
                                parent: storageService.panels.shell,
                                disableParentScroll: false,
                                targetEvent: event,
                                clickOutsideToClose: true,
                                fullscreen: false
                            });
                        },
                        icon: 'social:share',
                        class: 'rv-has-icon'
                    });
                }
            });
        }
    }
})();
