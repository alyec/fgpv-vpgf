(() => {
    'use strict';

    const STATE_OBJECT_DEFAULTS = (parentName, displayName) => {
        if (parentName) {
            return {
                parent: parentName,
                active: false,
                activeSkip: false,
                display: displayName
            };
        } else {
            return {
                active: false,
                activeSkip: false,
                morph: 'default',
                morphSkip: false,
                history: []
            };
        }
    };

    const DISPLAY_OBJECT_DEFAULTS = data => {
        return {
            isLoading: false,
            requester: null,
            requestId: null,
            data: data || null
        };
    };

    /**
     * @member initialState
     * @memberof app.common
     * @description
     *
     * The `initialState` constant service provides default stateManager state values.
     */
    /**
     * @member initialDisplay
     * @memberof app.common
     * @description
     *
     * The `initialDisplay` constant service provides default stateManager display value.
     */
    angular
        .module('app.common.router')
        .constant('initialState', {
            // `service.state` holds the state of the panel and content panes;
            // `active` indicates whether the panel/pane is open/visible or not;
            // `activeSkip` is a boolean flag indicating whether the animation on changes to the `active` should be skipped
            // `parent` links a pane to its parent panel; main panel can display three panes, for example, toc, toolbox, and details; only one pane can be active at a time;
            // `morph` indicates the mode of the panel; filters panel has three different modes: 'full', 'default', and 'minimized'; filters panel's modes specify different height for the panel; its changes are also animated;
            // `morphSkip` is a boolean flag indicating whether the animation on changes to the `morph` should be skipped
            // `history` keeps track of pane names opened in a panel; limit of 10 items;
            // 'displayName' links panel to a certain display object; several panels can target the same display object;

            main: STATE_OBJECT_DEFAULTS(),
            mainToc: STATE_OBJECT_DEFAULTS('main'),
            mainToolbox: STATE_OBJECT_DEFAULTS('main'),
            mainDetails: STATE_OBJECT_DEFAULTS('main', 'details'),
            mainLoaderFile: STATE_OBJECT_DEFAULTS('main'),
            mainLoaderService: STATE_OBJECT_DEFAULTS('main'),
            side: STATE_OBJECT_DEFAULTS(),
            sideMetadata: STATE_OBJECT_DEFAULTS('side', 'metadata'),
            sideSettings: STATE_OBJECT_DEFAULTS('side', 'settings'),
            filters: STATE_OBJECT_DEFAULTS(),
            filtersFulldata: STATE_OBJECT_DEFAULTS('filters', 'filters'),
            filtersNamedata: STATE_OBJECT_DEFAULTS('filters'),
            other: STATE_OBJECT_DEFAULTS(),
            otherBasemap: STATE_OBJECT_DEFAULTS('other'),
            mapnav: STATE_OBJECT_DEFAULTS(),
            help: STATE_OBJECT_DEFAULTS()
        })
        .constant('initialDisplay', {
            // TODO: add a unit test to check mapping between display options and layer toggles
            // `service.display` holds data to be displayed in metadata, details, filters, and settings panes;
            // `isLoading` is a boolean flag to be bound to `isLoading` property on `contentPane` directive; setting it to 'true', will display a loading indicator and hide pane's content; `false` reverse that;
            // `requester` an optional object used to pass display data; can be used to pass the layer name to the filters panel while the main data is still loading;
            // `requestId` is the id of the data request; used for check that the requested data is still required in case of async calls;
            // `data` is a data object to be displayed in the content pane;

            filters: DISPLAY_OBJECT_DEFAULTS({
                columns: null,
                data: null
            }),
            metadata: DISPLAY_OBJECT_DEFAULTS(),
            settings: DISPLAY_OBJECT_DEFAULTS(),
            details: DISPLAY_OBJECT_DEFAULTS()
        });
})();
