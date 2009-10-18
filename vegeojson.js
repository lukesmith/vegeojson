/// <reference path="VeJavaScriptIntellisenseHelper.js" />

var VEGeoJSON = function(map) {
    var createPointShape = function(geometry) {
        /// <summary>Creates a VEShape from a Point geometry
        /// </summary>
        /// <param name="geometry" type="Object">GeoJSON Geometry</param>
        /// <returns type="VEShape" />
        return new VEShape(VEShapeType.Pushpin, new VELatLong(geometry.coordinates[1], geometry.coordinates[0]));
    };

    var createMultiPointShapes = function(geometry, onShapeCreated) {
        /// <summary>Creates a VEShape for each point in the Multipoint geometry
        /// </summary>
        /// <param name="geometry" type="Object">GeoJSON Geometry</param>
        /// <returns type="VEShape" />
        var points = [];
        for (var i = 0; i < geometry.coordinates.length; i++) {
            var point = geometry.coordinates[i];
            var shape = new VEShape(VEShapeType.Pushpin, new VELatLong(point[1], point[0]));

            if (shape !== null) {
                onShapeCreated.call(this, geometry, shape);
            }

            points.push(shape);
        }
        return points;
    };

    var createPolygonShape = function(geometry) {
        /// <summary>Creates a VEShape from a polygon geometry
        /// </summary>
        /// <param name="geometry" type="Object">GeoJSON Geometry</param>
        /// <returns type="VEShape" />
        var polygon = geometry.coordinates[0];
        var latLngs = new Array(polygon.length);
        for (var i = 0; i < polygon.length; i++) {
            latLngs[i] = new VELatLong(polygon[i][1], polygon[i][0]);
        };
        return new VEShape(VEShapeType.Polygon, latLngs);
    };

    var createPolylineShape = function(geometry) {
        /// <summary>Creates a VEShape from a LineString geometry
        /// </summary>
        /// <param name="geometry" type="Object">GeoJSON Geometry</param>
        /// <returns type="VEShape" />
        var latLngs = new Array(geometry.coordinates.length);
        for (var i = 0; i < geometry.coordinates.length; i++) {
            var coord = geometry.coordinates[i];
            latLngs[i] = new VELatLong(coord[1], coord[0]);
        };
        return new VEShape(VEShapeType.Polyline, latLngs);
    };

    var createMultiPolylineShapes = function(geometry, onShapeCreated) {
        /// <summary>Creates a VEShape for each LineString in a MultiLineString geometry
        /// </summary>
        /// <param name="geometry" type="Object">GeoJSON Geometry</param>
        /// <returns type="VEShape" />
        var polylines = [];
        for (var i = 0; i < geometry.coordinates.length; i++) {
            var polyline = geometry.coordinates[i];
            var latLngs = new Array(polyline.length);

            for (var j = 0; j < polyline.length; j++) {
                var coord = polyline[j];
                latLngs[j] = new VELatLong(coord[1], coord[0]);
            }

            var shape = new VEShape(VEShapeType.Polyline, latLngs);

            if (shape !== null) {
                onShapeCreated.call(this, geometry, shape);
            }

            polylines.push(shape);
        }
        return polylines;
    };

    var createMultiPolygonShapes = function(geometry, onShapeCreated) {
        /// <summary>Creates a VEShape for each Polygon in a MultiPolygon geometry
        /// </summary>
        /// <param name="geometry" type="Object">GeoJSON Geometry</param>
        /// <returns type="VEShape" />
        var polygons = [];
        for (var i = 0; i < geometry.coordinates.length; i++) {
            var polygon = geometry.coordinates[i][0];
            var latLngs = new Array(polygon.length);

            for (var j = 0; j < polygon.length; j++) {
                var coord = polygon[j];
                latLngs[j] = new VELatLong(coord[1], coord[0]);
            }

            var shape = new VEShape(VEShapeType.Polygon, latLngs);

            if (shape !== null) {
                onShapeCreated.call(this, geometry, shape);
            }

            polygons.push(shape);
        }
        return polygons;
    };

    var createShapesFromGeometry = function(geometry, onShapeCreated) {
        /// <summary>Creates the shapes from a given geometry
        /// </summary>
        /// <param name="geometry" type="Object">GeoJSON Geometry</param>
        /// <returns type="VEShape" />
        if (typeof (geometry) !== "undefined" && geometry !== null) {
            var shape = null;

            if (geometry.type === "Point") {
                shape = createPointShape(geometry);
            } else if (geometry.type === "MultiPoint") {
                shape = createMultiPointShapes(geometry, onShapeCreated);
            } else if (geometry.type === "Polygon") {
                shape = createPolygonShape(geometry);
            } else if (geometry.type === "LineString") {
                shape = createPolylineShape(geometry);
            } else if (geometry.type === "MultiLineString") {
                shape = createMultiPolylineShapes(geometry, onShapeCreated);
            } else if (geometry.type === "MultiPolygon") {
                shape = createMultiPolygonShapes(geometry, onShapeCreated);
            } else if (geometry.type === "GeometryCollection") {
                for (var i = 0; i < geometry.geometries.length; i++) {
                    var geom = geometry.geometries[i];
                    shape = createShapesFromGeometry(geom, onShapeCreated);
                }
            }

            if ((geometry.type === "Point" || geometry.type === "Polygon" || geometry.type === "LineString") && shape !== null) {
                onShapeCreated.call(this, geometry, shape);
            }

            return shape;
        }
        else {
            return null;
        }
    };

    var addFeatureToLayer = function(feature, layer, onShapeCreated) {
        /// <summary>Adds a feature to the vemap with all geometries contained within a layer
        /// </summary>
        /// <param name="feature" type="Object">GeoJSON Geometry</param>
        /// <param name="layer" type="VEShapeLayer">VEShapeLayer to add created shapes to</param>
        var shapeCreated = function(geometry, shape) {
            if (typeof (onShapeCreated) !== "undefined" && onShapeCreated !== null) {
                onShapeCreated.call(this, { "geometry": geometry, "shape": shape });
            }

            layer.AddShape(shape);
        };

        createShapesFromGeometry(feature.geometry, shapeCreated);
    };

    var createGeometryFromShape = function(shape, onGeometryCreated) {
        /// <summary>Creates a geoJSON object from a VEShape
        /// </summary>
        /// <param name="shape" type="VEShape"></param>
        /// <returns type="Object" />
        if (shape !== null) {
            var geometry = null;
            var veLatLngs = shape.GetPoints();

            if (shape.GetType() === VEShapeType.Polygon) {
                geometry = { "type": "Polygon", "coordinates": [], "properties": {} };
                var coordinates = [];

                var coords = [];
                coords.push(veLatLngs[veLatLngs.length - 1].Longitude);
                coords.push(veLatLngs[veLatLngs.length - 1].Latitude);
                coordinates.push(coords);

                for (var i = 1; i < veLatLngs.length; i++) {
                    coords = [];
                    coords.push(veLatLngs[i].Longitude);
                    coords.push(veLatLngs[i].Latitude);
                    coordinates.push(coords);
                }

                geometry.coordinates.push(coordinates);
            } else if (shape.GetType() === VEShapeType.Pushpin) {
                geometry = { "type": "Point", "coordinates": [], "properties": {} };
                geometry.coordinates.push(veLatLngs[0].Longitude);
                geometry.coordinates.push(veLatLngs[0].Latitude);
            } else if (shape.GetType() === VEShapeType.Polyline) {
                geometry = { "type": "LineString", "coordinates": [], "properties": {} };
            }

            if (typeof (onGeometryCreated) !== "undefined" && onGeometryCreated !== null && geometry !== null) {
                onGeometryCreated.call(this, { "geometry": geometry, "shape": shape });
            }

            return geometry;
        } else {
            return null;
        }
    };

    return {
        addGeoJSON: function(geoJSON, onLayerCreated, onShapeCreated) {
            /// <summary>Adds the geoJSON object features to a vemap. Each geoJSON feature is rendered as a separate VEShapeLayer. An array of VEShapeLayer's are returned.
            /// </summary>
            /// <param name="geoJSON" type="Object">geoJSON Object to populate map with</param>
            /// <param name="onLayerCreated">Callback function when a new layer is created and before its added to the map</param>
            /// <param name="onShapeCreated">Callback function when a new shape is created and before its added to a layer</param>
            /// <returns type="Array" />
            var layers = [];

            if (typeof (geoJSON) !== "undefined" && geoJSON !== null) {
                for (var i = 0; i < geoJSON.features.length; i++) {
                    var feature = geoJSON.features[i];
                    var layer = new VEShapeLayer();
                    addFeatureToLayer(feature, layer, onShapeCreated);

                    if (typeof (onLayerCreated) !== "undefined" && onLayerCreated !== null) {
                        onLayerCreated.call(this, { "layer": layer, "feature": feature });
                    }

                    map.AddShapeLayer(layer);
                    layers.push(layer);
                }
            }

            return layers;
        },

        getGeoJSON: function(onGeometryCreated) {
            /// <summary>Gets a geoJSON object based on the layers in the map.
            /// </summary>
            /// <param name="onGeometryCreated">Callback function when a new geometry object is created.</param>
            /// <returns type="Object" />
            var geometries = [];
            var geoJSONObject = { "type": "FeatureCollection", "features": [] };

            var layerCount = map.GetShapeLayerCount();
            for (var i = 0; i < layerCount; i++) {
                var layer = map.GetShapeLayerByIndex(i);
                var numberShapes = layer.GetShapeCount();

                if (numberShapes > 0) {
                    var feature = { "type": "Feature", "geometry": null, "properties": {} };

                    if (numberShapes > 1) {
                        var geometry = { "type": "GeometryCollection", "geometries": [], "properties": {} };
                        feature.geometry = geometry;

                        for (var j = 0; j < numberShapes; j++) {
                            var shape = layer.GetShapeByIndex(j);
                            var geom = createGeometryFromShape(shape, onGeometryCreated);

                            if (geom !== null) {
                                geometry.geometries.push(geom);
                            }
                        }
                    } else {
                        var shape = layer.GetShapeByIndex(j);
                        var geom = createGeometryFromShape(shape, onGeometryCreated);

                        if (geom !== null) {
                            feature.geometry = geometry;
                        }
                    }

                    if (feature.geometry !== null) {
                        geoJSONObject.features.push(feature);
                    }
                }
            }

            return geoJSONObject;
        }
    };
}