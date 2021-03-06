(() => {
    'use strict';

    /**
     * @module basemapService
     * @memberof app.ui
     * @description
     *
     * The `basemapService` is responsible for providing a list of selectable basemaps, and tracking
     * the currently selected basemap.
     *
     */
    angular
        .module('app.geo')
        .factory('basemapService', basemapService);

    function basemapService($rootScope, events, configService, $translate, $injector, $mdSidenav, $q) {

        let bmSelected; // the current selected basemap
        let initialBasemapId;
        let closePromise;

        const onChangeCallback = [];
        const projections = [];
        const service = {
            select,
            getSelected,
            reload,
            setOnChangeCallback,
            open,
            close,
            toggle,
            isOpen,
            onClose: () => closePromise // returns promise that resolves when panel has closed (by any means)
        };

        return service;

        /**
         * Opens basemap panel.
         * @function open
         * @return  {Promise}   resolves to undefined when panel animation is complete
         */
        function open() {
            closePromise = $q($mdSidenav('right').onClose);
            return $mdSidenav('right')
                .open()
                // Once the side panel is open it hides the basemap mapnav button, so set focus on the panel
                .then(() => $('md-sidenav[md-component-id="right"] button').first().focus(true));
        }

        /**
         * Closes basemap panel.
         * @function close
         * @return  {Promise}   resolves to undefined when panel animation is complete
         */
        function close() {
            return $mdSidenav('right').close();
        }

        /**
         * Toggles basemap panel open/close.
         * @function toggle
         * @return  {Promise}   resolves to undefined when panel animation is complete
         */
        function toggle() {
            return isOpen() ? close() : open();
        }

        /**
         * Determines if the basemap panel is currently open/opening or closed/closing
         * @function toggle
         * @return  {Boolean}   true iff open/opening, false otherwise
         */
        function isOpen() {
            return $mdSidenav('right').isOpen();
        }

        /**
         * Returns the projection name given a basemap wkID as defined in translations,
         * or 'Other' if not found
         * @function wkidToName
         * @private
         * @param   {Number}    wkID    the basemap wkID from which to derive a name
         * @return  {String}    the translated basemap projection name
         */
        function wkidToName(wkID) {
            const translationID = `wkids.${wkID}`;
            const translationStr = $translate.instant(translationID);

            return translationID !== translationStr ? translationStr : $translate.instant('wkids.other');
        }

        /**
         * Sets a callback function that is called whenever basemaps changes.
         *
         * @function setOnChangeCallback
         * @param {Function} cb   a callback function which takes an optional parameter containing
         *                        the list of projections
         */
        function setOnChangeCallback(cb) {
            onChangeCallback.push(cb);
        }

        /**
         * Rebuilds the list of basemaps and projections based on the current configuration.
         * @function reload
         */
        function reload() {
            projections.length = 0;
            configService.getCurrent().then(conf => {
                initialBasemapId = conf.map ? conf.map.initialBasemapId : null;
                _addBaseMaps(conf.baseMaps);
            });
        }

        /**
         * Set the provided basemap as selected and update the map
         *
         * @function select
         * @param {Object} basemap   the basemap object to set as selected
         */
        function select(basemap) {
            bmSelected.selected = false; // set current basemap to unselected
            bmSelected = basemap;
            bmSelected.selected = true;

            if ($injector.get('geoService').baseMapHasSameSP(basemap.id)) { // avoid circular dependency
                $injector.get('geoService').selectBasemap(basemap); // avoid circular dependency
            } else {
                // avoiding circular dependency on bookmarkService
                $injector.get('reloadService').loadNewProjection(basemap.id); // avoid circular dependency
            }
        }

        /**
         * Get the currently selected basemap
         *
         * @function getSelected
         * @returns {Object}    the basemap that is currently selected
         */
        function getSelected() {
            return bmSelected;
        }

        /**
         * Organizes basemaps into projection groupings and inserts a blank basemap
         *
         * @function _addBaseMaps
         * @private
         * @param {Array} basemapList   A list of basemap objects
         */
        function _addBaseMaps(basemapList) {

            basemapList.forEach(bm => {
                const basemap = _normalizeBasemap(bm);
                const projName = wkidToName(basemap.wkid);
                let projection = projections.find(proj => proj.name === projName);
                // make first basemap selected by default
                bmSelected = typeof bmSelected === 'undefined' ? basemap : bmSelected;
                // create projection if one does not already exist
                if (!projection) {
                    projection = {
                        wkid: basemap.wkid,
                        name: projName,
                        basemaps: []
                    };
                    projections.push(projection);
                }

                // if config specifies a default basemap set to selected
                basemap.selected = initialBasemapId === basemap.id;
                bmSelected = basemap.selected ? basemap : bmSelected;

                projection.basemaps.push(basemap);
            });

            projections.forEach(p => p.basemaps.push({
                name: $translate.instant('basemap.blank.title'),
                description: $translate.instant('basemap.blank.desc'),
                type: 'blank',
                id: 'blank_basemap_' + p.basemaps[0].wkid,
                url: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7/',
                wkid: p.basemaps[0].wkid,
                selected: false,
                attribution: p.basemaps[0].attribution
            }));

            bmSelected.selected = true;
            onChangeCallback.forEach(cb => cb(projections, bmSelected));
        }
    }

    /**
     * Overwrites and adds properties to the basemap object provided by the config
     *
     * @function _normalizeBasemap
     * @private
     * @returns {Object}    the basemap object
     */
    function _normalizeBasemap(basemap) {
        return {
            name: basemap.name,
            description: basemap.description,
            type: basemap.type,
            id: basemap.id,
            url: basemap.layers[0].url,
            wkid: basemap.wkid,
            selected: false,
            attribution: basemap.attribution
        };
    }
})();
