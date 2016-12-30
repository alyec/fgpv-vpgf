(() => {

    // this is a default configuration of the side menu
    // options are grouped into sections and will be rendered as distinct lists in the side menu panel
    const SIDENAV_CONFIG_DEFAULT = {
        items: [
            [
                'layers',
                'basemap'
            ],
            [
                'fullscreen',
                'export',
                'share',
                'touch',
                'help'
            ],
            [
                'language'
            ]
        ]
    };

    /**
     * @ngdoc service
     * @module sideNavigationService
     * @memberof app.ui
     *
     * @description
     * The `sideNavigationService` service provides access and controls the side navigation menu.
     *
     */
    angular
        .module('app.ui')
        .factory('sideNavigationService', sideNavigationService);

    /**
     * `sideNavigationService` exposes methods to close/open the side navigation panel.
     * @param  {object} $mdSidenav
     * @return {object} service object
     */
    // need to find a more elegant way to include all these dependencies
    // jshint maxparams:15
    function sideNavigationService($mdSidenav, $rootScope, $rootElement, globalRegistry, configService, events,
        stateManager, basemapService, fullScreenService, exportService, storageService, helpService, reloadService,
        translations, $mdDialog) {

        const service = {
            open,
            close,
            toggle,

            config: {},
            controls: {},

            ShareController
        };

        service.controls = {
            layers: {
                type: 'link',
                label: 'appbar.tooltip.layers',
                icon: 'maps:layers',
                isChecked: () => stateManager.state.mainToc.active,
                action: () => {
                    service.close();
                    stateManager.setActive('mainToc');
                }
            },
            basemap: {
                type: 'link',
                label: 'nav.label.basemap',
                icon: 'maps:map',
                action: () => {
                    service.close();
                    basemapService.open();
                }
            },
            export: {
                type: 'link',
                label: 'sidenav.label.export',
                icon: 'community:export',
                action: () => {
                    service.close();
                    exportService.open();
                }
            },
            share: {
                type: 'link',
                label: 'sidenav.label.share',
                icon: 'social:share',
                action: () => {
                    service.close();

                    $mdDialog.show({
                        controller: service.ShareController,
                        controllerAs: 'self',
                        templateUrl: 'app/ui/sidenav/share-dialog.html',
                        parent: storageService.panels.shell,
                        disableParentScroll: false,
                        clickOutsideToClose: true,
                        fullscreen: false
                    });
                }
            },
            fullscreen: {
                type: 'link',
                label: 'sidenav.label.fullscreen',
                icon: 'navigation:fullscreen',
                isHidden: $rootElement.attr('rv-fullpage-app'),
                isChecked: fullScreenService.isExpanded,
                action: () => {
                    // service.close();
                    fullScreenService.toggle();
                }
            },
            touch: {
                type: 'link',
                label: 'sidenav.label.touch',
                icon: 'action:touch_app',
                isChecked: () => $rootElement.hasClass('rv-touch'),
                action: () => $rootElement.toggleClass('rv-touch')
            },
            help: {
                type: 'link',
                label: 'sidenav.label.help',
                icon: 'community:help',
                action: () => {
                    service.close();
                    helpService.open();
                }
            },
            language: {
                type: 'group',
                label: 'sidenav.label.language',
                icon: 'action:translate',
                children: []
            }
        };

        init();

        // if language change, reset menu item
        $rootScope.$on(events.rvLangSwitch, init);

        return service;

        function ShareController($mdDialog, $rootElement, $http, configService) {
            'ngInject';
            const self = this;

            // url cache to avoid unneeded API calls
            const URLS = {
                short: undefined,
                long: undefined
            };

            self.bookmarkClicked = bookmarkClicked;
            self.switchChanged = switchChanged;
            self.close = $mdDialog.hide;

            getLongLink();

            // fetch googleAPIKey - if it exists the short link switch option is shown
            configService.getCurrent().then(conf =>
                self.googleAPIUrl = conf.googleAPIKey ?
                    `https://www.googleapis.com/urlshortener/v1/url?key=${conf.googleAPIKey}` : null
            );

            /**
            * Handles onClick event on URL input box
            * @function switchChanged
            * @param    {Boolean}    value   the value of the short/long switch option
            */
            function switchChanged(value) {
                self.linkCopied = false;
                return value ? getShortLink() : getLongLink();
            }

            /**
            * Fetches a long url from the page if one has not yet been cached
            * @function getLongLink
            */
            function getLongLink() {
                if (typeof URLS.long === 'undefined') { // no cached url exists
                    globalRegistry.getMap($rootElement.attr('id')).getBookmark().then(bookmark =>
                        URLS.long = self.url = window.location.href.split('?')[0] + '?rv=' + String(bookmark)
                    );
                } else { // cache exists
                    self.url = URLS.long;
                }
            }

            /**
            * Fetches a short url from the Google API service if one has not yet been cached
            * @function getShortLink
            */
            function getShortLink() {
                // no cached url exists - making API call
                if (typeof URLS.short === 'undefined') {
                    $http.post(self.googleAPIUrl, { longUrl: self.url })
                        .then(r => URLS.short = self.url = r.data.id)
                        .catch(() => URLS.short = undefined); // reset cache from failed API call);
                // cache exists, API call not needed
                } else {
                    self.url = URLS.short;
                }
            }

            /**
            * Handles onClick event on URL input box
            * @function bookmarkClicked
            * @param    {Object}    event   the jQuery onClick event
            */
            function bookmarkClicked(event) {
                // select/highlight the URL link
                $(event.currentTarget).select();
                // try to automatically copy link - if successful display message
                self.linkCopied = document.execCommand('copy');
            }
        }

        /**
         * Opens side navigation panel.
         * @function open
         */
        function open() {
            $mdSidenav('left')
                .open()
                .then(() => $('md-sidenav[md-component-id="left"] button').first().focus(true));
        }

        /**
         * Closes side navigation panel.
         * @function close
         */
        function close() {
            return $mdSidenav('left').close();
        }

        // FIXME: write a proper toggle function
        /**
         * Toggles side navigation panel.
         *
         * @function toggle
         * @param  {object} argument [description]
         */
        function toggle(argument) {
            console.log(argument);
        }

        /**
         * Set up initial mapnav cluster buttons.
         * Set up language change listener to update the buttons when a new config is loaded.
         *
         * @function init
         * @private
         */
        function init() {
            setupSidenavButtons();
            setupLanguages();
        }

        /**
         * Merges a sidemenu snippet from the config file with the default configuration. This is a shallow extend and the top-level properties (`items` will be overwritten). Supplying an empty array as `items` will remove all the menu options.
         *
         * @function setupSidenavButtons
         * @function private
         */
        function setupSidenavButtons() {
            configService.getCurrent().then(data => {
                service.config = angular.extend({}, SIDENAV_CONFIG_DEFAULT, data.sideMenu);

                // all menu items should be defined in the config's ui section
                // should we account for cases when the export url is not specified, but export option is enabled in the side menu thought the config and hide it ourselves?
                // or just let it failed
                // or do these checks together with layer definition validity checks and remove export from the sidemenu options at that point
                service.controls.export.isHidden = !data.services.exportMapUrl;
                // shareable should be deprecated;
                service.controls.share.isHidden = !data.shareable;
            });
        }

        /**
         * Generate the language selector menu
         *
         * @function setupLanguages
         * @private
         */
        function setupLanguages() {
            // get languages available from configService
            const langs = configService.getLanguages();

            service.controls.language.children = langs.map(l =>
                ({
                    type: 'link',
                    label: translations[l].lang[l.substring(0, 2)],
                    action: switchLanguage,
                    isChecked: isCurrentLanguage,
                    value: l
                }));

            /**
             * Switches the language to the language represented by the sidemenu language control object.
             *
             * @function switchLanguage
             * @param {Object} control sidemenu language control object
             * @private
             */
            function switchLanguage(control) {
                // reload service with the new language and close side panel
                reloadService.loadNewLang(control.value);
                service.close();
            }

            /**
             * Checks if the provided sidemenu language control object represents the currently selected language
             *
             * @function isCurrentLanguage
             * @private
             * @param {Object} control sidemenu language control object
             * @return {Boolean} true is sidemenu language control object represents the currently selected language
             */
            function isCurrentLanguage(control) {
                return control.value === configService.currentLang();
            }
        }
    }
})();
