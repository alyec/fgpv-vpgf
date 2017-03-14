(() => {
    'use strict';

    /**
     * @module ConfigObject
     * @memberof app.core
     * @requires dependencies
     * @description     *
     *
     */
    angular
        .module('app.core')
        .factory('ConfigObject', ConfigObjectFactory);

    function ConfigObjectFactory(gapiService) {

        class LodSet {
            constructor({ id, lods }) {
                this._id = id;
                this._lods = lods;
            }

            get id () { return this._id; }
            get lods () { return this._lods; }
        }

        /**
         * @param {Object} spatialReference spatialreference object in the form of { wkid: <Number> }
         */
        class ExtentSet {
            constructor({ id, spatialReference, default: _default, full, maximum }) {
                this._id = id;
                this._spatialReference = spatialReference;

                this._default = this._parseExtent(_default);
                this._full = this._parseExtent(full) || this._default;
                this._maximum = this._parseExtent(maximum) || this._default;
            }

            get id () { return this._id; }
            get spatialReference () { return this._spatialReference; }

            get default () { return this._default; }
            get full () { return this._full; }
            get maximum () { return this._maximum; }

            _parseExtent(extent) {
                const completeExtent = angular.extend(
                    {},
                    extent, {
                    spatialReference: this._spatialReference
                });

                return gapiService.gapi.mapManager.getExtentFromJson(completeExtent);
            }
        }

        class TileSchema {
            constructor({ id, lodSetId, name }, extentSet, lodSet) {
                this._id = id;
                this._name = name;
                this._lodSetId = lodSetId;

                this._extentSet = extentSet;
                this._lodSet = lodSet;
            }

            get name () { return this._name; }
            get id () { return this._id; }

            get extentSet () { return this._extentSet; }
            get lodSet () { return this._lodSet; }

            // TODO: it's not yet decided how the blank basemap will be made; see arc room for notes
            makeBlankBasemap() {
                return new Basemap({
                    name: $translate.instant('basemap.blank.title'),
                    description: $translate.instant('basemap.blank.desc'),
                    type: 'blank',
                    id: `blank_basemap_${this._id}`,
                    url: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7/',
                    attribution: '',
                    tileSchema: this
                });
            }
        }

        class Basemap {
            constructor({ id, name, description, type, layers, attribution }, tileSchema) {
                this._id = id;
                this._name = name;
                this._description = description;
                this._type = type;
                this._layers = layers;
                this._url = layers[0].url;
                this._attribution = attribution;
                this._tileSchema = tileSchema;
            }

            _isSelected = false;

            get id () { return this._id ;}
            get name () { return this._name; }
            get description () { return this._description; }
            get type () { return this._type; }
            get layers () { return this._layers; }
            get url () { return this._url; }
            get attribution () { return this._attribution; }
            get tileSchema () { return this._tileSchema; }

            get isSelected () { return this._isSelected; }
            select() { this._isSelected = true; return this; }
            deselect() { this._isSelected = false; return this; }

            // convenience functions
            get lods () { return this._tileSchema.lodSet.lods; }

            get wkid () { return this._tileSchema.extentSet.spatialReference.wkid; }
            get default () { return this._tileSchema.extentSet.default; }
            get full () { return this._tileSchema.extentSet.full; }
            get maximum () { return this._tileSchema.extentSet.maximum; }
        }

        class Map {
            constructor(mapSource) {
                this._source = mapSource;

                this._extentSets = mapSource.extentSets.map(extentSetSource =>
                    (new ExtentSet(extentSetSource)));

                this._lodSets = mapSource.lodSets.map(lodSetSource =>
                    (new LodSet(lodSetSource)));

                this._tileSchemas = mapSource.tileSchemas.map(tileSchemaSource => {
                    const extentSet = this._extentSets.find(extentSet =>
                        extentSet.id === tileSchemaSource.extentSetId)

                    const lodSet = this._lodSets.find(lodSet =>
                        lodSet.id === tileSchemaSource.lodSetId);

                    const tileSchema = new TileSchema(tileSchemaSource, extentSet, lodSet);

                    return tileSchema;
                });

                // TODO: if basemaps are optional, here we need to generate a blank basemap for every tileSchema
                this._basemaps = mapSource.baseMaps.map(basemapSource => {
                    const tileSchema = this._tileSchemas.find(tileSchema =>
                        tileSchema.id === basemapSource.tileSchemaId);

                    const basemap = new Basemap(basemapSource, tileSchema);

                    return basemap;
                });

                // calling select on a basemap only marks it as `selected`; to actually change the displayed basemap, call `changeBasemap` on `geoService`
                (mapSource.initialBasemapId ?
                    this._basemaps.find(basemap =>
                        basemap.id === this._initialBasemapId) :
                    this._basemaps[0])
                    .select();

                // TODO: parser legend, layers, and components subsections
            }

            get source () { return this._source; }

            get tileSchemas () { return this._tileSchemas; }
            get basemaps () { return this._basemaps; }
            get extentSets () { return this._extentSets; }
            get lodSets () { return this._lodSets; }

            get selectedBasemap () { return this._basemaps.find(basemap => basemap.isSelected); }
        }

        class ConfigObject {
            /**
             *
             * @param {Object} configSource vanilla json config object loaded into the app by the ConfigService
             */
            constructor (configSource) {
                this._source = configSource;

                this._map = new Map(configSource.map);

                // TODO: parse ui and services sections
            }

            /**
             * Returns orignal JOSN source of the config object.
             * @return {Object} original json config object
             */
            get source () { return this._source; }

            get map () { return this._map; }
            get ui () { return this._ui; }
            get services () { return this._services; }

        }

        return ConfigObject;
    }
})();
